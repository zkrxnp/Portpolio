import type { Metadata } from 'next'
import { getSession } from '@/lib/auth'
import { loadVault, getNoteDetail, parseNoteId, toGraph } from '@/lib/vault'
import { firstValues } from '@/lib/validation'
import Workspace from '@/components/vault/Workspace'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

const DEFAULT_NOTE = 'page:about'

function pickId(raw: string | undefined): string {
  if (raw === 'graph') return 'graph'
  return (raw && parseNoteId(raw)) || DEFAULT_NOTE
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const id = pickId(firstValues(await searchParams).note)
  if (id === 'graph') return { title: '그래프 뷰' }
  if (id === DEFAULT_NOTE) return {}
  const v = await loadVault()
  const n = v.byId.get(id)
  return n ? { title: n.title } : {}
}

/**
 * 홈 = 옵시디언식 작업 공간. 첫 화면에 바로 내용이 보이도록 노트 목록·그래프·요청한 노트를
 * 서버에서 미리 읽어 넘깁니다. 이후 이동은 /api/notes 로 받아옵니다.
 */
export default async function Home({ searchParams }: Props) {
  const requested = pickId(firstValues(await searchParams).note)
  const vault = await loadVault()
  let active = requested
  let note = active === 'graph' ? null : await getNoteDetail(active, vault)
  if (active !== 'graph' && !note) {
    active = DEFAULT_NOTE
    note = await getNoteDetail(DEFAULT_NOTE, vault)
  }
  const session = await getSession().catch(() => null)

  return (
    <>
      <h1 className="sr-only">정현진 — 보안 포트폴리오</h1>
      <Workspace
        notes={vault.notes}
        initialNote={note}
        initialActive={active}
        graph={toGraph(vault)}
        isAdmin={Boolean(session)}
      />
    </>
  )
}

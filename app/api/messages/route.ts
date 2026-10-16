import { type NextRequest } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Message from '@/lib/models/Message'
import { messageInput } from '@/lib/validation'
import { ok, fail, handleError } from '@/lib/http'
import { clientIp, hashIp } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

/** 공개 문의 접수. 인증 없이 쓰기가 열리는 유일한 경로라 방어를 겹쳐 둡니다. */
export async function POST(req: NextRequest) {
  try {
    const data = messageInput.parse(await req.json())

    // 허니팟: 사람 눈에 안 보이는 필드가 채워졌으면 성공처럼 응답하고 버립니다.
    // 상태 코드까지 진짜 접수(201)와 같아야 봇이 구분하지 못합니다.
    if (data.website) return ok({ ok: true }, { status: 201 })

    // 로그인 레이트 리밋과 같은 IP 추출을 씁니다(XFF 맨 오른쪽 — 이유는 clientIp 주석).
    const ipHash = hashIp(clientIp(req.headers))

    await dbConnect()

    // 같은 발신자가 10분 안에 3건을 넘기면 막습니다.
    const since = new Date(Date.now() - 10 * 60 * 1000)
    const recent = await Message.countDocuments({ ipHash, createdAt: { $gte: since } })
    if (recent >= 3) {
      return fail('문의가 너무 자주 접수되었습니다. 잠시 뒤에 다시 보내주세요.', 429)
    }

    await Message.create({
      name: data.name,
      email: data.email,
      org: data.org,
      kind: data.kind,
      body: data.body,
      ipHash,
      userAgent: req.headers.get('user-agent')?.slice(0, 300) ?? '',
    })

    return ok({ ok: true }, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}

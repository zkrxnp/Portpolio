/**
 * lib/rateLimit.ts의 잠금 상태 머신 테스트.
 * 실 DB 없이, 모델 메서드만 메모리 구현으로 바꿔 끼웁니다.
 */
process.env.AUTH_SECRET = 'x'.repeat(40)

import LoginAttempt from '../lib/models/LoginAttempt'
import { checkLock, recordFailure, clearFailures, hashIp, clientIp } from '../lib/rateLimit'

type Row = { key: string; count: number; firstFailedAt: Date; lockedUntil: Date | null; expireAt: Date; save: () => Promise<void> }
let store = new Map<string, Row>()

function mkRow(key: string, init: Partial<Row>): Row {
  const row: Row = {
    key, count: 0, firstFailedAt: new Date(), lockedUntil: null, expireAt: new Date(),
    ...init,
    save: async () => { store.set(key, row) },
  } as Row
  return row
}

// --- mongoose 메서드 스텁 ---
const M = LoginAttempt as unknown as Record<string, unknown>

M.find = (q: { key: { $in: string[] }; lockedUntil?: { $gt: Date } }) => {
  const rows = q.key.$in.map((k) => store.get(k)).filter(Boolean) as Row[]
  const filtered = q.lockedUntil?.$gt
    ? rows.filter((r) => r.lockedUntil && r.lockedUntil > q.lockedUntil!.$gt)
    : rows
  const chain = { select: () => chain, lean: async () => filtered }
  return chain
}

M.deleteOne = async (q: { key: string; lockedUntil: null; firstFailedAt: { $lt: Date } }) => {
  const r = store.get(q.key)
  if (r && r.lockedUntil === null && r.firstFailedAt < q.firstFailedAt.$lt) store.delete(q.key)
}

M.deleteMany = async (q: { key: { $in: string[] } }) => {
  for (const k of q.key.$in) store.delete(k)
}

M.findOneAndUpdate = (
  q: { key: string },
  u: { $inc: { count: number }; $setOnInsert: { firstFailedAt: Date }; $set: { expireAt: Date } },
) => {
  let row = store.get(q.key)
  if (!row) {
    row = mkRow(q.key, { count: 0, firstFailedAt: u.$setOnInsert.firstFailedAt })
    store.set(q.key, row)
  }
  row.count += u.$inc.count
  row.expireAt = u.$set.expireAt
  return Promise.resolve(row)
}

// --- 테스트 ---
let pass = 0, fail = 0
function check(name: string, cond: boolean, extra = '') {
  if (cond) { pass++; console.log('  ok  ', name) }
  else { fail++; console.log('  FAIL', name, extra) }
}

const IP = hashIp('203.0.113.9')
const EMAIL = 'admin@jiwoo.security'

async function run() {
  console.log('\n[IP 정책] 15분 안에 5회 → 10분 잠금')
  store = new Map()
  for (let i = 1; i <= 4; i++) {
    await recordFailure(IP, EMAIL)
    const l = await checkLock(IP, EMAIL)
    check(`${i}회 실패 후에는 아직 안 잠김`, l.locked === false)
  }
  await recordFailure(IP, EMAIL)
  const after5 = await checkLock(IP, EMAIL)
  check('5회째에 잠김', after5.locked === true)
  if (after5.locked) {
    const mins = after5.retryAfterMs / 60000
    check('잠금이 약 10분', mins > 9.9 && mins <= 10.01, `${mins.toFixed(2)}분`)
  }

  console.log('\n[성공 시 초기화]')
  await clearFailures(IP, EMAIL)
  check('성공하면 잠금 해제', (await checkLock(IP, EMAIL)).locked === false)
  check('카운터 문서도 삭제됨', !store.has(`ip:${IP}`) && !store.has(`user:${EMAIL}`))

  console.log('\n[계정 정책] IP를 바꿔가며 분산 시도해도 계정 카운터는 누적')
  store = new Map()
  for (let i = 1; i <= 19; i++) {
    await recordFailure(hashIp(`198.51.100.${i}`), EMAIL)
  }
  const at19 = await checkLock(hashIp('198.51.100.200'), EMAIL)
  check('19회까지는 새 IP로 계속 시도 가능', at19.locked === false)

  await recordFailure(hashIp('198.51.100.20'), EMAIL)
  const at20 = await checkLock(hashIp('198.51.100.201'), EMAIL)
  check('20회째에 계정이 잠겨 새 IP도 차단', at20.locked === true)
  if (at20.locked) {
    const mins = at20.retryAfterMs / 60000
    check('계정 잠금이 약 15분', mins > 14.9 && mins <= 15.01, `${mins.toFixed(2)}분`)
  }

  console.log('\n[서비스 거부 내성] 계정이 잠겨도 다른 계정은 영향 없음')
  const other = await checkLock(hashIp('198.51.100.77'), 'someone-else@example.com')
  check('다른 계정은 멀쩡', other.locked === false)

  console.log('\n[창 만료] 창이 지난 실패는 1부터 다시 셈')
  store = new Map()
  await recordFailure(IP, EMAIL)
  await recordFailure(IP, EMAIL)
  const row = store.get(`ip:${IP}`)!
  check('현재 2회', row.count === 2, String(row.count))
  row.firstFailedAt = new Date(Date.now() - 20 * 60 * 1000) // 15분 창 밖으로
  await recordFailure(IP, EMAIL)
  check('창 밖이면 1로 리셋', store.get(`ip:${IP}`)!.count === 1, String(store.get(`ip:${IP}`)!.count))

  console.log('\n[IP 해시] 원문이 남지 않음')
  check('해시는 64자 hex', /^[0-9a-f]{64}$/.test(IP))
  check('같은 IP는 같은 해시', hashIp('203.0.113.9') === IP)
  check('다른 IP는 다른 해시', hashIp('203.0.113.10') !== IP)

  console.log('\n[클라이언트 IP] XFF 맨 왼쪽은 클라이언트가 고를 수 있음')
  const H = (h: Record<string, string>) => new Headers(h)
  check('위조 값 뒤에 프록시가 붙인 값이 있으면 프록시 값', clientIp(H({ 'x-forwarded-for': '1.2.3.4, 198.51.100.7' })) === '198.51.100.7')
  check('왼쪽을 바꿔도 결과가 같음', clientIp(H({ 'x-forwarded-for': '9.9.9.9, 198.51.100.7' })) === '198.51.100.7')
  check('값이 하나면 그 값', clientIp(H({ 'x-forwarded-for': '203.0.113.5' })) === '203.0.113.5')
  check('빈 항목은 무시', clientIp(H({ 'x-forwarded-for': '1.1.1.1, , ' })) === '1.1.1.1')
  check('XFF 없으면 x-real-ip', clientIp(H({ 'x-real-ip': '203.0.113.6' })) === '203.0.113.6')
  check('둘 다 없으면 local', clientIp(H({})) === 'local')

  console.log(`\n${pass} passed, ${fail} failed\n`)
  process.exit(fail === 0 ? 0 : 1)
}

run()

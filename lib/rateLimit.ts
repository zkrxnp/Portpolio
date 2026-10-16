import { createHash } from 'crypto'
import LoginAttempt from './models/LoginAttempt'

/**
 * IP와 계정에 서로 다른 정책을 겁니다.
 *
 * IP는 빡빡하게 (5회 / 10분 잠금) — 한 발신지의 무차별 대입을 바로 끊습니다.
 * 계정은 느슨하게 (20회 / 15분 잠금) — 여기를 IP만큼 조이면 공격자가 일부러
 * 틀려서 진짜 관리자를 잠가버리는 서비스 거부가 가능해집니다. 분산 시도를
 * 늦추되 운영자가 영영 못 들어가는 일은 없도록 한 절충입니다.
 */
const POLICY = {
  ip: { max: 5, lockMs: 10 * 60 * 1000, windowMs: 15 * 60 * 1000 },
  user: { max: 20, lockMs: 15 * 60 * 1000, windowMs: 60 * 60 * 1000 },
} as const

export function hashIp(ip: string): string {
  // 원문 IP는 저장하지 않습니다. 비교만 되면 충분합니다.
  return createHash('sha256').update(ip + (process.env.AUTH_SECRET ?? '')).digest('hex')
}

/**
 * X-Forwarded-For의 **맨 오른쪽** 값을 씁니다.
 *
 * 맨 왼쪽은 클라이언트가 보낸 값이 그대로 남을 수 있어 요청마다 바꿔 레이트 리밋을
 * 우회할 수 있습니다(로컬에서 실제로 재현). 맨 오른쪽은 우리 앞단 프록시가 붙인 값이라
 * 클라이언트가 고를 수 없습니다. Vercel처럼 헤더를 통째로 덮어쓰는 환경에서는 값이
 * 하나뿐이라 왼쪽과 같습니다.
 *
 * 한계: 프록시 없이 앱이 직접 노출되면 헤더 전체가 클라이언트 것이라 어느 쪽도 믿을 수
 * 없습니다. 그 구성은 쓰지 마세요.
 */
export function clientIp(headers: Headers): string {
  const hops = headers.get('x-forwarded-for')?.split(',').map((s) => s.trim()).filter(Boolean)
  return hops?.at(-1) || headers.get('x-real-ip')?.trim() || 'local'
}

type Check = { locked: false } | { locked: true; retryAfterMs: number }

/** 잠겨 있는지만 확인합니다. 카운트는 올리지 않습니다. */
export async function checkLock(ipHash: string, email: string): Promise<Check> {
  const now = Date.now()
  const docs = await LoginAttempt.find({
    key: { $in: [`ip:${ipHash}`, `user:${email}`] },
    lockedUntil: { $gt: new Date(now) },
  })
    .select('lockedUntil')
    .lean()

  if (docs.length === 0) return { locked: false }

  const until = Math.max(...docs.map((d) => new Date(d.lockedUntil as Date).getTime()))
  return { locked: true, retryAfterMs: until - now }
}

async function bump(key: string, policy: { max: number; lockMs: number; windowMs: number }) {
  const now = new Date()

  // 창이 지났으면 카운트를 1로 되돌립니다. upsert 한 번으로 끝내기 어려워
  // 창 밖 문서를 먼저 정리합니다.
  await LoginAttempt.deleteOne({
    key,
    lockedUntil: null,
    firstFailedAt: { $lt: new Date(now.getTime() - policy.windowMs) },
  })

  const doc = await LoginAttempt.findOneAndUpdate(
    { key },
    {
      $inc: { count: 1 },
      $setOnInsert: { firstFailedAt: now },
      $set: { expireAt: new Date(now.getTime() + policy.windowMs + policy.lockMs) },
    },
    { upsert: true, new: true },
  )

  if (doc.count >= policy.max && (!doc.lockedUntil || doc.lockedUntil < now)) {
    doc.lockedUntil = new Date(now.getTime() + policy.lockMs)
    await doc.save()
  }
}

/** 실패를 기록합니다. IP와 계정 양쪽을 올립니다. */
export async function recordFailure(ipHash: string, email: string): Promise<void> {
  await Promise.all([bump(`ip:${ipHash}`, POLICY.ip), bump(`user:${email}`, POLICY.user)])
}

/** 로그인이 성공하면 두 카운터를 모두 지웁니다. */
export async function clearFailures(ipHash: string, email: string): Promise<void> {
  await LoginAttempt.deleteMany({ key: { $in: [`ip:${ipHash}`, `user:${email}`] } })
}

export function formatRetry(ms: number): string {
  const mins = Math.ceil(ms / 60000)
  return mins <= 1 ? '1분' : `${mins}분`
}

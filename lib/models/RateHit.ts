import { Schema, model, models, type Model } from 'mongoose'

/**
 * 공개 쓰기 경로(방명록 등)의 요청 기록. 한 요청이 문서 하나입니다.
 *
 * key는 `<용도>:<sha256(IP + AUTH_SECRET)>` 형태라 원문 IP가 남지 않고,
 * TTL 인덱스가 창(window)이 지나면 지웁니다. 즉 IP 해시의 보관 기간 = 제한 창 길이.
 * 서버리스 인스턴스마다 메모리가 따로라 카운터는 DB에 둡니다(rateLimit.ts와 같은 이유).
 */
const RateHitSchema = new Schema(
  {
    key: { type: String, required: true },
    at: { type: Date, required: true, default: Date.now },
    expireAt: { type: Date, required: true },
  },
  { collection: 'ratehits', versionKey: false },
)

RateHitSchema.index({ key: 1, at: -1 })
RateHitSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 })

type RateHitDoc = { key: string; at: Date; expireAt: Date }

export const RateHit: Model<RateHitDoc> =
  (models.RateHit as Model<RateHitDoc>) || model<RateHitDoc>('RateHit', RateHitSchema)

/**
 * 창 안에서 max번까지 허용합니다. 넘으면 기록하지 않고 남은 대기 시간을 돌려줍니다.
 * 동시 요청 몇 건이 경계를 살짝 넘을 수는 있지만, 대량 도배를 막는 목적에는 충분합니다.
 */
export async function takeHit(
  key: string,
  windowMs: number,
  max: number,
): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
  const now = Date.now()
  const since = new Date(now - windowMs)
  const recent = await RateHit.find({ key, at: { $gt: since } }).sort({ at: 1 }).select('at').limit(max).lean()
  if (recent.length >= max) {
    const oldest = new Date(recent[0].at).getTime()
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)) }
  }
  await RateHit.create({ key, at: new Date(now), expireAt: new Date(now + windowMs) })
  return { ok: true }
}

export default RateHit

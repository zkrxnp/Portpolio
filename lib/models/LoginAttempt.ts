import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose'

/**
 * 로그인 실패 카운터.
 *
 * 인스턴스 메모리에 두면 서버리스에서 콜드 스타트마다 초기화되어 사실상
 * 무력화됩니다. 모든 인스턴스가 같은 숫자를 보도록 DB에 둡니다.
 *
 * key 형식:
 *   ip:<sha256>    — 한 발신지의 연속 실패
 *   user:<email>   — 한 계정을 겨냥한 분산 시도
 */
const LoginAttemptSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    count: { type: Number, default: 0, min: 0 },
    firstFailedAt: { type: Date, default: Date.now },
    lockedUntil: { type: Date, default: null },
    // TTL 인덱스가 만료된 문서를 알아서 지웁니다. 수동 정리가 필요 없습니다.
    expireAt: { type: Date, required: true },
  },
  { timestamps: true },
)

LoginAttemptSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 })

export type LoginAttemptDoc = InferSchemaType<typeof LoginAttemptSchema> & { _id: string }

export const LoginAttempt: Model<LoginAttemptDoc> =
  (models.LoginAttempt as Model<LoginAttemptDoc>) ||
  model<LoginAttemptDoc>('LoginAttempt', LoginAttemptSchema)

export default LoginAttempt

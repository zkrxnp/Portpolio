import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose'

/**
 * 관리자. 신원은 GitHub이 보증하므로 비밀번호를 저장하지 않습니다.
 * 키는 githubId(숫자) — 사용자명은 바뀔 수 있습니다.
 */
const UserSchema = new Schema(
  {
    githubId: { type: Number, required: true, unique: true },
    githubLogin: { type: String, required: true, trim: true },
    name: { type: String, default: '관리자' },
    avatarUrl: { type: String, default: '' },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true },
)

export type UserDoc = InferSchemaType<typeof UserSchema> & { _id: string }

export const User: Model<UserDoc> =
  (models.User as Model<UserDoc>) || model<UserDoc>('User', UserSchema)

export default User

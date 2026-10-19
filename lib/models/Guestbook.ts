import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose'

/**
 * 방명록. 로그인 없이 쓰는 공개 쓰기 경로라 저장 필드는 최소로 둡니다.
 * IP는 여기에 남기지 않습니다. 요청 제한은 RateHit(만료되는 해시)가 맡습니다.
 */
const GuestbookSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 40 },
    message: { type: String, required: true, trim: true, minlength: 2, maxlength: 500 },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'guestbook' },
)

GuestbookSchema.index({ createdAt: -1 })

export type GuestbookDoc = InferSchemaType<typeof GuestbookSchema> & { _id: string; createdAt: Date }

export const Guestbook: Model<GuestbookDoc> =
  (models.Guestbook as Model<GuestbookDoc>) || model<GuestbookDoc>('Guestbook', GuestbookSchema)

export default Guestbook

import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose'

export const MESSAGE_STATUSES = ['new', 'read', 'replied', 'archived'] as const

const MessageSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
    org: { type: String, default: '', maxlength: 100 },
    kind: { type: String, default: '기타' },
    body: { type: String, required: true, maxlength: 4000 },
    status: { type: String, enum: MESSAGE_STATUSES, default: 'new' },
    // 스팸 조사용. 원문 IP 대신 해시만 남깁니다.
    ipHash: { type: String, default: '', select: false },
    userAgent: { type: String, default: '', select: false },
  },
  { timestamps: true },
)

MessageSchema.index({ status: 1, createdAt: -1 })
MessageSchema.index({ ipHash: 1, createdAt: -1 })

export type MessageDoc = InferSchemaType<typeof MessageSchema> & { _id: string }

export const Message: Model<MessageDoc> =
  (models.Message as Model<MessageDoc>) || model<MessageDoc>('Message', MessageSchema)

export default Message

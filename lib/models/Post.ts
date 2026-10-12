import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose'

const PostSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    excerpt: { type: String, default: '', maxlength: 400 },
    body: { type: String, default: '' }, // 마크다운
    tags: { type: [String], default: [], index: true },
    published: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },
    views: { type: Number, default: 0, min: 0 },
    readingMinutes: { type: Number, default: 1, min: 1 },
  },
  { timestamps: true },
)

PostSchema.index({ published: 1, publishedAt: -1 })
PostSchema.index({ title: 'text', excerpt: 'text', body: 'text', tags: 'text' })

// 공개 전환 시 발행일을 한 번만 찍고, 읽는 시간은 본문에서 계산합니다.
PostSchema.pre('save', function (next) {
  if (this.published && !this.publishedAt) this.publishedAt = new Date()
  if (!this.published) this.publishedAt = null
  const words = String(this.body ?? '').trim().split(/\s+/).filter(Boolean).length
  this.readingMinutes = Math.max(1, Math.round(words / 300))
  next()
})

export type PostDoc = InferSchemaType<typeof PostSchema> & { _id: string }

export const Post: Model<PostDoc> =
  (models.Post as Model<PostDoc>) || model<PostDoc>('Post', PostSchema)

export default Post

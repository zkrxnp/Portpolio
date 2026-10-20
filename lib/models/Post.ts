import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose'

/** Research Log 주제 분류. 기존 프로젝트 분야와 CTF 풀이를 기준으로 잡았습니다. */
import { LOG_CATEGORIES } from '../constants'
// 선택지는 브라우저에서도 쓰므로 constants.ts에 두고, 기존 import 경로를 위해 다시 내보냅니다.
export { LOG_CATEGORIES }
export type { LogCategory } from '../constants'

const PostSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    excerpt: { type: String, default: '', maxlength: 400 },
    body: { type: String, default: '' }, // 마크다운
    tags: { type: [String], default: [], index: true },
    category: { type: String, enum: LOG_CATEGORIES, default: '기타' },
    relatedProjectIds: { type: [{ type: Schema.Types.ObjectId, ref: 'Project' }], default: [] },
    published: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },
    views: { type: Number, default: 0, min: 0 },
    readingMinutes: { type: Number, default: 1, min: 1 },
  },
  { timestamps: true },
)

PostSchema.index({ published: 1, publishedAt: -1 })
PostSchema.index({ category: 1, published: 1, publishedAt: -1 })
PostSchema.index({ relatedProjectIds: 1 })
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

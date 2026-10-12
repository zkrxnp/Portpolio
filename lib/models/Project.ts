import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose'

export const PROJECT_CATEGORIES = ['탐지', '설계', '포렌식', '리버싱', '웹'] as const
export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number]

export const PROJECT_VISUALS = ['log', 'trust', 'hex', 'none'] as const

const ProjectSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    summary: { type: String, required: true, maxlength: 300 },
    body: { type: String, default: '' }, // 마크다운
    category: { type: String, required: true, enum: PROJECT_CATEGORIES },
    visual: { type: String, enum: PROJECT_VISUALS, default: 'none' },
    period: { type: String, default: '' },
    role: { type: String, default: '' },
    stack: { type: [String], default: [] },
    links: {
      repo: { type: String, default: '' },
      writeup: { type: String, default: '' },
      demo: { type: String, default: '' },
    },
    featured: { type: Boolean, default: false },
    published: { type: Boolean, default: true },
    views: { type: Number, default: 0, min: 0 },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
)

// 목록 기본 정렬: 고정 → 수동 순서 → 최신
ProjectSchema.index({ published: 1, featured: -1, order: 1, createdAt: -1 })
ProjectSchema.index({ category: 1, published: 1 })
ProjectSchema.index({ title: 'text', summary: 'text', body: 'text', stack: 'text' })

export type ProjectDoc = InferSchemaType<typeof ProjectSchema> & { _id: string }

export const Project: Model<ProjectDoc> =
  (models.Project as Model<ProjectDoc>) || model<ProjectDoc>('Project', ProjectSchema)

export default Project

import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose'

import { PROJECT_CATEGORIES, PROJECT_VISUALS, PROJECT_STATUSES } from '../constants'
// 선택지는 브라우저에서도 쓰므로 constants.ts에 두고, 기존 import 경로를 위해 다시 내보냅니다.
export { PROJECT_CATEGORIES, PROJECT_VISUALS, PROJECT_STATUSES }
export type { ProjectCategory, ProjectStatus } from '../constants'

const ProjectSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    summary: { type: String, required: true, maxlength: 300 },
    body: { type: String, default: '' }, // 마크다운
    category: { type: String, required: true, enum: PROJECT_CATEGORIES },
    visual: { type: String, enum: PROJECT_VISUALS, default: 'none' },
    status: { type: String, enum: PROJECT_STATUSES, default: '완료' },
    // 대표 이미지 경로(/public 아래 또는 https). 비어 있으면 visual 그래픽을 씁니다.
    thumbnail: { type: String, default: '' },
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
ProjectSchema.index({ stack: 1, published: 1 })
ProjectSchema.index({ status: 1, published: 1 })
ProjectSchema.index({ title: 'text', summary: 'text', body: 'text', stack: 'text' })

export type ProjectDoc = InferSchemaType<typeof ProjectSchema> & { _id: string }

export const Project: Model<ProjectDoc> =
  (models.Project as Model<ProjectDoc>) || model<ProjectDoc>('Project', ProjectSchema)

export default Project

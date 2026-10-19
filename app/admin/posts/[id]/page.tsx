import { notFound } from 'next/navigation'
import { isValidObjectId } from 'mongoose'
import dbConnect from '@/lib/mongodb'
import Post from '@/lib/models/Post'
import Project from '@/lib/models/Project'
import PostEditor from '@/components/admin/PostEditor'

export const dynamic = 'force-dynamic'

export default async function EditPost({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (id !== 'new' && !isValidObjectId(id)) notFound()

  await dbConnect()
  const projects = (await Project.find({}).select('title').sort({ order: 1, createdAt: -1 }).lean())
    .map((p) => ({ _id: String(p._id), title: String(p.title) }))

  if (id === 'new') return <PostEditor mode="create" projects={projects} />

  const doc = await Post.findById(id).lean()
  if (!doc) notFound()

  return (
    <PostEditor
      mode="edit"
      id={String(doc._id)}
      projects={projects}
      initial={{
        title: doc.title,
        slug: doc.slug,
        excerpt: doc.excerpt ?? '',
        body: doc.body ?? '',
        tags: doc.tags ?? [],
        category: doc.category ?? '기타',
        relatedProjectIds: (doc.relatedProjectIds ?? []).map(String),
        published: Boolean(doc.published),
      }}
    />
  )
}

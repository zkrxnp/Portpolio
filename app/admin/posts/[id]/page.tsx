import { notFound } from 'next/navigation'
import { isValidObjectId } from 'mongoose'
import dbConnect from '@/lib/mongodb'
import Post from '@/lib/models/Post'
import PostEditor from '@/components/admin/PostEditor'

export const dynamic = 'force-dynamic'

export default async function EditPost({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (id === 'new') return <PostEditor mode="create" />
  if (!isValidObjectId(id)) notFound()

  await dbConnect()
  const doc = await Post.findById(id).lean()
  if (!doc) notFound()

  return (
    <PostEditor
      mode="edit"
      id={String(doc._id)}
      initial={{
        title: doc.title,
        slug: doc.slug,
        excerpt: doc.excerpt ?? '',
        body: doc.body ?? '',
        tags: doc.tags ?? [],
        published: Boolean(doc.published),
      }}
    />
  )
}

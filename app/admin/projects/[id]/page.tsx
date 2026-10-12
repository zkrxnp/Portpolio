import { notFound } from 'next/navigation'
import { isValidObjectId } from 'mongoose'
import dbConnect from '@/lib/mongodb'
import Project from '@/lib/models/Project'
import ProjectEditor from '@/components/admin/ProjectEditor'

export const dynamic = 'force-dynamic'

export default async function EditProject({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (id === 'new') {
    return <ProjectEditor mode="create" />
  }

  if (!isValidObjectId(id)) notFound()

  await dbConnect()
  const doc = await Project.findById(id).lean()
  if (!doc) notFound()

  return (
    <ProjectEditor
      mode="edit"
      id={String(doc._id)}
      initial={{
        title: doc.title,
        slug: doc.slug,
        summary: doc.summary,
        body: doc.body ?? '',
        category: doc.category,
        visual: doc.visual ?? 'none',
        period: doc.period ?? '',
        role: doc.role ?? '',
        stack: doc.stack ?? [],
        links: {
          repo: doc.links?.repo ?? '',
          writeup: doc.links?.writeup ?? '',
          demo: doc.links?.demo ?? '',
        },
        featured: Boolean(doc.featured),
        published: Boolean(doc.published),
        order: doc.order ?? 0,
      }}
    />
  )
}

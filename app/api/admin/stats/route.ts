import dbConnect from '@/lib/mongodb'
import Project from '@/lib/models/Project'
import Post from '@/lib/models/Post'
import Message from '@/lib/models/Message'
import { ok, handleError } from '@/lib/http'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await dbConnect()
    const [projects, posts, newMessages, topProjects, viewAgg] = await Promise.all([
      Project.countDocuments({}),
      Post.countDocuments({}),
      Message.countDocuments({ status: 'new' }),
      Project.find({ published: true }).select('title slug views').sort({ views: -1 }).limit(5).lean(),
      Project.aggregate<{ _id: null; total: number }>([{ $group: { _id: null, total: { $sum: '$views' } } }]),
    ])

    return ok({
      projects,
      posts,
      newMessages,
      totalViews: viewAgg[0]?.total ?? 0,
      topProjects,
    })
  } catch (err) {
    return handleError(err)
  }
}

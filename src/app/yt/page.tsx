import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

type ChannelListItem = {
	id: string
	title: string | null
	url: string
	description: string | null
	subscribers: number
	posts_cnt: number | null
	channel_id: string
	video_categories: string | null
	logo_url: string | null
}

function extractTopics(raw: string[] | null): string[] {
	if (!raw) return []
	return raw
		.filter(Boolean)
		.map((s) => {
			const parts = s.split('/')
			return parts[parts.length - 1]?.trim() || ''
		})
		.filter(Boolean)
}

export default async function YtPage() {
	const channels = await prisma.$queryRawUnsafe<ChannelListItem[]>(
		`SELECT id, title, url, description, subscribers, posts_cnt, channel_id, video_categories, logo_url
		 FROM channels
		 ORDER BY subscribers DESC
		 LIMIT 200`
	)

	return (
		<div className="min-h-screen bg-white text-gray-900">
			<div className="max-w-4xl mx-auto px-4 py-10">
				<div className="mb-6">
					<h1 className="text-3xl font-bold">Youtube channels</h1>
				</div>
				<ul className="space-y-3">
					{channels.map((c: ChannelListItem) => (
						<li key={c.id} className="rounded-lg border border-gray-200 bg-white shadow-sm">
																<Link href={`/yt/${encodeURIComponent(c.id)}/posts`} className="flex items-center gap-4 p-4 hover:bg-gray-50">
								{c.logo_url ? (
									<img
										src={c.logo_url}
										alt={c.title ?? c.channel_id}
										className="h-24 w-24 rounded-md object-contain bg-gray-100 border border-gray-200"
									/>
								) : (
									<div className="h-24 w-24 rounded-md bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-medium">YT</div>
								)}
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2">
										<span className="text-base font-semibold truncate">{c.title ?? c.channel_id}</span>
										<span className="inline-flex items-center gap-1 text-xs text-gray-500">
											<span>👥</span>
											<span>{Intl.NumberFormat('en', { notation: 'compact' }).format(c.subscribers)}</span>
										</span>
										{typeof c.posts_cnt === 'number' && (
											<span className="inline-flex items-center gap-1 text-xs text-gray-500">
												<span>🎬</span>
												<span>{Intl.NumberFormat('en', { notation: 'compact' }).format(c.posts_cnt)} videos</span>
											</span>
										)}
									</div>
									{c.description && (
										<p className="mt-1 text-sm text-gray-600 line-clamp-2">{c.description}</p>
									)}
									{extractTopics(c.video_categories as unknown as string[]).length > 0 && (
										<div className="mt-2 flex flex-wrap gap-2">
											{extractTopics(c.video_categories as unknown as string[]).map((t) => (
												<span key={t} className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs border border-gray-200">
													{t}
												</span>
											))}
										</div>
									)}
								</div>
							</Link>
						</li>
					))}
				</ul>
			</div>
		</div>
	)
} 
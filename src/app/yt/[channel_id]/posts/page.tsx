import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import PostsList from './postsList'

export const dynamic = 'force-dynamic'

type Params = { channel_id: string }

export default async function ChannelPostsPage({ params }: { params: Promise<Params> }) {
	const { channel_id } = await params
	const channel = await prisma.channels.findUnique({
		where: { id: channel_id },
		select: {
			id: true,
			title: true,
			description: true,
			subscribers: true,
			logo_url: true,
			url: true,
		},
	})

	if (!channel) {
		return (
			<div className="max-w-5xl mx-auto px-4 py-10">
				<p className="text-gray-600">Channel not found.</p>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-white text-gray-900">
			<header className="w-full" style={{ background: '#FAFAFBFF' }}>
				<div className="max-w-5xl mx-auto px-4 py-10">
					<div className="flex items-start gap-6">
						{channel.logo_url ? (
							<img src={channel.logo_url} alt={channel.title ?? channel_id} className="h-24 w-24 rounded-md object-contain bg-gray-100 border border-gray-200" />
						) : (
							<div className="h-24 w-24 rounded-md bg-gray-200" />
						)}
						<div className="flex-1 min-w-0">
							<h1 className="text-2xl font-bold truncate">{channel.title ?? channel_id}</h1>
							<p className="text-sm text-gray-500">{Intl.NumberFormat('en', { notation: 'compact' }).format(channel.subscribers)} subscribers</p>
							{channel.description && (
								<p className="mt-2 text-sm text-gray-600">{channel.description}</p>
							)}
							<div className="mt-2">
								<Link href={channel.url} target="_blank" className="text-sm text-blue-600 hover:underline">Open channel →</Link>
							</div>
						</div>
					</div>
				</div>
			</header>

			<div className="max-w-5xl mx-auto px-4 py-10">
				<section>
					<PostsList channelId={channel_id} />
				</section>
			</div>
		</div>
	)
} 
import { prisma } from '@/lib/prisma'
import TranscriptPanel from './TranscriptPanel'
import ExpandableText from './ExpandableText'
import AudioFooter from './AudioFooter'
import { createRef } from 'react'

export const dynamic = 'force-dynamic'

type Params = { channel_id: string; post_id: string }

function formatDuration(seconds?: number | null) {
	if (seconds == null || !Number.isFinite(Number(seconds))) return null
	const total = Math.floor(Number(seconds))
	const h = Math.floor(total / 3600)
	const m = Math.floor((total % 3600) / 60)
	const s = total % 60
	if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
	return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default async function PostPage({ params }: { params: Promise<Params> }) {
	const { channel_id, post_id } = await params

	const post = await prisma.posts.findFirst({
		where: { id: post_id, channels: { id: channel_id } },
		select: {
			id: true,
			title: true,
			description: true,
			url: true,
			published_at: true,
			views: true,
			likes: true,
			comments: true,
			logo_url: true,
			duration_seconds: true,
			s3_audio_url: true,
			channels: { select: { id: true, title: true, logo_url: true, subscribers: true } },
			transcripts: { select: { text: true } },
		},
	})

	if (!post) {
		return (
			<div className="max-w-5xl mx-auto px-4 py-10">
				<p className="text-gray-600">Post not found.</p>
			</div>
		)
	}

	let paragraphs= post.transcripts?.[0]?.text as any
	const duration = formatDuration(post.duration_seconds)
	const published = new Date(post.published_at as unknown as string).toLocaleDateString()
	const sharedAudioRef = createRef<HTMLAudioElement>() as React.RefObject<HTMLAudioElement>

	return (
		<div className="min-h-screen bg-white text-gray-900 pb-20">
			<header className="w-full" style={{ background: '#FAFAFBFF' }}>
				<div className="max-w-6xl mx-auto px-6 py-12">
					<div className="grid grid-cols-1 md:grid-cols-[360px_1fr] gap-8 items-start">
						<div className="w-full">
							{post.logo_url ? (
								<img src={post.logo_url} alt={post.title ?? ''} className="w-full h-[220px] md:h-[260px] object-cover rounded-xl shadow-sm border border-gray-200 bg-gray-100" />
							) : (
								<div className="w-full h-[220px] md:h-[260px] rounded-xl bg-gray-200 border border-gray-200" />
							)}
						</div>
						<div className="min-w-0">
							<h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900">{post.title ?? post.id}</h1>
							<div className="mt-4 flex flex-wrap items-center gap-5 text-sm text-gray-600">
								<span className="inline-flex items-center gap-2"><span aria-hidden>👤</span><span>{post.channels?.title ?? 'Channel'}</span></span>
								<span className="inline-flex items-center gap-2"><span aria-hidden>📅</span><span>{published}</span></span>
								{duration && <span className="inline-flex items-center gap-2"><span aria-hidden>⏱</span><span>{duration}</span></span>}
							</div>
							{post.description && (<div className="mt-6"><ExpandableText text={post.description} lines={2} /></div>)}
						</div>
					</div>
				</div>
			</header>

			<div className="max-w-6xl mx-auto px-6 py-10">
				{paragraphs?.length > 0 ? (
					<TranscriptPanel paragraphs={paragraphs} audioUrl={post.s3_audio_url} externalAudioRef={sharedAudioRef} />
				) : (
					<p className="text-sm text-gray-500">No transcript available for this episode.</p>
				)}
			</div>

			<AudioFooter audioUrl={post.s3_audio_url} externalRef={sharedAudioRef} />
		</div>
	)
} 
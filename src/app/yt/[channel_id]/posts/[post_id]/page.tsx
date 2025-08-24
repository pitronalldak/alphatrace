import { prisma } from '@/lib/prisma'
import ClientPostView from './ClientPostView'

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
			channels: { select: { id: true, title: true, logo_url: true, subscribers: true, url: true } },
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

	const paragraphs = (post.transcripts?.[0]?.text as any) ?? []
	const duration = formatDuration(post.duration_seconds)
	const published = new Date(post.published_at as unknown as string).toLocaleDateString()

	const mentionsRaw = await prisma.mentions.findMany({
		where: { post_id: post.id },
		select: { start: true, end: true, entity_type: true, entity_id: true, details: true },
	})

	const companyIds = Array.from(new Set(mentionsRaw
		.filter((m: { entity_type: string; entity_id: string | null }) => m.entity_type === 'company' && m.entity_id)
		.map((m: { entity_id: string | null }) => String(m.entity_id))))
	const cryptoIds = Array.from(new Set(mentionsRaw
		.filter((m: { entity_type: string; entity_id: string | null }) => m.entity_type === 'cryptocurrency' && m.entity_id)
		.map((m: { entity_id: string | null }) => String(m.entity_id))))

	const companies = companyIds.length > 0 ? await prisma.companies.findMany({
		where: { id: { in: companyIds } },
		select: { id: true, name: true, ticker: true },
	}) : []
	const cryptos = cryptoIds.length > 0 ? await prisma.cryptocurrencies.findMany({
		where: { id: { in: cryptoIds } },
		select: { id: true, name: true },
	}) : []


	const mentions = mentionsRaw.map((m: { start: number; end: number; entity_type: string; entity_id: string | null; details: any }) => {
		return {
			start: Number(m.start) || 0,
			end: Number(m.end) || 0,
			entityType: m.entity_type,
			entityId: m.entity_id,
			details: m.details,
		}
	})

	return (
		<div className="min-h-screen bg-white text-gray-900 pb-20">
			<ClientPostView
				id={post.id}
				title={post.title}
				videoUrl={post.url}
				channelTitle={post.channels?.title ?? null}
				published={published}
				duration={duration}
				description={post.description}
				paragraphs={paragraphs}
				mentions={mentions}
			/>
		</div>
	)
} 
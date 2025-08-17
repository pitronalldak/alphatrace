'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Poppins } from 'next/font/google'
import { Inter } from 'next/font/google'
import RefreshChannelButton from './RefreshChannelButton'
import RefreshPostButton from './[post_id]/RefreshPostButton'

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'] })
const inter = Inter({ subsets: ['latin'], weight: ['500'] })

type PostItem = {
	id: string
	title: string | null
	url: string
	views: number
	likes: number
	comments: number
	published_at: string
	post_id?: string | null
	hasTranscript?: boolean
	durationSec?: number | null
	logo_url?: string | null
}

const PAGE_SIZE = 25

function formatDuration(seconds?: number | null): string | null {
	if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) return null
	const total = Math.floor(seconds)
	const h = Math.floor(total / 3600)
	const m = Math.floor((total % 3600) / 60)
	const s = total % 60
	if (h > 0) {
		return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
	}
	return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function PostsList({ channelId, channelUrl }: { channelId: string; channelUrl?: string | null }) {
	const [posts, setPosts] = useState<PostItem[]>([])
	const [page, setPage] = useState(0)
	const [hasMore, setHasMore] = useState(true)
	const [loading, setLoading] = useState(false)
	const sentinelRef = useRef<HTMLDivElement | null>(null)
	const loadingRef = useRef(false)
	const hasMoreRef = useRef(true)

	useEffect(() => {
		loadingRef.current = loading
	}, [loading])

	useEffect(() => {
		hasMoreRef.current = hasMore
	}, [hasMore])

	const loadPage = useCallback(async (nextPage: number) => {
		if (loadingRef.current || !hasMoreRef.current) return
		setLoading(true)
		try {
			const res = await fetch(`/api/channels/${encodeURIComponent(channelId)}/posts?page=${nextPage}`, { cache: 'no-store' })
			if (!res.ok) throw new Error('Failed to load')
			const data = (await res.json()) as { items: PostItem[]; hasMore: boolean }
			setPosts((prev) => (nextPage === 0 ? data.items : [...prev, ...data.items]))
			setHasMore(data.hasMore)
			setPage(nextPage)
		} finally {
			setLoading(false)
		}
	}, [channelId])

	// Reset and load first page when channel changes
	useEffect(() => {
		setPosts([])
		setHasMore(true)
		setPage(0)
		loadPage(0)
	}, [channelId, loadPage])

	// Observe sentinel to load subsequent pages
	useEffect(() => {
		const el = sentinelRef.current
		if (!el) return
		const observer = new IntersectionObserver((entries) => {
			const first = entries[0]
			if (first.isIntersecting && hasMoreRef.current && !loadingRef.current) {
				loadPage(page + 1)
			}
		}, { rootMargin: '200px' })
		observer.observe(el)
		return () => observer.disconnect()
	}, [page, loadPage])

	return (
		<div className="space-y-2">
			{posts.map((p) => (
				<Link key={p.id} href={`/yt/${encodeURIComponent(channelId)}/posts/${encodeURIComponent(p.id)}`} className={`${poppins.className} flex items-center justify-between rounded-md border border-gray-200 px-4 py-3`} style={{ background: '#FAFAFBFF' }}>
					<div className="flex items-center gap-3 min-w-0 mr-4">
						{p.logo_url ? (
							<img src={p.logo_url} alt={p.title ?? p.id} className="h-10 w-10 rounded-md object-cover bg-gray-100 border border-gray-200" />
						) : (
							<div className="h-10 w-10 rounded-md bg-gray-200" />
						)}
						<div className="min-w-0">
							<div className="truncate font-medium" style={{
								fontSize: "16px",
								lineHeight: "24px", 
								fontWeight: "600", 
								color: "#171A1FFF"}}
							>{p.title ?? p.id}</div>
							<div className="mt-1 text-xs text-gray-500 flex items-center gap-3">
								<span>{Intl.NumberFormat('en', { notation: 'compact' }).format(p.views)} views</span>
								<span>{Intl.NumberFormat('en', { notation: 'compact' }).format(p.likes)} likes</span>
								<span>{Intl.NumberFormat('en', { notation: 'compact' }).format(p.comments)} comments</span>
								<span>{new Date(p.published_at).toLocaleDateString()}</span>
							</div>
						</div>
					</div>
					<div className="flex flex-col items-end gap-1">
						{p.hasTranscript ? (
							<span className="inline-flex items-center justify-center h-6 w-8 rounded border border-gray-300 text-[10px] font-semibold text-gray-700 bg-white">CC</span>
						) : (
							<RefreshChannelButton channelUrl={channelUrl ?? undefined} size="sm" title="Fetch transcript" showStatus={false} />
						)}
						{formatDuration(p.durationSec) && (
							<span className={`${inter.className}`} style={{ fontSize: '12px', lineHeight: '16px', fontWeight: 500, color: '#171A1FFF' }}>
								{formatDuration(p.durationSec)}
							</span>
						)}
					</div>
				</Link>
			))}
			{!loading && posts.length === 0 && (
				<div className="text-sm text-gray-500">No posts yet.</div>
			)}
			<div ref={sentinelRef} className="h-10" />
			{loading && <div className="text-sm text-gray-500">Loading…</div>}
		</div>
	)
} 
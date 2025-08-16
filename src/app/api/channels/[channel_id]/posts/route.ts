import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const PAGE_SIZE = 25

type RawPost = {
    id: string
    title: string | null
    url: string
    views: number
    likes: number
    comments: number
    published_at: Date
    duration_seconds: number | null
    logo_url: string | null
    has_transcript: boolean
}

export async function GET(
    request: Request,
    context: { params: Promise<{ channel_id: string }> }
) {
    const { channel_id: rawParam } = await context.params
    const { searchParams } = new URL(request.url)
    const pageParam = Number(searchParams.get('page') || '0')
    const page = Number.isFinite(pageParam) && pageParam >= 0 ? pageParam : 0

    // Resolve the canonical channels.id from either id or external channel_id
    const channel = await prisma.channels.findFirst({
        where: {
            OR: [{ id: rawParam }, { channel_id: rawParam }],
        },
        select: { id: true },
    })

    if (!channel) {
        return NextResponse.json({ items: [], hasMore: false, error: 'Channel not found' }, { status: 404 })
    }

    const itemsRaw = await prisma.$queryRaw<RawPost[]>`
		SELECT p.id,
		       p.title,
		       p.url,
		       p.views,
		       p.likes,
		       p.comments,
		       p.published_at,
		       p.duration_seconds,
		       p.logo_url,
		       EXISTS(SELECT 1 FROM transcripts t WHERE t.post_id = p.id) AS has_transcript
		FROM posts p
		WHERE p.channel_id = ${channel.id}::uuid
		ORDER BY p.published_at DESC
		OFFSET ${page * PAGE_SIZE} LIMIT ${PAGE_SIZE}
	`

    const items = itemsRaw.map((row: RawPost) => ({
        id: row.id,
        title: row.title,
        url: row.url,
        views: row.views,
        likes: row.likes,
        comments: row.comments,
        published_at: row.published_at,
        hasTranscript: !!row.has_transcript,
        durationSec: row.duration_seconds != null ? Math.round(Number(row.duration_seconds)) : null,
        logo_url: row.logo_url ?? null,
    }))

    return NextResponse.json({ items, hasMore: items.length === PAGE_SIZE })
} 
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim() || undefined
    const takeParam = searchParams.get('take')
    const take = Math.min(Number.isFinite(Number(takeParam)) ? Number(takeParam) : 50, 200)

    const where = q
        ? {
            OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
                { url: { contains: q, mode: 'insensitive' } },
                { channel_id: { contains: q, mode: 'insensitive' } },
            ],
        }
        : undefined

    const items = await prisma.channels.findMany({
        where,
        orderBy: { subscribers: 'desc' },
        take,
        select: {
            id: true,
            title: true,
            url: true,
            description: true,
            subscribers: true,
            posts_cnt: true,
            channel_id: true,
            media_type: true,
        },
    })

    return NextResponse.json({ items })
} 
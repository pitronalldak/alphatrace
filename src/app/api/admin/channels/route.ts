import { NextResponse } from 'next/server'
import { ALPHATRACE_API_URL } from '@/config/env'

export async function POST(request: Request) {
    try {
        const { url, type } = await request.json().catch(() => ({})) as { url?: string, type?: string }
        if (!url || typeof url !== 'string') {
            return NextResponse.json({ error: 'Missing url' }, { status: 400 })
        }

        const upstream = await fetch(`${ALPHATRACE_API_URL}/channels/import`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, type }),
        })

        const data = await upstream.json().catch(() => ({}))
        return NextResponse.json(data, { status: upstream.status })
    } catch (err) {
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}

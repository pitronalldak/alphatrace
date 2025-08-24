'use client'

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'

type PlayerHandle = {
    playFrom: (seconds: number) => void
}

function extractYouTubeId(url?: string | null): string | null {
    if (!url) return null
    try {
        const u = new URL(url)
        if (u.hostname.includes('youtu.be')) return u.pathname.replace('/', '') || null
        if (u.searchParams.get('v')) return u.searchParams.get('v')
        const path = u.pathname.split('/')
        const idx = path.findIndex((p) => p === 'embed' || p === 'shorts' || p === 'live')
        if (idx >= 0 && path[idx + 1]) return path[idx + 1]
        return null
    } catch {
        return null
    }
}

export default forwardRef<PlayerHandle, { videoUrl?: string | null; className?: string }>(function YouTubePlayer({ videoUrl, className }, ref) {
    const iframeRef = useRef<HTMLIFrameElement | null>(null)
    const [ready, setReady] = useState(false)
    const pending = useRef<Array<() => void>>([])
    const videoId = useMemo(() => extractYouTubeId(videoUrl), [videoUrl])
    const src = useMemo(() => (videoId ? `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?enablejsapi=1&rel=0&modestbranding=1` : undefined), [videoId])

    useEffect(() => {
        function handleMessage(event: MessageEvent) {
            if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) return
            try {
                const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
                if (data?.event === 'onReady') {
                    setReady(true)
                }
            } catch {}
        }
        window.addEventListener('message', handleMessage)
        return () => window.removeEventListener('message', handleMessage)
    }, [])

    function postCommand(func: string, args: any[] = []) {
        const iframe = iframeRef.current
        if (!iframe || !iframe.contentWindow) return
        const message = JSON.stringify({ event: 'command', func, args })
        iframe.contentWindow.postMessage(message, '*')
    }

    function playFrom(seconds: number) {
        const action = () => {
            postCommand('seekTo', [Math.max(0, Math.floor(Number(seconds) || 0)), true])
            postCommand('playVideo', [])
        }
        if (ready) action()
        else pending.current.push(action)
    }

    useEffect(() => {
        if (ready && pending.current.length > 0) {
            const tasks = [...pending.current]
            pending.current = []
            tasks.forEach((t) => t())
        }
    }, [ready])

    useImperativeHandle(ref, () => ({ playFrom }))

    if (!src) return null

    return (
        <div className={className} style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', height: 0 }}>
            <iframe
                ref={iframeRef}
                src={src}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                title="YouTube video player"
            />
        </div>
    )
})



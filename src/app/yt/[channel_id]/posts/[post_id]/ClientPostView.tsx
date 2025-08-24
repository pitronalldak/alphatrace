'use client'

import { useMemo, useRef, useState } from 'react'
import YouTubePlayer from './YouTubePlayer'
import TranscriptPanel from './TranscriptPanel'
import ExpandableText from './ExpandableText'
import RefreshPostButton from './RefreshPostButton'
import EntityFooter from './EntityFooter'

type Snippet = { confidence: string; end: number; speaker: string; start: number; text: string }

export default function ClientPostView({
    id,
    title,
    videoUrl,
    channelTitle,
    published,
    duration,
    description,
    paragraphs,
    mentions,
}: {
    id: string
    title?: string | null
    videoUrl?: string | null
    channelTitle?: string | null
    published: string
    duration?: string | null
    description?: string | null
    paragraphs: Snippet[]
    mentions: { start: number; end: number;  entityType?: string; entityId: string | null; details: { sentiment: any; match_score?: number; name?: string | null; ticker?: string | null; entity_id: string } }[]
}) {
    const ytRef = useRef<{ playFrom: (t: number) => void } | null>(null)
    const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null)

    console.log('mentions', mentions)
    const chips = useMemo(() => {
        const byKey = new Map<string, { id: string; label: string; kind: 'company' | 'crypto' | 'other'; color: 'bg-green-400' | 'bg-red-400' | 'bg-gray-400' }>()
        for (const m of mentions) {
            const name = (m.details?.name ?? '').trim()
            if (!name) continue
            const key = `${m.entityType ?? 'other'}::${name}`
            if (byKey.has(key)) continue
            const ticker = m.details?.ticker ? ` (${m.details.ticker})` : ''
            const label = (name + ticker).trim()
            const kind: 'company' | 'crypto' | 'other' = m.entityType === 'company' ? 'company' : m.entityType === 'crypto' ? 'crypto' : 'other'
            const score = Number(m.details?.sentiment?.score)
            console.log('score', score)
            const color: 'bg-green-400' | 'bg-red-400' | 'bg-gray-400' = Number.isFinite(score) ? (score > 0 ? 'bg-green-400' : score < 0 ? 'bg-red-400' : 'bg-gray-400') : 'bg-gray-400'
            byKey.set(key, { id: name, label, kind, color })
        }
        return Array.from(byKey.values())
    }, [mentions])

    return (
        <>
            <header className="w-full" style={{ background: '#FAFAFBFF' }}>
                <div className="max-w-6xl mx-auto px-6 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        <div className="w-full md:col-span-1">
                            <YouTubePlayer ref={ytRef as any} videoUrl={videoUrl} />
                        </div>
                        <div className="min-w-0 md:col-span-1">
                            <div className="flex items-start justify-between gap-4">
                                <h1 className="text-[32px] leading-[1.2] font-extrabold tracking-tight text-gray-900">{title ?? id}</h1>
                                <RefreshPostButton postUrl={videoUrl} />
                            </div>
                            <div className="mt-4 flex flex-wrap items-center gap-5 text-sm text-gray-600">
                                <span className="inline-flex items-center gap-2"><span aria-hidden>👤</span><span>{channelTitle ?? 'Channel'}</span></span>
                                <span className="inline-flex items-center gap-2"><span aria-hidden>📅</span><span>{published}</span></span>
                                {duration && <span className="inline-flex items-center gap-2"><span aria-hidden>⏱</span><span>{duration}</span></span>}
                            </div>
                            {description && (<div className="mt-6"><ExpandableText text={description} lines={2} /></div>)}
                        </div>
                    </div>
                </div>
            </header>

            {chips.length > 0 && (
                <div className="max-w-6xl mx-auto px-6 mt-12">
                    <div className="flex flex-wrap gap-2 pb-2">
                        {chips.map((chip) => {
                            const selected = chip.id === selectedEntityId
                            return (
                                <button
                                    key={chip.id}
                                    type="button"
                                    onClick={() => setSelectedEntityId((prev) => (prev === chip.id ? null : chip.id))}
                                    className={`px-3 py-1 rounded-full text-sm font-bold text-white border cursor-pointer transition-transform transition-colors duration-200 ease-out ${selected ? 'bg-blue-600 border-blue-600' : `${chip.color} border-transparent`} hover:scale-105 active:scale-95 shadow-sm`}
                                >
                                    <span className="inline-flex items-center gap-2">
                                        {chip.kind === 'company' && (
                                            <span aria-hidden className="text-[14px]">🏢</span>
                                        )}
                                        {chip.kind === 'crypto' && (
                                            <span aria-hidden className="text-[14px]">🪙</span>
                                        )}
                                        <span>{chip.label}</span>
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto px-6 py-10">
                {paragraphs?.length > 0 ? (
                    <TranscriptPanel
                        paragraphs={paragraphs}
                        mentions={mentions}
                        selectedEntityId={selectedEntityId}
                        onPlayAt={(s) => ytRef.current?.playFrom(Math.max(0, Math.floor(Number(s) || 0)))}
                    />
                ) : (
                    <p className="text-sm text-gray-500">No transcript available for this episode.</p>
                )}
            </div>

            {/* Footer with entity details */}
            <EntityFooter
                open={!!selectedEntityId}
                details={useMemo(() => {
                    if (!selectedEntityId) return null
                    const m = mentions.find((mm) => (mm.details?.name ?? '') === selectedEntityId)
                    return m?.details ?? null
                }, [selectedEntityId, mentions])}
                entityType={useMemo(() => {
                    if (!selectedEntityId) return null
                    const m = mentions.find((mm) => (mm.details?.name ?? '') === selectedEntityId)
                    return m?.entityType ?? null
                }, [selectedEntityId, mentions])}
                onClose={() => setSelectedEntityId(null)}
            />
        </>
    )
}



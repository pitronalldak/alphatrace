'use client'

import { useMemo } from 'react'

type Props = {
    open: boolean
    details: Record<string, any> | null
    entityType?: string | null
    onClose?: () => void
}

export default function EntityFooter({ open, details, entityType, onClose }: Props) {
    const items = useMemo(() => {
        if (!details) return [] as Array<{ key: string; value: string }>
        const speaker = details?.speaker
        const polarity = details?.sentiment?.polarity
        const emotionsRaw = details?.sentiment?.emotions
        const intensity = details?.sentiment?.intensity
        const subjectivity = details?.sentiment?.subjectivity
        const emotions = Array.isArray(emotionsRaw) ? emotionsRaw.join(', ') : emotionsRaw
        const list: Array<{ key: string; value: string }> = []
        if (speaker != null && speaker !== '') list.push({ key: 'Speaker', value: formatValue(speaker) })
        if (polarity != null && polarity !== '') list.push({ key: 'Polarity', value: formatValue(polarity) })
        if (emotions != null && emotions !== '') list.push({ key: 'Emotions', value: formatValue(emotions) })
        if (intensity != null && intensity !== '') list.push({ key: 'Intensity', value: formatValue(intensity) })
        if (subjectivity != null && subjectivity !== '') list.push({ key: 'Subjectivity', value: formatValue(subjectivity) })
        return list
    }, [details])

    const icon = entityType === 'company' ? '🏢' : entityType === 'crypto' || entityType === 'cryptocurrency' ? '🪙' : '🔎'

    // Header data extraction with graceful fallbacks
    const header = useMemo(() => {
        const name: string | undefined = (details?.name ?? details?.title ?? undefined) as any
        const ticker: string | undefined = (details?.ticker ?? details?.symbol ?? undefined) as any
        const sector: string | undefined = (details?.sector ?? details?.industry ?? details?.category ?? undefined) as any
        const updatedAt: string | number | Date | undefined = (details?.updated_at ?? details?.last_updated ?? details?.updatedAt ?? undefined) as any
        const price: number | string | undefined = (details?.price ?? details?.current_price ?? details?.currentPrice ?? undefined) as any
        const change: number | string | undefined = (details?.change ?? details?.price_change ?? details?.delta ?? undefined) as any
        const changePct: number | string | undefined = (details?.change_percent ?? details?.price_change_percent ?? details?.percent ?? undefined) as any
        const sentimentScore: number | string | undefined = (details?.sentiment?.score ?? undefined) as any
        const sentimentJust: string | undefined = (details?.sentiment?.score_justification ?? undefined) as any
        const sentimentSummary: string | undefined = (details?.sentiment?.summary ?? undefined) as any

        function fmtAgo(val: any): string | undefined {
            try {
                if (!val) return undefined
                const ts = new Date(val as any).getTime()
                if (!Number.isFinite(ts)) return undefined
                const mins = Math.max(0, Math.floor((Date.now() - ts) / 60000))
                return mins === 0 ? 'Updated just now' : `Updated ${mins} minute${mins === 1 ? '' : 's'} ago`
            } catch {
                return undefined
            }
        }

        return {
            name,
            ticker,
            sector,
            updatedText: fmtAgo(updatedAt),
            price: typeof price === 'number' ? price : price != null ? Number(price) : undefined,
            change: typeof change === 'number' ? change : change != null ? Number(change) : undefined,
            changePct: typeof changePct === 'number' ? changePct : changePct != null ? Number(changePct) : undefined,
            sentimentScore: typeof sentimentScore === 'number' ? sentimentScore : sentimentScore != null ? Number(sentimentScore) : undefined,
            sentimentJust,
            sentimentSummary,
        }
    }, [details])

    return (
        <div
            className={`fixed left-0 right-0 bottom-0 z-50 pointer-events-none`}
            aria-hidden={!open}
        >
            <div
                className={`w-full transition-transform duration-300 ease-out ${open ? 'translate-y-0' : 'translate-y-full'}`}
            >
                <div className="pointer-events-auto w-full rounded-t-2xl border-t border-gray-200 bg-white shadow-xl relative"
                >
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-2 right-2 h-8 w-8 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                        aria-label="Close"
                    >
                        ×
                    </button>
                    <div className="px-6 pt-4 text-[16px]">
                        <div className="grid grid-cols-1 md:grid-cols-3 items-start gap-4">
                            {/* Left: Name, sector, updated */}
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 text-gray-900">
                                    <span aria-hidden className="text-lg">{icon}</span>
                                    <h3 className="text-[32px] leading-[1.2] font-semibold truncate">
                                        {header.name ?? '—'}{header.ticker ? <span className="ml-2 text-gray-500 text-sm align-middle">{header.ticker}</span> : null}
                                    </h3>
                                </div>
                                <div className="mt-2 text-[16px] text-gray-600 flex items-center gap-4">
                                    {header.sector && <span>{header.sector}</span>}
                                    {header.updatedText && <span className="text-gray-400">{header.updatedText}</span>}
                                </div>
                            </div>

                            {/* Middle: Price and change */}
                            <div className="flex items-center gap-3">
                                {header.price != null && (
                                    <div className="text-2xl font-semibold text-gray-900">{formatMoney(header.price)}</div>
                                )}
                                {(header.change != null || header.changePct != null) && (
                                    <div className={`text-[16px] font-medium ${Number(header.change) >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center gap-1`}>
                                        {Number(header.change) >= 0 ? '↑' : '↓'}
                                        {header.change != null && <span>{formatNumber(header.change)}</span>}
                                        {header.changePct != null && <span>({formatPercent(header.changePct)})</span>}
                                    </div>
                                )}
                            </div>

                            {/* Right: empty (close button moved to absolute top-right) */}
                            <div className="flex items-start justify-end gap-6"></div>
                        </div>
                        {(header.sentimentScore != null) && (
                            <div className="mt-2 px-1 text-[16px] text-gray-700">
                                Sentiment index{' '}
                                <span className="font-semibold text-gray-900" title={header.sentimentJust ?? undefined}>{formatNumber(header.sentimentScore)}</span>
                                {header.sentimentJust ? <span className="text-gray-500"> ({header.sentimentJust})</span> : null}
                            </div>
                        )}
                        {header.sentimentSummary && (
                            <div className="mt-1 px-1 pb-2 text-[16px] text-gray-700">
                                {header.sentimentSummary}
                            </div>
                        )}
                    </div>
                    <div className="px-6 py-4 overflow-y-auto">
                        {items.length === 0 ? (
                            <p className="text-[16px] text-gray-500">No details available.</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-[16px]">
                                {items.map(({ key, value }) => (
                                    <div key={key} className="flex items-start gap-3">
                                        <div className="min-w-[120px] text-gray-500">{key}</div>
                                        <div className="font-medium text-gray-900 break-words">{value}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function formatValue(val: any): string {
    try {
        if (val == null) return ''
        if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') return String(val)
        return JSON.stringify(val)
    } catch {
        return String(val)
    }
}

function flattenDetails(details: Record<string, any>): Array<{ key: string; value: string }> {
    const omitKeys = new Set(['start_index', 'start', 'end', 'end_index'])
    const rows: Array<{ key: string; value: string }> = []
    for (const [k, v] of Object.entries(details)) {
        if (omitKeys.has(k)) continue
        if (v != null && typeof v === 'object' && !Array.isArray(v)) {
            for (const [ck, cv] of Object.entries(v)) {
                rows.push({ key: `${k}.${ck}`, value: formatValue(cv) })
            }
        } else {
            rows.push({ key: k, value: formatValue(v) })
        }
    }
    return rows
}

function formatMoney(n: number): string {
    try {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n)
    } catch {
        return String(n)
    }
}

function formatNumber(n: number): string {
    try {
        return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n)
    } catch {
        return String(n)
    }
}

function formatPercent(n: number): string {
    try {
        return `${n >= 0 ? '' : ''}${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n)}%`
    } catch {
        return `${n}%`
    }
}



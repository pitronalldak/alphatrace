'use client'

import { RefObject, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

type Snippet = { confidence: string; end: number; speaker: string; start: number; text: string }

type Mention = { start: number; end: number; entityId?: string | null; details: { sentiment: any; name?: string | null; ticker?: string | null } }

type Props = {
	paragraphs: Snippet[]
	audioUrl?: string | null
	externalAudioRef?: RefObject<HTMLAudioElement>
	onFirstPlay?: () => void
	onPlayAt?: (seconds: number, persist: boolean) => void
	mentions?: Mention[]
    selectedEntityId?: string | null
}

export default function TranscriptPanel({ paragraphs, audioUrl, externalAudioRef, onFirstPlay, onPlayAt, mentions = [], selectedEntityId = null }: Props) {
	const [q, setQ] = useState('')
	const [stickyPlay, setStickyPlay] = useState(false)
	const internalRef = useRef<HTMLAudioElement | null>(null)
	const audioRef = externalAudioRef ?? internalRef
	const firstPlayedRef = useRef(false)

	
	const filtered = useMemo(() => {
		if (!Array.isArray(paragraphs)) return []
		if (!q) return paragraphs
		return paragraphs.filter((p) => p.text?.toLowerCase().includes(q.toLowerCase()))
	}, [paragraphs, q])

	function playFrom(start: number, persist: boolean) {
		if (onPlayAt) {
			onPlayAt(start, persist)
			if (persist && !firstPlayedRef.current) {
				firstPlayedRef.current = true
				onFirstPlay?.()
			}
			return
		}
		const audio = audioRef.current
		if (!audio || !audioUrl) return
		if (audio.src !== audioUrl) audio.src = audioUrl
		try {
			audio.currentTime = Math.max(0, Number(start) || 0)
			audio.play().catch(() => {})
			setStickyPlay(persist)
			if (persist && !firstPlayedRef.current) {
				firstPlayedRef.current = true
				onFirstPlay?.()
			}
		} catch {}
	}

	function handleHover(start: number) {
		playFrom(start, false)
	}

	function handleClick(start: number) {
		playFrom(start, true)
	}

	function handleLeave() {
		const audio = audioRef.current
		if (!audio) return
		if (!stickyPlay) audio.pause()
	}

	useEffect(() => {
		const audio = audioRef.current
		if (!audio) return
		const onEnded = () => setStickyPlay(false)
		audio.addEventListener('ended', onEnded)
		return () => audio.removeEventListener('ended', onEnded)
	}, [audioRef])


	return (
		<div className="space-y-4 mb-[240px]">
			{!onPlayAt && audioUrl && !externalAudioRef && <audio ref={audioRef} preload="metadata" />}
			<div className="space-y-3">
				<p className="text-[16px] text-gray-800">
					{(() => {
						const nodes: ReactNode[] = []
						let i = 0
						while (i < filtered.length) {
							const snip = filtered[i]
							const match = selectedEntityId
								? mentions.find((m) => snip.start < m.end && snip.end > m.start && (m.details?.name ?? null) === selectedEntityId)
								: undefined
							const isHighlighted = !!match

							if (!isHighlighted) {
								// Non-highlighted snippet rendered plainly
								nodes.push(
									<span key={`s-${i}`}>
										{snip.text
											?.split(/\s+/)
											.filter(Boolean)
											.map((word, wi) => (
												<span
													key={`w-${i}-${wi}`}
													onClick={() => handleClick(snip.start)}
												>
													{word}
												</span>
											))}{' '}
									</span>
								)
								i += 1
								continue
							}

							// Start a highlighted group
							let groupColor = (() => {
								const sRaw = (match as any)?.details?.sentiment?.score ?? (match as any)?.details?.score ?? (match as any)?.details?.match_score
								const sNum = Number(sRaw)
								return sRaw == null || !Number.isFinite(sNum) ? 'bg-gray-400' : sNum > 0 ? 'bg-green-400' : sNum < 0 ? 'bg-red-400' : 'bg-gray-400'
							})()
							const groupItems: ReactNode[] = []
							let j = i
							while (j < filtered.length) {
								const s = filtered[j]
								const m2 = selectedEntityId
									? mentions.find((m) => s.start < m.end && s.end > m.start && (m.details?.name ?? null) === selectedEntityId)
									: undefined

								// groupColor stays consistent for the whole group based on the first matched mention

								if (!m2) break

								groupItems.push(
									<span key={`s-${j}`}>
										{s.text
											?.split(/\s+/)
											.filter(Boolean)
											.map((word, wi) => (
												<span
													key={`w-${j}-${wi}`}
													onClick={() => handleClick(s.start)}
												>
													{word}
												</span>
											))}{' '}
									</span>
								)
								j += 1
							}
							
							nodes.push(
								<span key={`g-${i}`} className="relative inline-block">
									<span className={`${groupColor} absolute inset-0 rounded-[4px] rounded-tl-[0px]`} aria-hidden />
									{(match?.details?.name || match?.details?.ticker) && (
										<span className={`absolute ${groupColor} text-white font-bold rounded-[2px] z-10`} style={{ whiteSpace: 'nowrap', transform: 'translateX(-100%)', left: '1px', padding: '2px 6px', borderTopLeftRadius: '8px' }}>
											{`${match?.details?.name ?? ''}${match?.details?.name && match?.details?.ticker ? ' ' : ''}${match?.details?.ticker ? `(${match?.details?.ticker})` : ''}`}
										</span>
									)}
									<span className="relative z-10 py-[2px] px-[2px] text-white font-bold cursor-pointer">
										{groupItems}
									</span>
								</span>
							)
							i = j
						}
						return nodes
					})()}
				</p>
				{filtered.length === 0 && (
					<p className="text-sm text-gray-500">No matching results.</p>
				)}
			</div>
		</div>
	)
} 
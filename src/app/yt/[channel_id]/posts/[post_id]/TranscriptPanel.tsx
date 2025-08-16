'use client'

import { RefObject, useEffect, useMemo, useRef, useState } from 'react'

type Snippet = { confidence: string; end: number; speaker: string; start: number; text: string }

type Props = {
	paragraphs: Snippet[]
	audioUrl?: string | null
	externalAudioRef?: RefObject<HTMLAudioElement>
	onFirstPlay?: () => void
}

export default function TranscriptPanel({ paragraphs, audioUrl, externalAudioRef, onFirstPlay }: Props) {
	console.log('TranscriptPanel', paragraphs, audioUrl, externalAudioRef)
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
		console.log('playFrom', start, persist)
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
		<div className="space-y-4">
			{audioUrl && !externalAudioRef && <audio ref={audioRef} preload="metadata" />}
			<input
				type="text"
				placeholder="Search transcript..."
				className="w-full max-w-md rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
				value={q}
				onChange={(e) => setQ(e.target.value)}
		/>
			<div className="space-y-3">
				<p className="text-sm leading-7 text-gray-800">
					{filtered.map((snip, si) => (
						<span key={`s-${si}`}>
							{snip.text
								?.split(/\s+/)
								.filter(Boolean)
								.map((word, wi) => (
									<span
										key={`w-${si}-${wi}`}
										onMouseEnter={() => handleHover(snip.start)}
										onMouseLeave={handleLeave}
										onClick={() => handleClick(snip.start)}
										className="hover:underline cursor-pointer"
									>
										{word}
									</span>
								))}
							{' '}
						</span>
					))}
				</p>
				{filtered.length === 0 && (
					<p className="text-sm text-gray-500">No matching results.</p>
				)}
			</div>
		</div>
	)
} 
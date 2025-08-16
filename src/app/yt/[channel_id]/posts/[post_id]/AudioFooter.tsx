'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

function formatTime(sec: number) {
	if (!Number.isFinite(sec) || sec < 0) sec = 0
	const m = Math.floor(sec / 60)
	const s = Math.floor(sec % 60)
	return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function AudioFooter({ audioUrl, externalRef }: { audioUrl?: string | null; externalRef?: React.RefObject<HTMLAudioElement> }) {
	const internalRef = useRef<HTMLAudioElement | null>(null)
	const audioRef = externalRef ?? internalRef
	const [playing, setPlaying] = useState(false)
	const [current, setCurrent] = useState(0)
	const [duration, setDuration] = useState(0)
	const [volume, setVolume] = useState(1)

	useEffect(() => {
		const audio = audioRef.current
		if (!audio) return
		if (audioUrl && audio.src !== audioUrl) audio.src = audioUrl
		const onTime = () => setCurrent(audio.currentTime)
		const onMeta = () => setDuration(audio.duration || 0)
		const onEnd = () => setPlaying(false)
		audio.addEventListener('timeupdate', onTime)
		audio.addEventListener('loadedmetadata', onMeta)
		audio.addEventListener('ended', onEnd)
		return () => {
			audio.removeEventListener('timeupdate', onTime)
			audio.removeEventListener('loadedmetadata', onMeta)
			audio.removeEventListener('ended', onEnd)
		}
	}, [audioRef, audioUrl])

	function togglePlay() {
		const audio = audioRef.current
		if (!audio) return
		if (audio.paused) {
			audio.play().then(() => setPlaying(true)).catch(() => {})
		} else {
			audio.pause()
			setPlaying(false)
		}
	}

	function seek(p: number) {
		const audio = audioRef.current
		if (!audio || !Number.isFinite(duration) || duration <= 0) return
		audio.currentTime = Math.max(0, Math.min(duration, p * duration))
	}

	function changeVolume(v: number) {
		const audio = audioRef.current
		if (!audio) return
		audio.volume = Math.max(0, Math.min(1, v))
		setVolume(audio.volume)
	}

	return (
		<div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
			<div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
				{/* Controls */}
				<button onClick={togglePlay} className="h-10 w-10 rounded-full bg-[#1E6DB5] text-white flex items-center justify-center">
					{playing ? '❚❚' : '►'}
				</button>
				{/* Progress */}
				<div className="flex-1 flex items-center gap-3">
					<span className="text-sm text-gray-700 w-12 text-right">{formatTime(current)}</span>
					<input
						type="range"
						min={0}
						max={1000}
						value={duration > 0 ? Math.floor((current / duration) * 1000) : 0}
						onChange={(e) => seek(Number(e.target.value) / 1000)}
						className="flex-1 h-2 rounded bg-gray-100 appearance-none"
					/>
					<span className="text-sm text-gray-700 w-12">{formatTime(duration)}</span>
				</div>
				{/* Volume */}
				<div className="flex items-center gap-2">
					<span role="img" aria-label="volume">🔊</span>
					<input type="range" min={0} max={100} value={Math.round(volume * 100)} onChange={(e) => changeVolume(Number(e.target.value) / 100)} />
				</div>
			</div>
			{!externalRef && <audio ref={audioRef} preload="metadata" className="hidden" />}
		</div>
	)
} 
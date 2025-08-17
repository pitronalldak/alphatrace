'use client'

import { useState } from 'react'
 
type SizeOption = 'sm' | 'md'

export default function RefreshChannelButton({ channelUrl, size = 'md', title = 'Refresh channel', showStatus = true }: { channelUrl?: string | null; size?: SizeOption; title?: string; showStatus?: boolean }) {
	const [loading, setLoading] = useState(false)
	const [ok, setOk] = useState<boolean | null>(null)

	async function refreshChannel() {
		if (!channelUrl) return
		setLoading(true)
		setOk(null)
		try {
			const res = await fetch('/api/admin/channels', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ url: channelUrl }),
			})
			setOk(res.ok)
		} catch {
			setOk(false)
		} finally {
			setLoading(false)
		}
	}

	const buttonSizeClass = size === 'sm' ? 'h-6 w-6' : 'h-9 w-9'
	const iconSizeClass = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'

	return (
		<div className="relative inline-flex items-center">
			<button
				type="button"
				onClick={(e) => {
					e.preventDefault()
					e.stopPropagation()
					refreshChannel()
				}}
				disabled={!channelUrl || loading}
				title={title}
				aria-label={title}
				className={`${buttonSizeClass} rounded-full border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center`}
			>
				{loading ? (
					<svg className={`${iconSizeClass} animate-spin`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
						<path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
					</svg>
				) : (
					<svg className={iconSizeClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
						<path d="M21 12a9 9 0 1 1-3.66-7.24"/>
						<polyline points="21 3 21 9 15 9"/>
					</svg>
				)}
			</button>
			{showStatus && ok !== null && (
				<span className={`ml-2 text-xs ${ok ? 'text-green-600' : 'text-red-600'}`}>{ok ? 'Refreshed' : 'Failed'}</span>
			)}
		</div>
	)
}

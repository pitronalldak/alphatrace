"use client"

import { useState } from 'react'
import Link from 'next/link'

export default function AdminPage() {
	const [url, setUrl] = useState('')
	const [loading, setLoading] = useState(false)
	const [message, setMessage] = useState<string | null>(null)

	async function submit(e: React.FormEvent) {
		e.preventDefault()
		setMessage(null)
		if (!url.trim()) return
		setLoading(true)
		try {
			const res = await fetch('/api/admin/channels', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ url: url.trim() }),
			})
			const data = await res.json().catch(() => ({}))
			if (!res.ok) throw new Error(data?.error || 'Failed to create channel')
			setMessage('Channel created successfully')
			setUrl('')
		} catch (err: any) {
			setMessage(err?.message || 'Something went wrong')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="min-h-screen bg-white text-gray-900">
			<div className="max-w-xl mx-auto px-6 py-10">
				<h1 className="text-2xl font-bold mb-2">Admin: Add YouTube Channel</h1>
				<div className="mb-4">
					<Link href="/yt" className="text-sm text-blue-600 hover:underline">Go to all channels</Link>
				</div>
				<form onSubmit={submit} className="space-y-4">
					<input
						type="url"
						placeholder="https://www.youtube.com/@channel or video/channel URL"
						className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
						value={url}
						onChange={(e) => setUrl(e.target.value)}
					/>
					<button
						type="submit"
						disabled={loading || !url.trim()}
						className="rounded-md bg-[#1E6DB5] text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
					>
						{loading ? 'Adding…' : 'Add channel'}
					</button>
				</form>
				{message && <p className="mt-4 text-sm">{message}</p>}
			</div>
		</div>
	)
}

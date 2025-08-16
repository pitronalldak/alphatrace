'use client'

import { useState } from 'react'

export default function ExpandableText({ text, lines = 2 }: { text: string; lines?: number }) {
	const [expanded, setExpanded] = useState(false)

	if (!text?.trim()) return null

	return (
		<div>
			<p className={expanded ? 'text-base leading-7 text-gray-700' : `text-base leading-7 text-gray-700 line-clamp-${lines}`}>
				{text}
			</p>
			<button
				type="button"
				onClick={() => setExpanded((v) => !v)}
				className="mt-2 text-sm font-medium text-blue-600 hover:underline"
			>
				{expanded ? 'Show less' : 'Show more'}
			</button>
		</div>
	)
} 
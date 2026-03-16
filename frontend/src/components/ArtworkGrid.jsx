import { useState } from 'react'

export default function ArtworkGrid({ artworks }) {
  if (!artworks || artworks.length === 0) {
    return (
      <div className="text-center py-8 text-[#666]">
        <p>No artworks found yet. Try adjusting your preferences.</p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-xs uppercase tracking-wider text-[#666] mb-4">
        Found {artworks.length} artwork{artworks.length !== 1 ? 's' : ''}
      </h3>
      <div className="grid sm:grid-cols-2 gap-4">
        {artworks.map((artwork, i) => (
          <ArtworkCard key={i} data={artwork} index={i} />
        ))}
      </div>
    </div>
  )
}

function ArtworkCard({ data, index }) {
  // Parse the artwork data — it might be a JSON string or plain text
  let parsed = {}
  
  if (typeof data === 'string') {
    try {
      parsed = JSON.parse(data)
    } catch {
      // Plain text note from the agent
      return (
        <div className="p-4 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors">
          <div className="flex items-start gap-2">
            <span className="text-amber-400 text-xs font-mono shrink-0">#{index + 1}</span>
            <p className="text-sm text-[#bbb] leading-relaxed">{data}</p>
          </div>
        </div>
      )
    }
  } else {
    parsed = data
  }

  const { title, artist, price, size, url, platform, why_it_fits } = parsed

  return (
    <div className="p-4 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] hover:border-amber-500/30 transition-all group">
      {/* Title + Artist */}
      <div className="mb-2">
        <h4 className="font-medium text-[#ddd] text-sm group-hover:text-amber-300 transition-colors">
          {title || 'Untitled'}
        </h4>
        {artist && <p className="text-xs text-[#888]">{artist}</p>}
      </div>

      {/* Details */}
      <div className="flex flex-wrap gap-2 mb-3">
        {price && (
          <span className="text-xs px-2 py-0.5 bg-green-900/20 border border-green-800/30 rounded-full text-green-400">
            {price}
          </span>
        )}
        {size && (
          <span className="text-xs px-2 py-0.5 bg-[#252525] rounded-full text-[#999]">
            {size}
          </span>
        )}
        {platform && (
          <span className="text-xs px-2 py-0.5 bg-[#252525] rounded-full text-[#999]">
            {platform}
          </span>
        )}
      </div>

      {/* Why it fits */}
      {why_it_fits && (
        <p className="text-xs text-[#777] leading-relaxed mb-3 italic">
          "{why_it_fits}"
        </p>
      )}

      {/* Buy Link */}
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-xs text-amber-400 hover:text-amber-300 transition-colors"
        >
          View on {platform || 'website'} →
        </a>
      )}
    </div>
  )
}

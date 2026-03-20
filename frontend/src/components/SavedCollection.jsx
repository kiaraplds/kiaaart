export default function SavedCollection({ isOpen, onToggle, savedArtworks, onRemove }) {
  if (!isOpen) return null

  return (
    <div className="w-72 h-screen flex flex-col bg-white border-l border-warm-200/60 shrink-0">
      {/* Header */}
      <div className="px-4 py-4 border-b border-warm-200/40 flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-warm-800 italic">Collection</h2>
          <p className="text-[11px] text-warm-400">
            {savedArtworks.length} saved piece{savedArtworks.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={onToggle}
          className="p-1.5 hover:bg-warm-100 rounded-lg transition-colors text-warm-400"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Saved Items */}
      <div className="flex-1 overflow-y-auto p-3">
        {savedArtworks.length === 0 ? (
          <div className="text-center mt-12 px-4">
            <div className="w-10 h-10 rounded-xl bg-warm-50 flex items-center justify-center mx-auto mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B8A080" strokeWidth="1.5">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
            </div>
            <p className="text-xs text-warm-400 leading-relaxed">
              Save artworks you love and they'll appear here
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {savedArtworks.map((artwork, i) => (
              <div
                key={artwork._id || i}
                className="bg-warm-50/50 border border-warm-200/40 rounded-xl group hover:border-warm-300 transition-all overflow-hidden"
              >
                {/* Thumbnail */}
                {artwork.image_url && (
                  <div className="w-full h-24 bg-warm-100 overflow-hidden">
                    <img
                      src={artwork.image_url}
                      alt={artwork.title || 'Artwork'}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.parentElement.style.display = 'none' }}
                    />
                  </div>
                )}

                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-display text-sm font-semibold text-warm-800 leading-snug truncate">
                        {artwork.title || 'Untitled'}
                      </h4>
                      {artwork.artist && (
                        <p className="text-[11px] text-warm-400 truncate">{artwork.artist}</p>
                      )}
                    </div>
                    <button
                      onClick={() => onRemove(artwork._id)}
                      className="p-1 text-warm-300 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all shrink-0"
                      title="Remove"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {artwork.price && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-green-50 border border-green-200/60 rounded-full text-green-700">
                        {artwork.price}
                      </span>
                    )}
                    {artwork.platform && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-warm-100 rounded-full text-warm-500">
                        {artwork.platform}
                      </span>
                    )}
                  </div>

                  {artwork.url && (
                    <a
                      href={artwork.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-2 text-[11px] font-medium text-warm-500 hover:text-warm-700 transition-colors underline underline-offset-2 decoration-warm-200"
                    >
                      View artwork
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-warm-200/40">
        <p className="text-[10px] text-warm-300 text-center tracking-wide">
          Your curated selection
        </p>
      </div>
    </div>
  )
}

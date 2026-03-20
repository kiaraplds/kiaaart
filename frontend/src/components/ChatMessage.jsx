import { useState, useRef } from 'react'

const BUDGETS = ['Under £50', '£50–150', '£150–300', '£300–500', '£500+']
const STYLES = ['Abstract', 'Botanical', 'Photography', 'Minimalist', 'Figurative', 'Landscape', 'Line Drawing', 'Mixed Media', 'Pop Art', 'Impressionist', 'Geometric', 'Watercolour', 'Street Art', 'Surrealist', 'Portraiture', 'Typography', 'Collage', 'Vintage']

export default function ChatMessage({ message, onSearch, onSpeak, onUpload, onSave, savedIds }) {
  const { role, type } = message

  if (role === 'user') {
    return <UserMessage message={message} />
  }

  return <AssistantMessage message={message} onSearch={onSearch} onSpeak={onSpeak} onUpload={onUpload} onSave={onSave} savedIds={savedIds} />
}

// ── Welcome Message with Upload ────────────────────────────────
function WelcomeMessage({ content, onUpload }) {
  const fileRef = useRef()
  const [isDragging, setIsDragging] = useState(false)

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (file && (file.type.startsWith('image/') || file.name.match(/\.heic$/i))) {
      onUpload(file)
    }
    e.target.value = ''
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && (file.type.startsWith('image/') || file.name.match(/\.heic$/i))) {
      onUpload(file)
    }
  }

  return (
    <div className="space-y-4">
      <div className="px-4 py-3 bg-white border border-warm-200/60 rounded-2xl rounded-bl-md shadow-sm">
        <p className="text-sm text-warm-700 leading-relaxed">{content}</p>
      </div>

      {/* Prominent upload area */}
      <div
        onClick={() => fileRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        className={`cursor-pointer rounded-2xl rounded-bl-md border-2 border-dashed p-6 text-center transition-all duration-200 ${
          isDragging
            ? 'border-warm-500 bg-warm-100/50'
            : 'border-warm-300 bg-warm-50/50 hover:border-warm-400 hover:bg-warm-100/30'
        }`}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl btn-shimmer flex items-center justify-center shadow-lg">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FAF7F2" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="9" cy="10" r="2" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-warm-700">Upload a photo of your space</p>
            <p className="text-xs text-warm-400 mt-1">Drop an image here or click to browse</p>
          </div>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*,.heic,.heif"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  )
}

// ── User Messages ──────────────────────────────────────────────
function UserMessage({ message }) {
  if (message.type === 'image') {
    return (
      <div className="flex justify-end">
        <div className="max-w-xs sm:max-w-sm">
          <img
            src={message.content}
            alt="Your room"
            className="rounded-2xl rounded-br-md shadow-md border border-warm-200/40"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-end">
      <div className="max-w-[75%] px-4 py-3 rounded-2xl rounded-br-md text-sm leading-relaxed shadow-sm" style={{ backgroundColor: '#3A5239', color: '#F4F7F4' }}>
        {message.content}
      </div>
    </div>
  )
}

// ── Assistant Messages ─────────────────────────────────────────
function AssistantMessage({ message, onSearch, onSpeak, onUpload, onSave, savedIds }) {
  const { type, content } = message

  const wrapper = (children) => (
    <div className="flex justify-start gap-3">
      <div className="w-7 h-7 rounded-full bg-warm-800 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-cream text-xs font-display italic font-semibold">K</span>
      </div>
      <div className="max-w-[85%] space-y-3">
        {children}
      </div>
    </div>
  )

  if (type === 'welcome') {
    return wrapper(
      <WelcomeMessage content={content} onUpload={onUpload} />
    )
  }

  if (type === 'analysis') {
    const analysis = message.analysis || {}
    const style = analysis.room_style || {}
    const colours = analysis.colour_palette || {}
    const recs = analysis.art_recommendations || {}

    return wrapper(
      <>
        <div className="px-4 py-3 bg-white border border-warm-200/60 rounded-2xl rounded-bl-md shadow-sm">
          <p className="text-sm text-warm-700 leading-relaxed italic">"{content}"</p>
        </div>

        {/* Analysis card */}
        <div className="bg-white border border-warm-200/60 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b" style={{ borderColor: '#E3EBE3', backgroundColor: '#F4F7F4' }}>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: '#486748' }}>Space Analysis</p>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {style.primary_style && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-warm-400 mb-0.5">Style</p>
                  <p className="text-sm text-warm-700">{style.primary_style}</p>
                </div>
              )}
              {style.mood && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-warm-400 mb-0.5">Mood</p>
                  <p className="text-sm text-warm-700">{style.mood}</p>
                </div>
              )}
            </div>

            {colours.dominant_colours?.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wider text-warm-400 mb-1.5">Palette</p>
                <div className="flex flex-wrap gap-1.5">
                  {colours.dominant_colours.map((c, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: '#FDF9F3', border: '1px solid #E8DCC8', color: '#7A6248' }}>
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {recs.suggested_styles?.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wider text-warm-400 mb-1.5">Suggested Art</p>
                <div className="flex flex-wrap gap-1.5">
                  {recs.suggested_styles.map((s, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: '#E3EBE3', border: '1px solid #C7D6C7', color: '#3A5239' }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    )
  }

  if (type === 'preferences') {
    return wrapper(
      <PreferencesCard
        content={content}
        analysis={message.analysis}
        onSearch={onSearch}
      />
    )
  }

  if (type === 'artworks') {
    return wrapper(
      <>
        <div className="px-4 py-3 bg-white border border-warm-200/60 rounded-2xl rounded-bl-md shadow-sm">
          <p className="text-sm text-warm-700 leading-relaxed">{content}</p>
          {onSpeak && (
            <button
              onClick={() => onSpeak(content)}
              className="mt-1.5 text-xs text-warm-400 hover:text-warm-600 transition-colors"
            >
              Listen
            </button>
          )}
        </div>
        <ArtworkCards artworks={message.artworks} onSave={onSave} savedIds={savedIds} />
      </>
    )
  }

  // Default text message
  return wrapper(
    <div className="px-4 py-3 bg-white border border-warm-200/60 rounded-2xl rounded-bl-md shadow-sm">
      <p className="text-sm text-warm-700 leading-relaxed whitespace-pre-wrap">{content}</p>
      {onSpeak && content && (
        <button
          onClick={() => onSpeak(content)}
          className="mt-1.5 text-xs text-warm-400 hover:text-warm-600 transition-colors"
        >
          Listen
        </button>
      )}
    </div>
  )
}

// ── Preferences Inline Card ────────────────────────────────────
function PreferencesCard({ content, analysis, onSearch }) {
  const [budget, setBudget] = useState('£50–150')
  const [selectedStyles, setSelectedStyles] = useState([])
  const [customStyle, setCustomStyle] = useState('')

  const recs = analysis?.art_recommendations || {}

  const toggleStyle = (style) => {
    setSelectedStyles(prev =>
      prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]
    )
  }

  const handleSearch = () => {
    const allStyles = [...selectedStyles]
    if (customStyle.trim()) allStyles.push(customStyle.trim())

    onSearch({
      budget,
      style: allStyles.length > 0 ? allStyles.join(', ') : recs.suggested_styles?.join(', ') || 'open to suggestions',
      colours: recs.suggested_colour_palette?.join(', ') || 'as recommended',
      size: recs.suggested_sizes?.join(', ') || 'as recommended',
      location: 'UK',
    })
  }

  return (
    <div className="rounded-2xl rounded-bl-md shadow-lg overflow-hidden" style={{ background: 'linear-gradient(135deg, #3A5239, #1E2B1E)', border: '1px solid rgba(90,130,90,0.3)' }}>
      <div className="px-5 py-4">
        <p className="text-sm leading-relaxed mb-5" style={{ color: '#E3EBE3' }}>{content}</p>

        {/* Budget */}
        <div className="mb-5">
          <p className="text-xs uppercase tracking-wider mb-2.5 font-medium" style={{ color: '#A3BBA3' }}>Budget</p>
          <div className="flex flex-wrap gap-2">
            {BUDGETS.map(b => (
              <button
                key={b}
                onClick={() => setBudget(b)}
                className="px-4 py-2 rounded-full text-xs font-medium transition-all duration-200"
                style={budget === b
                  ? { backgroundColor: '#C7D6C7', color: '#1E2B1E', fontWeight: 600, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', transform: 'scale(1.05)' }
                  : { color: 'rgba(200,220,200,0.7)', border: '1px solid rgba(120,160,120,0.35)' }
                }
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Style */}
        <div className="mb-5">
          <p className="text-xs uppercase tracking-wider mb-2.5 font-medium" style={{ color: '#A3BBA3' }}>
            Style <span style={{ color: '#5C7F5C', fontWeight: 400 }}>(optional)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {STYLES.map(s => (
              <button
                key={s}
                onClick={() => toggleStyle(s)}
                className="px-4 py-2 rounded-full text-xs font-medium transition-all duration-200"
                style={selectedStyles.includes(s)
                  ? { backgroundColor: '#B8C5D0', color: '#1C2430', fontWeight: 600, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', transform: 'scale(1.05)' }
                  : { color: 'rgba(200,220,200,0.7)', border: '1px solid rgba(120,160,120,0.35)' }
                }
              >
                {s}
              </button>
            ))}
          </div>

          {/* Custom style input */}
          <div className="mt-3">
            <input
              type="text"
              value={customStyle}
              onChange={(e) => setCustomStyle(e.target.value)}
              placeholder="Or describe what you're looking for..."
              className="w-full px-4 py-2.5 rounded-xl text-xs bg-transparent border outline-none transition-all placeholder:text-[#5C7F5C]"
              style={{ borderColor: 'rgba(120,160,120,0.35)', color: '#E3EBE3' }}
              onFocus={(e) => e.target.style.borderColor = '#A3BBA3'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(120,160,120,0.35)'}
            />
          </div>
        </div>

        <button
          onClick={handleSearch}
          className="w-full py-3 text-sm font-semibold rounded-xl transition-all duration-200 hover:shadow-md"
          style={{ backgroundColor: '#FAF7F2', color: '#1E2B1E' }}
        >
          Find artwork for this space
        </button>
      </div>
    </div>
  )
}

// ── Artwork Cards (inline in chat) ─────────────────────────────
function ArtworkCards({ artworks, onSave, savedIds }) {
  const [linkStatus, setLinkStatus] = useState({})
  const [imgErrors, setImgErrors] = useState({})
  const API_URL = import.meta.env.VITE_API_URL || ''

  // Check links on mount
  useState(() => {
    const urls = []
    artworks?.forEach(a => {
      const parsed = typeof a === 'string' ? (() => { try { return JSON.parse(a) } catch { return {} } })() : a
      if (parsed.url) urls.push(parsed.url)
    })
    if (urls.length > 0) {
      fetch(`${API_URL}/api/check-links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls }),
      })
        .then(r => r.json())
        .then(data => setLinkStatus(data.results || {}))
        .catch(() => {})
    }
  })

  if (!artworks || artworks.length === 0) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {artworks.map((artwork, i) => {
        let parsed = {}
        if (typeof artwork === 'string') {
          try { parsed = JSON.parse(artwork) } catch {
            return (
              <div key={i} className="p-3 bg-white border border-warm-200/60 rounded-xl shadow-sm">
                <p className="text-xs text-warm-600 leading-relaxed">{artwork}</p>
              </div>
            )
          }
        } else {
          parsed = artwork
        }

        const { title, artist, price, size, url, image_url, platform, why_it_fits } = parsed
        const artworkId = url || `${title}-${artist}-${i}`
        const isSaved = savedIds?.has(artworkId)
        const status = url ? linkStatus[url] : null
        const linkDead = status && !status.alive

        // Hide cards with broken links
        if (linkDead) return null

        return (
          <div key={i} className="bg-white border border-warm-200/60 hover:border-warm-300 rounded-xl shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
            {/* Artwork preview image */}
            {image_url && !imgErrors[i] && (
              <div className="w-full h-40 bg-warm-100 overflow-hidden">
                <img
                  src={image_url}
                  alt={title || 'Artwork preview'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={() => setImgErrors(prev => ({ ...prev, [i]: true }))}
                />
              </div>
            )}

            <div className="p-4">
              {/* Save button */}
              {onSave && (
                <button
                  onClick={() => onSave({ ...parsed, _id: artworkId })}
                  className={`absolute top-3 right-3 p-1.5 rounded-lg transition-all z-10 ${
                    image_url && !imgErrors[i] ? 'bg-white/80 backdrop-blur-sm shadow-sm' : ''
                  } ${
                    isSaved
                      ? 'text-warm-800 bg-warm-100'
                      : 'text-warm-300 opacity-0 group-hover:opacity-100 hover:text-warm-600 hover:bg-warm-50'
                  }`}
                  title={isSaved ? 'Saved' : 'Save to collection'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                  </svg>
                </button>
              )}

              <h4 className="font-display text-base font-semibold text-warm-800 group-hover:text-warm-900 leading-snug pr-8">
                {title || 'Untitled'}
              </h4>
              {artist && <p className="text-xs text-warm-400 mt-0.5">{artist}</p>}

              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {price && (
                  <span className="text-xs px-2 py-0.5 bg-green-50 border border-green-200/60 rounded-full text-green-700">
                    {price}
                  </span>
                )}
                {size && (
                  <span className="text-xs px-2 py-0.5 bg-warm-50 border border-warm-200/60 rounded-full text-warm-500">
                    {size}
                  </span>
                )}
                {platform && (
                  <span className="text-xs px-2 py-0.5 bg-blue-50 border border-blue-200/60 rounded-full text-blue-600">
                    {platform}
                  </span>
                )}
              </div>

              {why_it_fits && (
                <p className="text-xs text-warm-500 leading-relaxed mt-2 italic">
                  "{why_it_fits}"
                </p>
              )}

              {url && (
                <div className="flex items-center gap-2 mt-2.5">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-xs font-medium text-warm-600 hover:text-warm-800 transition-colors underline underline-offset-2 decoration-warm-300"
                  >
                    View on {platform || 'website'}
                  </a>
                  {status && status.alive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" title="Link verified" />
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || ''

export default function HistorySidebar({ isOpen, onToggle, onLoadSession, onNewChat, currentSessionId }) {
  const [sessions, setSessions] = useState([])

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/api/history`)
      const data = await res.json()
      setSessions(data.sessions || [])
    } catch (err) {
      console.warn('Could not load history:', err)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [currentSessionId])

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    try {
      await fetch(`${API_URL}/api/history/${id}`, { method: 'DELETE' })
      setSessions(prev => prev.filter(s => s.id !== id))
    } catch (err) {
      console.warn('Delete failed:', err)
    }
  }

  const formatDate = (iso) => {
    const d = new Date(iso)
    const now = new Date()
    const diff = now - d

    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }

  const getLabel = (session) => {
    if (session.room_analysis?.room_style?.primary_style) {
      return session.room_analysis.room_style.primary_style
    }
    if (session.room_analysis?.summary) {
      return session.room_analysis.summary.slice(0, 40) + '...'
    }
    return 'Room analysis'
  }

  if (!isOpen) return null

  const handleSidebarClick = (e) => {
    // Close only if clicking empty space, not buttons/links/sessions
    if (e.target === e.currentTarget) onToggle()
  }

  return (
    <div className="w-72 h-screen flex flex-col bg-white border-r border-warm-200/60 shrink-0" onClick={handleSidebarClick}>
      {/* Sidebar Header */}
      <div className="h-14 px-6 border-b border-warm-200/60 flex items-center justify-between shrink-0">
        <p className="font-display text-lg font-semibold text-warm-800 italic">History</p>
        <button
          onClick={onToggle}
          className="p-1.5 hover:bg-warm-100 rounded-lg transition-colors text-warm-400"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* New Chat */}
      <div className="px-3 py-3">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-warm-600 hover:bg-warm-50 border border-warm-200/60 hover:border-warm-300 transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New conversation
        </button>
      </div>

      {/* Sessions */}
      <div className="flex-1 overflow-y-auto px-3 pb-3" onClick={handleSidebarClick}>
        {sessions.length === 0 ? (
          <p className="text-xs text-warm-300 text-center mt-8 px-4 leading-relaxed">
            Your past conversations will appear here
          </p>
        ) : (
          <div className="space-y-0.5">
            {sessions.map(session => (
              <div
                key={session.id}
                onClick={() => onLoadSession(session)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all group ${
                  session.id === currentSessionId
                    ? 'bg-warm-100/80 border border-warm-200/60'
                    : 'hover:bg-warm-50'
                }`}
              >
                {/* Thumbnail */}
                {session.room_image_path ? (
                  <img
                    src={`${API_URL}/uploads/${session.room_image_path}`}
                    alt=""
                    className="w-9 h-9 rounded-lg object-cover shrink-0 border border-warm-200/40"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-warm-100 flex items-center justify-center shrink-0">
                    <span className="text-warm-400 text-sm font-display italic">K</span>
                  </div>
                )}

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-warm-700 truncate">{getLabel(session)}</p>
                  <p className="text-[11px] text-warm-400">
                    {formatDate(session.created_at)}
                    {session.artworks?.length > 0 && (
                      <span> · {session.artworks.length} pieces</span>
                    )}
                  </p>
                </div>

                {/* Delete */}
                <button
                  onClick={(e) => handleDelete(e, session.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-warm-300 hover:text-red-400 transition-all"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-warm-200/40">
        <p className="text-[10px] text-warm-300 text-center tracking-wide">
          Curated by AI, chosen by you
        </p>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || ''

export default function HistorySidebar({ onLoadSession, currentSessionId }) {
  const [sessions, setSessions] = useState([])
  const [isOpen, setIsOpen] = useState(false)

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

  if (sessions.length === 0) return null

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-50 p-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-[#888] hover:text-white hover:border-[#555] transition-all"
        title="History"
      >
        <span className="text-sm">🕐 {sessions.length}</span>
      </button>

      {/* Sidebar */}
      {isOpen && (
        <div className="fixed top-0 right-0 h-full w-80 bg-[#141414] border-l border-[#222] z-40 overflow-y-auto shadow-2xl">
          <div className="p-4 border-b border-[#222] flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Previous Rooms</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[#666] hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="p-2 space-y-1">
            {sessions.map(session => (
              <div
                key={session.id}
                onClick={() => {
                  onLoadSession(session)
                  setIsOpen(false)
                }}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all group ${
                  session.id === currentSessionId
                    ? 'bg-amber-500/10 border border-amber-500/30'
                    : 'hover:bg-[#1e1e1e]'
                }`}
              >
                {/* Thumbnail */}
                {session.room_image_path ? (
                  <img
                    src={`${API_URL}/uploads/${session.room_image_path}`}
                    alt="Room"
                    className="w-12 h-12 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-[#252525] flex items-center justify-center shrink-0 text-xl">
                    🖼
                  </div>
                )}

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#ccc] truncate">{getLabel(session)}</p>
                  <p className="text-xs text-[#666]">
                    {formatDate(session.created_at)}
                    {session.artworks && session.artworks.length > 0 && (
                      <span className="ml-1">· {session.artworks.length} artworks</span>
                    )}
                  </p>
                </div>

                {/* Delete */}
                <button
                  onClick={(e) => handleDelete(e, session.id)}
                  className="opacity-0 group-hover:opacity-100 text-[#555] hover:text-red-400 transition-all text-xs"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

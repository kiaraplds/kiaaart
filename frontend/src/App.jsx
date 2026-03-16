import { useState } from 'react'
import RoomUpload from './components/RoomUpload'
import RoomAnalysis from './components/RoomAnalysis'
import ChatPanel from './components/ChatPanel'
import ArtworkGrid from './components/ArtworkGrid'
import Preferences from './components/Preferences'
import AudioPlayer from './components/AudioPlayer'
import HistorySidebar from './components/HistorySidebar'
import { analyseRoom, searchArt, chat, speak } from './api/client'

function App() {
  const [step, setStep] = useState('upload')
  const [roomImage, setRoomImage] = useState(null)
  const [roomAnalysis, setRoomAnalysis] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [artworks, setArtworks] = useState([])
  const [searchSummary, setSearchSummary] = useState('')
  const [chatMessages, setChatMessages] = useState([])
  const [chatSessionId] = useState(() => 'chat-' + Math.random().toString(36).slice(2))
  const [audioUrl, setAudioUrl] = useState(null)
  const [error, setError] = useState(null)

  const API_URL = import.meta.env.VITE_API_URL || ''

  // ── Room Upload ──────────────────────────────────────────────
  const handleUpload = async (file) => {
    setError(null)
    setRoomImage(URL.createObjectURL(file))
    setStep('analysing')

    try {
      const analysis = await analyseRoom(file)

      if (analysis.error) {
        setError(analysis.error)
        setStep('upload')
        return
      }

      setRoomAnalysis(analysis)
      setSessionId(analysis.session_id || null)

      // Use server image URL if available
      if (analysis.image_url) {
        setRoomImage(`${API_URL}${analysis.image_url}`)
      }

      setStep('preferences')
      setChatMessages([{
        role: 'assistant',
        content: analysis.summary || "I've analysed your space! Tell me your taste and budget."
      }])
    } catch (err) {
      setError(`Failed to analyse room: ${err.message}`)
      setStep('upload')
    }
  }

  // ── Art Search ───────────────────────────────────────────────
  const handleSearch = async (preferences) => {
    setError(null)
    setStep('searching')

    try {
      const results = await searchArt({
        roomAnalysis: roomAnalysis,
        sessionId: sessionId,
        ...preferences,
      })

      setArtworks(results.artworks || [])
      setSearchSummary(results.summary || '')
      setStep('results')

      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: results.summary || `I found ${(results.artworks || []).length} artworks for you!`
      }])
    } catch (err) {
      setError(`Search failed: ${err.message}`)
      setStep('preferences')
    }
  }

  // ── Chat ─────────────────────────────────────────────────────
  const handleChat = async (message) => {
    setError(null)
    setChatMessages(prev => [...prev, { role: 'user', content: message }])

    try {
      const result = await chat({ message, sessionId: chatSessionId, roomAnalysis })
      setChatMessages(prev => [...prev, { role: 'assistant', content: result.response }])
      return result.response
    } catch (err) {
      setError(`Chat failed: ${err.message}`)
    }
  }

  // ── TTS ──────────────────────────────────────────────────────
  const handleSpeak = async (text) => {
    try {
      const blob = await speak(text)
      const url = URL.createObjectURL(blob)
      setAudioUrl(url)
    } catch (err) {
      console.warn('TTS unavailable:', err.message)
    }
  }

  // ── Load from History ────────────────────────────────────────
  const handleLoadSession = (session) => {
    setRoomAnalysis(session.room_analysis)
    setSessionId(session.id)

    if (session.room_image_path) {
      setRoomImage(`${API_URL}/uploads/${session.room_image_path}`)
    }

    setChatMessages([{
      role: 'assistant',
      content: session.room_analysis?.summary || "Here's your previous room analysis."
    }])

    if (session.artworks && session.artworks.length > 0) {
      setArtworks(session.artworks)
      setSearchSummary(session.summary || '')
      setStep('results')
    } else {
      setStep('preferences')
    }
  }

  // ── Reset ────────────────────────────────────────────────────
  const handleReset = () => {
    setStep('upload')
    setRoomImage(null)
    setRoomAnalysis(null)
    setSessionId(null)
    setArtworks([])
    setSearchSummary('')
    setChatMessages([])
    setAudioUrl(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#e8e8e8]">
      {/* History Sidebar */}
      <HistorySidebar onLoadSession={handleLoadSession} currentSessionId={sessionId} />

      {/* Header */}
      <header className="border-b border-[#222] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-sm">
            🖼
          </div>
          <h1 className="font-display text-xl font-semibold tracking-tight">WallWise</h1>
          <span className="text-xs text-[#666] ml-2 hidden sm:inline">AI Art Advisor</span>
        </div>
        {step !== 'upload' && (
          <button onClick={handleReset} className="text-sm text-[#888] hover:text-white transition-colors">
            ← Start over
          </button>
        )}
      </header>

      {/* Error Banner */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-900/30 border border-red-800/50 rounded-lg text-red-300 text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-3 text-red-400 hover:text-red-200">✕</button>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">

        {step === 'upload' && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="font-display text-4xl font-bold mb-3">
                Find the perfect art<br />for your space
              </h2>
              <p className="text-[#888] text-lg">
                Upload a photo of your room and we'll recommend artwork you can actually buy.
              </p>
            </div>
            <RoomUpload onUpload={handleUpload} />
          </div>
        )}

        {step === 'analysing' && (
          <div className="max-w-2xl mx-auto text-center">
            {roomImage && (
              <img src={roomImage} alt="Your room" className="w-full max-h-80 object-cover rounded-xl opacity-70 mb-8" />
            )}
            <div className="flex items-center justify-center gap-3">
              <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-[#888] text-lg">Analysing your space...</p>
            </div>
          </div>
        )}

        {step === 'preferences' && (
          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              {roomImage && <img src={roomImage} alt="Your room" className="w-full rounded-xl mb-4" />}
              <RoomAnalysis analysis={roomAnalysis} />
            </div>
            <div>
              <Preferences analysis={roomAnalysis} onSearch={handleSearch} onChat={handleChat} messages={chatMessages} />
            </div>
          </div>
        )}

        {step === 'searching' && (
          <div className="max-w-2xl mx-auto text-center py-16">
            <div className="w-12 h-12 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h3 className="font-display text-2xl font-semibold mb-2">Hunting for artwork...</h3>
            <p className="text-[#888]">
              Searching Saatchi Art, Etsy, and galleries for pieces that match your space.
              <br />This takes 30-60 seconds.
            </p>
          </div>
        )}

        {step === 'results' && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              {roomImage && <img src={roomImage} alt="Your room" className="w-full rounded-xl mb-4" />}
              <RoomAnalysis analysis={roomAnalysis} compact />
              {audioUrl && <div className="mt-4"><AudioPlayer src={audioUrl} /></div>}
            </div>
            <div className="lg:col-span-2">
              {searchSummary && (
                <div className="mb-6 p-4 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a]">
                  <div className="flex items-start justify-between">
                    <p className="text-[#ccc] text-sm leading-relaxed">{searchSummary}</p>
                    <button onClick={() => handleSpeak(searchSummary)} className="ml-3 text-[#666] hover:text-amber-400 transition-colors shrink-0" title="Listen">
                      🔊
                    </button>
                  </div>
                </div>
              )}
              <ArtworkGrid artworks={artworks} />
              <div className="mt-8">
                <ChatPanel messages={chatMessages} onSend={handleChat} onSpeak={handleSpeak} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App

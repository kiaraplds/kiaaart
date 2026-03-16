import { useState, useRef, useEffect, useCallback } from 'react'
import HistorySidebar from './components/HistorySidebar'
import ChatMessage from './components/ChatMessage'
import ChatInput from './components/ChatInput'
import SavedCollection from './components/SavedCollection'
import LoadingBubble from './components/LoadingBubble'
import { analyseRoom, searchArt, chat, speak } from './api/client'

function App() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      type: 'welcome',
      content: "Hello! I'm your personal art curator. Share a photo of your space and I'll help you find the perfect piece.",
    },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [loadingText, setLoadingText] = useState('')
  const [roomAnalysis, setRoomAnalysis] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [chatSessionId] = useState(() => 'chat-' + Math.random().toString(36).slice(2))
  const [audioUrl, setAudioUrl] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collectionOpen, setCollectionOpen] = useState(false)
  const [savedArtworks, setSavedArtworks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('kiaaart-saved') || '[]')
    } catch { return [] }
  })
  const [currentSessionId, setCurrentSessionId] = useState(null)
  const messagesEndRef = useRef(null)
  const API_URL = import.meta.env.VITE_API_URL || ''

  const savedIds = new Set(savedArtworks.map(a => a._id))

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Persist saved artworks
  useEffect(() => {
    localStorage.setItem('kiaaart-saved', JSON.stringify(savedArtworks))
  }, [savedArtworks])

  // ── Save / Unsave artwork ──────────────────────────────────────
  const handleSave = (artwork) => {
    setSavedArtworks(prev => {
      const exists = prev.some(a => a._id === artwork._id)
      if (exists) {
        return prev.filter(a => a._id !== artwork._id)
      }
      return [...prev, artwork]
    })
    if (!collectionOpen) setCollectionOpen(true)
  }

  const handleRemoveSaved = (id) => {
    setSavedArtworks(prev => prev.filter(a => a._id !== id))
  }

  // ── Room Upload (inline in chat) ─────────────────────────────
  const handleUpload = async (file) => {
    const imageUrl = URL.createObjectURL(file)

    setMessages(prev => [
      ...prev,
      { role: 'user', type: 'image', content: imageUrl },
    ])
    setIsLoading(true)
    setLoadingText('Studying your space')

    try {
      const analysis = await analyseRoom(file)

      if (analysis.error) {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', type: 'text', content: `I couldn't quite make that out — ${analysis.error}. Could you try another photo?` },
        ])
        setIsLoading(false)
        return
      }

      setRoomAnalysis(analysis)
      setSessionId(analysis.session_id || null)
      setCurrentSessionId(analysis.session_id || null)

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          type: 'analysis',
          content: analysis.summary || "What a lovely space!",
          analysis: analysis,
        },
        {
          role: 'assistant',
          type: 'preferences',
          content: "What's your budget and style preference? Or just tell me what you're looking for.",
          analysis: analysis,
        },
      ])
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', type: 'text', content: `Something went wrong analysing your photo. ${err.message}` },
      ])
    }
    setIsLoading(false)
    setLoadingText('')
  }

  // ── Art Search ───────────────────────────────────────────────
  const handleSearch = async (preferences) => {
    setMessages(prev => [
      ...prev,
      { role: 'user', type: 'text', content: `Looking for ${preferences.style} art, budget ${preferences.budget}` },
    ])
    setIsLoading(true)
    setLoadingText('Searching galleries')

    try {
      const results = await searchArt({
        roomAnalysis,
        sessionId,
        ...preferences,
      })

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          type: 'artworks',
          content: results.summary || `I found ${(results.artworks || []).length} pieces for you.`,
          artworks: results.artworks || [],
        },
      ])
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', type: 'text', content: `I had trouble searching — ${err.message}` },
      ])
    }
    setIsLoading(false)
    setLoadingText('')
  }

  // ── Chat ─────────────────────────────────────────────────────
  const handleChat = async (message) => {
    setMessages(prev => [...prev, { role: 'user', type: 'text', content: message }])
    setIsLoading(true)
    setLoadingText('Thinking')

    try {
      const result = await chat({ message, sessionId: chatSessionId, roomAnalysis })
      setMessages(prev => [
        ...prev,
        { role: 'assistant', type: 'text', content: result.response },
      ])
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', type: 'text', content: `Sorry, something went wrong. ${err.message}` },
      ])
    }
    setIsLoading(false)
    setLoadingText('')
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
    setCurrentSessionId(session.id)

    const restored = [
      {
        role: 'assistant',
        type: 'welcome',
        content: "Hello! I'm your personal art curator. Share a photo of your space and I'll help you find the perfect piece.",
      },
    ]

    if (session.room_image_path) {
      restored.push({
        role: 'user',
        type: 'image',
        content: `${API_URL}/uploads/${session.room_image_path}`,
      })
    }

    if (session.room_analysis) {
      restored.push({
        role: 'assistant',
        type: 'analysis',
        content: session.room_analysis.summary || "Here's your space analysis.",
        analysis: session.room_analysis,
      })
    }

    if (session.artworks && session.artworks.length > 0) {
      restored.push({
        role: 'assistant',
        type: 'artworks',
        content: session.summary || `Found ${session.artworks.length} pieces for this space.`,
        artworks: session.artworks,
      })
    }

    setMessages(restored)
  }

  // ── New Chat ─────────────────────────────────────────────────
  const handleNewChat = () => {
    setMessages([
      {
        role: 'assistant',
        type: 'welcome',
        content: "Hello! I'm your personal art curator. Share a photo of your space and I'll help you find the perfect piece.",
      },
    ])
    setRoomAnalysis(null)
    setSessionId(null)
    setCurrentSessionId(null)
    setAudioUrl(null)
  }

  return (
    <div className="h-screen flex bg-cream">
      {/* Left Sidebar — History */}
      <HistorySidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onLoadSession={handleLoadSession}
        onNewChat={handleNewChat}
        currentSessionId={currentSessionId}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-6 border-b border-warm-200/60 shrink-0">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 hover:bg-warm-100 rounded-lg transition-colors text-warm-500"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 12h18M3 6h18M3 18h18" />
                </svg>
              </button>
            )}
            <h1
              onClick={handleNewChat}
              className="font-display text-2xl font-semibold text-warm-800 tracking-tight italic cursor-pointer hover:text-warm-600 transition-colors"
            >
              Kiaaart
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-warm-400 font-light tracking-wide hidden sm:block mr-2">
              your personal art curator
            </p>
            {/* Collection toggle */}
            <button
              onClick={() => setCollectionOpen(!collectionOpen)}
              className={`relative p-2 rounded-lg transition-all ${
                collectionOpen
                  ? 'bg-warm-800 text-cream'
                  : 'text-warm-400 hover:text-warm-600 hover:bg-warm-100'
              }`}
              title="Saved collection"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={collectionOpen ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
              {savedArtworks.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-warm-800 text-cream text-[10px] font-medium rounded-full flex items-center justify-center">
                  {savedArtworks.length}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-16 py-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg, i) => (
              <ChatMessage
                key={i}
                message={msg}
                onSearch={handleSearch}
                onSpeak={handleSpeak}
                onUpload={handleUpload}
                onSave={handleSave}
                savedIds={savedIds}
                analysis={msg.analysis}
              />
            ))}

            {isLoading && (
              <LoadingBubble context={loadingText} />
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Audio element (hidden) */}
        {audioUrl && (
          <audio src={audioUrl} autoPlay onEnded={() => setAudioUrl(null)} />
        )}

        {/* Input Area */}
        <ChatInput
          onSend={handleChat}
          onUpload={handleUpload}
          disabled={isLoading}
        />
      </div>

      {/* Right Sidebar — Saved Collection */}
      <SavedCollection
        isOpen={collectionOpen}
        onToggle={() => setCollectionOpen(!collectionOpen)}
        savedArtworks={savedArtworks}
        onRemove={handleRemoveSaved}
      />
    </div>
  )
}

export default App

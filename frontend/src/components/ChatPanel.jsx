import { useState, useRef, useEffect } from 'react'

export default function ChatPanel({ messages, onSend, onSpeak }) {
  const [input, setInput] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const messagesEndRef = useRef(null)
  const recognitionRef = useRef(null)

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim()) return
    onSend(input.trim())
    setInput('')
  }

  // ── Voice Input (Web Speech API) ─────────────────────────────
  const toggleVoice = () => {
    if (isRecording) {
      recognitionRef.current?.stop()
      setIsRecording(false)
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser. Try Chrome.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-GB'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setInput(transcript)
      setIsRecording(false)
      // Auto-send voice input
      onSend(transcript)
      setInput('')
    }

    recognition.onerror = () => setIsRecording(false)
    recognition.onend = () => setIsRecording(false)

    recognitionRef.current = recognition
    recognition.start()
    setIsRecording(true)
  }

  return (
    <div className="border border-[#2a2a2a] rounded-xl overflow-hidden bg-[#141414]">
      {/* Messages */}
      <div className="max-h-64 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-[#555] text-sm text-center py-4">
            Ask me anything about art for your space...
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
              msg.role === 'user'
                ? 'bg-amber-500/20 text-amber-200 rounded-br-sm'
                : 'bg-[#1e1e1e] text-[#bbb] rounded-bl-sm'
            }`}>
              {msg.content}
              {msg.role === 'assistant' && onSpeak && (
                <button
                  onClick={() => onSpeak(msg.content)}
                  className="ml-2 text-[#555] hover:text-amber-400 transition-colors inline"
                  title="Listen"
                >
                  🔊
                </button>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 border-t border-[#222]">
        <button
          type="button"
          onClick={toggleVoice}
          className={`p-2 rounded-lg transition-all shrink-0 ${
            isRecording
              ? 'bg-red-500/20 text-red-400 animate-pulse'
              : 'bg-[#1a1a1a] text-[#666] hover:text-[#aaa]'
          }`}
          title={isRecording ? 'Stop recording' : 'Voice input'}
        >
          🎤
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isRecording ? 'Listening...' : 'Ask about art, budget, style...'}
          disabled={isRecording}
          className="flex-1 px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-sm text-[#ccc] placeholder-[#555] focus:border-amber-500/50 focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isRecording || !input.trim()}
          className="px-4 py-2 bg-amber-500 text-black text-sm font-medium rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-30"
        >
          →
        </button>
      </form>
    </div>
  )
}

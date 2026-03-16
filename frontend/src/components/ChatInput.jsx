import { useState, useRef } from 'react'

export default function ChatInput({ onSend, onUpload, disabled }) {
  const [input, setInput] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const fileRef = useRef()
  const recognitionRef = useRef(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim() || disabled) return
    onSend(input.trim())
    setInput('')
  }

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (file && file.type.startsWith('image/')) {
      onUpload(file)
    }
    e.target.value = ''
  }

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
    <div className="border-t border-warm-200/60 bg-white/50 backdrop-blur-sm px-4 sm:px-6 lg:px-16 py-4">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex items-end gap-2">
        {/* Upload button */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="p-2.5 rounded-xl text-warm-400 hover:text-warm-600 hover:bg-warm-100 transition-all shrink-0"
          title="Upload a room photo"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <circle cx="9" cy="10" r="2" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.heic,.heif"
          capture="environment"
          className="hidden"
          onChange={handleFile}
        />

        {/* Voice button */}
        <button
          type="button"
          onClick={toggleVoice}
          className={`p-2.5 rounded-xl transition-all shrink-0 ${
            isRecording
              ? 'text-red-500 bg-red-50 animate-pulse'
              : 'text-warm-400 hover:text-warm-600 hover:bg-warm-100'
          }`}
          title={isRecording ? 'Stop recording' : 'Voice input'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 10a7 7 0 0014 0" />
            <line x1="12" y1="17" x2="12" y2="22" />
          </svg>
        </button>

        {/* Text input */}
        <div className="flex-1 relative">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isRecording ? 'Listening...' : 'Tell me about your ideal artwork...'}
            disabled={disabled || isRecording}
            className="w-full px-4 py-3 bg-white border border-warm-200 rounded-2xl text-sm text-warm-800 placeholder-warm-300 focus:border-warm-400 focus:outline-none disabled:opacity-50 shadow-sm"
          />
        </div>

        {/* Send button */}
        <button
          type="submit"
          disabled={disabled || isRecording || !input.trim()}
          className="p-2.5 rounded-xl bg-warm-800 text-cream hover:bg-warm-700 transition-colors disabled:opacity-30 shrink-0 shadow-sm"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </form>
    </div>
  )
}

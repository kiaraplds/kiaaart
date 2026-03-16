import { useState, useEffect } from 'react'

const PHRASES = {
  'Studying your space': [
    'Studying your space',
    'Analysing the lighting',
    'Reading the room',
    'Noting the colours',
    'Almost there',
  ],
  'Searching galleries': [
    'Searching galleries',
    'Browsing Saatchi Art',
    'Checking Etsy',
    'Comparing prices',
    'Curating your selection',
    'Nearly done',
  ],
  'Thinking': [
    'Thinking',
    'Considering options',
    'Crafting a response',
  ],
}

export default function LoadingBubble({ context }) {
  const [phraseIndex, setPhraseIndex] = useState(0)
  const phrases = PHRASES[context] || [context || 'Thinking']

  useEffect(() => {
    setPhraseIndex(0)
    const interval = setInterval(() => {
      setPhraseIndex(prev => {
        if (prev < phrases.length - 1) return prev + 1
        return prev
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [context, phrases.length])

  const currentPhrase = phrases[phraseIndex] || phrases[0]

  return (
    <div className="flex justify-start gap-3">
      <div className="w-7 h-7 rounded-full bg-warm-800 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-cream text-xs font-display italic font-semibold">K</span>
      </div>
      <div className="bg-white border border-warm-200/60 rounded-2xl rounded-bl-md px-5 py-3.5 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="text-sm text-sage-700 italic">{currentPhrase}</span>
          <div className="flex gap-1.5" style={{ alignItems: 'flex-end' }}>
            <span className="loading-dot" />
            <span className="loading-dot" />
            <span className="loading-dot" />
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState, useRef } from 'react'

export default function AudioPlayer({ src }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef(null)

  const toggle = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a]">
      <button
        onClick={toggle}
        className="w-10 h-10 rounded-full bg-amber-500 text-black flex items-center justify-center hover:bg-amber-400 transition-colors shrink-0"
      >
        {isPlaying ? '⏸' : '▶'}
      </button>
      <div className="flex-1">
        <p className="text-xs text-[#888]">Art Advisor</p>
        <div className="h-1 bg-[#333] rounded-full mt-1 overflow-hidden">
          <div className={`h-full bg-amber-500 rounded-full transition-all ${isPlaying ? 'animate-pulse w-2/3' : 'w-0'}`} />
        </div>
      </div>
      <audio
        ref={audioRef}
        src={src}
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />
    </div>
  )
}

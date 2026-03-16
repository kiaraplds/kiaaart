import { useState, useRef } from 'react'

export default function RoomUpload({ onUpload }) {
  const [isDragging, setIsDragging] = useState(false)
  const fileRef = useRef()

  const handleFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      onUpload(file)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  return (
    <div
      onClick={() => fileRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragging(false)}
      className={`
        relative cursor-pointer rounded-2xl border-2 border-dashed p-16
        transition-all duration-200 text-center
        ${isDragging
          ? 'border-amber-400 bg-amber-400/5'
          : 'border-[#333] hover:border-[#555] bg-[#141414] hover:bg-[#1a1a1a]'
        }
      `}
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />
      
      <div className="text-5xl mb-4">📸</div>
      <p className="text-lg font-medium mb-2">
        Drop a photo of your room here
      </p>
      <p className="text-[#666] text-sm">
        or click to browse — JPG, PNG, WebP up to 10MB
      </p>
      <p className="text-[#555] text-xs mt-4">
        Tip: photograph the wall where you want to hang art
      </p>
    </div>
  )
}

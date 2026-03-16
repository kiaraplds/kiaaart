import { useState } from 'react'

const BUDGETS = ['Under £50', '£50–150', '£150–300', '£300–500', '£500+']
const STYLES = ['Abstract', 'Botanical', 'Photography', 'Minimalist', 'Figurative', 'Landscape', 'Line Drawing', 'Mixed Media']
const LOCATIONS = ['UK', 'Europe', 'US', 'Australia', 'Global']

export default function Preferences({ analysis, onSearch, onChat, messages }) {
  const [budget, setBudget] = useState('£50–150')
  const [selectedStyles, setSelectedStyles] = useState([])
  const [location, setLocation] = useState('UK')
  const [chatInput, setChatInput] = useState('')

  const recs = analysis?.art_recommendations || {}

  const toggleStyle = (style) => {
    setSelectedStyles(prev =>
      prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]
    )
  }

  const handleSearch = () => {
    onSearch({
      budget,
      style: selectedStyles.length > 0 ? selectedStyles.join(', ') : recs.suggested_styles?.join(', ') || 'open to suggestions',
      colours: recs.suggested_colour_palette?.join(', ') || 'as recommended',
      size: recs.suggested_sizes?.join(', ') || 'as recommended',
      location,
    })
  }

  const handleChat = (e) => {
    e.preventDefault()
    if (!chatInput.trim()) return
    onChat(chatInput.trim())
    setChatInput('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-2xl font-semibold mb-1">Great space!</h3>
        <p className="text-[#888] text-sm">Tell me what you're looking for and I'll find artwork you can buy.</p>
      </div>

      {/* Budget */}
      <div>
        <label className="text-xs uppercase tracking-wider text-[#666] block mb-2">Budget</label>
        <div className="flex flex-wrap gap-2">
          {BUDGETS.map(b => (
            <button
              key={b}
              onClick={() => setBudget(b)}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                budget === b
                  ? 'bg-amber-500 text-black font-medium'
                  : 'bg-[#1a1a1a] text-[#999] border border-[#333] hover:border-[#555]'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="text-xs uppercase tracking-wider text-[#666] block mb-2">Location</label>
        <div className="flex flex-wrap gap-2">
          {LOCATIONS.map(loc => (
            <button
              key={loc}
              onClick={() => setLocation(loc)}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                location === loc
                  ? 'bg-amber-500 text-black font-medium'
                  : 'bg-[#1a1a1a] text-[#999] border border-[#333] hover:border-[#555]'
              }`}
            >
              {loc}
            </button>
          ))}
        </div>
      </div>

      {/* Style */}
      <div>
        <label className="text-xs uppercase tracking-wider text-[#666] block mb-2">
          Art Style <span className="text-[#444]">(optional — we'll suggest if you skip)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {STYLES.map(s => (
            <button
              key={s}
              onClick={() => toggleStyle(s)}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                selectedStyles.includes(s)
                  ? 'bg-amber-500 text-black font-medium'
                  : 'bg-[#1a1a1a] text-[#999] border border-[#333] hover:border-[#555]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Search Button */}
      <button
        onClick={handleSearch}
        className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold rounded-xl hover:from-amber-400 hover:to-orange-400 transition-all text-sm"
      >
        Find artwork for my space →
      </button>

      {/* Chat */}
      <div className="border-t border-[#222] pt-4">
        <p className="text-xs text-[#555] mb-3">Or just tell me what you want:</p>
        
        {/* Messages */}
        <div className="space-y-3 mb-3 max-h-48 overflow-y-auto">
          {messages.map((msg, i) => (
            <div key={i} className={`text-sm ${msg.role === 'user' ? 'text-right' : ''}`}>
              <span className={`inline-block px-3 py-2 rounded-xl max-w-[85%] ${
                msg.role === 'user'
                  ? 'bg-amber-500/20 text-amber-200'
                  : 'bg-[#1a1a1a] text-[#bbb]'
              }`}>
                {msg.content}
              </span>
            </div>
          ))}
        </div>

        <form onSubmit={handleChat} className="flex gap-2">
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="e.g. Something colourful under £100..."
            className="flex-1 px-4 py-2.5 bg-[#1a1a1a] border border-[#333] rounded-xl text-sm text-[#ccc] placeholder-[#555] focus:border-amber-500/50 focus:outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-[#222] border border-[#333] rounded-xl text-sm hover:bg-[#2a2a2a] transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}

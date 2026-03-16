export default function RoomAnalysis({ analysis, compact = false }) {
  if (!analysis) return null

  const wall = analysis.wall_analysis || {}
  const style = analysis.room_style || {}
  const colours = analysis.colour_palette || {}
  const recs = analysis.art_recommendations || {}

  if (compact) {
    return (
      <div className="p-4 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a]">
        <h4 className="text-xs uppercase tracking-wider text-[#666] mb-2">Your Space</h4>
        <p className="text-sm text-[#aaa]">
          {style.primary_style} · {style.mood}
        </p>
        <div className="flex flex-wrap gap-1 mt-2">
          {(colours.dominant_colours || []).map((c, i) => (
            <span key={i} className="text-xs px-2 py-0.5 bg-[#252525] rounded-full text-[#999]">{c}</span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      {analysis.summary && (
        <div className="p-4 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a]">
          <p className="text-[#ccc] text-sm leading-relaxed italic">"{analysis.summary}"</p>
        </div>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3">
        <InfoCard label="Style" value={style.primary_style} />
        <InfoCard label="Mood" value={style.mood} />
        <InfoCard label="Wall" value={`${wall.primary_colour}, ${wall.available_space} space`} />
        <InfoCard label="Light" value={wall.lighting} />
      </div>

      {/* Colours */}
      <div className="p-4 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a]">
        <h4 className="text-xs uppercase tracking-wider text-[#666] mb-2">Room Colours</h4>
        <div className="flex flex-wrap gap-1">
          {(colours.dominant_colours || []).map((c, i) => (
            <span key={i} className="text-xs px-2 py-1 bg-[#252525] rounded-full text-[#bbb]">{c}</span>
          ))}
        </div>
        {colours.complementary_colours?.length > 0 && (
          <>
            <h4 className="text-xs uppercase tracking-wider text-[#666] mb-2 mt-3">Complementary for Art</h4>
            <div className="flex flex-wrap gap-1">
              {colours.complementary_colours.map((c, i) => (
                <span key={i} className="text-xs px-2 py-1 bg-amber-900/20 border border-amber-800/30 rounded-full text-amber-300">{c}</span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Recommendations */}
      {recs.suggested_styles?.length > 0 && (
        <div className="p-4 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a]">
          <h4 className="text-xs uppercase tracking-wider text-[#666] mb-2">Recommended Art Styles</h4>
          <div className="flex flex-wrap gap-1">
            {recs.suggested_styles.map((s, i) => (
              <span key={i} className="text-xs px-2 py-1 bg-[#252525] rounded-full text-[#bbb]">{s}</span>
            ))}
          </div>
          {recs.suggested_sizes?.length > 0 && (
            <p className="text-xs text-[#666] mt-2">
              Sizes: {recs.suggested_sizes.join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function InfoCard({ label, value }) {
  return (
    <div className="p-3 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
      <p className="text-[10px] uppercase tracking-wider text-[#555]">{label}</p>
      <p className="text-sm text-[#bbb] mt-0.5">{value || '—'}</p>
    </div>
  )
}

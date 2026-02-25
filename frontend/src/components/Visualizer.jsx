export default function Visualizer({ status }) {
  if (status === 'listening') return <ListeningDots />
  if (status === 'recording') return <WaveformBars count={28} color="bg-red-400/50" h={24} />
  if (status === 'playing')   return <WaveformBars count={12} color="bg-emerald-400/40" h={16} />
  return <div className="h-8" /> /* spacer to prevent layout shift */
}

/* ── Gentle pulsing dots while waiting for speech ── */

function ListeningDots() {
  return (
    <div className="flex items-center justify-center gap-2.5 h-8">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full bg-cyan-400/60 animate-listening-dot"
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </div>
  )
}

/* ── Animated bars for recording / playing ── */

function WaveformBars({ count, color, h }) {
  return (
    <div className="flex items-center justify-center gap-[3px] h-8">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={`w-[3px] rounded-full ${color} animate-waveform-bar origin-center`}
          style={{ animationDelay: `${i * 0.06}s`, height: h }}
        />
      ))}
    </div>
  )
}

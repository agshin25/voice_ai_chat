export default function RecordButton({ status, onClick }) {
  const isRecording = status === 'recording'
  const isProcessing = status === 'processing'
  const isPlaying = status === 'playing'
  const isDisabled = isProcessing || isPlaying

  return (
    <div className="relative flex items-center justify-center h-24">
      {/* Expanding pulse rings while recording */}
      {isRecording && (
        <>
          <span className="absolute size-[72px] rounded-full border border-red-500/25 animate-pulse-ring" />
          <span className="absolute size-[72px] rounded-full border border-red-500/15 animate-pulse-ring [animation-delay:0.7s]" />
        </>
      )}

      {/* Diffused glow behind button */}
      <div
        className={`absolute size-24 rounded-full blur-2xl transition-all duration-700 ${
          isRecording   ? 'bg-red-500/20' :
          isProcessing  ? 'bg-violet-500/15' :
          isPlaying     ? 'bg-emerald-500/15' :
                          'bg-transparent'
        }`}
      />

      {/* Main button */}
      <button
        onClick={onClick}
        disabled={isDisabled}
        aria-label={
          isRecording  ? 'Stop recording' :
          isProcessing ? 'Processing…' :
          isPlaying    ? 'Playing response…' :
                         'Start recording'
        }
        className={`
          relative z-10 size-[72px] rounded-full flex items-center justify-center
          transition-all duration-300 cursor-pointer
          ${isRecording
            ? 'bg-red-500/80 shadow-[0_0_50px_rgba(239,68,68,0.25)] scale-110'
            : isProcessing
            ? 'bg-white/[0.04] border border-white/[0.08] cursor-wait'
            : isPlaying
            ? 'bg-white/[0.04] border border-emerald-500/[0.15] cursor-default'
            : 'bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.09] hover:border-white/[0.14] hover:shadow-[0_0_40px_rgba(139,92,246,0.15)] hover:scale-105 active:scale-95'
          }
        `}
      >
        {isProcessing ? (
          /* Spinner */
          <svg className="size-6 text-violet-400 animate-spin-slow" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2" />
            <path
              d="M12 2a10 10 0 0 1 8.66 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        ) : isRecording ? (
          /* Stop square */
          <div className="size-5 rounded-[4px] bg-white/90" />
        ) : isPlaying ? (
          /* Speaker icon */
          <svg className="size-6 text-emerald-400/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-3.54a.75.75 0 0 1 1.28.53v13.52a.75.75 0 0 1-1.28.53L6.75 15.75H5.25a.75.75 0 0 1-.75-.75v-6a.75.75 0 0 1 .75-.75h1.5z" />
          </svg>
        ) : (
          /* Microphone icon */
          <svg className="size-6 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3z" />
          </svg>
        )}
      </button>
    </div>
  )
}

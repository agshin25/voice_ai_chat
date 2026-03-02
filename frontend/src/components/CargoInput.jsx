import { useState, useRef } from 'react'

export default function CargoInput({ status, onSend, onToggleVoice }) {
  const [value, setValue] = useState('')
  const textareaRef = useRef(null)

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const submit = () => {
    const text = value.trim()
    if (!text) return
    onSend(text)
    setValue('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleInput = (e) => {
    setValue(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'
  }

  return (
    <div className="shrink-0 px-4 pb-5 pt-3 border-t border-white/[0.04]">
      <div className="max-w-2xl mx-auto flex items-center bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 gap-2 focus-within:border-violet-500/30 focus-within:bg-white/[0.06] transition-all duration-200">

        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your cargo..."
          rows={1}
          className="flex-1 bg-transparent py-3 text-[14px] text-white/75 placeholder-white/20 outline-none resize-none leading-relaxed max-h-32 overflow-y-auto"
        />

        <div className="shrink-0">
          {value.trim() ? (
            <SendButton onClick={submit} />
          ) : (
            <MicButton status={status} onClick={onToggleVoice} />
          )}
        </div>
      </div>

      {status !== 'idle' && (
        <p className={`text-center text-[11px] font-medium tracking-widest uppercase mt-2 transition-colors duration-300 ${STATUS_COLOR[status]}`}>
          {STATUS_LABEL[status]}
        </p>
      )}
    </div>
  )
}

function SendButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-8 h-8 rounded-xl flex items-center justify-center bg-violet-500 text-white hover:bg-violet-400 transition-all duration-200"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
      </svg>
    </button>
  )
}

function MicButton({ status, onClick }) {
  const isRecording  = status === 'recording'
  const isListening  = status === 'listening'
  const isProcessing = status === 'processing'
  const isPlaying    = status === 'playing'

  return (
    <button
      onClick={onClick}
      className={`
        w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300
        ${isRecording  ? 'bg-red-500/70 text-white'     :
          isListening  ? 'bg-cyan-500/10 text-cyan-400' :
          isProcessing ? 'text-violet-400'              :
          isPlaying    ? 'text-emerald-400'             :
          'bg-white/[0.08] text-white/50 hover:text-white/75 hover:bg-white/[0.12]'}
      `}
    >
      {isProcessing ? (
        <svg className="size-4 animate-spin-slow" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2" />
          <path d="M12 2a10 10 0 0 1 8.66 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ) : isRecording ? (
        <div className="size-3 rounded-[3px] bg-white/90" />
      ) : (
        <svg className={`size-4 ${isListening ? 'animate-breathe' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3z" />
        </svg>
      )}
    </button>
  )
}

const STATUS_LABEL = {
  idle: 'Ready', listening: 'Listening', recording: 'Recording',
  processing: 'Thinking', playing: 'Speaking',
}

const STATUS_COLOR = {
  idle: 'text-white/25',       listening: 'text-cyan-400/80',
  recording: 'text-red-400/80', processing: 'text-violet-400/80',
  playing: 'text-emerald-400/80',
}

import { useState, useRef, useEffect } from 'react'
import ChatMessage from './components/ChatMessage'
import RecordButton from './components/RecordButton'

export default function App() {
  const [messages, setMessages] = useState([])
  const [status, setStatus] = useState('idle') // idle | recording | processing | playing
  const [error, setError] = useState(null)

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const chatEndRef = useRef(null)
  const audioRef = useRef(null)

  /* auto-scroll on new messages */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  /* auto-dismiss errors */
  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => setError(null), 4000)
    return () => clearTimeout(t)
  }, [error])

  /* ── Recording ── */

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      const mimeType =
        MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' :
        MediaRecorder.isTypeSupported('audio/webm')             ? 'audio/webm' :
                                                                  ''
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
        stream.getTracks().forEach((t) => t.stop())
        sendAudio(blob)
      }

      recorder.start()
      setStatus('recording')
    } catch {
      setError('Microphone access denied. Please allow microphone permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }

  /* ── API ── */

  const sendAudio = async (blob) => {
    setStatus('processing')
    try {
      const form = new FormData()
      form.append('audio', blob, 'recording.webm')

      const res = await fetch('/api/chat', { method: 'POST', body: form })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const data = await res.json()

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'user', text: data.user_text },
        { id: crypto.randomUUID(), role: 'ai', text: data.ai_text, audioUrl: data.audio_url },
      ])

      /* auto-play AI response audio */
      if (data.audio_url) {
        setStatus('playing')
        const audio = new Audio(data.audio_url)
        audioRef.current = audio
        audio.onended = () => setStatus('idle')
        audio.onerror = () => setStatus('idle')
        await audio.play().catch(() => setStatus('idle'))
      } else {
        setStatus('idle')
      }
    } catch {
      setError('Failed to get a response. Please try again.')
      setStatus('idle')
    }
  }

  /* ── Handlers ── */

  const handleToggle = () => {
    if (status === 'recording') stopRecording()
    else if (status === 'idle') startRecording()
  }

  const statusLabel = {
    idle: 'Ready',
    recording: 'Listening',
    processing: 'Thinking',
    playing: 'Speaking',
  }

  const statusColor = {
    idle: 'text-white/25',
    recording: 'text-red-400/80',
    processing: 'text-violet-400/80',
    playing: 'text-emerald-400/80',
  }

  /* ── Render ── */

  return (
    <div className="h-dvh w-screen bg-[#08080c] flex flex-col overflow-hidden font-sans">
      {/* Ambient top glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(88,28,135,0.10) 0%, transparent 60%)',
        }}
      />

      {/* Error toast */}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-xl text-red-300 text-sm px-5 py-3 rounded-xl shadow-lg">
            {error}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="relative z-10 flex items-center justify-center py-4 border-b border-white/[0.04]">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
          <h1 className="text-white/80 text-[15px] font-medium tracking-[0.03em]">
            Voice AI
          </h1>
        </div>
      </header>

      {/* Chat area */}
      <main className="relative z-10 flex-1 overflow-y-auto chat-scroll">
        {messages.length === 0 ? (
          /* ── Empty state ── */
          <div className="h-full flex flex-col items-center justify-center px-6 select-none">
            {/* Glowing mic icon */}
            <div className="relative mb-8">
              <div className="absolute inset-0 w-20 h-20 rounded-full bg-violet-500/10 blur-xl animate-breathe" />
              <div className="relative w-20 h-20 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-white/20"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3z"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-white/70 text-xl font-medium mb-2">
              How can I help?
            </h2>
            <p className="text-white/30 text-sm">
              Tap the microphone to start talking
            </p>
          </div>
        ) : (
          /* ── Messages ── */
          <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
            {messages.map((msg, i) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                style={{ animationDelay: `${(i % 2) * 0.1}s` }}
              />
            ))}
            <div ref={chatEndRef} />
          </div>
        )}
      </main>

      {/* Bottom bar */}
      <footer className="relative z-10 flex flex-col items-center gap-3 pb-8 pt-4">
        {/* Waveform visualizer */}
        {status === 'recording' && <Waveform />}

        {/* Status label */}
        <p
          className={`text-xs font-medium tracking-widest uppercase transition-colors duration-300 ${statusColor[status]}`}
        >
          {statusLabel[status]}
        </p>

        <RecordButton status={status} onClick={handleToggle} />
      </footer>
    </div>
  )
}

/* ── Waveform bars shown while recording ── */

function Waveform() {
  const BAR_COUNT = 28
  return (
    <div className="flex items-center justify-center gap-[3px] h-8">
      {Array.from({ length: BAR_COUNT }, (_, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full bg-red-400/50 animate-waveform-bar origin-center"
          style={{ animationDelay: `${i * 0.06}s`, height: 24 }}
        />
      ))}
    </div>
  )
}

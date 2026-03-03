import { useRef, useEffect } from 'react'
import useVoiceChat from '../hooks/useVoiceChat'
import ChatMessage from '../components/ChatMessage'
import RecordButton from '../components/RecordButton'
import Visualizer from '../components/Visualizer'

const STATUS_LABEL = {
  idle: 'Ready',
  listening: 'Listening',
  recording: 'Recording',
  processing: 'Thinking',
  playing: 'Speaking',
}

const STATUS_COLOR = {
  idle: 'text-white/25',
  listening: 'text-cyan-400/80',
  recording: 'text-red-400/80',
  processing: 'text-violet-400/80',
  playing: 'text-emerald-400/80',
}

export default function ChatPage() {
  const { status, messages, error, toggle } = useVoiceChat()
  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="h-full flex flex-col">
      {/* Error toast */}
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-xl text-red-300 text-sm px-5 py-3 rounded-xl shadow-lg">
            {error}
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-white/[0.04] shrink-0">
        <div className={`w-2 h-2 rounded-full shrink-0 transition-colors duration-500 md:ml-0 ml-8 ${
          status === 'idle'
            ? 'bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]'
            : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
        }`} />
        <h2 className="text-white/60 text-[14px] font-medium tracking-[0.02em]">Voice Chat</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto chat-scroll relative">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="max-w-2xl mx-auto px-6 py-6 space-y-3">
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
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-3 pb-8 pt-4 shrink-0">
        <Visualizer status={status} />
        <p className={`text-xs font-medium tracking-widest uppercase transition-colors duration-300 ${STATUS_COLOR[status]}`}>
          {STATUS_LABEL[status]}
        </p>
        <RecordButton status={status} onClick={toggle} />
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center px-6 select-none">
      <div className="relative mb-8">
        <div className="absolute inset-0 w-20 h-20 rounded-full bg-violet-500/10 blur-xl animate-breathe" />
        <div className="relative w-20 h-20 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
          <svg className="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3z" />
          </svg>
        </div>
      </div>
      <h2 className="text-white/70 text-xl font-medium mb-2">How can I help?</h2>
      <p className="text-white/30 text-sm">Tap the microphone to start a conversation</p>
    </div>
  )
}

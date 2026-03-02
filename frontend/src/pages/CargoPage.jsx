import { useRef, useEffect } from 'react'
import useCargoChat from '../hooks/useCargoChat'
import ChatMessage from '../components/ChatMessage'
import CargoInput from '../components/CargoInput'

export default function CargoPage() {
  const { status, messages, error, toggleVoice, sendText } = useCargoChat()
  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="h-full flex flex-col">
      {error && <ErrorToast message={error} />}

      <PageHeader />

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

      <CargoInput
        status={status}
        onSend={sendText}
        onToggleVoice={toggleVoice}
      />
    </div>
  )
}

function PageHeader() {
  return (
    <div className="flex items-center gap-2.5 px-6 py-4 border-b border-white/[0.04] shrink-0">
      <svg className="w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
      <h2 className="text-white/60 text-[14px] font-medium tracking-[0.02em]">Cargo Tracking</h2>
    </div>
  )
}

function ErrorToast({ message }) {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-xl text-red-300 text-sm px-5 py-3 rounded-xl shadow-lg">
        {message}
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
          </svg>
        </div>
      </div>
      <h2 className="text-white/70 text-xl font-medium mb-2">Track your cargo</h2>
      <p className="text-white/30 text-sm text-center">
        Speak or type your cargo number<br />to get real-time tracking info
      </p>
    </div>
  )
}

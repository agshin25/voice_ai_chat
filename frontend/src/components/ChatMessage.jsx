export default function ChatMessage({ message, style }) {
  const isUser = message.role === 'user'

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-slide-up`}
      style={style}
    >
      <div
        className={`
          max-w-[85%] sm:max-w-[75%] px-4 py-3
          ${isUser
            ? 'bg-violet-500/[0.12] border border-violet-500/[0.08] rounded-2xl rounded-br-md'
            : 'bg-white/[0.03] border border-white/[0.05] rounded-2xl rounded-bl-md'
          }
        `}
      >
        {!isUser && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400/60" />
            <span className="text-[11px] font-medium text-white/30 uppercase tracking-wider">
              AI
            </span>
          </div>
        )}
        <p
          className={`text-[14px] leading-relaxed whitespace-pre-wrap ${
            isUser ? 'text-white/85' : 'text-white/75'
          }`}
        >
          {message.text}
        </p>
      </div>
    </div>
  )
}

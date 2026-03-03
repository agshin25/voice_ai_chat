import { useState, useEffect } from 'react'

const NAV = [
  {
    id: 'chat',
    label: 'Voice Chat',
    icon: (
      <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3z" />
      </svg>
    ),
  },
  {
    id: 'cargo',
    label: 'Cargo Tracking',
    icon: (
      <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
  },
]

const isMobileScreen = () => window.innerWidth < 768

export default function Sidebar({ activePage, onNavigate }) {
  const [open, setOpen] = useState(() => !isMobileScreen())
  const [isMobile, setIsMobile] = useState(() => isMobileScreen())

  useEffect(() => {
    const handleResize = () => {
      const mobile = isMobileScreen()
      setIsMobile(mobile)
      if (!mobile) setOpen(true)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const navigate = (id) => {
    onNavigate(id)
    if (isMobile) setOpen(false)
  }

  if (isMobile) {
    return (
      <>
        {/* Mobile toggle button */}
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="fixed top-[12px] left-4 z-40 w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
            </svg>
          </button>
        )}

        {/* Backdrop */}
        {open && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
        )}

        {/* Mobile drawer */}
        <aside
          className={`
            fixed top-0 left-0 h-full z-50 w-[260px] flex flex-col
            bg-[#0a0a12] border-r border-white/[0.06]
            transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
            ${open ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <SidebarContent
            open={true}
            activePage={activePage}
            onNavigate={navigate}
            onClose={() => setOpen(false)}
            showClose
          />
        </aside>
      </>
    )
  }

  return (
    <aside
      className={`
        h-full shrink-0 flex flex-col bg-[#0a0a12] border-r border-white/[0.05]
        transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
        ${open ? 'w-[220px]' : 'w-[60px]'}
      `}
    >
      <SidebarContent
        open={open}
        activePage={activePage}
        onNavigate={navigate}
        onClose={() => setOpen(false)}
        onOpen={() => setOpen(true)}
      />
    </aside>
  )
}

function SidebarContent({ open, activePage, onNavigate, onClose, onOpen, showClose }) {
  return (
    <>
      {/* Header */}
      <div className={`flex items-center border-b border-white/[0.04] h-[57px] shrink-0 ${open ? 'px-4 gap-2.5' : 'justify-center'}`}>
        <div className="w-7 h-7 rounded-lg bg-violet-500/15 border border-violet-500/25 flex items-center justify-center shrink-0">
          <svg className="w-3.5 h-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
          </svg>
        </div>

        {open && (
          <>
            <span className="flex-1 text-white/75 text-[14px] font-semibold tracking-[0.02em] overflow-hidden whitespace-nowrap">
              Voice AI
            </span>
            <button
              onClick={onClose}
              className="w-6 h-6 rounded-lg flex items-center justify-center text-white/25 hover:text-white/55 hover:bg-white/[0.05] transition-colors shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className={`flex-1 py-4 space-y-1 ${open ? 'px-3' : 'px-2'}`}>
        {NAV.map(item => {
          const active = activePage === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={!open ? item.label : undefined}
              className={`
                w-full flex items-center rounded-xl text-left
                transition-all duration-150
                ${open ? 'gap-3 px-3 py-2.5' : 'justify-center py-2.5'}
                ${active
                  ? 'bg-violet-500/[0.12] border border-violet-500/[0.18] text-violet-300'
                  : 'text-white/35 hover:text-white/60 hover:bg-white/[0.04] border border-transparent'
                }
              `}
            >
              <span className={active ? 'text-violet-400' : 'text-white/30'}>
                {item.icon}
              </span>
              {open && (
                <>
                  <span className="text-[13px] font-medium whitespace-nowrap overflow-hidden">
                    {item.label}
                  </span>
                  {active && <div className="ml-auto w-1 h-1 rounded-full bg-violet-400/70 shrink-0" />}
                </>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className={`border-t border-white/[0.04] ${open ? 'px-4 py-4 flex items-center justify-between' : 'flex justify-center py-4'}`}>
        {open && <p className="text-[11px] text-white/15 tracking-wide">v1.0</p>}
        {!open && onOpen && (
          <button
            onClick={onOpen}
            className="w-6 h-6 rounded-lg flex items-center justify-center text-white/25 hover:text-white/55 hover:bg-white/[0.05] transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        )}
      </div>
    </>
  )
}

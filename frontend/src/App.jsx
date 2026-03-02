import { useState } from 'react'
import Sidebar from './components/Sidebar'
import ChatPage from './pages/ChatPage'
import CargoPage from './pages/CargoPage'

const PAGES = {
  chat: ChatPage,
  cargo: CargoPage,
}

export default function App() {
  const [activePage, setActivePage] = useState('chat')
  const Page = PAGES[activePage]

  return (
    <div className="h-dvh w-screen bg-[#08080c] flex overflow-hidden font-sans">
      {/* Ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 20% -10%, rgba(88,28,135,0.08) 0%, transparent 60%)',
        }}
      />

      <Sidebar activePage={activePage} onNavigate={setActivePage} />

      <main className="relative flex-1 flex flex-col overflow-hidden">
        <Page />
      </main>
    </div>
  )
}

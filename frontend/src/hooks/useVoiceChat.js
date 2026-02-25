import { useState, useRef, useCallback, useEffect } from 'react'
import useWebSocket from './useWebSocket'
import useVAD from './useVAD'
import { encodeWAV, createAudioURL } from '../utils/audioUtils'


export default function useVoiceChat() {
  const [status, setStatus] = useState('idle')
  const [messages, setMessages] = useState([])
  const [error, setError] = useState(null)

  const audioRef = useRef(null)
  const statusRef = useRef('idle')
  const ws = useWebSocket()
  const vad = useVAD()

  useEffect(() => { statusRef.current = status }, [status])

  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => setError(null), 4000)
    return () => clearTimeout(t)
  }, [error])

  /* ── Helpers ── */

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
  }, [])

  /* ── WebSocket handlers ── */

  const setupWSHandlers = useCallback(() => {
    ws.setHandlers({
      onJson: (data) => {
        switch (data.status) {
          case 'transcribing':
            setStatus('processing')
            break

          case 'thinking':
            setMessages((prev) => [
              ...prev,
              { id: crypto.randomUUID(), role: 'user', text: data.user_text },
            ])
            break

          case 'speaking':
            setMessages((prev) => [
              ...prev,
              { id: crypto.randomUUID(), role: 'ai', text: data.ai_text },
            ])
            break

          case 'idle':
            // Server done — resume listening if not playing audio
            if (statusRef.current !== 'playing') {
              setStatus('listening')
            }
            break
        }
      },

      onBinary: async (data) => {
        // Pause VAD so it doesn't pick up AI audio from speakers
        vad.pause()
        setStatus('playing')

        const url = createAudioURL(data)
        const audio = new Audio(url)
        audioRef.current = audio

        const cleanup = () => {
          URL.revokeObjectURL(url)
          if (audioRef.current === audio) {
            audioRef.current = null
            if (statusRef.current === 'playing') {
              setStatus('listening')
              vad.resume()
            }
          }
        }

        audio.onended = cleanup
        audio.onerror = cleanup

        try { await audio.play() }
        catch { cleanup() }
      },

      onClose: () => {
        if (statusRef.current !== 'idle') setStatus('idle')
      },
    })
  }, [ws, vad, stopAudio])

  /* ── Start / End conversation ── */

  const startConversation = useCallback(async () => {
    try {
      const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
      await ws.connect(`${proto}//${location.host}/api/ws/chat`)
      setupWSHandlers()

      await vad.start({
        onSpeechStart: () => {
          setStatus('recording')
        },
        onSpeechEnd: (audio) => {
          setStatus('processing')
          const wav = encodeWAV(audio)
          wav.arrayBuffer().then((buf) => ws.sendBinary(buf))
        },
      })

      setStatus('listening')
    } catch (err) {
      console.error('Failed to start conversation:', err)
      setError('Could not start — check microphone permissions.')
      setStatus('idle')
    }
  }, [ws, vad, setupWSHandlers, stopAudio])

  const endConversation = useCallback(() => {
    stopAudio()
    vad.stop()
    ws.disconnect()
    setStatus('idle')
  }, [ws, vad, stopAudio])

  const toggle = useCallback(() => {
    if (status === 'idle') startConversation()
    else endConversation()
  }, [status, startConversation, endConversation])

  // Cleanup on unmount only — use ref so effect has no deps that retrigger it
  const endRef = useRef(endConversation)
  endRef.current = endConversation
  useEffect(() => () => endRef.current(), [])

  return { status, messages, error, toggle }
}

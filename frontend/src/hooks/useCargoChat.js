import { useState, useRef, useCallback, useEffect } from 'react'
import useWebSocket from './useWebSocket'
import useVAD from './useVAD'
import { encodeWAV, createAudioURL } from '../utils/audioUtils'

export default function useCargoChat() {
  const [status, setStatus] = useState('idle')
  const [messages, setMessages] = useState([])
  const [error, setError] = useState(null)

  const audioRef         = useRef(null)
  const audioQueueRef    = useRef([])
  const isPlayingRef     = useRef(false)
  const idleReceivedRef  = useRef(false)
  const streamingTextRef = useRef('')
  const aiMessageIdRef   = useRef(null)
  const statusRef        = useRef('idle')
  const isVoiceModeRef   = useRef(false)

  const ws  = useWebSocket()
  const vad = useVAD()

  const updateStatus = useCallback((s) => {
    statusRef.current = s
    setStatus(s)
  }, [])

  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => setError(null), 4000)
    return () => clearTimeout(t)
  }, [error])

  /* ── Audio playback ── */

  const playNext = useCallback(() => {
    const queue = audioQueueRef.current
    if (queue.length === 0) {
      isPlayingRef.current = false
      if (idleReceivedRef.current) {
        if (isVoiceModeRef.current) {
          updateStatus('listening')
          vad.resume()
        } else {
          updateStatus('idle')
        }
      }
      return
    }

    isPlayingRef.current = true
    const data = queue.shift()
    const url  = createAudioURL(data)
    const audio = new Audio(url)
    audioRef.current = audio

    const onDone = () => {
      URL.revokeObjectURL(url)
      audioRef.current = null
      playNext()
    }

    audio.onended = onDone
    audio.onerror = onDone
    audio.play().catch(onDone)
  }, [vad, updateStatus])

  const stopAudio = useCallback(() => {
    audioQueueRef.current = []
    isPlayingRef.current  = false
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
          case 'thinking':
            streamingTextRef.current = ''
            aiMessageIdRef.current   = null
            idleReceivedRef.current  = false
            setMessages((prev) => [
              ...prev,
              { id: crypto.randomUUID(), role: 'user', text: data.user_text },
            ])
            break

          case 'ai_chunk': {
            const chunk = data.text
            streamingTextRef.current += (streamingTextRef.current ? ' ' : '') + chunk

            if (!aiMessageIdRef.current) {
              const id = crypto.randomUUID()
              aiMessageIdRef.current = id
              setMessages((prev) => [
                ...prev,
                { id, role: 'ai', text: streamingTextRef.current },
              ])
            } else {
              const id   = aiMessageIdRef.current
              const text = streamingTextRef.current
              setMessages((prev) =>
                prev.map((m) => (m.id === id ? { ...m, text } : m))
              )
            }
            break
          }

          case 'error':
            setError('Something went wrong. Try again.')
            updateStatus('idle')
            break

          case 'idle':
            idleReceivedRef.current = true
            if (!isPlayingRef.current) {
              if (isVoiceModeRef.current) {
                updateStatus('listening')
                vad.resume()
              } else {
                updateStatus('idle')
              }
            }
            break
        }
      },

      onBinary: (data) => {
        vad.pause()
        updateStatus('playing')
        audioQueueRef.current.push(data)
        if (!isPlayingRef.current) playNext()
      },

      onClose: () => {
        if (statusRef.current !== 'idle') updateStatus('idle')
      },
    })
  }, [ws, vad, playNext, updateStatus])

  /* ── Connect / Disconnect ── */

  const connect = useCallback(async () => {
    try {
      const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
      await ws.connect(`${proto}//${location.host}/api/ws/cargo`)
      setupWSHandlers()
    } catch {
      setError('Could not connect to server.')
    }
  }, [ws, setupWSHandlers])

  const disconnect = useCallback(() => {
    isVoiceModeRef.current = false
    stopAudio()
    vad.stop()
    ws.disconnect()
    updateStatus('idle')
  }, [ws, vad, stopAudio, updateStatus])

  /* ── Voice ── */

  const toggleVoice = useCallback(async () => {
    if (isVoiceModeRef.current) {
      disconnect()
      return
    }

    try {
      await connect()
      await vad.start({
        onSpeechStart: () => {
          console.log('[cargo] speech start')
          updateStatus('recording')
        },
        onSpeechEnd: (audio) => {
          console.log('[cargo] speech end')
          vad.pause()
          updateStatus('processing')
          const wav = encodeWAV(audio)
          wav.arrayBuffer().then((buf) => ws.sendBinary(buf))
        },
      })
      isVoiceModeRef.current = true
      updateStatus('listening')
      console.log('[cargo] VAD started, listening')
    } catch (err) {
      console.error('[cargo] VAD start failed:', err)
      setError('Could not access microphone.')
      updateStatus('idle')
    }
  }, [connect, disconnect, ws, vad, updateStatus])

  /* ── Text ── */

  const sendText = useCallback(async (text) => {
    if (!text.trim()) return

    if (statusRef.current === 'idle') await connect()

    updateStatus('processing')
    ws.sendText(text)
  }, [connect, ws, updateStatus])

  /* ── Cleanup on unmount ── */

  const disconnectRef = useRef(disconnect)
  disconnectRef.current = disconnect
  useEffect(() => () => disconnectRef.current(), [])

  return { status, messages, error, toggleVoice, sendText }
}

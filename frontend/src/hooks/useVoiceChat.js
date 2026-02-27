import { useState, useRef, useCallback, useEffect } from 'react'
import useWebSocket from './useWebSocket'
import useVAD from './useVAD'
import { encodeWAV, createAudioURL } from '../utils/audioUtils'


export default function useVoiceChat() {
  const [status, setStatus] = useState('idle')
  const [messages, setMessages] = useState([])
  const [error, setError] = useState(null)

  const audioRef = useRef(null)
  const audioQueueRef = useRef([])
  const isPlayingRef = useRef(false)
  const idleReceivedRef = useRef(false)
  const streamingTextRef = useRef("")
  const aiMessageIdRef = useRef(null)
  const statusRef = useRef('idle')
  const timeoutRef = useRef(null)
  const ws = useWebSocket()
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

  /* ── Helpers ── */

  const clearProcessingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const startProcessingTimeout = useCallback(() => {
    clearProcessingTimeout()
    timeoutRef.current = setTimeout(() => {
      if (statusRef.current === 'processing') {
        console.warn('Processing timeout — resuming listening')
        updateStatus('listening')
        vad.resume()
      }
    }, 15000)
  }, [clearProcessingTimeout, vad])

  const playNext = useCallback(() => {
    const queue = audioQueueRef.current
    if (queue.length === 0) {
      isPlayingRef.current = false
      // If server already sent idle, resume listening now
      if (idleReceivedRef.current) {
        updateStatus('listening')
        vad.resume()
      }
      return
    }

    isPlayingRef.current = true
    const data = queue.shift()
    const url = createAudioURL(data)
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
    isPlayingRef.current = false
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
            updateStatus('processing')
            startProcessingTimeout()
            break

          case 'thinking':
            // Reset streaming state for new response
            streamingTextRef.current = ""
            aiMessageIdRef.current = null
            idleReceivedRef.current = false
            setMessages((prev) => [
              ...prev,
              { id: crypto.randomUUID(), role: 'user', text: data.user_text },
            ])
            break

          case 'ai_chunk': {
            // Accumulate streaming text
            const chunk = data.text
            streamingTextRef.current += (streamingTextRef.current ? " " : "") + chunk

            if (!aiMessageIdRef.current) {
              // First chunk — create the AI message
              const id = crypto.randomUUID()
              aiMessageIdRef.current = id
              setMessages((prev) => [
                ...prev,
                { id, role: 'ai', text: streamingTextRef.current },
              ])
            } else {
              // Update existing AI message with accumulated text
              const id = aiMessageIdRef.current
              const text = streamingTextRef.current
              setMessages((prev) =>
                prev.map((m) => (m.id === id ? { ...m, text } : m))
              )
            }
            break
          }

          case 'speaking':
            // Final complete text — update the AI message to ensure it's complete
            if (aiMessageIdRef.current) {
              const id = aiMessageIdRef.current
              setMessages((prev) =>
                prev.map((m) => (m.id === id ? { ...m, text: data.ai_text } : m))
              )
            }
            break

          case 'error':
            console.error('Server error:', data.message)
            setError('Something went wrong. Try again.')
            break

          case 'idle':
            clearProcessingTimeout()
            idleReceivedRef.current = true
            // Only resume if nothing is playing
            if (!isPlayingRef.current) {
              updateStatus('listening')
              vad.resume()
            }
            break
        }
      },

      onBinary: (data) => {
        clearProcessingTimeout()
        vad.pause()
        updateStatus('playing')

        // Queue the audio chunk
        audioQueueRef.current.push(data)
        // If nothing is currently playing, start playback
        if (!isPlayingRef.current) {
          playNext()
        }
      },

      onClose: () => {
        clearProcessingTimeout()
        if (statusRef.current !== 'idle') updateStatus('idle')
      },
    })
  }, [ws, vad, playNext, startProcessingTimeout, clearProcessingTimeout])

  /* ── Start / End conversation ── */

  const startConversation = useCallback(async () => {
    try {
      const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
      await ws.connect(`${proto}//${location.host}/api/ws/chat`)
      setupWSHandlers()

      await vad.start({
        onSpeechStart: () => {
          updateStatus('recording')
        },
        onSpeechEnd: (audio) => {
          vad.pause()
          updateStatus('processing')
          const wav = encodeWAV(audio)
          wav.arrayBuffer().then((buf) => ws.sendBinary(buf))
        },
      })

      updateStatus('listening')
    } catch (err) {
      console.error('Failed to start conversation:', err)
      setError('Could not start — check microphone permissions.')
      updateStatus('idle')
    }
  }, [ws, vad, setupWSHandlers, stopAudio])

  const endConversation = useCallback(() => {
    clearProcessingTimeout()
    stopAudio()
    idleReceivedRef.current = false
    streamingTextRef.current = ""
    aiMessageIdRef.current = null
    vad.stop()
    ws.disconnect()
    updateStatus('idle')
  }, [ws, vad, stopAudio, clearProcessingTimeout])

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

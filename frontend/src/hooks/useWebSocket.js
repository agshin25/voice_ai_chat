import { useRef, useCallback, useMemo } from 'react'

export default function useWebSocket() {
  const wsRef = useRef(null)
  const handlersRef = useRef({})

  const connect = useCallback((url) => {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.binaryType = 'arraybuffer'
      ws.onopen = () => resolve(ws)
      ws.onerror = (e) => reject(e)

      ws.onmessage = (event) => {
        if (typeof event.data === 'string') {
          handlersRef.current.onJson?.(JSON.parse(event.data))
        } else {
          handlersRef.current.onBinary?.(event.data)
        }
      }

      ws.onclose = () => handlersRef.current.onClose?.()
    })
  }, [])

  const disconnect = useCallback(() => {
    wsRef.current?.close()
    wsRef.current = null
  }, [])

  const sendBinary = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(data)
    }
  }, [])

  const setHandlers = useCallback((h) => {
    handlersRef.current = h
  }, [])

  return useMemo(
    () => ({ connect, disconnect, sendBinary, setHandlers }),
    [connect, disconnect, sendBinary, setHandlers]
  )
}

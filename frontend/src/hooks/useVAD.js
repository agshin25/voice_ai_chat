import { useRef, useCallback, useMemo } from 'react'

export default function useVAD() {
  const vadRef = useRef(null)

  const start = useCallback(async ({ onSpeechStart, onSpeechEnd }) => {
    const { MicVAD } = await import('@ricky0123/vad-web')

    const vad = await MicVAD.new({
      workletURL: '/vad.worklet.bundle.min.js',
      modelURL: '/silero_vad.onnx',
      onnxWASMBasePath: 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.2/dist/',
      positiveSpeechThreshold: 0.8,
      negativeSpeechThreshold: 0.35,
      minSpeechFrames: 5,
      preSpeechPadFrames: 10,
      redemptionFrames: 16,
      onSpeechStart,
      onSpeechEnd,
    })

    vad.start()
    vadRef.current = vad
  }, [])

  const stop = useCallback(() => {
    vadRef.current?.pause()
    vadRef.current?.destroy()
    vadRef.current = null
  }, [])

  const pause = useCallback(() => vadRef.current?.pause(), [])
  const resume = useCallback(() => vadRef.current?.start(), [])

  return useMemo(
    () => ({ start, stop, pause, resume }),
    [start, stop, pause, resume]
  )
}

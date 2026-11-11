import { useCallback, useEffect, useRef, useState } from 'react'
import { createSoloPlayer, type SoloNoteSequence } from '../lib/soloAudio'
import type { GeneratedSolo } from '../lib/theory/solo'

export function useSoloPlayer() {
  const playerRef = useRef<ReturnType<typeof createSoloPlayer> | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const playSolo = useCallback((solo: GeneratedSolo, tempo: number) => {
    if (!playerRef.current) {
      playerRef.current = createSoloPlayer()
    }

    const sequences: SoloNoteSequence[] = solo.notes.map((n) => ({
      semitone: n.semitone,
      octave: n.octave,
      duration: n.duration,
      delay: n.delay,
    }))

    playerRef.current.play(sequences, tempo)
    setIsPlaying(true)

    // Calculate duration for auto-stop UI
    const lastNote = solo.notes[solo.notes.length - 1]
    const totalSeconds = ((lastNote.delay + lastNote.duration) * (60 / tempo)) + 0.5
    const timer = setTimeout(() => setIsPlaying(false), totalSeconds * 1000)

    return () => {
      clearTimeout(timer)
      playerRef.current?.stop()
      setIsPlaying(false)
    }
  }, [])

  const stop = useCallback(() => {
    playerRef.current?.stop()
    setIsPlaying(false)
  }, [])

  useEffect(() => {
    return () => playerRef.current?.dispose()
  }, [])

  return { playSolo, stop, isPlaying }
}
import { useCallback, useEffect, useRef } from 'react'
import { createNotePlucker, type NotePlucker } from '../lib/audio'

// Lazily creates the audio engine on first note and tears it down on unmount.
export function useNotePlayer(): (semitone: number) => void {
  const pluckerRef = useRef<NotePlucker | null>(null)

  const playNote = useCallback((semitone: number) => {
    pluckerRef.current ??= createNotePlucker()
    pluckerRef.current.play(semitone)
  }, [])

  useEffect(() => () => pluckerRef.current?.dispose(), [])

  return playNote
}

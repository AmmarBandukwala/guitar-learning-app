import { useCallback, useMemo, useState } from 'react'
import type { Scale } from '../lib/theory/scales'
import type { Tuning } from '../lib/theory/tunings'
import { generateSolo, getGenre, getGenres } from '../lib/theory/solo'
import { useSoloPlayer } from './useSoloPlayer'

interface SoloGeneratorState {
  genreId: string
  totalBars: number
  tempo: number
}

const DEFAULT_SOLO_STATE: SoloGeneratorState = {
  genreId: 'blues',
  totalBars: 8,
  tempo: 120,
}

export function useSoloGenerator(root: number, scale: Scale, tuning: Tuning) {
  const [state, setState] = useState<SoloGeneratorState>(DEFAULT_SOLO_STATE)
  const [generatedSolo, setGeneratedSolo] = useState<ReturnType<typeof generateSolo> | null>(null)
  const { playSolo, stop, isPlaying } = useSoloPlayer()

  const genres = useMemo(() => getGenres(), [])
  const genre = useMemo(() => getGenre(state.genreId), [state.genreId])

  const generate = useCallback(() => {
    const solo = generateSolo(root, scale, tuning, genre, state.totalBars)
    setGeneratedSolo(solo)
  }, [root, scale, tuning, genre, state.totalBars])

  const play = useCallback(() => {
    if (generatedSolo) {
      playSolo(generatedSolo, state.tempo)
    }
  }, [generatedSolo, state.tempo, playSolo])

  const updateState = useCallback((patch: Partial<SoloGeneratorState>) => {
    setState((prev) => ({ ...prev, ...patch }))
  }, [])

  return {
    state,
    genres,
    genre,
    generatedSolo,
    isPlaying,
    generate,
    play,
    stop,
    updateState,
  }
}
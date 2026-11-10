// User-facing settings model and validation. Pure, no React.

import { maxStartFret } from './fretboard'

export type Handed = 'right' | 'left'

export interface Settings {
  root: number
  scaleId: string
  tuningId: string
  handed: Handed
  frets: number
  startFret: number
  useFlats: boolean
  muteNonScale: boolean
  sound: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  root: 0,
  scaleId: 'major',
  tuningId: 'standard',
  handed: 'right',
  frets: 12,
  startFret: 0,
  useFlats: false,
  muteNonScale: false,
  sound: false,
}

// Merge a partial update over the defaults and clamp values into range.
export function sanitizeSettings(partial: Partial<Settings>): Settings {
  const merged = { ...DEFAULT_SETTINGS, ...partial }
  merged.startFret = Math.min(Math.max(0, merged.startFret), maxStartFret(merged.frets))
  return merged
}

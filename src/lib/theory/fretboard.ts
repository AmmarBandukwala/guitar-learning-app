// Fretboard geometry: turns settings + scale + tuning into a renderable model.
// Pure, no React.

import { noteName } from './notes'
import type { Scale } from './scales'
import type { Settings } from './settings'
import type { Tuning } from './tunings'

const TOTAL_FRETS = 24

export function maxStartFret(frets: number): number {
  return Math.max(0, TOTAL_FRETS - frets)
}

export interface FretNote {
  string: number // 0 = lowest string
  fret: number // absolute fret number, 0 = open
  semitone: number // 0-11
  name: string
  isRoot: boolean
  inScale: boolean
}

export interface FretboardModel {
  columns: number[] // absolute fret numbers, left -> right
  rows: number // number of strings
  notes: FretNote[]
}

export function buildFretboard(
  settings: Settings,
  scale: Scale,
  tuning: Tuning,
): FretboardModel {
  const root = ((settings.root % 12) + 12) % 12
  const intervalSet = new Set(scale.intervals.map((i) => ((i % 12) + 12) % 12))
  const columns: number[] = []
  for (let f = settings.startFret; f < settings.startFret + settings.frets; f++) {
    columns.push(f)
  }
  const notes: FretNote[] = []
  tuning.strings.forEach((open, stringIdx) => {
    for (const fret of columns) {
      const semitone = (((open + fret) % 12) + 12) % 12
      notes.push({
        string: stringIdx,
        fret,
        semitone,
        name: noteName(semitone, settings.useFlats),
        isRoot: semitone === root,
        inScale: intervalSet.has(semitone),
      })
    }
  })
  return { columns, rows: tuning.strings.length, notes }
}

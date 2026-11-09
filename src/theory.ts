// Music-theory + fretboard model. Pure, no React.

export const SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
export const FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

export function noteName(semitone: number, useFlats: boolean): string {
  const n = ((semitone % 12) + 12) % 12
  return (useFlats ? FLAT : SHARP)[n]
}

export interface Scale {
  id: string
  name: string
  category: string
  intervals: number[] // semitones from the root
}

export const SCALES: Scale[] = [
  // Major & minor families
  { id: 'major', name: 'Major', category: 'Major & Minor', intervals: [0, 2, 4, 5, 7, 9, 11] },
  { id: 'natural-minor', name: 'Natural Minor', category: 'Major & Minor', intervals: [0, 2, 3, 5, 7, 8, 10] },
  { id: 'harmonic-minor', name: 'Harmonic Minor', category: 'Major & Minor', intervals: [0, 2, 3, 5, 7, 8, 11] },
  { id: 'melodic-minor', name: 'Melodic Minor', category: 'Major & Minor', intervals: [0, 2, 3, 5, 7, 9, 11] },
  { id: 'harmonic-major', name: 'Harmonic Major', category: 'Major & Minor', intervals: [0, 2, 4, 5, 7, 8, 11] },
  { id: 'neapolitan-minor', name: 'Neapolitan Minor', category: 'Major & Minor', intervals: [0, 1, 3, 5, 7, 8, 10] },

  // Modes of major
  { id: 'ionian', name: 'Ionian', category: 'Modes of Major', intervals: [0, 2, 4, 5, 7, 9, 11] },
  { id: 'dorian', name: 'Dorian', category: 'Modes of Major', intervals: [0, 2, 3, 5, 7, 9, 10] },
  { id: 'phrygian', name: 'Phrygian', category: 'Modes of Major', intervals: [0, 1, 3, 5, 7, 8, 10] },
  { id: 'lydian', name: 'Lydian', category: 'Modes of Major', intervals: [0, 2, 4, 6, 7, 9, 11] },
  { id: 'mixolydian', name: 'Mixolydian', category: 'Modes of Major', intervals: [0, 2, 4, 5, 7, 9, 10] },
  { id: 'aeolian', name: 'Aeolian', category: 'Modes of Major', intervals: [0, 2, 3, 5, 7, 8, 10] },
  { id: 'locrian', name: 'Locrian', category: 'Modes of Major', intervals: [0, 1, 3, 5, 6, 8, 10] },

  // Modes of harmonic minor
  { id: 'phrygian-dominant', name: 'Phrygian Dominant', category: 'Modes of Minor', intervals: [0, 1, 4, 5, 7, 8, 10] },
  { id: 'lydian-dominant', name: 'Lydian Dominant', category: 'Modes of Minor', intervals: [0, 2, 4, 6, 7, 9, 10] },
  { id: 'dorian-b2', name: 'Dorian \u266d2', category: 'Modes of Minor', intervals: [0, 1, 3, 5, 7, 9, 10] },
  { id: 'locrian-nat6', name: 'Locrian \u266e6', category: 'Modes of Minor', intervals: [0, 1, 3, 5, 7, 8, 10] },
  { id: 'aeolian-b5', name: 'Aeolian \u266d5', category: 'Modes of Minor', intervals: [0, 1, 3, 5, 7, 8, 10] },
  { id: 'ionian-b5', name: 'Ionian \u266d5', category: 'Modes of Minor', intervals: [0, 2, 4, 5, 7, 8, 11] },

  // Modes of melodic minor
  { id: 'dorian-sharp4', name: 'Dorian \u266f4', category: 'Modes of Melodic Minor', intervals: [0, 2, 4, 5, 7, 8, 11] },
  { id: 'lydian-sharp2', name: 'Lydian \u266f2', category: 'Modes of Melodic Minor', intervals: [0, 2, 3, 6, 7, 9, 11] },
  { id: 'lydian-augmented', name: 'Lydian Augmented', category: 'Modes of Melodic Minor', intervals: [0, 2, 4, 6, 7, 9, 11] },
  { id: 'mixolydian-sharp4', name: 'Mixolydian \u266f4', category: 'Modes of Melodic Minor', intervals: [0, 2, 4, 5, 7, 9, 11] },
  { id: 'aeolian-sharp4', name: 'Aeolian \u266f4', category: 'Modes of Melodic Minor', intervals: [0, 2, 3, 5, 7, 8, 11] },
  { id: 'locrian-sharp2', name: 'Locrian \u266f2', category: 'Modes of Melodic Minor', intervals: [0, 1, 4, 5, 7, 9, 11] },

  // Pentatonic
  { id: 'major-pentatonic', name: 'Major Pentatonic', category: 'Pentatonic', intervals: [0, 2, 4, 7, 9] },
  { id: 'minor-pentatonic', name: 'Minor Pentatonic', category: 'Pentatonic', intervals: [0, 3, 5, 7, 10] },
  { id: 'sus4-pentatonic', name: 'Suspended 4 Pentatonic', category: 'Pentatonic', intervals: [0, 2, 5, 7, 9] },
  { id: 'lydian-pentatonic', name: 'Lydian Pentatonic', category: 'Pentatonic', intervals: [0, 2, 4, 6, 9] },

  // Blues
  { id: 'blues', name: 'Blues', category: 'Blues', intervals: [0, 3, 5, 6, 7, 10] },
  { id: 'major-blues', name: 'Major Blues', category: 'Blues', intervals: [0, 3, 5, 7, 9, 10] },

  // Symmetric
  { id: 'diminished', name: 'Diminished (half-whole)', category: 'Symmetric', intervals: [0, 1, 3, 4, 6, 7, 9, 10] },
  { id: 'diminished-wt', name: 'Diminished (whole-half)', category: 'Symmetric', intervals: [0, 2, 3, 5, 6, 8, 9, 11] },
  { id: 'whole-tone', name: 'Whole Tone', category: 'Symmetric', intervals: [0, 2, 4, 6, 8, 10] },
  { id: 'augmented', name: 'Augmented', category: 'Symmetric', intervals: [0, 3, 4, 7, 8, 11] },
  { id: 'chromatic', name: 'Chromatic', category: 'Symmetric', intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },

  // Exotic / other
  { id: 'hungarian-minor', name: 'Hungarian Minor', category: 'Exotic', intervals: [0, 2, 3, 5, 6, 8, 11] },
  { id: 'ultralocrian', name: 'Ultralocrian', category: 'Exotic', intervals: [0, 1, 3, 4, 6, 7, 9] },
  { id: 'enigmatic', name: 'Enigmatic', category: 'Exotic', intervals: [0, 1, 4, 5, 8, 10, 11] },
  { id: 'manhattan', name: 'Manhattan', category: 'Exotic', intervals: [0, 1, 3, 6, 8, 10, 11] },
  { id: 'bebop-dominant', name: 'Bebop Dominant', category: 'Exotic', intervals: [0, 2, 4, 5, 6, 7, 9, 10] },
]

export interface Tuning {
  id: string
  name: string
  strings: number[] // lowest string first, as semitone numbers
}

export const TUNINGS: Tuning[] = [
  { id: 'standard', name: 'Standard \u2014 E A D G B E', strings: [4, 9, 2, 7, 11, 4] },
  { id: 'dropped-d', name: 'Dropped D \u2014 D A D G B E', strings: [2, 9, 2, 7, 11, 4] },
  { id: 'dropped-ds', name: 'Dropped D# \u2014 D# A D G B E', strings: [3, 9, 2, 7, 11, 4] },
  { id: 'drop-c', name: 'Drop C \u2014 C G C F A D', strings: [0, 7, 0, 5, 9, 2] },
  { id: 'drop-cs', name: 'Drop C# \u2014 C# G# C# F# A# D#', strings: [1, 8, 1, 5, 10, 3] },
  { id: 'open-d', name: 'Open D \u2014 D A D F# A D', strings: [2, 9, 2, 6, 9, 2] },
  { id: 'open-g', name: 'Open G \u2014 D G D G B D', strings: [2, 7, 2, 7, 11, 2] },
  { id: 'open-a', name: 'Open A \u2014 E A E C# E A', strings: [4, 9, 4, 1, 4, 9] },
  { id: 'open-e', name: 'Open E \u2014 E B E G# B E', strings: [4, 11, 4, 1, 11, 4] },
  { id: 'open-c', name: 'Open C \u2014 C G C E G C', strings: [0, 7, 0, 4, 7, 0] },
  { id: 'dadgad', name: 'DADGAD \u2014 D A D G A D', strings: [2, 9, 2, 7, 9, 2] },
  { id: '7std', name: '7-String \u2014 A E A D G B E', strings: [9, 4, 9, 2, 7, 11, 4] },
  { id: '7dropped', name: '7-String Dropped \u2014 D A D G B E A', strings: [2, 9, 2, 7, 11, 4, 9] },
  { id: '8std', name: '8-String \u2014 E A D G C E A', strings: [4, 9, 2, 7, 0, 4, 9, 4] },
]

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

const TOTAL_FRETS = 24

export function getScale(id: string): Scale {
  return SCALES.find((s) => s.id === id) ?? SCALES[0]
}

export function getTuning(id: string): Tuning {
  return TUNINGS.find((t) => t.id === id) ?? TUNINGS[0]
}

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

// The distinct note names of the scale, spelled from the root (ascending).
export function scaleNoteNames(
  root: number,
  intervals: number[],
  useFlats: boolean,
): string[] {
  return intervals.map((i) => noteName(((root + i) % 12 + 12) % 12, useFlats))
}

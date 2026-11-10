// Scale and mode library. Pure, no React.

import { noteName } from './notes'

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

export function getScale(id: string): Scale {
  return SCALES.find((s) => s.id === id) ?? SCALES[0]
}

// The distinct note names of the scale, spelled from the root (ascending).
export function scaleNoteNames(
  root: number,
  intervals: number[],
  useFlats: boolean,
): string[] {
  return intervals.map((i) => noteName(((root + i) % 12 + 12) % 12, useFlats))
}

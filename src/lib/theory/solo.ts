// Solo generator: produces guitar solo phrases based on scale + genre rules.
// Pure, no React.

import type { Scale } from './scales'
import type { Tuning } from './tunings'

export interface SoloNote {
  semitone: number // 0-11 chromatic class
  octave: number
  string: number // string index (0 = lowest/thickest)
  fret: number
  duration: number // in beats (1 = quarter note)
  delay: number // beats from start of phrase
}

export interface GeneratedSolo {
  notes: SoloNote[]
  bars: number
  genre: string
  scale: string
  root: number
}

// ── Genre-specific style rules ──────────────────────────────────────────────

export interface GenreStyle {
  id: string
  name: string
  // Probability weights for note duration types
  durations: { beats: number; weight: number }[]
  // Target notes per bar (range)
  notesPerBar: [min: number, max: number]
  // Preferred scale degrees to target (0-indexed into scale intervals)
  preferredDegrees: number[]
  // Probability of using passing tones (chromatic approach)
  passingToneChance: number
  // Probability of repeating a note (hammer-on / hold)
  repeatChance: number
  // Pentatonic-leaning genres skip some degrees for a "bluesier" sound
  pentatonicBias: boolean
}

const GENRES: GenreStyle[] = [
  {
    id: 'blues',
    name: 'Blues',
    durations: [
      { beats: 0.5, weight: 15 },
      { beats: 0.75, weight: 10 },
      { beats: 1, weight: 25 },
      { beats: 1.5, weight: 10 },
      { beats: 2, weight: 20 },
      { beats: 3, weight: 5 },
    ],
    notesPerBar: [4, 8],
    preferredDegrees: [0, 2, 4, 3, 5, 1], // root, minor 3rd, 5th, blue note emphasized
    passingToneChance: 0.3,
    repeatChance: 0.25,
    pentatonicBias: true,
  },
  {
    id: 'rock',
    name: 'Rock',
    durations: [
      { beats: 0.25, weight: 10 },
      { beats: 0.5, weight: 20 },
      { beats: 0.75, weight: 10 },
      { beats: 1, weight: 20 },
      { beats: 1.5, weight: 10 },
      { beats: 2, weight: 15 },
    ],
    notesPerBar: [5, 10],
    preferredDegrees: [0, 2, 4, 5, 7, 1, 3], // mixolydian-ish
    passingToneChance: 0.15,
    repeatChance: 0.15,
    pentatonicBias: false,
  },
  {
    id: 'metal',
    name: 'Metal',
    durations: [
      { beats: 0.25, weight: 30 },
      { beats: 0.5, weight: 30 },
      { beats: 0.75, weight: 5 },
      { beats: 1, weight: 10 },
      { beats: 1.5, weight: 5 },
      { beats: 2, weight: 10 },
    ],
    notesPerBar: [8, 16],
    preferredDegrees: [0, 1, 3, 4, 5, 7, 2], // harmonic minor / phrygian dominant
    passingToneChance: 0.1,
    repeatChance: 0.1,
    pentatonicBias: false,
  },
  {
    id: 'jazz',
    name: 'Jazz',
    durations: [
      { beats: 0.25, weight: 15 },
      { beats: 0.5, weight: 20 },
      { beats: 0.75, weight: 20 },
      { beats: 1, weight: 15 },
      { beats: 1.5, weight: 10 },
      { beats: 2, weight: 5 },
    ],
    notesPerBar: [6, 12],
    preferredDegrees: [0, 2, 4, 5, 7, 9, 1, 3, 11], // extended harmony
    passingToneChance: 0.4,
    repeatChance: 0.05,
    pentatonicBias: false,
  },
  {
    id: 'country',
    name: 'Country',
    durations: [
      { beats: 0.5, weight: 15 },
      { beats: 0.75, weight: 10 },
      { beats: 1, weight: 25 },
      { beats: 1.5, weight: 10 },
      { beats: 2, weight: 20 },
      { beats: 3, weight: 5 },
    ],
    notesPerBar: [4, 7],
    preferredDegrees: [0, 2, 4, 5, 7, 1, 3], // major pentatonic + 6th
    passingToneChance: 0.1,
    repeatChance: 0.2,
    pentatonicBias: false,
  },
]

export function getGenre(id: string): GenreStyle {
  return GENRES.find((g) => g.id === id) ?? GENRES[0]
}

export function getGenres(): GenreStyle[] {
  return GENRES
}

// ── Weighted random selection ───────────────────────────────────────────────

function weightedRandom<T>(items: { value: T; weight: number }[]): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0)
  let r = Math.random() * total
  for (const item of items) {
    r -= item.weight
    if (r <= 0) return item.value
  }
  return items[items.length - 1].value
}

// ── Scale degree selection with genre bias ──────────────────────────────────

function selectScaleDegree(
  intervals: number[],
  preferredDegrees: number[],
  scaleDegreeIndex: number[],
  lastDegree?: number,
  passingToneChance = 0,
): { semitone: number; isPassing: boolean } {
  // Check for passing tone (chromatic approach note)
  if (Math.random() < passingToneChance && lastDegree !== undefined) {
    const lastSemitone = intervals[lastDegree]
    // Approach from above or below
    const direction = Math.random() < 0.5 ? 1 : -1
    return {
      semitone: ((lastSemitone + direction + 12) % 12),
      isPassing: true,
    }
  }

  // Weight selection by preference
  const weights = scaleDegreeIndex.map((deg) => {
    const prefIndex = preferredDegrees.indexOf(deg)
    if (prefIndex === -1) return 0.5
    return 3 - prefIndex * 0.3
  })

  const weighted = scaleDegreeIndex.map((deg, i) => ({
    value: deg,
    weight: weights[i],
  }))

  const degree = weightedRandom(weighted)
  return { semitone: intervals[degree], isPassing: false }
}

// ── Find optimal string/fret for a note ─────────────────────────────────────

function findStringAndFret(
  targetSemitone: number,
  targetOctave: number,
  tuning: Tuning,
  lastString?: number,
  maxFret: number = 12,
): { string: number; fret: number; octave: number } | null {
  const targetMidi = targetOctave * 12 + targetSemitone

  let best: { string: number; fret: number; octave: number; score: number } | null = null

  for (const [stringIdx, openSemitone] of tuning.strings.entries()) {
    // Calculate fret needed
    let fret = targetMidi - (4 * 12 + openSemitone)

    // Try adjusting octave if fret is out of range
    while (fret < 0) fret += 12
    while (fret > maxFret) fret -= 12

    if (fret < 0 || fret > maxFret) continue

    const actualMidi = 4 * 12 + openSemitone + fret
    const actualOctave = Math.floor(actualMidi / 12)

    // Score: prefer closer strings (less position shifting), lower frets
    const stringDistance = lastString !== undefined ? Math.abs(stringIdx - lastString) : 0
    const score = stringDistance * 2 + fret * 0.1

    if (!best || score < best.score) {
      best = { string: stringIdx, fret, octave: actualOctave, score }
    }
  }

  return best ? { string: best.string, fret: best.fret, octave: best.octave } : null
}

// ── Phrase structure generation ─────────────────────────────────────────────

/**
 * Generate a solo with call-and-response phrase structure.
 * Divides the total bars into 2-4 bar phrases.
 */
function generatePhraseStructure(totalBars: number): number[] {
  const phraseLengths: number[] = []
  let remaining = totalBars

  while (remaining > 0) {
    // Phrase lengths: 2, 4, or remaining
    let phraseLen = Math.min(4, remaining)
    if (remaining <= 4) {
      phraseLen = remaining
    } else if (Math.random() < 0.5 && remaining >= 4) {
      phraseLen = 2
    }
    phraseLengths.push(phraseLen)
    remaining -= phraseLen
  }

  return phraseLengths
}

// ── Main solo generator ─────────────────────────────────────────────────────

export function generateSolo(
  root: number,
  scale: Scale,
  tuning: Tuning,
  genre: GenreStyle,
  totalBars: number,
  beatsPerBar: number = 4,
): GeneratedSolo {
  const intervals = scale.intervals
  const scaleDegreeIndex = intervals.map((_, i) => i)

  // Apply pentatonic bias: reduce full scale to 5-note core
  const effectiveDegrees = genre.pentatonicBias
    ? scaleDegreeIndex.filter((_, i) => i < 5) // first 5 degrees
    : scaleDegreeIndex

  const phraseStructure = generatePhraseStructure(totalBars)

  const notes: SoloNote[] = []
  let currentBeat = 0

  for (const phraseBars of phraseStructure) {
    const phraseBeats = phraseBars * beatsPerBar

    // Generate notes for this phrase
    const targetNotes =
      Math.floor(
        Math.random() * (genre.notesPerBar[1] - genre.notesPerBar[0] + 1) +
          genre.notesPerBar[0],
      ) * phraseBars

    let phraseBeat = 0
    let lastDegree: number | undefined
    let lastString: number | undefined

    // Determine the octave range for this phrase
    // Alternate between mid and high register for variety
    const baseOctave = 4 + Math.floor(Math.random() * 2) // octave 4 or 5

    while (phraseBeat < phraseBeats && notes.filter((n) => n.delay >= currentBeat).length < targetNotes) {
      // Select duration
      const duration = weightedRandom(
        genre.durations.map((d) => ({ value: d.beats, weight: d.weight })),
      )

      // Don't exceed phrase boundary
      if (phraseBeat + duration > phraseBeats + 0.5) break

      // Check for repeated note (hammer-on style)
      let semitone: number
      let octave: number

      if (lastDegree !== undefined && Math.random() < genre.repeatChance) {
        semitone = intervals[lastDegree]
        octave = baseOctave
      } else {
        const selection = selectScaleDegree(
          intervals,
          genre.preferredDegrees,
          effectiveDegrees,
          lastDegree,
          genre.passingToneChance,
        )
        semitone = selection.semitone
        octave = baseOctave + (Math.random() < 0.2 ? 1 : 0) // occasional octave jump
        if (!selection.isPassing) {
          // Find which degree this is
          const degreeIdx = intervals.indexOf(semitone)
          if (degreeIdx !== -1) lastDegree = degreeIdx
        }
      }

      // Resolve to absolute semitone for string/fret calculation
      const absoluteSemitone = ((root + semitone) % 12 + 12) % 12

      // Find string and fret
      const position = findStringAndFret(absoluteSemitone, octave, tuning, lastString)
      if (!position) continue

      notes.push({
        semitone: absoluteSemitone,
        octave: position.octave,
        string: position.string,
        fret: position.fret,
        duration,
        delay: currentBeat + phraseBeat,
      })

      lastString = position.string
      phraseBeat += duration
    }

    currentBeat += phraseBeats
  }

  return {
    notes,
    bars: totalBars,
    genre: genre.name,
    scale: scale.name,
    root,
  }
}

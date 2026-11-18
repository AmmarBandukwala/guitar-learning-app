// Solo generator: produces guitar solo phrases based on scale + genre rules.
// Pure, no React.

import { noteName } from './notes'
import type { Scale } from './scales'
import type { Tuning } from './tunings'
import { openStringMidi } from './tunings'

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

export interface FretOptions {
  /** Previously chosen string, used to keep the hand near its last position. */
  lastString?: number
  /** Previously chosen fret, the stronger cue for staying in a position. */
  lastFret?: number
  /** Highest fret the player is willing to reach. */
  maxFret?: number
}

/**
 * Pick the string/fret that plays `targetSemitone` at `targetOctave`.
 *
 * A fret is a physical distance up the neck, so it must come from absolute
 * pitch: `fret = targetMidi - openStringMidi`. A string can only sound notes
 * at or above its own open pitch, so candidates below it (or past `maxFret`)
 * are rejected outright rather than wrapped into another octave.
 *
 * MIDI follows the `octave * 12 + semitone` convention used by the audio
 * engine, so the tab and the playback always agree.
 */
export function findStringAndFret(
  targetSemitone: number,
  targetOctave: number,
  tuning: Tuning,
  options: FretOptions = {},
): { string: number; fret: number; octave: number } | null {
  const { lastString, lastFret, maxFret = 12 } = options
  const pc = ((targetSemitone % 12) + 12) % 12
  const targetMidi = targetOctave * 12 + pc
  const openMidi = openStringMidi(tuning)

  let best: { string: number; fret: number; score: number } | null = null

  for (const [stringIdx, open] of openMidi.entries()) {
    const fret = targetMidi - open
    if (fret < 0 || fret > maxFret) continue

    // Guitarists stay in a fret *position* and move across adjacent strings,
    // rather than staying on one string. So weight hand movement up/down the
    // neck most, then a small string hop, then a mild preference for lower
    // positions. Without this the solver parks every note on a single string.
    const fretMove = lastFret !== undefined ? Math.abs(fret - lastFret) : 0
    const stringMove = lastString !== undefined ? Math.abs(stringIdx - lastString) : 0
    const score = fretMove * 1.0 + stringMove * 0.35 + fret * 0.05

    if (!best || score < best.score) {
      best = { string: stringIdx, fret, score }
    }
  }

  // `targetMidi` is built from `pc` in 0..11, so its octave is exactly the
  // octave we were asked for; returning it keeps tab and audio in lockstep.
  return best ? { string: best.string, fret: best.fret, octave: targetOctave } : null
}

// ── ASCII tab rendering ─────────────────────────────────────────────────────

/**
 * Render notes as a monospaced ASCII guitar tab, highest string first:
 *
 *     e|-------5-------|
 *     B|--5-------5----|
 *     G|---------------|
 *
 * Columns are a fixed width per beat, so horizontal position still encodes
 * rhythm, and `|` marks bar lines. Every string keeps the same column widths,
 * which is what keeps the numbers vertically aligned with when they are played.
 */
export function renderTab(
  notes: SoloNote[],
  tuning: Tuning,
  bars: number,
  beatsPerBar: number = 4,
  colsPerBeat: number = 4,
): string {
  const rows = tuning.strings.length
  const totalCols = Math.max(1, Math.round(bars * beatsPerBar * colsPerBeat))

  // grid[row][col] holds the fret text for that cell; '' means empty.
  const grid: string[][] = Array.from({ length: rows }, () =>
    new Array<string>(totalCols).fill(''),
  )

  const ordered = [...notes].sort((a, b) => a.delay - b.delay)
  for (const note of ordered) {
    if (note.string < 0 || note.string >= rows) continue
    let col = Math.min(
      totalCols - 1,
      Math.max(0, Math.round(note.delay * colsPerBeat)),
    )
    // Keep at least one separator column between fret numbers on the same
    // string. Without this, fret 12 followed by fret 10 renders as "1210",
    // which a reader cannot parse.
    const blocked = (c: number) =>
      grid[note.string][c] !== '' || (c > 0 && grid[note.string][c - 1] !== '')
    while (col < totalCols - 1 && blocked(col)) col++
    const text = String(note.fret)
    for (let i = 0; i < text.length; i++) {
      const c = col + i
      if (c < totalCols) grid[note.string][c] = text[i]
    }
  }

  const barCols = new Set<number>()
  for (let b = 1; b < bars; b++) {
    const col = Math.round(b * beatsPerBar * colsPerBeat)
    if (col < totalCols) barCols.add(col)
  }

  // Column width is driven by the widest fret number in that column.
  const widths: number[] = []
  for (let c = 0; c < totalCols; c++) {
    let w = 1
    for (let r = 0; r < rows; r++) w = Math.max(w, grid[r][c].length)
    widths.push(w)
  }

  // Highest string on top; only the very top string is spelled lowercase,
  // matching the conventional `e| B| G| D| A| E|` layout.
  const labels: string[] = []
  for (let row = 0; row < rows; row++) {
    const name = noteName(tuning.strings[row], false)
    labels.push(row === rows - 1 ? name.toLowerCase() : name)
  }
  // Sharps make a label two characters wide, so pad them all to the same
  // width or the string lines would not line up between rows.
  const labelWidth = Math.max(...labels.map((l) => l.length))

  const lines: string[] = []
  for (let row = rows - 1; row >= 0; row--) {
    let line = `${labels[row].padStart(labelWidth)}|`
    for (let c = 0; c < totalCols; c++) {
      const cell = grid[row][c]
      const width = widths[c]
      if (cell) {
        line += cell.padEnd(width, '-')
      } else {
        line += (barCols.has(c) ? '|' : '-').repeat(width)
      }
    }
    lines.push(`${line}|`)
  }

  return lines.join('\n')
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
    let lastFret: number | undefined

    // Determine the octave range for this phrase
    // Alternate between mid and high register for variety
    const baseOctave = 4 + Math.floor(Math.random() * 2) // octave 4 or 5

    while (phraseBeat < phraseBeats && notes.filter((n) => n.delay >= currentBeat).length < targetNotes) {
      // Select duration
      const rawDuration = weightedRandom(
        genre.durations.map((d) => ({ value: d.beats, weight: d.weight })),
      )

      // Stop rather than starting a note that cannot fit in the phrase, and
      // clamp the tail so a note never crosses the bar line into the next
      // phrase (that would overlap the notes the next phrase starts with).
      const remaining = phraseBeats - phraseBeat
      if (remaining <= 0 || rawDuration > remaining + 0.5) break
      const duration = Math.min(rawDuration, remaining)

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

      // Find string and fret. A register can sit above the neck (octave 5+
      // lands past fret 12 on the treble strings), so fall back to the
      // neighbouring octaves before giving up on the note entirely.
      const opts = { lastString, lastFret, maxFret: 12 }
      const position =
        findStringAndFret(absoluteSemitone, octave, tuning, opts) ??
        findStringAndFret(absoluteSemitone, octave - 1, tuning, opts) ??
        findStringAndFret(absoluteSemitone, octave + 1, tuning, opts)

      // Always consume the beat, otherwise an unplaceable note would spin this
      // loop forever without advancing `phraseBeat`.
      phraseBeat += duration
      if (!position) continue

      notes.push({
        semitone: absoluteSemitone,
        octave: position.octave,
        string: position.string,
        fret: position.fret,
        duration,
        delay: currentBeat + phraseBeat - duration,
      })

      lastString = position.string
      lastFret = position.fret
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

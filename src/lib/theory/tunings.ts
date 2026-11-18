// Guitar tunings. Pure, no React.

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
  { id: 'drop-cs', name: 'Drop C# \u2014 C# G# C# F# A# D#', strings: [1, 8, 1, 6, 10, 3] },
  { id: 'open-d', name: 'Open D \u2014 D A D F# A D', strings: [2, 9, 2, 6, 9, 2] },
  { id: 'open-g', name: 'Open G \u2014 D G D G B D', strings: [2, 7, 2, 7, 11, 2] },
  { id: 'open-a', name: 'Open A \u2014 E A E C# E A', strings: [4, 9, 4, 1, 4, 9] },
  { id: 'open-e', name: 'Open E \u2014 E B E G# B E', strings: [4, 11, 4, 8, 11, 4] },
  { id: 'open-c', name: 'Open C \u2014 C G C E G C', strings: [0, 7, 0, 4, 7, 0] },
  { id: 'dadgad', name: 'DADGAD \u2014 D A D G A D', strings: [2, 9, 2, 7, 9, 2] },
  { id: '7std', name: '7-String \u2014 A E A D G B E', strings: [9, 4, 9, 2, 7, 11, 4] },
  { id: '7dropped', name: '7-String Dropped \u2014 D A D G B E A', strings: [2, 9, 2, 7, 11, 4, 9] },
  { id: '8std', name: '8-String \u2014 E A D G C E A', strings: [4, 9, 2, 7, 0, 4, 9, 4] },
]

export function getTuning(id: string): Tuning {
  return TUNINGS.find((t) => t.id === id) ?? TUNINGS[0]
}

// `strings` only stores pitch classes, which is not enough to know where a note
// actually sits on the neck: the low E and the high E are both class 4 but 24
// frets apart. These helpers recover the absolute open-string MIDI numbers.

// The thinnest string of a guitar sits around E4 (MIDI 64). Anchoring there and
// walking downwards reproduces real register for every tuning in the list,
// including 7- and 8-string necks, without hardcoding per tuning.
const HIGHEST_STRING_ANCHOR = 64

function pitchClass(value: number): number {
  return ((value % 12) + 12) % 12
}

/** MIDI number with this pitch class nearest `anchor`. */
function nearestToAnchor(pc: number, anchor: number): number {
  let best = pc
  let bestDist = Math.abs(pc - anchor)
  for (let octave = 1; octave <= 8; octave++) {
    const midi = pc + 12 * octave
    const dist = Math.abs(midi - anchor)
    if (dist < bestDist) {
      best = midi
      bestDist = dist
    }
  }
  return best
}

/** Largest MIDI number below `limit` that belongs to pitch class `pc`. */
function largestBelow(pc: number, limit: number): number {
  return pc + 12 * Math.floor((limit - 1 - pc) / 12)
}

/**
 * Open-string MIDI numbers, lowest string first.
 *
 * The thinnest string is anchored near E4 and each thicker string takes the
 * next lower note of its own pitch class, so the result always descends the
 * way a real neck does. Standard tuning yields [40, 45, 50, 55, 59, 64]
 * = E2 A2 D3 G3 B3 E4.
 */
export function openStringMidi(tuning: Tuning): number[] {
  const result = new Array<number>(tuning.strings.length)
  let limit = Infinity

  for (let idx = tuning.strings.length - 1; idx >= 0; idx--) {
    const pc = pitchClass(tuning.strings[idx])
    const midi =
      idx === tuning.strings.length - 1
        ? nearestToAnchor(pc, HIGHEST_STRING_ANCHOR)
        : largestBelow(pc, limit)
    result[idx] = midi
    limit = midi
  }

  return result
}

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

export function getTuning(id: string): Tuning {
  return TUNINGS.find((t) => t.id === id) ?? TUNINGS[0]
}

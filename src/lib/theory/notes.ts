// Chromatic note spelling. Pure, no React.

export const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
export const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

export function noteName(semitone: number, useFlats: boolean): string {
  const n = ((semitone % 12) + 12) % 12
  return (useFlats ? FLAT_NAMES : SHARP_NAMES)[n]
}

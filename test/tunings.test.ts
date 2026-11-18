// Tuning geometry: pitch classes -> real open-string MIDI numbers.
// Run with: npm test

import assert from 'node:assert/strict'
import { TUNINGS, getTuning, openStringMidi } from '../src/lib/theory/tunings'

{
  // Standard tuning is E2 A2 D3 G3 B3 E4.
  assert.deepEqual(openStringMidi(getTuning('standard')), [40, 45, 50, 55, 59, 64])
}

{
  // Drop tunings keep the low string where guitarists actually put it.
  assert.deepEqual(openStringMidi(getTuning('dropped-d')), [38, 45, 50, 55, 59, 64])
  assert.deepEqual(openStringMidi(getTuning('drop-c')), [36, 43, 48, 53, 57, 62])
}

{
  // Every tuning must ascend and stay inside a real guitar range.
  for (const tuning of TUNINGS) {
    const midi = openStringMidi(tuning)
    assert.equal(midi.length, tuning.strings.length, `${tuning.id}: one entry per string`)
    for (let i = 1; i < midi.length; i++) {
      assert.ok(midi[i] > midi[i - 1], `${tuning.id}: strings must ascend`)
    }
    assert.ok(midi[0] >= 28 && midi[0] <= 48, `${tuning.id}: low string in range`)
    assert.ok(midi[midi.length - 1] <= 72, `${tuning.id}: high string in range`)
  }
}

{
  // Pitch classes must survive the round trip into MIDI.
  for (const tuning of TUNINGS) {
    openStringMidi(tuning).forEach((midi, i) => {
      assert.equal(midi % 12, tuning.strings[i], `${tuning.id} string ${i} keeps its pitch class`)
    })
  }
}

{
  // Tuning names advertise their open strings; the data must match the label.
  const expected: Record<string, string[]> = {
    standard: ['E', 'A', 'D', 'G', 'B', 'E'],
    'dropped-d': ['D', 'A', 'D', 'G', 'B', 'E'],
    'open-d': ['D', 'A', 'D', 'F#', 'A', 'D'],
    'open-e': ['E', 'B', 'E', 'G#', 'B', 'E'],
    'drop-cs': ['C#', 'G#', 'C#', 'F#', 'A#', 'D#'],
  }
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  for (const [id, want] of Object.entries(expected)) {
    const got = openStringMidi(getTuning(id)).map((m) => names[m % 12])
    assert.deepEqual(got, want, `${id} open strings match its name`)
  }
}

console.log('  ok  tuning geometry')

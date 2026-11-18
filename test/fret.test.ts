// Fret calculation regressions. These are the cases the modulo version got wrong.
// Run with: npm test

import assert from 'node:assert/strict'
import { getTuning, openStringMidi } from '../src/lib/theory/tunings'
import { findStringAndFret } from '../src/lib/theory/solo'

const standard = getTuning('standard')
const midi = openStringMidi(standard)

{
  // An open string is fret 0. Low E (E2) must not become fret 12 or 11.
  const pos = findStringAndFret(4, 3, standard)
  assert.ok(pos)
  assert.equal(pos.fret, 0, 'open low E is fret 0')
  assert.equal(pos.string, 0)
}

{
  // A note a semitone BELOW an open string must never wrap to fret 11.
  // F2 (octave 3, pc 5) is above the open low E (40) but below the open A
  // string (45). The old modulo math offered the A string at fret 8; the real
  // answer is the low E at fret 1.
  const pos = findStringAndFret(5, 3, standard)
  assert.ok(pos)
  assert.equal(pos.string, 0, 'F2 belongs on the low E')
  assert.equal(pos.fret, 1, 'F2 is one fret up, not a wrapped interval')
  assert.equal(midi[pos.string] + pos.fret, 3 * 12 + 5)
}

{
  // D#2 (MIDI 39) is below the open low E (40): genuinely unplayable on a
  // standard guitar, so it must be rejected rather than wrapped to fret 11.
  assert.equal(findStringAndFret(3, 3, standard), null, 'D#2 is below the neck')
}

{
  // A note needing a specific fret returns that fret, unwrapped.
  // B2 = MIDI 47 -> A string (45) = fret 2, low E (40) = fret 7.
  const pos = findStringAndFret(11, 3, standard)
  assert.ok(pos)
  assert.equal(pos.fret, 2, 'B2 is fret 2 on the A string')
  assert.equal(pos.string, 1)
}

{
  // Fret 12 must be representable at all (modulo math capped at 11).
  // A3 = MIDI 57 -> A string (45) = fret 12 exactly.
  const pos = findStringAndFret(9, 4, standard, { lastString: 1 })
  assert.ok(pos)
  assert.equal(pos.fret, 12, 'fret 12 is reachable, not wrapped to 0')
  assert.equal(pos.string, 1)
}

{
  // maxFret is respected: with a 5-fret window nothing above fret 5 is offered.
  const pos = findStringAndFret(9, 4, standard, { maxFret: 5 })
  if (pos) assert.ok(pos.fret <= 5, 'respects maxFret')
}

{
  // Exhaustive: every placement must reproduce the requested pitch exactly.
  for (let octave = 2; octave <= 6; octave++) {
    for (let pc = 0; pc < 12; pc++) {
      const pos = findStringAndFret(pc, octave, standard)
      if (!pos) continue
      const target = octave * 12 + pc
      assert.equal(
        midi[pos.string] + pos.fret,
        target,
        `pc ${pc} oct ${octave}: fret must equal the pitch delta`,
      )
      assert.ok(pos.fret >= 0 && pos.fret <= 12, `fret ${pos.fret} within the neck`)
      assert.equal(pos.octave, octave, 'reported octave matches the pitch played')
    }
  }
}

{
  // Notes below the whole neck return null instead of a fabricated fret.
  assert.equal(findStringAndFret(0, 1, standard), null, 'C below the low E is unplayable')
  assert.equal(findStringAndFret(11, 0, standard), null, 'far below the neck is unplayable')
}

{
  // Works for non-standard tunings too: every answer is a real position.
  for (const id of ['dropped-d', 'drop-c', 'open-d', 'open-g', 'dadgad', '7std', '8std']) {
    const tuning = getTuning(id)
    const open = openStringMidi(tuning)
    for (let octave = 3; octave <= 5; octave++) {
      for (let pc = 0; pc < 12; pc++) {
        const pos = findStringAndFret(pc, octave, tuning)
        if (!pos) continue
        assert.equal(
          open[pos.string] + pos.fret,
          octave * 12 + pc,
          `${id} pc ${pc} oct ${octave} lands on the right pitch`,
        )
      }
    }
  }
}

{
  // Hand preference: with lastString set, the solver stays nearby when it can.
  // G4 = MIDI 67 is reachable at fret 12 (string 3), 8 (string 4) or 3 (string 5).
  // With no history it takes the lowest fret; coming from string 3 it should
  // stay put rather than leaping across the neck.
  const free = findStringAndFret(7, 5, standard)
  assert.ok(free)
  assert.equal(free.string, 5, 'no history: picks the lowest fret')
  assert.equal(free.fret, 3)

  const staying = findStringAndFret(7, 5, standard, { lastString: 3, lastFret: 12 })
  assert.ok(staying)
  assert.equal(staying.string, 3, 'keeps the hand in position instead of leaping')
  assert.equal(staying.fret, 12)
}

console.log('  ok  fret calculation')

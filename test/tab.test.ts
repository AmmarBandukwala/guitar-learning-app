// ASCII tab rendering + generated-solo invariants.
// Run with: npm test

import assert from 'node:assert/strict'
import { getTuning, openStringMidi } from '../src/lib/theory/tunings'
import { getScale } from '../src/lib/theory/scales'
import { generateSolo, getGenre, getGenres, renderTab } from '../src/lib/theory/solo'

const standard = getTuning('standard')

// ── renderTab ───────────────────────────────────────────────────────────────

{
  const tab = renderTab(
    [
      { semitone: 4, octave: 4, string: 5, fret: 5, duration: 1, delay: 0 },
      { semitone: 7, octave: 4, string: 1, fret: 5, duration: 1, delay: 1 },
    ],
    standard,
    1,
  )
  const lines = tab.split('\n')

  assert.equal(lines.length, 6, 'six string rows')
  // Highest string on top with conventional labels.
  assert.deepEqual(
    lines.map((l) => l[0]),
    ['e', 'B', 'G', 'D', 'A', 'E'],
    'e| B| G| D| A| E| layout',
  )
  assert.equal(new Set(lines.map((l) => l.length)).size, 1, 'rows stay aligned')
  assert.ok(lines[0].startsWith('e|'), 'top row is the high e string')
  assert.ok(lines[0].includes('5'), 'fret 5 appears on the high e row')
  assert.ok(lines[4].includes('5'), 'fret 5 appears on the A row')
  // The B row (index 1) must not carry the note that belongs to the high e.
  assert.ok(!lines[1].includes('5'), 'notes do not bleed onto neighbouring strings')
}

{
  // Two-digit frets must not shift the other rows out of alignment.
  const tab = renderTab(
    [
      { semitone: 4, octave: 4, string: 5, fret: 12, duration: 1, delay: 0 },
      { semitone: 4, octave: 3, string: 0, fret: 0, duration: 1, delay: 2 },
    ],
    standard,
    1,
  )
  const lines = tab.split('\n')
  assert.equal(new Set(lines.map((l) => l.length)).size, 1, 'two-digit frets keep rows aligned')
  assert.ok(lines[0].includes('12'), 'fret 12 rendered in full')
  assert.ok(lines[5].includes('0'), 'open string rendered as 0')
}

{
  // Bar lines separate bars.
  const rows = renderTab([], standard, 2).split('\n')
  assert.ok(rows[0].split('|').length >= 4, 'an interior bar line is drawn')
}

{
  // Rhythm is preserved: a later note sits further right.
  const tab = renderTab(
    [
      { semitone: 4, octave: 4, string: 5, fret: 3, duration: 1, delay: 0 },
      { semitone: 4, octave: 4, string: 5, fret: 7, duration: 1, delay: 3 },
    ],
    standard,
    1,
  )
  const row = tab.split('\n')[0]
  assert.ok(row.indexOf('3') < row.indexOf('7'), 'notes render in time order')
}

// ── generateSolo ────────────────────────────────────────────────────────────

{
  // Every generated note must be physically consistent with its string/fret,
  // and the tab must be renderable. Runs many times because generation is
  // randomised; a single bad octave would show up quickly.
  const scale = getScale('minor-pentatonic')
  const tunings = ['standard', 'dropped-d', 'drop-c', 'open-d', '7std'].map(getTuning)

  for (const tuning of tunings) {
    const open = openStringMidi(tuning)
    for (const genre of getGenres()) {
      for (let run = 0; run < 12; run++) {
        const solo = generateSolo(4, scale, tuning, getGenre(genre.id), 8)
        assert.ok(solo.notes.length > 0, `${tuning.id}/${genre.id} produced notes`)

        for (const n of solo.notes) {
          const played = open[n.string] + n.fret
          assert.equal(played % 12, n.semitone, 'fret/string sounds the notated pitch class')
          assert.equal(Math.floor(played / 12), n.octave, 'notated octave matches the fret')
          assert.ok(n.fret >= 0 && n.fret <= 12, `fret ${n.fret} out of neck range`)
          assert.ok(n.delay >= 0, 'delay is non-negative')
          assert.ok(n.duration > 0, 'duration is positive')
        }

        // No overlapping notes on the same string.
        const busyUntil = new Map<number, number>()
        for (const n of [...solo.notes].sort((a, b) => a.delay - b.delay)) {
          const prev = busyUntil.get(n.string)
          assert.ok(prev === undefined || n.delay >= prev - 1e-9, 'no overlap on one string')
          busyUntil.set(n.string, n.delay + n.duration)
        }

        // Tab renders without throwing and keeps every row the same width.
        const widths = new Set(renderTab(solo.notes, tuning, solo.bars).split('\n').map((l) => l.length))
        assert.equal(widths.size, 1, 'generated tab rows are aligned')
      }
    }
  }
}

{
  // A solo should use the neck, not one string. This is what regressed when
  // the score over-rewarded "same string as last note".
  const scale = getScale('minor-pentatonic')
  const tuning = getTuning('standard')
  let sawSpread = false
  for (let run = 0; run < 20 && !sawSpread; run++) {
    const solo = generateSolo(4, scale, tuning, getGenre('rock'), 8)
    const distinct = new Set(solo.notes.map((n) => n.string))
    if (distinct.size >= 3) sawSpread = true
  }
  assert.ok(sawSpread, 'solos should span several strings, not sit on one')
}

console.log('  ok  tab rendering + solo generation')

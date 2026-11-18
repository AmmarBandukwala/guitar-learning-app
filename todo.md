# Guitar Scale Finder - Solo Generator Fixes

## Status: fixed

### Root cause
`Tuning.strings` stores **pitch classes only** (`[4, 9, 2, 7, 11, 4]` for standard),
with no octave. A fret is a physical distance up the neck, so it cannot be derived
from pitch classes alone.

- The original code assumed every open string sat at `4 * 12 + openSemitone`, which
  is only true for the high E. The low E is MIDI 40, not 64.
- The follow-up attempt `fret = (target - open + 12) % 12` was worse: it discarded
  the octave entirely, could never express frets above 11, and wrapped notes lying
  *below* an open string up to fret 11.

### Fix
1. `tunings.ts` - new `openStringMidi(tuning)` recovers absolute open-string MIDI
   by anchoring the thinnest string near E4 and walking downwards. This reproduces
   real register for every tuning: standard `E2 A2 D3 G3 B3 E4`, 7-string `A1...E4`,
   8-string `E1...E4`.
2. `solo.ts` - `findStringAndFret` now uses `fret = targetMidi - openMidi` and
   rejects candidates below the open string or past `maxFret` instead of wrapping.
   Exported for testing.
3. `solo.ts` - placement scores fret *position* (hand movement across the neck)
   rather than "same string", so lines spread across strings like real playing.
4. `solo.ts` - added `renderTab()`, a plain-text tab renderer (`e| B| G| D| A| E|`)
   with bar lines, rhythm-aligned columns and padded labels.
5. `SoloGenerator.tsx` - Tab/Grid view toggle plus a "Copy tab" button.

### Bugs found along the way
- `open-e` tuning listed `C#` (1) where its name says `G#` -> corrected to 8.
- `drop-cs` tuning listed `F` (5) where its name says `F#` -> corrected to 6.
- Notes could overrun a phrase boundary by 0.5 beats, overlapping the next
  phrase's notes. Now clamped to the bar line.
- An unplaceable note hit `continue` without advancing `phraseBeat`, which could
  spin the generation loop forever. The beat is now always consumed.

## Verification
- `npm test` - 3 suites: tuning geometry, fret calculation, tab rendering +
  solo generation. Includes exhaustive checks that every returned position
  reproduces the requested pitch exactly, across all tunings and octaves.
- `npm run build` and `npm run lint` both clean.
- `npm run demo:tab` prints a rendered tab for manual inspection.

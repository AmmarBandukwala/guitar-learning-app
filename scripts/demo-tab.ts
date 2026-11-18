import { getTuning, openStringMidi } from '../src/lib/theory/tunings'
import { getScale } from '../src/lib/theory/scales'
import { generateSolo, getGenre, renderTab } from '../src/lib/theory/solo'

const tuning = getTuning('standard')
console.log('open strings MIDI:', openStringMidi(tuning).join(', '))
const solo = generateSolo(4, getScale('minor-pentatonic'), tuning, getGenre('blues'), 2)
console.log('\nA minor pentatonic blues lick, standard tuning, 2 bars:\n')
console.log(renderTab(solo.notes, tuning, 2))
console.log('\nnotes (string index 0 = low E):')
const open = openStringMidi(tuning)
for (const n of solo.notes.slice(0, 8)) {
  console.log(`  beat ${n.delay.toFixed(2)}  string ${n.string}  fret ${n.fret}  -> MIDI ${open[n.string] + n.fret}`)
}

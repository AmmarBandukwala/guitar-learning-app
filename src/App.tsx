import { useMemo } from 'react'
import ControlPanel from './components/ControlPanel'
import Fretboard from './components/Fretboard'
import ScaleLegend from './components/ScaleLegend'
import SoloGenerator from './components/SoloGenerator'
import { useNotePlayer } from './hooks/useNotePlayer'
import { useSettings } from './hooks/useSettings'
import { buildFretboard, getScale, getTuning, scaleNoteNames } from './lib/theory'
import './App.css'

export default function App() {
  const { settings, updateSettings, resetSettings } = useSettings()
  const playNote = useNotePlayer()

  const scale = getScale(settings.scaleId)
  const tuning = getTuning(settings.tuningId)
  const model = useMemo(
    () => buildFretboard(settings, scale, tuning),
    [settings, scale, tuning],
  )
  const noteNames = scaleNoteNames(settings.root, scale.intervals, settings.useFlats)

  return (
    <div className="app">
      <header className="app-header">
        <h1>Guitar Fretboard</h1>
        <p className="subtitle">
          {scale.name} on {tuning.name.split(' \u2014 ')[1] ?? tuning.name} ·{' '}
          {settings.handed === 'left' ? 'left-handed' : 'right-handed'}
        </p>
      </header>

      <ControlPanel settings={settings} onChange={updateSettings} onReset={resetSettings} />

      <SoloGenerator
        root={settings.root}
        scaleId={settings.scaleId}
        tuningId={settings.tuningId}
        useFlats={settings.useFlats}
      />

      <main className="board-wrap">
        <Fretboard
          model={model}
          handed={settings.handed}
          useFlats={settings.useFlats}
          muteNonScale={settings.muteNonScale}
          soundEnabled={settings.sound}
          onPlay={playNote}
        />
        <ScaleLegend
          noteNames={noteNames}
          showNonScale={!settings.muteNonScale}
          soundEnabled={settings.sound}
        />
      </main>
    </div>
  )
}

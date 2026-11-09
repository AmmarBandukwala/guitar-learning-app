import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  DEFAULT_SETTINGS,
  buildFretboard,
  getScale,
  getTuning,
  scaleNoteNames,
  maxStartFret,
  type Settings,
} from './theory'
import Controls from './Controls'
import Fretboard from './Fretboard'
import './App.css'

const STORAGE_KEY = 'guitar:settings'

function sanitize(partial: Partial<Settings>): Settings {
  const merged = { ...DEFAULT_SETTINGS, ...partial }
  merged.startFret = Math.min(Math.max(0, merged.startFret), maxStartFret(merged.frets))
  return merged
}

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return sanitize(JSON.parse(raw) as Partial<Settings>)
  } catch {
    // ignore malformed storage
  }
  return DEFAULT_SETTINGS
}

export default function App() {
  const [settings, setSettings] = useState<Settings>(loadSettings)

  const onChange = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => sanitize({ ...prev, ...patch }))
  }, [])

  const onReset = useCallback(() => setSettings(DEFAULT_SETTINGS), [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // storage may be unavailable (private mode) — non-fatal
    }
  }, [settings])

  const scale = getScale(settings.scaleId)
  const tuning = getTuning(settings.tuningId)
  const model = useMemo(
    () => buildFretboard(settings, scale, tuning),
    [settings, scale, tuning],
  )

  // Web Audio "pluck" on dot click.
  const ctxRef = useRef<AudioContext | null>(null)
  const playNote = useCallback((semitone: number) => {
    let ctx = ctxRef.current
    if (!ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      if (!Ctor) return
      ctx = new Ctor()
      ctxRef.current = ctx
    }
    if (ctx.state === 'suspended') void ctx.resume()
    const now = ctx.currentTime
    const freq = 440 * Math.pow(2, (semitone - 9) / 12) // A4 = 440Hz
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(freq, now)
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.35, now + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 1.7)
  }, [])

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

      <Controls settings={settings} onChange={onChange} onReset={onReset} />

      <main className="board-wrap">
        <Fretboard
          model={model}
          handed={settings.handed}
          useFlats={settings.useFlats}
          muteNonScale={settings.muteNonScale}
          soundEnabled={settings.sound}
          onPlay={playNote}
        />
        <div className="board-footer">
          <div className="scale-notes" aria-label="Scale notes">
            {noteNames.map((name, i) => (
              <span
                key={`${name}-${i}`}
                className={`note-chip ${i === 0 ? 'is-root' : ''}`}
              >
                {name}
              </span>
            ))}
          </div>
          <div className="legend">
            <span className="legend-item">
              <span className="dot dot-root" /> Root
            </span>
            <span className="legend-item">
              <span className="dot dot-scale" /> Scale
            </span>
            {!settings.muteNonScale && (
              <span className="legend-item">
                <span className="dot dot-non" /> Non-scale
              </span>
            )}
            {settings.sound && <span className="hint">Tip: click a note to hear it</span>}
          </div>
        </div>
      </main>
    </div>
  )
}

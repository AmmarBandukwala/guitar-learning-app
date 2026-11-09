import {
  SCALES,
  TUNINGS,
  SHARP,
  FLAT,
  maxStartFret,
  type Settings,
} from './theory'

interface Props {
  settings: Settings
  onChange: (patch: Partial<Settings>) => void
  onReset: () => void
}

const FRET_OPTIONS = [12, 15, 24]

export default function Controls({ settings, onChange, onReset }: Props) {
  const roots = (settings.useFlats ? FLAT : SHARP)

  // Group scales by their category, preserving declaration order.
  const grouped = SCALES.reduce<Record<string, typeof SCALES>>((acc, s) => {
    const list = acc[s.category] ?? []
    list.push(s)
    acc[s.category] = list
    return acc
  }, {})

  const startMax = maxStartFret(settings.frets)

  return (
    <div className="controls">
      <section className="control-group">
        <label className="control-label">Root</label>
        <div className="root-grid">
          {roots.map((name, i) => (
            <button
              key={`${name}-${i}`}
              className={`chip ${settings.root === i ? 'is-active' : ''}`}
              onClick={() => onChange({ root: i })}
            >
              {name}
            </button>
          ))}
        </div>
      </section>

      <section className="control-group">
        <label className="control-label" htmlFor="scale">
          Scale / Mode
        </label>
        <select
          id="scale"
          className="select"
          value={settings.scaleId}
          onChange={(e) => onChange({ scaleId: e.target.value })}
        >
          {Object.entries(grouped).map(([category, list]) => (
            <optgroup key={category} label={category}>
              {list.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </section>

      <section className="control-group">
        <label className="control-label" htmlFor="tuning">
          Tuning
        </label>
        <select
          id="tuning"
          className="select"
          value={settings.tuningId}
          onChange={(e) => onChange({ tuningId: e.target.value })}
        >
          {TUNINGS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </section>

      <section className="control-group control-inline">
        <div>
          <label className="control-label">Handedness</label>
          <div className="segmented">
            <button
              className={settings.handed === 'right' ? 'is-active' : ''}
              onClick={() => onChange({ handed: 'right' })}
            >
              R
            </button>
            <button
              className={settings.handed === 'left' ? 'is-active' : ''}
              onClick={() => onChange({ handed: 'left' })}
            >
              L
            </button>
          </div>
        </div>

        <div>
          <label className="control-label">Frets</label>
          <div className="segmented">
            {FRET_OPTIONS.map((f) => (
              <button
                key={f}
                className={settings.frets === f ? 'is-active' : ''}
                onClick={() => onChange({ frets: f, startFret: Math.min(settings.startFret, maxStartFret(f)) })}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="control-label">
            Position · fret {settings.startFret}
          </label>
          <input
            type="range"
            min={0}
            max={startMax}
            value={settings.startFret}
            onChange={(e) => onChange({ startFret: Number(e.target.value) })}
            aria-label="Start fret"
          />
        </div>
      </section>

      <section className="control-group control-inline">
        <label className="switch">
          <input
            type="checkbox"
            checked={settings.useFlats}
            onChange={(e) => onChange({ useFlats: e.target.checked })}
          />
          Flat names
        </label>
        <label className="switch">
          <input
            type="checkbox"
            checked={settings.muteNonScale}
            onChange={(e) => onChange({ muteNonScale: e.target.checked })}
          />
          Hide non-scale
        </label>
        <label className="switch">
          <input
            type="checkbox"
            checked={settings.sound}
            onChange={(e) => onChange({ sound: e.target.checked })}
          />
          Sound
        </label>
        <button className="reset" onClick={onReset}>
          Reset
        </button>
      </section>
    </div>
  )
}

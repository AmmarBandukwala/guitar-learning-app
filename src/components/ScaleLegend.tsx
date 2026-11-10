import './ScaleLegend.css'

interface Props {
  noteNames: string[]
  showNonScale: boolean
  soundEnabled: boolean
}

// Scale note chips + dot legend shown under the fretboard.
export default function ScaleLegend({ noteNames, showNonScale, soundEnabled }: Props) {
  return (
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
        {showNonScale && (
          <span className="legend-item">
            <span className="dot dot-non" /> Non-scale
          </span>
        )}
        {soundEnabled && <span className="hint">Tip: click a note to hear it</span>}
      </div>
    </div>
  )
}

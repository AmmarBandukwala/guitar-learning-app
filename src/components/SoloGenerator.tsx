import { useMemo, useState } from 'react'
import { getScale, getTuning, noteName } from '../lib/theory'
import { useSoloGenerator } from '../hooks/useSoloGenerator'
import './SoloGenerator.css'

interface Props {
  root: number
  scaleId: string
  tuningId: string
  useFlats: boolean
}

const BAR_OPTIONS = [8, 12, 16, 24, 32]
const BEATS_PER_BAR = 4
const BEAT_WIDTH = 36 // pixels per beat

/** Format fret numbers for tab: 0 = open, numbered frets for pressed notes */
function formatFret(fret: number): string {
  return String(fret)
}

export default function SoloGenerator({ root, scaleId, tuningId, useFlats }: Props) {
  const scale = useMemo(() => getScale(scaleId), [scaleId])
  const tuning = useMemo(() => getTuning(tuningId), [tuningId])
  const [isExpanded, setIsExpanded] = useState(false)

  const {
    state,
    genres,
    generatedSolo,
    isPlaying,
    generate,
    play,
    stop,
    updateState,
  } = useSoloGenerator(root, scale, tuning)

  // Build tab rendering data
  const tabData = useMemo(() => {
    if (!generatedSolo) return null

    const strings = tuning.strings.slice().reverse() // high E (top) first for display
    const totalBars = generatedSolo.bars

    // For each string, get all notes
    const stringData = strings.map((open, displayIdx) => {
      const stringIdx = strings.length - 1 - displayIdx // map back to tuning index
      const stringNotes = generatedSolo.notes.filter((n) => n.string === stringIdx)
      const stringNoteName = noteName(open, useFlats).toUpperCase()

      return {
        name: stringNoteName,
        frets: stringNotes.map((n) => ({
          fret: n.fret,
          semitone: n.semitone,
          time: n.delay, // start time in beats
          duration: n.duration,
          isRoot: n.semitone === root,
          display: formatFret(n.fret),
        })),
      }
    })

    return {
      strings: stringData,
      totalBars,
      noteName: (s: number) => noteName(s, useFlats),
    }
  }, [generatedSolo, root, tuning.strings, useFlats])

  return (
    <div className={`solo-generator ${isExpanded ? 'is-expanded' : ''}`}>
      <div className="solo-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h2>Solo Generator</h2>
        <span className="solo-toggle">{isExpanded ? '▾' : '▸'}</span>
      </div>

      {isExpanded && (
        <div className="solo-content">
          <div className="solo-controls">
            <div className="solo-control-group">
              <label className="control-label" htmlFor="solo-genre">Genre</label>
              <select
                id="solo-genre"
                className="select"
                value={state.genreId}
                onChange={(e) => updateState({ genreId: e.target.value })}
              >
                {genres.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="solo-control-group">
              <label className="control-label">Bars</label>
              <div className="segmented">
                {BAR_OPTIONS.map((b) => (
                  <button
                    key={b}
                    className={state.totalBars === b ? 'is-active' : ''}
                    onClick={() => updateState({ totalBars: b })}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <div className="solo-control-group">
              <label className="control-label" htmlFor="solo-tempo">
                Tempo: {state.tempo} BPM
              </label>
              <input
                id="solo-tempo"
                type="range"
                min={60}
                max={200}
                value={state.tempo}
                onChange={(e) => updateState({ tempo: Number(e.target.value) })}
              />
            </div>

            <div className="solo-actions">
              <button className="btn-generate" onClick={generate}>
                Generate Solo
              </button>
              {generatedSolo && (
                <>
                  {isPlaying ? (
                    <button className="btn-stop" onClick={stop}>
                      ■ Stop
                    </button>
                  ) : (
                    <button className="btn-play" onClick={play}>
                      ▶ Play
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* TAB chart area */}
          <div className="tab-section">
            {!generatedSolo ? (
              <p className="solo-empty">Click "Generate Solo" to create a guitar solo.</p>
            ) : (
              <TabChart data={tabData!} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tab Chart Component ──────────────────────────────────────────────────────

interface TabStringNote {
  fret: number
  semitone: number
  time: number
  duration: number
  isRoot: boolean
  display: string
}

interface TabString {
  name: string
  frets: TabStringNote[]
}

interface TabData {
  strings: TabString[]
  totalBars: number
  noteName: (s: number) => string
}

function TabChart({ data }: { data: TabData }) {
  const { strings, totalBars, noteName } = data
  const totalWidth = totalBars * BEATS_PER_BAR

  return (
    <div className="tab-container">
      <div className="tab-head">
        <span className="tab-head-label" />
        <span className="tab-head-info">{totalBars} bars · {strings.length} strings</span>
      </div>

      <div className="tab-scroll" style={{ overflowX: 'auto' }}>
        <div className="tab-board" style={{ width: `${(totalWidth + 2) * BEAT_WIDTH}px` }}>
          {/* Strings: top line = high E, bottom line = low E */}
          {strings.map((str, sIdx) => (
            <div className="tab-str-row" key={sIdx}>
              <span className="tab-str-label">{str.name}</span>
              <div className="tab-str-line" style={{ width: `${totalWidth * BEAT_WIDTH}px` }}>
                {/* Bar lines */}
                {Array.from({ length: totalBars + 1 }, (_, b) => (
                  <div
                    key={`bar-${b}`}
                    className={`tab-bar ${b === 0 ? 'is-open' : ''}`}
                    style={{ left: `${b * BEATS_PER_BAR * BEAT_WIDTH}px` }}
                  />
                ))}

                {/* Notes positioned by time on their string */}
                {str.frets.map((note, idx) => {
                  const left = note.time * BEAT_WIDTH
                  const width = Math.max(note.duration * BEAT_WIDTH - 4, 20)

                  return (
                    <div
                      key={idx}
                      className={`tab-fret-num ${note.isRoot ? 'is-root' : ''}`}
                      style={{ left: `${left}px`, width: `${width}px` }}
                      title={`${noteName(note.semitone)} string ${str.name}`}
                    >
                      {note.display}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Time markers */}
          <div className="tab-time-line" style={{ width: `${totalWidth * BEAT_WIDTH}px` }}>
            {Array.from({ length: totalBars + 1 }, (_, b) => (
              <span key={b} className="tab-time-mark" style={{ left: `${b * BEATS_PER_BAR * BEAT_WIDTH}px` }}>
                {b + 1}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
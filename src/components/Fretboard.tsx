import { noteName, type FretboardModel, type Handed } from '../lib/theory'
import './Fretboard.css'

interface Props {
  model: FretboardModel
  handed: Handed
  useFlats: boolean
  muteNonScale: boolean
  soundEnabled: boolean
  onPlay?: (semitone: number) => void
}

const COLORS = {
  root: '#38bdf8',
  rootText: '#04283b',
  scale: '#e2e8f0',
  scaleText: '#0f172a',
  non: 'rgba(148,163,184,0.35)',
  string: 'rgba(226,232,240,0.85)',
  fret: 'rgba(148,163,184,0.45)',
  nut: '#e2e8f0',
  inlay: 'rgba(226,232,240,0.12)',
  label: '#94a3b8',
}

const SINGLE_INLAYS = new Set([3, 5, 7, 9, 15, 17, 19, 21])
const DOUBLE_INLAYS = new Set([12, 24])

export default function Fretboard({
  model,
  handed,
  useFlats,
  muteNonScale,
  soundEnabled,
  onPlay,
}: Props) {
  const { columns, rows, notes } = model
  const isLeft = handed === 'left'

  const cellW = Math.max(30, Math.round(820 / columns.length))
  const stringH = 34
  const topPad = 24
  const bottomPad = 24
  const sidePad = 44
  const boardW = columns.length * cellW
  const boardH = rows * stringH
  const width = sidePad + boardW + sidePad
  const height = topPad + boardH + bottomPad

  const nutX = isLeft ? sidePad + boardW : sidePad
  const boardTop = topPad
  const boardBottom = topPad + boardH

  // Left edge of the cell for column c (handedness-aware).
  const colLeft = (c: number) =>
    isLeft ? sidePad + boardW - (c + 1) * cellW : sidePad + c * cellW
  const dotX = (fret: number, c: number) => (fret === 0 ? nutX : colLeft(c) + cellW / 2)
  // String 0 (lowest) renders at the bottom for right-handed, top for left-handed.
  const rowOf = (stringIdx: number) => (isLeft ? stringIdx : rows - 1 - stringIdx)
  const dotY = (stringIdx: number) => boardTop + rowOf(stringIdx) * stringH + stringH / 2

  const columnIndex = new Map(columns.map((f, c) => [f, c]))

  const r = Math.min(cellW, stringH) / 2 - 3

  const inlays = columns
    .map((f, c) => ({ f, c }))
    .filter(({ f }) => SINGLE_INLAYS.has(f) || DOUBLE_INLAYS.has(f))

  const labelX = isLeft ? nutX + 14 : nutX - 14
  const labelAnchor = isLeft ? 'start' : 'end'

  return (
    <svg
      className="fretboard"
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Guitar fretboard diagram"
    >
      <defs>
        <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b2c1c" />
          <stop offset="100%" stopColor="#241a10" />
        </linearGradient>
      </defs>

      {/* Board face */}
      <rect
        x={sidePad}
        y={boardTop}
        width={boardW}
        height={boardH}
        fill="url(#wood)"
        rx={4}
      />

      {/* Inlays */}
      {inlays.map(({ f, c }) => {
        const x = colLeft(c) + cellW / 2
        if (DOUBLE_INLAYS.has(f)) {
          return (
            <g key={`inlay-${f}`}>
              <circle cx={x} cy={boardTop + boardH / 4} r={5} fill={COLORS.inlay} />
              <circle cx={x} cy={boardTop + (boardH * 3) / 4} r={5} fill={COLORS.inlay} />
            </g>
          )
        }
        return <circle key={`inlay-${f}`} cx={x} cy={boardTop + boardH / 2} r={5} fill={COLORS.inlay} />
      })}

      {/* Strings */}
      {Array.from({ length: rows }, (_, i) => (
        <line
          key={`string-${i}`}
          x1={sidePad}
          y1={boardTop + i * stringH + stringH / 2}
          x2={sidePad + boardW}
          y2={boardTop + i * stringH + stringH / 2}
          stroke={COLORS.string}
          strokeWidth={1 + i * 0.12}
        />
      ))}

      {/* Frets */}
      {Array.from({ length: columns.length + 1 }, (_, k) => {
        const x = isLeft ? sidePad + boardW - k * cellW : sidePad + k * cellW
        const isNut = k === 0
        return (
          <line
            key={`fret-${k}`}
            x1={x}
            y1={boardTop}
            x2={x}
            y2={boardBottom}
            stroke={isNut ? COLORS.nut : COLORS.fret}
            strokeWidth={isNut ? 4 : 1}
          />
        )
      })}

      {/* String labels at the nut */}
      {model.notes
        .filter((n) => n.fret === 0)
        .map((n) => (
          <text
            key={`label-${n.string}`}
            x={labelX}
            y={dotY(n.string) + 4}
            textAnchor={labelAnchor}
            className="fb-label"
            fill={COLORS.label}
          >
            {noteName(n.semitone, useFlats)}
          </text>
        ))}

      {/* Fret numbers */}
      {columns.map((f, c) => (
        <text
          key={`num-${f}`}
          x={colLeft(c) + cellW / 2}
          y={boardBottom + 18}
          textAnchor="middle"
          className="fb-num"
          fill={COLORS.label}
        >
          {f === 0 ? '0' : f}
        </text>
      ))}

      {/* Notes */}
      {notes.map((n) => {
        const visible = n.inScale || !muteNonScale
        if (!visible) return null
        const c = columnIndex.get(n.fret)
        if (c === undefined) return null
        const x = dotX(n.fret, c)
        const y = dotY(n.string)

        if (!n.inScale) {
          return <circle key={`n-${n.string}-${n.fret}`} cx={x} cy={y} r={5} fill={COLORS.non} />
        }

        const isOpen = n.fret === 0
        const fill = n.isRoot ? COLORS.root : COLORS.scale
        const textColor = n.isRoot ? COLORS.rootText : COLORS.scaleText
        const twoChars = n.name.length > 1
        return (
          <g
            key={`n-${n.string}-${n.fret}`}
            className="fb-note"
            style={{ cursor: soundEnabled && onPlay ? 'pointer' : 'default' }}
            onClick={
              soundEnabled && onPlay ? () => onPlay(n.semitone) : undefined
            }
          >
            <circle cx={x} cy={y} r={r} fill={fill} />
            {isOpen && <circle cx={x} cy={y} r={r + 3} fill="none" stroke={fill} strokeWidth={1.5} />}
            <text
              x={x}
              y={y + (twoChars ? 3.5 : 4.5)}
              textAnchor="middle"
              className="fb-note-text"
              fontSize={twoChars ? r * 0.95 : r * 1.1}
              fill={textColor}
            >
              {n.name}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

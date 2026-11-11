// Solo playback engine: sequences notes through Web Audio with guitar-like timbre.

export interface SoloPlayer {
  play(soloNotes: SoloNoteSequence[], tempo: number): void
  stop(): void
  dispose(): void
}

export interface SoloNoteSequence {
  semitone: number
  octave: number
  duration: number
  delay: number
}

function resolveAudioContext(): typeof AudioContext | undefined {
  if (typeof window.AudioContext !== 'undefined') return window.AudioContext
  return (window as unknown as { webkitAudioContext?: typeof AudioContext })
    .webkitAudioContext
}

export function createSoloPlayer(): SoloPlayer {
  let ctx: AudioContext | null = null
  let scheduledNodes: { osc: OscillatorNode; gain: GainNode }[] = []
  let timeoutIds: number[] = []

  function getCtx(): AudioContext {
    if (!ctx) {
      const Ctor = resolveAudioContext()
      if (!Ctor) throw new Error('Web Audio API not available')
      ctx = new Ctor()
    }
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  }

  function playNoteSequenced(
    audioCtx: AudioContext,
    semitone: number,
    octave: number,
    durationBeats: number,
    delayBeats: number,
    tempo: number,
  ) {
    const secondsPerBeat = 60 / tempo
    const startTime = audioCtx.currentTime + delayBeats * secondsPerBeat
    const durationSeconds = durationBeats * secondsPerBeat

    // MIDI number for frequency calculation
    const midi = octave * 12 + semitone
    const freq = 440 * Math.pow(2, (midi - 69) / 12)

    // Guitar-like synthesis: mix of triangle + saw for body
    const osc1 = audioCtx.createOscillator()
    const osc2 = audioCtx.createOscillator()
    const gain1 = audioCtx.createGain()
    const gain2 = audioCtx.createGain()
    const masterGain = audioCtx.createGain()

    osc1.type = 'triangle'
    osc2.type = 'sawtooth'
    osc1.frequency.setValueAtTime(freq, startTime)
    osc2.frequency.setValueAtTime(freq, startTime)

    // Slight detune for richness
    osc2.detune.setValueAtTime(3, startTime)

    gain1.gain.setValueAtTime(0.25, startTime)
    gain2.gain.setValueAtTime(0.08, startTime)

    // Amp envelope: fast attack, quick decay, sustain, release
    masterGain.gain.setValueAtTime(0, startTime)
    masterGain.gain.linearRampToValueAtTime(0.4, startTime + 0.005)
    masterGain.gain.exponentialRampToValueAtTime(0.2, startTime + durationSeconds * 0.3)
    masterGain.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSeconds)

    osc1.connect(gain1)
    osc2.connect(gain2)
    gain1.connect(masterGain)
    gain2.connect(masterGain)
    masterGain.connect(audioCtx.destination)

    osc1.start(startTime)
    osc2.start(startTime)
    osc1.stop(startTime + durationSeconds + 0.05)
    osc2.stop(startTime + durationSeconds + 0.05)

    scheduledNodes.push(
      { osc: osc1, gain: gain1 },
      { osc: osc2, gain: gain2 },
    )
  }

  return {
    play(soloNotes, tempo) {
      this.stop()
      const audioCtx = getCtx()

      for (const note of soloNotes) {
        playNoteSequenced(
          audioCtx,
          note.semitone,
          note.octave,
          note.duration,
          note.delay,
          tempo,
        )
      }

      // Calculate total duration for cleanup
      const lastNote = soloNotes[soloNotes.length - 1]
      const totalDuration = (lastNote.delay + lastNote.duration) * (60 / tempo) + 0.5
      const timeoutId = setTimeout(() => {
        timeoutIds = timeoutIds.filter((id) => id !== timeoutId)
      }, totalDuration * 1000)
      timeoutIds.push(timeoutId)
    },

    stop() {
      for (const node of scheduledNodes) {
        try {
          node.osc.stop()
          node.osc.disconnect()
          node.gain.disconnect()
        } catch {
          // already stopped
        }
      }
      scheduledNodes = []
      for (const id of timeoutIds) {
        clearTimeout(id)
      }
      timeoutIds = []
    },

    dispose() {
      this.stop()
      ctx?.close()
      ctx = null
    },
  }
}
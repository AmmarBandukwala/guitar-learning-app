// Framework-agnostic Web Audio "pluck" synth.

export interface NotePlucker {
  /** Sound one note, given as a semitone number (0 = C, A4 = 57-equivalent via 9-based mapping). */
  play(semitone: number): void
  dispose(): void
}

function resolveAudioContext(): typeof AudioContext | undefined {
  if (typeof window.AudioContext !== 'undefined') return window.AudioContext
  return (window as unknown as { webkitAudioContext?: typeof AudioContext })
    .webkitAudioContext
}

export function createNotePlucker(): NotePlucker {
  let ctx: AudioContext | null = null

  return {
    play(semitone: number) {
      if (!ctx) {
        const Ctor = resolveAudioContext()
        if (!Ctor) return
        ctx = new Ctor()
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
    },
    dispose() {
      void ctx?.close()
      ctx = null
    },
  }
}

export class PcmPlayer {
  private audioContext: AudioContext
  private nextStartTime: number
  private isClosed: boolean

  constructor(sampleRate = 24000) {
    // Try to honor sampleRate; browsers may override
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate })
    this.nextStartTime = this.audioContext.currentTime
    this.isClosed = false
  }

  play(samples: Float32Array) {
    if (this.isClosed) return
    if (samples.length === 0) return

    const ctx = this.audioContext
    const buffer = ctx.createBuffer(1, samples.length, ctx.sampleRate)
    const channelData = buffer.getChannelData(0)
    channelData.set(samples)

    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)

    const startAt = Math.max(ctx.currentTime, this.nextStartTime)
    source.start(startAt)
    this.nextStartTime = startAt + buffer.duration
  }

  async close() {
    if (this.isClosed) return
    this.isClosed = true
    try {
      await this.audioContext.close()
    } catch {}
  }
}



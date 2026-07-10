/**
 * Procedural city soundscape — synthesized with the Web Audio API, no
 * audio assets. Three layers: a low city hum (filtered brown noise),
 * occasional distant electronic blips, and a rain wash that fades in
 * with the weather. Everything sits at a deliberately low volume.
 */
export class CitySoundscape {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private rainGain: GainNode | null = null;
  private blipTimer: ReturnType<typeof setTimeout> | null = null;

  private makeNoiseBuffer(brown: boolean): AudioBuffer {
    const ctx = this.ctx!;
    const seconds = 2;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      if (brown) {
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.5;
      } else {
        data[i] = white;
      }
    }
    return buffer;
  }

  start() {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    const ctx = new AudioContext();
    this.ctx = ctx;

    this.master = ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(ctx.destination);

    // Layer 1 — city hum: brown noise through a gentle lowpass
    const hum = ctx.createBufferSource();
    hum.buffer = this.makeNoiseBuffer(true);
    hum.loop = true;
    const humFilter = ctx.createBiquadFilter();
    humFilter.type = "lowpass";
    humFilter.frequency.value = 260;
    const humGain = ctx.createGain();
    humGain.gain.value = 0.08;
    hum.connect(humFilter).connect(humGain).connect(this.master);
    hum.start();

    // Layer 2 — rain wash: white noise band, gain driven by weather
    const rain = ctx.createBufferSource();
    rain.buffer = this.makeNoiseBuffer(false);
    rain.loop = true;
    const rainFilter = ctx.createBiquadFilter();
    rainFilter.type = "bandpass";
    rainFilter.frequency.value = 4200;
    rainFilter.Q.value = 0.4;
    this.rainGain = ctx.createGain();
    this.rainGain.gain.value = 0;
    rain.connect(rainFilter).connect(this.rainGain).connect(this.master);
    rain.start();

    // Layer 3 — distant electronic blips on a randomized schedule
    const scheduleBlip = () => {
      this.blipTimer = setTimeout(() => {
        if (!this.ctx || this.ctx.state !== "running") {
          scheduleBlip();
          return;
        }
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = 500 + Math.random() * 900;
        const env = this.ctx.createGain();
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(0.02, t + 0.02);
        env.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
        osc.connect(env).connect(this.master!);
        osc.start(t);
        osc.stop(t + 0.3);
        scheduleBlip();
      }, 3500 + Math.random() * 5500);
    };
    scheduleBlip();
  }

  setRain(on: boolean) {
    if (!this.ctx || !this.rainGain) return;
    this.rainGain.gain.linearRampToValueAtTime(
      on ? 0.06 : 0,
      this.ctx.currentTime + 1.5
    );
  }

  stop() {
    if (this.blipTimer) {
      clearTimeout(this.blipTimer);
      this.blipTimer = null;
    }
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
      this.master = null;
      this.rainGain = null;
    }
  }
}

// Procedural Web Audio API sound engine: weapons, explosions, engine hum, sirens, and coastal radio.

import { RADIO_STATIONS } from './config.js';

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.masterGain = null;
    this.engineOsc = null;
    this.engineGain = null;
    this.sirenOsc = null;
    this.sirenGain = null;
    this.radioStep = 0;
    this.radioTimer = 0;
    this.sirenPhase = 0;
  }

  unlock() {
    if (this.muted) return;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.32;
        this.masterGain.connect(this.ctx.destination);
        this._initContinuousLoops();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch {
      // Ignore audio errors in restricted environments
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 0.32, this.ctx.currentTime, 0.04);
    }
    return this.muted;
  }

  _initContinuousLoops() {
    if (!this.ctx || !this.masterGain) return;
    // Continuous subtle engine drone
    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.value = 55;
    const engineFilter = this.ctx.createBiquadFilter();
    engineFilter.type = 'lowpass';
    engineFilter.frequency.value = 210;
    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.value = 0;
    this.engineOsc.connect(engineFilter);
    engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.masterGain);
    this.engineOsc.start();

    // Police wail siren
    this.sirenOsc = this.ctx.createOscillator();
    this.sirenOsc.type = 'triangle';
    this.sirenOsc.frequency.value = 640;
    this.sirenGain = this.ctx.createGain();
    this.sirenGain.gain.value = 0;
    this.sirenOsc.connect(this.sirenGain);
    this.sirenGain.connect(this.masterGain);
    this.sirenOsc.start();
  }

  _noiseBurst(duration, cutoff, gainPeak) {
    if (this.muted || !this.ctx || !this.masterGain) return;
    const len = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) {
      data[i] = (Math.random() * 2 - 1) * Math.exp((-i / len) * 5);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gainPeak, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.masterGain);
    src.start();
  }

  playGunshot(weaponId = 'pistol') {
    if (this.muted || !this.ctx) return;
    if (weaponId === 'shotgun') {
      this._noiseBurst(0.24, 950, 0.72);
    } else if (weaponId === 'smg') {
      this._noiseBurst(0.08, 1900, 0.36);
    } else if (weaponId === 'carbine') {
      this._noiseBurst(0.12, 1650, 0.48);
    } else {
      this._noiseBurst(0.11, 1450, 0.44);
    }
  }

  playExplosion() {
    if (this.muted || !this.ctx || !this.masterGain) return;
    this._noiseBurst(0.65, 520, 0.9);
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(26, this.ctx.currentTime + 0.55);
    g.gain.setValueAtTime(0.65, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.58);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.6);
  }

  playCrash(intensity = 0.5) {
    this._noiseBurst(0.18, 780, Math.min(0.6, 0.2 + intensity * 0.4));
  }

  playDoor() {
    this._noiseBurst(0.07, 600, 0.25);
  }

  playEngineStart() {
    if (this.muted || !this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(65, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(145, this.ctx.currentTime + 0.16);
    osc.frequency.linearRampToValueAtTime(82, this.ctx.currentTime + 0.32);
    g.gain.setValueAtTime(0.18, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.34);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }

  playPickup() {
    this._playTone(587.3, 0.09, 'triangle', 0.22, 0);
    this._playTone(880, 0.14, 'triangle', 0.22, 0.07);
  }

  playMissionPassed() {
    this._playTone(392, 0.14, 'triangle', 0.25, 0);
    this._playTone(493.9, 0.14, 'triangle', 0.25, 0.12);
    this._playTone(587.3, 0.16, 'triangle', 0.25, 0.24);
    this._playTone(784, 0.32, 'triangle', 0.28, 0.36);
  }

  _playTone(freq, dur, type, vol, delay = 0) {
    if (this.muted || !this.ctx || !this.masterGain) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  update(dt, game) {
    if (!this.ctx || this.muted || game.mode !== 'playing') {
      if (this.engineGain && this.ctx) this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
      if (this.sirenGain && this.ctx) this.sirenGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
      return;
    }

    const now = this.ctx.currentTime;
    const v = game.player.vehicle;

    // Engine hum tracks player vehicle speed
    if (v && !v.wrecked) {
      const speed = Math.hypot(v.vx, v.vy);
      this.engineOsc.frequency.setTargetAtTime(52 + speed * 0.24, now, 0.05);
      this.engineGain.gain.setTargetAtTime(0.11 + Math.min(0.09, speed * 0.0002), now, 0.06);
    } else {
      this.engineGain.gain.setTargetAtTime(0, now, 0.08);
    }

    // Police siren when wanted and cruisers are active
    const wanted = game.police ? game.police.wantedLevel : 0;
    if (wanted > 0) {
      this.sirenPhase += dt * 3.1;
      const freq = 660 + Math.sin(this.sirenPhase) * 230;
      this.sirenOsc.frequency.setTargetAtTime(freq, now, 0.03);
      this.sirenGain.gain.setTargetAtTime(0.055, now, 0.08);
    } else {
      this.sirenGain.gain.setTargetAtTime(0, now, 0.08);
    }

    // Subtle procedural radio synth groove when driving
    const station = RADIO_STATIONS[game.player.radioIndex] || RADIO_STATIONS[0];
    if (v && station.bpm > 0) {
      const stepDur = 60 / station.bpm / 2;
      this.radioTimer += dt;
      if (this.radioTimer >= stepDur) {
        this.radioTimer -= stepDur;
        const notes =
          station.style === 'synthwave'
            ? [110, 110, 146.8, 130.8, 98, 98, 130.8, 164.8]
            : station.style === 'house'
              ? [130.8, 164.8, 196, 164.8, 146.8, 174.6, 220, 174.6]
              : [98, 110, 130.8, 98, 146.8, 130.8, 110, 87.3];
        const freq = notes[this.radioStep % notes.length];
        this._playTone(freq, stepDur * 0.85, 'sawtooth', 0.055, 0);
        if (this.radioStep % 2 === 0) {
          this._playTone(freq * 2, stepDur * 0.45, 'triangle', 0.035, 0);
        }
        this.radioStep += 1;
      }
    }
  }
}

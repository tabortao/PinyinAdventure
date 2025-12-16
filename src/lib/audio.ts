import * as Tone from 'tone';

class AudioEngine {
  private synth: Tone.Synth;
  private isReady: boolean = false;

  constructor() {
    this.synth = new Tone.Synth().toDestination();
  }

  async init() {
    if (this.isReady) return;
    await Tone.start();
    this.isReady = true;
  }

  playNote(note: string, duration: string = '8n') {
    if (!this.isReady) this.init(); // Auto init on first play if user interaction
    try {
      this.synth.triggerAttackRelease(note, duration);
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  }

  playWin() {
    if (!this.isReady) return;
    const now = Tone.now();
    this.synth.triggerAttackRelease("C5", "8n", now);
    this.synth.triggerAttackRelease("E5", "8n", now + 0.1);
    this.synth.triggerAttackRelease("G5", "8n", now + 0.2);
    this.synth.triggerAttackRelease("C6", "4n", now + 0.3);
  }

  playLose() {
    if (!this.isReady) return;
    const now = Tone.now();
    this.synth.triggerAttackRelease("G4", "8n", now);
    this.synth.triggerAttackRelease("Eb4", "8n", now + 0.2);
    this.synth.triggerAttackRelease("C4", "4n", now + 0.4);
  }
}

export const audioEngine = new AudioEngine();

/* audio.js
   Browser-generated sound effects and best-score storage. Keeping these here
   means the game scene can request a sound without knowing how it is made. */

export const Sound = {
  context: null,
  muted: false,
  bassNotes: [110, 110, 131, 98, 110, 110, 147, 131],
  bassIndex: 0,

  // Browsers only allow sound after a click, so this is called when Play is pressed.
  init: function () {
    if (!this.context) {
      try {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        this.context = null;
      }
    }
    if (this.context && this.context.state === 'suspended') {
      this.context.resume();
    }
  },

  // Plays one beep. "slide" bends the pitch up or down.
  tone: function (freq, duration, type, volume, slide) {
    if (this.muted || !this.context) return;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, now);
    if (slide) {
      oscillator.frequency.linearRampToValueAtTime(freq + slide, now + duration);
    }
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  },

  playStar: function () {
    this.tone(880, 0.08, 'triangle', 0.07);
    setTimeout(() => this.tone(1320, 0.1, 'triangle', 0.07), 70);
  },

  playPower: function () {
    this.tone(520, 0.1, 'triangle', 0.07);
    setTimeout(() => this.tone(780, 0.1, 'triangle', 0.07), 90);
    setTimeout(() => this.tone(1040, 0.14, 'triangle', 0.07), 180);
  },

  playHit: function () {
    this.tone(150, 0.28, 'sawtooth', 0.09, -90);
  },

  playBlock: function () {
    this.tone(320, 0.16, 'square', 0.06, -160);
  },

  playGameOver: function () {
    this.tone(330, 0.22, 'triangle', 0.08);
    setTimeout(() => this.tone(247, 0.22, 'triangle', 0.08), 220);
    setTimeout(() => this.tone(165, 0.4, 'triangle', 0.08), 440);
  },

  // One note of the bass line. The game calls this every 380 ms while playing.
  playBassNote: function () {
    const note = this.bassNotes[this.bassIndex % this.bassNotes.length];
    this.bassIndex++;
    this.tone(note, 0.34, 'triangle', 0.03);
  },

  toggleMute: function () {
    this.muted = !this.muted;
    return this.muted;
  }
};

// Best score is kept in the browser (localStorage).
export const BestScore = {
  load: function () {
    try {
      return parseInt(localStorage.getItem('spaceDodgerBest'), 10) || 0;
    } catch (e) {
      return 0;
    }
  },
  save: function (value) {
    try {
      localStorage.setItem('spaceDodgerBest', String(value));
    } catch (e) {}
  }
};

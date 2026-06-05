'use client';

/**
 * Tiny Web Audio "beep" feedback for the POS scanner — no audio asset needed.
 * Browsers block audio that wasn't started from a user gesture, so call
 * `unlockScanSound()` from a click handler (e.g. opening the scanner dialog or
 * toggling sound on) before the first socket-driven beep can play.
 */

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

let audioContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    const Ctor = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
    if (!Ctor) return null;
    audioContext = new Ctor();
  }
  return audioContext;
}

/** Resume the audio context from a user gesture so later beeps are allowed to play. */
export function unlockScanSound(): void {
  const ctx = getContext();
  if (ctx && ctx.state === 'suspended') void ctx.resume();
}

function tone(
  frequency: number,
  startOffset: number,
  durationMs: number,
  type: OscillatorType,
): void {
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') void ctx.resume();

  const start = ctx.currentTime + startOffset;
  const end = start + durationMs / 1000;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);

  // Fast attack + decay so it reads as a clean "blip" rather than a click.
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.18, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);

  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(end + 0.02);
}

/** Friendly two-note rising chirp — "added to cart". */
export function playScanSuccess(): void {
  tone(880, 0, 90, 'sine');
  tone(1175, 0.09, 120, 'sine');
}

/** Low buzz — "no match / scan failed". */
export function playScanError(): void {
  tone(196, 0, 240, 'square');
}

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  audioCtx ??= new Ctx();
  return audioCtx;
}

/** A single short, soft synthesized tone starting `startOffset` seconds from now. */
function playTone(ctx: AudioContext, frequency: number, startOffset: number, duration: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const startAt = ctx.currentTime + startOffset;
  osc.type = 'sine';
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(0.06, startAt + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.02);
}

/** A soft, short synthesized tone — no external audio asset required. */
export function playTapSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    playTone(ctx, 660, 0, 0.12);
  } catch {
    /* audio not available in this context */
  }
}

/** A gentle three-note ascending chime played once when a target is reached. */
export function playCompletionSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    playTone(ctx, 523.25, 0, 0.14); // C5
    playTone(ctx, 659.25, 0.12, 0.14); // E5
    playTone(ctx, 783.99, 0.24, 0.22); // G5
  } catch {
    /* audio not available in this context */
  }
}

import type { DoctorMood } from "../types.js";

export interface DoctorFaceFrame {
  eyes: string;
  mouth: string;
}

const SCANNING_FRAMES: DoctorFaceFrame[] = [
  { eyes: "◠ ◠", mouth: " ─ " },
  { eyes: "◠ ◠", mouth: " ◡ " },
  { eyes: "◡ ◡", mouth: " ◡ " },
  { eyes: "◠ ◠", mouth: " ◡ " },
];

const GREAT_FRAMES: DoctorFaceFrame[] = [
  { eyes: "◠ ◠", mouth: " ▽ " },
  { eyes: "◠ ◠", mouth: " ◡ " },
];

const OK_FRAMES: DoctorFaceFrame[] = [
  { eyes: "• •", mouth: " ─ " },
  { eyes: "- -", mouth: " ─ " },
];

const BAD_FRAMES: DoctorFaceFrame[] = [
  { eyes: "x x", mouth: " ▽ " },
  { eyes: "× ×", mouth: " ▽ " },
];

const NEUTRAL_FRAMES: DoctorFaceFrame[] = [{ eyes: "• •", mouth: " ─ " }];

const ERROR_FRAMES: DoctorFaceFrame[] = [
  { eyes: "@ @", mouth: " ▼ " },
  { eyes: "@ @", mouth: " ─ " },
];

const FRAMES_BY_MOOD: Record<DoctorMood, DoctorFaceFrame[]> = {
  scanning: SCANNING_FRAMES,
  great: GREAT_FRAMES,
  ok: OK_FRAMES,
  bad: BAD_FRAMES,
  neutral: NEUTRAL_FRAMES,
  error: ERROR_FRAMES,
};

const BLINK_FRAME: DoctorFaceFrame = { eyes: "◡ ◡", mouth: " ◡ " };

export const getDoctorFrame = (mood: DoctorMood, frameIndex: number): DoctorFaceFrame => {
  const frames = FRAMES_BY_MOOD[mood];
  return frames[frameIndex % frames.length];
};

export const getBlinkFrame = (): DoctorFaceFrame => BLINK_FRAME;

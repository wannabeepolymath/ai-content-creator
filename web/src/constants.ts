export const MIN_IMAGE_WIDTH = 120;

/** Horizontal drag on image (not resize handles): left = float left, right = float right. Vertical drag: clear float (block). */
export const IMAGE_FLOAT_DRAG_H = 36;
export const IMAGE_FLOAT_DRAG_V = 48;

const configuredApiBase = import.meta.env.VITE_API_BASE_URL?.trim();

export const apiBase = (configuredApiBase
  ? configuredApiBase
  : import.meta.env.DEV
    ? "http://localhost:4000"
    : ""
).replace(/\/$/, "");

/** localStorage key for per-browser API key (matches server `AI_TEXT_PROVIDER`). */
export const USER_API_KEY_STORAGE_KEY = "magi-user-api-key";

/** Pastel highlighter colors (TipTap multicolor highlight). */
export const HIGHLIGHT_COLORS = [
  { label: "Green", color: "#bbf7d0" },
  { label: "Blue", color: "#bfdbfe" },
  { label: "Pink", color: "#fbcfe8" },
  { label: "Purple", color: "#e9d5ff" },
  { label: "Yellow", color: "#fef08a" },
] as const;

// Shared visual identity for the shareable image cards (fixture, stats).
//
// These are captured to PNGs and posted to WhatsApp etc., so they are styled
// with explicit hex colors — NOT Chakra theme tokens — to look identical for
// every viewer and to never follow the app's light/dark mode. The palette is
// the app's blue scale (see components/theme.ts), with a gold accent reserved
// for the champion, mirroring the in-app champion styling.

export const CARD_WIDTH = 1080;

export const INK = "#0c142e"; // blue.950 — deep ground
export const INK_2 = "#1a365d"; // blue.900
export const CARD = "rgba(255,255,255,0.05)";
export const CARD_BORDER = "rgba(255,255,255,0.12)";
export const ACCENT = "#63b3ed"; // blue.300 — bright accent on dark
export const ACCENT_SOFT = "99,179,237"; // blue.300 as rgb, for translucent fills
export const GOLD = "#f6c453"; // champion accent
export const GOLD_SOFT = "246,196,83";
export const TEXT = "#eaf2fb";
export const MUTED = "#9db6d4";

export const FONT =
  '"Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif';

/** The card ground — a subtle radial from blue.900 to blue.950. */
export const CARD_BG = `radial-gradient(120% 80% at 50% -10%, ${INK_2} 0%, ${INK} 60%)`;

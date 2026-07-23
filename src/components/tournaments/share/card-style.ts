// Shared visual identity for the shareable image cards (fixture, stats).
//
// These are captured to PNGs and posted to WhatsApp etc., so they are styled
// with explicit hex colors — NOT Chakra theme tokens — to look identical for
// every viewer and to never follow the app's light/dark mode. The palette is
// the app's club-crest identity: a deep maroon ground (brand.*), a rose accent,
// and the earned gold (gold.*) reserved for the champion — mirroring the in-app
// styling. Hexes are kept in lockstep with components/theme.ts.

export const CARD_WIDTH = 1080;

export const INK = "#2B0B13"; // brand.950 — deep maroon ground
export const INK_2 = "#571825"; // brand.800 — top glow
export const CARD = "rgba(255,255,255,0.05)";
export const CARD_BORDER = "rgba(255,255,255,0.12)";
export const ACCENT = "#DA7B94"; // brand.300 — rose accent on dark
export const ACCENT_SOFT = "218,123,148"; // brand.300 as rgb, for translucent fills
export const GOLD = "#DFB958"; // gold.300 — earned gold, champion accent
export const GOLD_SOFT = "223,185,88";
export const TEXT = "#FBECF0"; // brand.50 — warm rose-white
export const MUTED = "#A79E92"; // warm taupe — muted

export const FONT =
  '"Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif';

/** The card ground — a subtle radial from brand.800 to brand.950. */
export const CARD_BG = `radial-gradient(120% 80% at 50% -10%, ${INK_2} 0%, ${INK} 60%)`;

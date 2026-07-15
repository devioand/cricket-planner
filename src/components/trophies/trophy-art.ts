import type { TrophyConfig, TrophyMetal, TrophyShape } from "@/contexts/tournament-context/types";

/**
 * SVG trophy art. Each entry's `art` is the inner markup of a `0 0 120 176`
 * viewBox; the token `url(#GRAD)` is swapped for a per-instance gradient id so
 * every trophy can carry its own colour. Engraving text is rendered separately
 * by <TrophyBadge> (never injected as HTML) at `engraveY`.
 *
 * Cups and the fitness pieces share a wide nameplate foot (`NAMEPLATE`) so the
 * engraved name always has room. The Belt and Medal engrave on their own big
 * medallion instead (`onDark: false`).
 */
export interface ShapeArt {
  art: string;
  engraveY: number;
  engraveSize: number;
  /** Width to clamp the engraving to (SVG user units). */
  textLen: number;
  /** True when the name sits on a dark recessed plate → light text. */
  onDark: boolean;
}

const G = "url(#GRAD)";
const SHEEN = 'fill="rgba(255,255,255,0.3)"';
const LEATHER = "#3a2c1d";

/** Shared wide two-tier metallic foot. */
const NAMEPLATE = `
  <rect x="28" y="148" width="64" height="7" rx="2" fill="${G}"/>
  <rect x="15" y="154" width="90" height="20" rx="3.5" fill="${G}"/>
  <rect x="15" y="154" width="90" height="5" rx="3.5" fill="rgba(255,255,255,0.18)"/>`;

/** Defaults for every cup / fitness piece that uses the shared nameplate. */
const BASE = { engraveY: 167, engraveSize: 8.5, textLen: 74, onDark: true };

export const TROPHY_ART: Record<TrophyShape, ShapeArt> = {
  grand: {
    ...BASE,
    art: `
      <path d="M28 56 C4 56 6 100 36 94" fill="none" stroke="${G}" stroke-width="7" stroke-linecap="round"/>
      <path d="M92 56 C116 56 114 100 84 94" fill="none" stroke="${G}" stroke-width="7" stroke-linecap="round"/>
      <path d="M25 49 L95 49 C95 94 79 112 60 112 C41 112 25 94 25 49 Z" fill="${G}"/>
      <ellipse cx="60" cy="49" rx="35" ry="7.5" fill="${G}"/>
      <ellipse cx="60" cy="49" rx="28" ry="4.6" fill="rgba(0,0,0,.2)"/>
      <path d="M33 52 C33 88 43 106 55 110 C45 96 41 74 41 52 Z" ${SHEEN}/>
      <path d="M53 112 L67 112 L65 126 L55 126 Z" fill="${G}"/>
      <ellipse cx="60" cy="127" rx="11" ry="4" fill="${G}"/>
      <rect x="53" y="127" width="14" height="23" rx="2" fill="${G}"/>
      ${NAMEPLATE}`,
  },
  classic: {
    ...BASE,
    art: `
      <path d="M35 58 C15 58 17 90 39 88" fill="none" stroke="${G}" stroke-width="5.5" stroke-linecap="round"/>
      <path d="M85 58 C105 58 103 90 81 88" fill="none" stroke="${G}" stroke-width="5.5" stroke-linecap="round"/>
      <path d="M33 52 L87 52 C87 88 74 103 60 103 C46 103 33 88 33 52 Z" fill="${G}"/>
      <ellipse cx="60" cy="52" rx="27" ry="6" fill="${G}"/>
      <ellipse cx="60" cy="52" rx="21" ry="3.8" fill="rgba(0,0,0,.2)"/>
      <path d="M40 55 C40 84 48 99 58 102 C50 90 47 72 47 55 Z" ${SHEEN}/>
      <path d="M55 103 L65 103 L63 120 L57 120 Z" fill="${G}"/>
      <ellipse cx="60" cy="121" rx="9" ry="3.4" fill="${G}"/>
      <rect x="55" y="121" width="10" height="29" rx="2" fill="${G}"/>
      ${NAMEPLATE}`,
  },
  flute: {
    ...BASE,
    art: `
      <path d="M46 60 C36 60 37 78 49 76" fill="none" stroke="${G}" stroke-width="4" stroke-linecap="round"/>
      <path d="M74 60 C84 60 83 78 71 76" fill="none" stroke="${G}" stroke-width="4" stroke-linecap="round"/>
      <path d="M47 46 L73 46 L65 110 C65 116 55 116 55 110 Z" fill="${G}"/>
      <ellipse cx="60" cy="46" rx="13" ry="3.6" fill="${G}"/>
      <ellipse cx="60" cy="46" rx="9" ry="2.2" fill="rgba(0,0,0,.2)"/>
      <path d="M51 49 C51 82 55 104 59 112 C55 104 55 74 56 49 Z" ${SHEEN}/>
      <path d="M56 110 L64 110 L62 126 L58 126 Z" fill="${G}"/>
      <ellipse cx="60" cy="127" rx="8" ry="3" fill="${G}"/>
      <rect x="56" y="127" width="8" height="23" rx="2" fill="${G}"/>
      ${NAMEPLATE}`,
  },
  chalice: {
    ...BASE,
    art: `
      <path d="M34 50 C34 52 40 72 60 72 C80 72 86 52 86 50 Z" fill="${G}"/>
      <ellipse cx="60" cy="50" rx="26" ry="6" fill="${G}"/>
      <ellipse cx="60" cy="50" rx="20" ry="4" fill="rgba(0,0,0,.2)"/>
      <path d="M40 52 C42 64 50 70 58 71 C50 66 45 58 44 52 Z" ${SHEEN}/>
      <path d="M56 72 L64 72 L62 108 L58 108 Z" fill="${G}"/>
      <ellipse cx="60" cy="90" rx="6.5" ry="3" fill="${G}"/>
      <rect x="56" y="106" width="8" height="44" rx="2" fill="${G}"/>
      ${NAMEPLATE}`,
  },
  star: {
    ...BASE,
    art: `
      <path d="M60 30 L69 52 L93 54 L74 69 L81 92 L60 79 L39 92 L46 69 L27 54 L51 52 Z" fill="${G}"/>
      <path d="M60 30 L69 52 L60 55 Z" ${SHEEN}/>
      <path d="M57 92 L63 92 L62 112 L58 112 Z" fill="${G}"/>
      <ellipse cx="60" cy="113" rx="8" ry="3" fill="${G}"/>
      <rect x="57" y="113" width="6" height="37" rx="2" fill="${G}"/>
      ${NAMEPLATE}`,
  },
  orb: {
    ...BASE,
    art: `
      <circle cx="60" cy="54" r="30" fill="${G}"/>
      <path d="M60 24 A30 30 0 0 0 33 70 A30 30 0 0 1 60 24 Z" ${SHEEN}/>
      <path d="M40 38 C54 48 66 60 80 70" fill="none" stroke="rgba(0,0,0,.32)" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M43 33 l3 4 M49 44 l3 4 M55 51 l3 4 M62 57 l3 4 M69 63 l3 4 M76 68 l3 4" stroke="rgba(0,0,0,.28)" stroke-width="1.2" stroke-linecap="round"/>
      <path d="M40 80 C40 96 80 96 80 80 L74 84 C74 92 46 92 46 84 Z" fill="${G}"/>
      <rect x="53" y="90" width="14" height="20" rx="2" fill="${G}"/>
      <rect x="54" y="110" width="12" height="40" rx="2" fill="${G}"/>
      ${NAMEPLATE}`,
  },
  belt: {
    engraveY: 100, engraveSize: 8, textLen: 44, onDark: false,
    art: `
      <path d="M2 76 Q60 68 118 76 L118 100 Q60 108 2 100 Z" fill="${LEATHER}"/>
      <path d="M2 79 Q60 71 118 79 M2 97 Q60 105 118 97" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="1" stroke-dasharray="2 3"/>
      <path d="M14 80 l16 -5 6 13 -6 13 -16 -5 z" fill="${G}"/>
      <path d="M106 80 l-16 -5 -6 13 6 13 16 -5 z" fill="${G}"/>
      <circle cx="60" cy="88" r="31" fill="${G}"/>
      <circle cx="60" cy="88" r="25" fill="rgba(0,0,0,.14)"/>
      <circle cx="60" cy="88" r="25" fill="none" stroke="${G}" stroke-width="1.4"/>
      <path d="M60 57 A31 31 0 0 0 32 96 A31 31 0 0 1 60 57 Z" ${SHEEN}/>
      <path d="M60 66 l3 6 6.5 .6 -5 4.4 1.6 6.4 -6.1 -3.6 -6.1 3.6 1.6 -6.4 -5 -4.4 6.5 -.6 z" fill="${G}"/>`,
  },
  crown: {
    ...BASE,
    art: `
      <path d="M26 96 L20 58 L40 76 L60 44 L80 76 L100 58 L94 96 Z" fill="${G}"/>
      <path d="M26 96 L20 58 L40 76 L34 92 Z" ${SHEEN}/>
      <circle cx="20" cy="56" r="4.5" fill="${G}"/>
      <circle cx="60" cy="42" r="5.5" fill="${G}"/>
      <circle cx="100" cy="56" r="4.5" fill="${G}"/>
      <rect x="26" y="94" width="68" height="12" rx="2.5" fill="${G}"/>
      <circle cx="38" cy="100" r="2.4" fill="rgba(0,0,0,.28)"/>
      <circle cx="60" cy="100" r="2.4" fill="rgba(0,0,0,.28)"/>
      <circle cx="82" cy="100" r="2.4" fill="rgba(0,0,0,.28)"/>
      <rect x="46" y="106" width="28" height="14" rx="3" fill="${G}"/>
      <rect x="52" y="120" width="16" height="30" rx="2" fill="${G}"/>
      ${NAMEPLATE}`,
  },
  medal: {
    engraveY: 126, engraveSize: 8, textLen: 44, onDark: false,
    art: `
      <path d="M40 20 L58 74 L48 78 L30 26 Z" fill="${G}"/>
      <path d="M80 20 L62 74 L72 78 L90 26 Z" fill="${G}"/>
      <path d="M40 20 L58 74 L48 78 L30 26 Z" fill="rgba(0,0,0,.14)"/>
      <circle cx="60" cy="112" r="33" fill="${G}"/>
      <circle cx="60" cy="112" r="27" fill="rgba(0,0,0,.13)"/>
      <circle cx="60" cy="112" r="27" fill="none" stroke="${G}" stroke-width="1.4"/>
      <path d="M60 79 A33 33 0 0 0 30 122 A33 33 0 0 1 60 79 Z" ${SHEEN}/>
      <path d="M60 90 l3.2 6.6 7.2 .6 -5.4 4.8 1.7 7 -6.7 -4 -6.7 4 1.7 -7 -5.4 -4.8 7.2 -.6 z" fill="${G}"/>`,
  },
  flame: {
    ...BASE,
    art: `
      <path d="M60 26 C48 46 42 54 44 76 C45 96 55 106 60 106 C65 106 80 98 80 74 C80 58 70 54 66 44 C63 56 58 56 58 46 C58 38 62 34 60 26 Z" fill="${G}"/>
      <path d="M60 26 C50 46 45 54 47 74 C48 88 54 98 58 102 C52 92 50 74 52 60 C53 48 58 40 60 26 Z" ${SHEEN}/>
      <path d="M60 58 C54 66 51 72 53 82 C54 90 60 96 60 96 C65 92 68 84 68 76 C68 68 62 66 60 58 Z" fill="rgba(255,255,255,.28)"/>
      <path d="M55 106 L65 106 L63 118 L57 118 Z" fill="${G}"/>
      <rect x="55" y="118" width="10" height="32" rx="2" fill="${G}"/>
      ${NAMEPLATE}`,
  },
  iron: {
    ...BASE,
    art: `
      <rect x="30" y="66" width="60" height="11" rx="5.5" fill="${G}"/>
      <rect x="19" y="52" width="13" height="39" rx="4" fill="${G}"/>
      <rect x="10" y="59" width="10" height="25" rx="3" fill="${G}"/>
      <rect x="88" y="52" width="13" height="39" rx="4" fill="${G}"/>
      <rect x="100" y="59" width="10" height="25" rx="3" fill="${G}"/>
      <rect x="30" y="66" width="60" height="4" fill="rgba(255,255,255,0.3)"/>
      <rect x="55" y="77" width="10" height="73" rx="2" fill="${G}"/>
      ${NAMEPLATE}`,
  },
  bolt: {
    ...BASE,
    art: `
      <path d="M70 26 L38 84 L55 84 L48 122 L86 58 L67 58 L76 26 Z" fill="${G}"/>
      <path d="M70 26 L46 70 L58 70 L52 96 L60 58 L52 58 Z" fill="rgba(255,255,255,0.3)"/>
      <rect x="52" y="116" width="16" height="34" rx="2" fill="${G}"/>
      ${NAMEPLATE}`,
  },
};

export interface ShapeMeta {
  id: TrophyShape;
  label: string;
  group: "Cups" | "Challenge";
}

/** Ordered shape list for the designer picker, grouped Cups → Challenge. */
export const TROPHY_SHAPES: ShapeMeta[] = [
  { id: "grand", label: "Grand", group: "Cups" },
  { id: "classic", label: "Classic", group: "Cups" },
  { id: "flute", label: "Flute", group: "Cups" },
  { id: "chalice", label: "Chalice", group: "Cups" },
  { id: "star", label: "Star", group: "Cups" },
  { id: "orb", label: "Orb", group: "Cups" },
  { id: "belt", label: "Belt", group: "Challenge" },
  { id: "crown", label: "Crown", group: "Challenge" },
  { id: "medal", label: "Medal", group: "Challenge" },
  { id: "flame", label: "Flame", group: "Challenge" },
  { id: "iron", label: "Iron", group: "Challenge" },
  { id: "bolt", label: "Bolt", group: "Challenge" },
];

const METAL_BASE: Record<Exclude<TrophyMetal, "custom">, string> = {
  gold: "#e6b23a",
  silver: "#c4ccd6",
  bronze: "#bd7b3f",
};

function mix(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return (
    "#" +
    pa
      .map((v, i) => Math.round(v + (pb[i] - v) * t))
      .map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0"))
      .join("")
  );
}

/** Resolve a trophy's base colour + the derived metallic + engraving colours. */
export function metalColors(config: TrophyConfig) {
  const raw =
    config.metal === "custom" ? config.color || "#e6b23a" : METAL_BASE[config.metal];
  const base = /^#[0-9a-fA-F]{6}$/.test(raw) ? raw : "#e6b23a";
  return {
    light: mix(base, "#ffffff", 0.5),
    mid: base,
    dark: mix(base, "#1c1606", 0.34),
    // dark text for engraving on bright metal (belt/medal medallion)
    engraveFill: mix(base, "#120d02", 0.62),
    engraveStroke: mix(base, "#ffffff", 0.7),
    // light text for engraving on the dark recessed nameplate (cups)
    engraveLight: mix(base, "#ffffff", 0.86),
    engraveLightStroke: mix(base, "#000000", 0.5),
  };
}

/** Fall back to Classic for any unknown/legacy shape value. */
export function resolveShape(shape: string): TrophyShape {
  return (TROPHY_ART as Record<string, ShapeArt>)[shape] ? (shape as TrophyShape) : "classic";
}

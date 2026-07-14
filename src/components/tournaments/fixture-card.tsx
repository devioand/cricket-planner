"use client";

import { forwardRef } from "react";
import type {
  TournamentState,
  PlayoffSlot,
} from "@/contexts/tournament-context/types";

/**
 * The shareable fixture-draft card. Rendered at a fixed 1080px design width and
 * captured to a PNG (see ShareFixtureDialog) for posting to WhatsApp etc.
 *
 * Intentionally styled with explicit hex colors and inline styles rather than
 * Chakra theme tokens: the exported image must look identical for every viewer
 * and must NOT follow the app's light/dark mode. This is the one place a fixed
 * pixel width is correct — the output is an image, not a responsive screen.
 */

// Fixed design palette (theme-independent) — the app's blue scale (theme.ts).
const INK = "#0c142e"; // blue.950 — deep ground
const INK_2 = "#1a365d"; // blue.900
const CARD = "rgba(255,255,255,0.05)";
const CARD_BORDER = "rgba(255,255,255,0.12)";
const ACCENT = "#63b3ed"; // blue.300 — bright accent on dark
const ACCENT_SOFT = "99,179,237"; // blue.300 as rgb, for translucent fills
const TEXT = "#eaf2fb";
const MUTED = "#9db6d4";
const FONT =
  '"Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif';

export const FIXTURE_CARD_WIDTH = 1080;

export interface FixtureCardProps {
  tournamentName: string;
  state: TournamentState;
}

interface WindowParts {
  date: string;
  time: string;
  duration: string | null;
}

/** Break the planned window into minimal, pre-formatted pieces (or null). */
function windowParts(startISO?: string, endISO?: string): WindowParts | null {
  if (!startISO) return null;
  const start = new Date(startISO);
  if (Number.isNaN(start.getTime())) return null;

  const date = start
    .toLocaleDateString(undefined, {
      weekday: "short",
      day: "numeric",
      month: "short",
    })
    .toUpperCase();
  const t = (d: Date) =>
    d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  if (!endISO) return { date, time: t(start), duration: null };
  const end = new Date(endISO);
  if (Number.isNaN(end.getTime())) return { date, time: t(start), duration: null };

  const mins = Math.round((end.getTime() - start.getTime()) / 60000);
  let duration: string | null = null;
  if (mins > 0) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    duration = h && m ? `${h}h ${m}m` : h ? `${h}h` : `${m}m`;
  }
  return { date, time: `${t(start)} – ${t(end)}`, duration };
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

/** Human description of a playoff slot for the pre-tournament draft. Avoids the
 *  jargon "seed" — spells out the points-table position instead. */
function describeSlot(slot: PlayoffSlot, labelById: Map<string, string>): string {
  if (slot.kind === "seed") return `${ordinal(slot.seed)} on points table`;
  const l = labelById.get(slot.matchId) ?? "TBD";
  return slot.kind === "winnerOf" ? `Winner · ${l}` : `Loser · ${l}`;
}

function playoffSummary(state: TournamentState): string | null {
  const { playoffConfig, playoffFormat } = state;
  if (!playoffConfig || playoffFormat === "none" || playoffConfig.qualifiers === 0) {
    return null;
  }
  const pretty: Record<string, string> = {
    "final-only": "Final",
    "world-cup": "Knockout",
    league: "League playoffs",
    custom: "Custom bracket",
  };
  return `Top ${playoffConfig.qualifiers} → ${pretty[playoffFormat] ?? "Playoffs"}`;
}

export const FixtureCard = forwardRef<HTMLDivElement, FixtureCardProps>(
  function FixtureCard({ tournamentName, state }, ref) {
    const win = windowParts(state.scheduledStart, state.scheduledEnd);

    const groupMatches = state.matches
      .filter((m) => !m.isPlayoff)
      .sort((a, b) => a.round - b.round);

    const playoffSpecs = state.playoffConfig?.matches ?? [];
    const labelById = new Map(playoffSpecs.map((s) => [s.id, s.label]));

    return (
      <div
        ref={ref}
        style={{
          width: FIXTURE_CARD_WIDTH,
          boxSizing: "border-box",
          fontFamily: FONT,
          color: TEXT,
          background: `radial-gradient(120% 80% at 50% -10%, ${INK_2} 0%, ${INK} 60%)`,
          padding: "72px 64px 60px",
        }}
      >
        {/* Eyebrow */}
        <div
          style={{
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: 4,
            color: ACCENT,
          }}
        >
          🏏 FIXTURE DRAFT
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 78,
            fontWeight: 800,
            lineHeight: 1.04,
            marginTop: 16,
            letterSpacing: -1,
          }}
        >
          {tournamentName}
        </div>

        {/* Minimal schedule line */}
        {win && (
          <div style={{ marginTop: 24, display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: 18 }}>
            <span style={{ fontSize: 30, fontWeight: 700, color: ACCENT, letterSpacing: 2 }}>
              {win.date}
            </span>
            <span style={{ fontSize: 30, fontWeight: 500, color: TEXT }}>
              {win.time}
            </span>
            {win.duration && (
              <span style={{ fontSize: 26, fontWeight: 500, color: MUTED }}>
                · {win.duration}
              </span>
            )}
          </div>
        )}

        {/* Group stage */}
        {groupMatches.length > 0 && (
          <>
            <SectionLabel>
              GROUP STAGE · {groupMatches.length} MATCHES
            </SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 22 }}>
              {groupMatches.map((m, i) => (
                <MatchCardRow
                  key={m.id}
                  tag={`MATCH ${String(i + 1).padStart(2, "0")}`}
                  left={m.team1}
                  right={m.team2}
                />
              ))}
            </div>
          </>
        )}

        {/* Playoffs */}
        {playoffSpecs.length > 0 && (
          <>
            <SectionLabel>🏆 PLAYOFFS · {playoffSummary(state)}</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 22 }}>
              {playoffSpecs.map((spec) => (
                <MatchCardRow
                  key={spec.id}
                  tag={spec.label.toUpperCase()}
                  left={describeSlot(spec.slot1, labelById)}
                  right={describeSlot(spec.slot2, labelById)}
                  isFinal={spec.isFinal}
                  muted
                />
              ))}
            </div>
          </>
        )}

        {/* Footer */}
        <div
          style={{
            marginTop: 44,
            paddingTop: 26,
            borderTop: `1px solid ${CARD_BORDER}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: MUTED,
            fontSize: 26,
            fontWeight: 600,
          }}
        >
          <span>🎯 {state.maxOvers} overs · {state.maxWickets} wkts</span>
          <span>🏏 Cricket Planner</span>
        </div>
      </div>
    );
  },
);

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 24,
        fontWeight: 700,
        letterSpacing: 3,
        color: MUTED,
        marginTop: 46,
      }}
    >
      {children}
    </div>
  );
}

/** A single fixture rendered as an exciting VS card. */
function MatchCardRow({
  tag,
  left,
  right,
  isFinal,
  muted,
}: {
  tag: string;
  left: string;
  right: string;
  isFinal?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      style={{
        background: isFinal
          ? `linear-gradient(100deg, rgba(${ACCENT_SOFT},0.16), rgba(${ACCENT_SOFT},0.05))`
          : CARD,
        border: `1px solid ${isFinal ? `rgba(${ACCENT_SOFT},0.45)` : CARD_BORDER}`,
        borderRadius: 22,
        padding: "22px 30px 26px",
      }}
    >
      {/* Eyebrow tag */}
      <div
        style={{
          textAlign: "center",
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: 3,
          color: isFinal ? ACCENT : MUTED,
          marginBottom: 14,
        }}
      >
        {isFinal ? `👑 ${tag}` : tag}
      </div>

      {/* Team A · VS · Team B */}
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div
          style={{
            flex: 1,
            textAlign: "right",
            fontSize: 36,
            fontWeight: 700,
            color: muted ? MUTED : TEXT,
          }}
        >
          {left}
        </div>
        <div
          style={{
            flexShrink: 0,
            width: 74,
            height: 74,
            borderRadius: "50%",
            background: ACCENT,
            color: INK,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: 1,
          }}
        >
          VS
        </div>
        <div
          style={{
            flex: 1,
            textAlign: "left",
            fontSize: 36,
            fontWeight: 700,
            color: muted ? MUTED : TEXT,
          }}
        >
          {right}
        </div>
      </div>
    </div>
  );
}

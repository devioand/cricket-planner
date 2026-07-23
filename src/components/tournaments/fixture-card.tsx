"use client";

import { forwardRef } from "react";
import type {
  TournamentState,
  PlayoffSlot,
} from "@/contexts/tournament-context/types";
import { EMPTY_FORM, predictWin, type FormData } from "@/lib/predictions";
import {
  ACCENT,
  CARD,
  CARD_BG,
  CARD_BORDER,
  CARD_WIDTH,
  FONT,
  GOLD,
  GOLD_SOFT,
  INK,
  MUTED,
  TEXT,
} from "@/components/tournaments/share/card-style";

/**
 * The shareable fixture-draft card. Rendered at a fixed 1080px design width and
 * captured to a PNG (see ShareFixtureDialog) for posting to WhatsApp etc.
 *
 * Intentionally styled with explicit hex colors and inline styles rather than
 * Chakra theme tokens: the exported image must look identical for every viewer
 * and must NOT follow the app's light/dark mode. This is the one place a fixed
 * pixel width is correct — the output is an image, not a responsive screen.
 */

export const FIXTURE_CARD_WIDTH = CARD_WIDTH;

export interface FixtureCardProps {
  tournamentName: string;
  state: TournamentState;
  /** Real head-to-head/form history, so the card can show win predictions.
   *  Defaults to no history → the card renders the matchups without odds. */
  formData?: FormData;
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

/** Human description of a playoff slot for the pre-tournament draft. Avoids the
 *  jargon "seed" — a seed slot reads as its rank in the points table. */
function describeSlot(slot: PlayoffSlot, labelById: Map<string, string>): string {
  if (slot.kind === "seed") return `Table #${slot.seed}`;
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
  function FixtureCard({ tournamentName, state, formData = EMPTY_FORM }, ref) {
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
          background: CARD_BG,
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
          FIXTURE DRAFT
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
              GROUP STAGE · {groupMatches.length} GAMES
            </SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 22 }}>
              {groupMatches.map((m, i) => (
                <MatchCardRow
                  key={m.id}
                  tag={`GAME ${String(i + 1).padStart(2, "0")}`}
                  left={m.team1}
                  right={m.team2}
                  prob={predictWin(m.team1, m.team2, formData)}
                />
              ))}
            </div>
          </>
        )}

        {/* Playoffs */}
        {playoffSpecs.length > 0 && (
          <>
            <SectionLabel>PLAYOFFS · {playoffSummary(state)}</SectionLabel>
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
          <span>{state.maxOvers} overs · {state.maxWickets} wkts</span>
          <span>Cricket Planner</span>
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

/** A single fixture rendered as an exciting VS card. Group games carry a real
 *  win prediction (`prob`, 0..1 for the left team); playoff rows pass none. */
function MatchCardRow({
  tag,
  left,
  right,
  isFinal,
  muted,
  prob,
}: {
  tag: string;
  left: string;
  right: string;
  isFinal?: boolean;
  muted?: boolean;
  prob?: number | null;
}) {
  const p1 = prob === null || prob === undefined ? null : Math.round(prob * 100);
  return (
    <div
      style={{
        background: isFinal
          ? `linear-gradient(100deg, rgba(${GOLD_SOFT},0.16), rgba(${GOLD_SOFT},0.05))`
          : CARD,
        border: `1px solid ${isFinal ? `rgba(${GOLD_SOFT},0.5)` : CARD_BORDER}`,
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
          color: isFinal ? GOLD : MUTED,
          marginBottom: 14,
        }}
      >
        {tag}
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

      {/* Real win prediction — a split bar, then each team's chance below its
          own side, colour-matched to its slice. */}
      {p1 !== null && (
        <div style={{ marginTop: 22 }}>
          <div
            style={{
              height: 16,
              borderRadius: 999,
              overflow: "hidden",
              display: "flex",
              background: "rgba(255,255,255,0.08)",
            }}
          >
            <div style={{ width: `${p1}%`, background: ACCENT }} />
            <div style={{ flex: 1, background: "rgba(255,255,255,0.22)" }} />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginTop: 12,
            }}
          >
            <span style={{ fontSize: 30, fontWeight: 800, color: ACCENT }}>
              {p1}%
            </span>
            <span
              style={{
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: 2,
                color: MUTED,
              }}
            >
              WINNING PREDICTION
            </span>
            <span style={{ fontSize: 30, fontWeight: 800, color: TEXT }}>
              {100 - p1}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

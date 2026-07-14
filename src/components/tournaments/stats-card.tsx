"use client";

import { forwardRef } from "react";
import type { TournamentState } from "@/contexts/tournament-context/types";
import {
  computeTournamentInsights,
  type Award,
  type Highlight,
} from "@/contexts/tournament-context/algorithms/insights";
import {
  getTournamentStandings,
  formatNRR,
} from "@/contexts/tournament-context/algorithms/cricket-stats";
import {
  ACCENT,
  ACCENT_SOFT,
  CARD,
  CARD_BG,
  CARD_BORDER,
  FONT,
  GOLD,
  GOLD_SOFT,
  MUTED,
  TEXT,
} from "@/components/tournaments/share/card-style";

/**
 * The shareable tournament-stats card: champion/leader, the points table, team
 * awards, and match highlights. Rendered at a fixed 1080px width and captured
 * to a PNG for sharing. Theme-independent by design (see card-style.ts) —
 * mirrors the app's blue identity with gold reserved for the champion.
 */

export interface StatsCardProps {
  tournamentName: string;
  state: TournamentState;
}

export const StatsCard = forwardRef<HTMLDivElement, StatsCardProps>(
  function StatsCard({ tournamentName, state }, ref) {
    const insights = computeTournamentInsights(state);
    const standings = getTournamentStandings(state.teamStats).filter(
      (t) => t.matchesPlayed > 0,
    );

    return (
      <div
        ref={ref}
        style={{
          width: 1080,
          boxSizing: "border-box",
          fontFamily: FONT,
          color: TEXT,
          background: CARD_BG,
          padding: "72px 64px 60px",
        }}
      >
        {/* Eyebrow */}
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 4, color: ACCENT }}>
          🏏 TOURNAMENT STATS
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

        {/* At-a-glance totals */}
        <div style={{ marginTop: 22, display: "flex", gap: 40, flexWrap: "wrap" }}>
          <Stat value={insights.matchesCompleted} label="matches played" />
          <Stat value={insights.totalRuns} label="runs scored" />
          <Stat value={insights.totalWickets} label="wickets taken" />
        </div>

        {/* Champion / leader hero */}
        {insights.champion ? (
          <Hero
            emoji="🏆"
            eyebrow="CHAMPIONS"
            name={insights.champion}
            note="Tournament winner"
            gold
          />
        ) : (
          insights.standout && (
            <Hero
              emoji="🌟"
              eyebrow="TEAM TO BEAT"
              name={insights.standout.team}
              note={`Leading ${insights.standout.awardCount} of ${insights.standout.totalAwards} awards`}
            />
          )
        )}

        {/* Points table */}
        {standings.length > 0 && (
          <>
            <SectionLabel>📋 POINTS TABLE</SectionLabel>
            <div style={{ marginTop: 20 }}>
              <TableHeader />
              {standings.map((t, i) => {
                const champ = t.teamName === insights.champion;
                return (
                  <TableRow
                    key={t.teamName}
                    pos={i + 1}
                    team={t.teamName}
                    p={t.matchesPlayed}
                    w={t.wins}
                    l={t.losses}
                    pts={t.points}
                    nrr={formatNRR(t.netRunRate)}
                    highlight={champ}
                  />
                );
              })}
            </div>
          </>
        )}

        {/* Team awards */}
        {insights.awards.length > 0 && (
          <>
            <SectionLabel>⭐ TEAM AWARDS</SectionLabel>
            <div
              style={{
                marginTop: 20,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              {insights.awards.map((a) => (
                <AwardTile key={a.key} award={a} />
              ))}
            </div>
          </>
        )}

        {/* Match highlights */}
        {insights.highlights.length > 0 && (
          <>
            <SectionLabel>🎬 MATCH HIGHLIGHTS</SectionLabel>
            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              {insights.highlights.map((h) => (
                <HighlightRow key={h.key} highlight={h} />
              ))}
            </div>
          </>
        )}

        {/* Footer */}
        <div
          style={{
            marginTop: 46,
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
          <span>🎯 {state.maxOvers} overs</span>
          <span>🏏 Cricket Planner</span>
        </div>
      </div>
    );
  },
);

// ── Primitives ────────────────────────────────────────────────────────────────

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div style={{ fontSize: 52, fontWeight: 800, color: ACCENT, lineHeight: 1 }}>
        {value.toLocaleString()}
      </div>
      <div style={{ fontSize: 24, color: MUTED, fontWeight: 600, marginTop: 4 }}>
        {label}
      </div>
    </div>
  );
}

function Hero({
  emoji,
  eyebrow,
  name,
  note,
  gold,
}: {
  emoji: string;
  eyebrow: string;
  name: string;
  note: string;
  gold?: boolean;
}) {
  const soft = gold ? GOLD_SOFT : ACCENT_SOFT;
  const ring = gold ? GOLD : ACCENT;
  return (
    <div
      style={{
        marginTop: 34,
        background: `linear-gradient(100deg, rgba(${soft},0.2), rgba(${soft},0.06))`,
        border: `1px solid rgba(${soft},0.5)`,
        borderRadius: 26,
        padding: "34px 30px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 60, lineHeight: 1 }}>{emoji}</div>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 4, color: ring, marginTop: 10 }}>
        {eyebrow}
      </div>
      <div style={{ fontSize: 60, fontWeight: 800, marginTop: 6 }}>{name}</div>
      <div style={{ fontSize: 26, color: MUTED, fontWeight: 600, marginTop: 8 }}>{note}</div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 3, color: MUTED, marginTop: 48 }}>
      {children}
    </div>
  );
}

// Points-table column layout, shared by header and rows.
const COLS = "56px 1fr 90px 90px 90px 110px 130px";

function TableHeader() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: COLS,
        alignItems: "center",
        padding: "0 24px 12px",
        fontSize: 22,
        fontWeight: 700,
        letterSpacing: 1,
        color: MUTED,
      }}
    >
      <span>#</span>
      <span>TEAM</span>
      <span style={{ textAlign: "center" }}>P</span>
      <span style={{ textAlign: "center" }}>W</span>
      <span style={{ textAlign: "center" }}>L</span>
      <span style={{ textAlign: "center" }}>PTS</span>
      <span style={{ textAlign: "center" }}>NRR</span>
    </div>
  );
}

function TableRow({
  pos,
  team,
  p,
  w,
  l,
  pts,
  nrr,
  highlight,
}: {
  pos: number;
  team: string;
  p: number;
  w: number;
  l: number;
  pts: number;
  nrr: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: COLS,
        alignItems: "center",
        padding: "20px 24px",
        marginBottom: 10,
        borderRadius: 16,
        background: highlight
          ? `linear-gradient(100deg, rgba(${GOLD_SOFT},0.16), rgba(${GOLD_SOFT},0.05))`
          : CARD,
        border: `1px solid ${highlight ? `rgba(${GOLD_SOFT},0.45)` : CARD_BORDER}`,
        fontSize: 30,
      }}
    >
      <span style={{ fontWeight: 800, color: highlight ? GOLD : ACCENT }}>{pos}</span>
      <span style={{ fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {highlight ? `👑 ${team}` : team}
      </span>
      <Num>{p}</Num>
      <Num>{w}</Num>
      <Num>{l}</Num>
      <span style={{ textAlign: "center", fontWeight: 800 }}>{pts}</span>
      <span style={{ textAlign: "center", fontWeight: 700, color: MUTED }}>{nrr}</span>
    </div>
  );
}

function Num({ children }: { children: React.ReactNode }) {
  return <span style={{ textAlign: "center", fontWeight: 600, color: MUTED }}>{children}</span>;
}

function AwardTile({ award }: { award: Award }) {
  return (
    <div
      style={{
        background: CARD,
        border: `1px solid ${CARD_BORDER}`,
        borderRadius: 20,
        padding: "24px 26px",
      }}
    >
      <div style={{ fontSize: 22, color: MUTED, fontWeight: 600 }}>
        {award.emoji} {award.title}
      </div>
      <div style={{ fontSize: 38, fontWeight: 800, marginTop: 8 }}>{award.team}</div>
      <div style={{ fontSize: 24, fontWeight: 600, color: ACCENT, marginTop: 4 }}>
        {award.metric}
      </div>
    </div>
  );
}

function HighlightRow({ highlight: h }: { highlight: Highlight }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 22,
        background: CARD,
        border: `1px solid ${CARD_BORDER}`,
        borderRadius: 18,
        padding: "20px 28px",
      }}
    >
      <span style={{ fontSize: 44, flexShrink: 0 }}>{h.emoji}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 22, color: MUTED, fontWeight: 600 }}>{h.title}</div>
        <div style={{ fontSize: 34, fontWeight: 700, marginTop: 2 }}>{h.headline}</div>
      </div>
      {h.detail && (
        <span style={{ fontSize: 24, color: ACCENT, fontWeight: 600, flexShrink: 0 }}>
          {h.detail}
        </span>
      )}
    </div>
  );
}

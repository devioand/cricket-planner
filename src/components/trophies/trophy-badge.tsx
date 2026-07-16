"use client";

import { useId } from "react";
import { Box, Text, VStack } from "@chakra-ui/react";
import type { TrophyConfig } from "@/contexts/tournament-context/types";
import { metalColors, resolveShape, TROPHY_ART } from "./trophy-art";

const SIZE_PX = { sm: 66, md: 108, lg: 168 } as const;

export interface TrophyBadgeProps {
  config: TrophyConfig;
  /** Champion name — renders the "Won by …" line when present. */
  wonBy?: string;
  /** ISO date the trophy was earned. */
  date?: string;
  size?: keyof typeof SIZE_PX;
  /** Show the "Won by …" line when a winner is given (default true). */
  showWonBy?: boolean;
}

/**
 * A trophy — the chosen silhouette rendered as SVG with a metallic gradient,
 * plus an optional "Won by …" caption. Each instance gets its own gradient id
 * so trophies of different colours can sit side by side.
 */
export function TrophyBadge({
  config,
  wonBy,
  date,
  size = "md",
  showWonBy = true,
}: TrophyBadgeProps) {
  const gid = "tro-" + useId().replace(/[:»]/g, "");
  const shape = resolveShape(config.shape);
  const art = TROPHY_ART[shape];
  const { light, mid, dark } = metalColors(config);

  const inner = art.art.replaceAll("url(#GRAD)", `url(#${gid})`);
  const px = SIZE_PX[size];

  const earnedDate = date
    ? new Date(date).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <VStack gap={size === "sm" ? 1 : 2.5}>
      <svg
        viewBox="0 0 120 176"
        role="img"
        aria-label="Trophy"
        width={px}
        height={(px * 176) / 120}
        style={{ filter: "drop-shadow(0 6px 8px rgba(0,0,0,0.22))", maxWidth: "100%" }}
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={light} />
            <stop offset="0.5" stopColor={mid} />
            <stop offset="1" stopColor={dark} />
          </linearGradient>
        </defs>
        <g dangerouslySetInnerHTML={{ __html: inner }} />
      </svg>

      {showWonBy && wonBy && (
        <Text fontSize="xs" color="fg.muted" textAlign="center">
          🏅 Won by{" "}
          <Box as="span" fontWeight="semibold" color="fg.default">
            {wonBy}
          </Box>
          {earnedDate ? ` · ${earnedDate}` : ""}
        </Text>
      )}
    </VStack>
  );
}

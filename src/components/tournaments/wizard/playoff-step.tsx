"use client";

// "How is the champion decided?" — the playoff step. Playoffs sit on TOP of the
// round-robin table: the group stage produces standings, then a knockout (or
// none) decides the champion. Each option maps to the config-driven playoff
// engine via resolvePlayoffSelection; "Custom" opens the bracket builder.

import { Box, HStack, Text, VStack } from "@chakra-ui/react";
import type { IconType } from "react-icons";
import {
  LuCheck,
  LuChevronRight,
  LuGitBranch,
  LuGitFork,
  LuListOrdered,
  LuNetwork,
  LuSlidersHorizontal,
  LuSwords,
} from "react-icons/lu";
import type { PlayoffConfig } from "@/contexts/tournament-context/types";
import {
  resolvePlayoffSelection,
  type PlayoffSelection,
  type PlayoffTemplate,
} from "./playoff-designer";
import { CustomPlayoffBuilder } from "./custom-playoff-builder";

/** A playoff choice: no knockout, one of the presets, or a custom bracket. */
export type PlayoffChoice = "none" | PlayoffTemplate;

/** Fixed qualifier count each preset implies (custom carries its own). */
const QUALIFIERS: Record<Exclude<PlayoffChoice, "none" | "custom">, number> = {
  final: 2,
  "eliminator-final": 3,
  "world-cup": 4,
  league: 4,
};

interface OptionInfo {
  name: string;
  desc: string;
  /** One-line breakdown shown when the option is selected. */
  detail: string;
  icon: IconType;
}

const OPTIONS: Record<PlayoffChoice, OptionInfo> = {
  none: {
    name: "Table winner",
    desc: "Whoever tops the league is champion — no knockout.",
    detail: "No extra matches — the standings decide it.",
    icon: LuListOrdered,
  },
  final: {
    name: "Final",
    desc: "The top two meet in a single final.",
    detail: "1 match after the group stage: the Final.",
    icon: LuSwords,
  },
  "eliminator-final": {
    name: "Eliminator + Final",
    desc: "2nd v 3rd, then the winner faces 1st in the final.",
    detail: "2 matches: Eliminator, then the Final.",
    icon: LuGitFork,
  },
  "world-cup": {
    name: "Semis + Final",
    desc: "Top 4: 1v4 and 2v3 — the winners play the final.",
    detail: "3 matches: two semi-finals, then the Final.",
    icon: LuNetwork,
  },
  league: {
    name: "Double chance",
    desc: "IPL-style — the top two get a second shot at the final.",
    detail: "4 matches: Qualifier 1, Eliminator, Qualifier 2, Final.",
    icon: LuGitBranch,
  },
  custom: {
    name: "Custom bracket",
    desc: "Build the knockout exactly how you want it.",
    detail: "",
    icon: LuSlidersHorizontal,
  },
};

/** Which playoff choices make sense for a given number of teams. */
export function playoffChoices(teamCount: number): PlayoffChoice[] {
  const list: PlayoffChoice[] = ["none", "final"];
  if (teamCount === 3) list.push("eliminator-final");
  if (teamCount >= 4) list.push("world-cup", "league");
  list.push("custom");
  return list;
}

export function defaultPlayoffChoice(teamCount: number): PlayoffChoice {
  if (teamCount >= 4) return "world-cup";
  if (teamCount === 3) return "eliminator-final";
  return "final";
}

/** Resolve a choice (+ custom config) into what the engine/persistence need. */
export function choiceToSelection(
  choice: PlayoffChoice,
  custom: PlayoffConfig,
  teamCount: number,
): PlayoffSelection {
  if (choice === "none") {
    return resolvePlayoffSelection(0, "final", custom, teamCount);
  }
  const qualifiers = choice === "custom" ? custom.qualifiers : QUALIFIERS[choice];
  return resolvePlayoffSelection(qualifiers, choice, custom, teamCount);
}

interface PlayoffStepProps {
  teamCount: number;
  choice: PlayoffChoice;
  onChoice: (c: PlayoffChoice) => void;
  customConfig: PlayoffConfig;
  onCustomConfig: (c: PlayoffConfig) => void;
}

export function PlayoffStep({
  teamCount,
  choice,
  onChoice,
  customConfig,
  onCustomConfig,
}: PlayoffStepProps) {
  return (
    <VStack align="stretch" gap={2.5}>
      {playoffChoices(teamCount).map((c) => {
        const info = OPTIONS[c];
        const selected = choice === c;
        return (
          <OptionCard
            key={c}
            info={info}
            isCustom={c === "custom"}
            selected={selected}
            onClick={() => onChoice(c)}
          >
            {selected && c !== "custom" && info.detail && (
              <Box mt={2.5} pl="52px">
                <Text fontSize="xs" fontWeight="medium" color="colorPalette.fg">
                  {info.detail}
                </Text>
              </Box>
            )}
            {selected && c === "custom" && (
              <Box mt={3}>
                <CustomPlayoffBuilder
                  teamCount={teamCount}
                  value={customConfig}
                  onChange={onCustomConfig}
                  showQualifiers
                />
              </Box>
            )}
          </OptionCard>
        );
      })}
    </VStack>
  );
}

function OptionCard({
  info,
  isCustom,
  selected,
  onClick,
  children,
}: {
  info: OptionInfo;
  isCustom: boolean;
  selected: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}) {
  const Icon = info.icon;
  return (
    <Box
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      p={4}
      borderRadius="xl"
      borderWidth={selected ? 2 : 1}
      colorPalette="brand"
      borderColor={selected ? "colorPalette.500" : "border.default"}
      bg={selected ? { base: "brand.50", _dark: "brand.950" } : "card.bg"}
      cursor="pointer"
      transition="all 0.15s"
      _hover={selected ? {} : { borderColor: "colorPalette.300" }}
    >
      <HStack gap={3} align="center">
        <Box
          flexShrink={0}
          boxSize="40px"
          borderRadius="lg"
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg={selected ? "colorPalette.500" : "bg.emphasized"}
          color={selected ? "white" : "colorPalette.fg"}
          transition="all 0.15s"
        >
          <Icon size={20} />
        </Box>
        <Box flex="1" minW={0}>
          <Text fontFamily="heading" fontWeight="bold" fontSize="md" color="fg.default">
            {info.name}
          </Text>
          <Text fontSize="sm" color="fg.muted" lineHeight="1.4">
            {info.desc}
          </Text>
        </Box>
        <Box flexShrink={0} color={selected ? "colorPalette.500" : "fg.muted"} display="flex">
          {selected ? (
            <LuCheck size={18} />
          ) : isCustom ? (
            <LuChevronRight size={18} />
          ) : null}
        </Box>
      </HStack>
      {children}
    </Box>
  );
}

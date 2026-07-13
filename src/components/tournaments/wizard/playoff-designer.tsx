"use client";

import { Box, Card, HStack, Text, VStack } from "@chakra-ui/react";
import { LuCheck } from "react-icons/lu";
import type {
  PlayoffConfig,
  PlayoffFormat,
} from "@/contexts/tournament-context/types";
import {
  buildEliminatorFinalConfig,
  buildFinalOnlyConfig,
  buildLeagueConfig,
  buildWorldCupConfig,
} from "@/contexts/tournament-context/algorithms/playoff-engine";
import { validatePlayoffConfig } from "@/contexts/tournament-context/algorithms/playoff-config-validation";
import { CustomPlayoffBuilder } from "./custom-playoff-builder";

export type PlayoffTemplate =
  | "final"
  | "eliminator-final"
  | "world-cup"
  | "league"
  | "custom";

interface TemplateInfo {
  name: string;
  description: string;
}

const TEMPLATE_INFO: Record<PlayoffTemplate, TemplateInfo> = {
  final: {
    name: "Final",
    description: "1st plays 2nd — winner takes the title.",
  },
  "eliminator-final": {
    name: "Eliminator + Final",
    description: "2nd v 3rd in an eliminator; its winner faces 1st in the final.",
  },
  "world-cup": {
    name: "World Cup — Semis + Final",
    description: "SF1 (1v4), SF2 (2v3), then the Final. Straight knockout.",
  },
  league: {
    name: "League / IPL",
    description:
      "Qualifier 1, Eliminator, Qualifier 2, Final — the top two get a second chance.",
  },
  custom: {
    name: "Custom",
    description: "Design the bracket yourself.",
  },
};

/** Which templates make sense for a given number of qualifiers. */
export function templatesFor(qualifiers: number): PlayoffTemplate[] {
  if (qualifiers === 2) return ["final"];
  if (qualifiers === 3) return ["eliminator-final", "custom"];
  if (qualifiers === 4) return ["world-cup", "league", "custom"];
  return ["custom"]; // 5+
}

export function defaultTemplate(qualifiers: number): PlayoffTemplate {
  return templatesFor(qualifiers)[0] ?? "final";
}

export interface PlayoffSelection {
  format: PlayoffFormat;
  /** Explicit config to persist; null lets the engine build from `format`. */
  config: PlayoffConfig | null;
  label: string;
  valid: boolean;
}

/**
 * Resolve the qualifiers + template choice into what the engine needs. Presets
 * with a matching format enum pass a null config (the engine rebuilds them);
 * the 3-team eliminator and hand-built brackets carry an explicit config.
 */
export function resolvePlayoffSelection(
  qualifiers: number,
  template: PlayoffTemplate,
  custom: PlayoffConfig,
  teamCount: number,
): PlayoffSelection {
  if (qualifiers === 0) {
    return {
      format: "none",
      config: null,
      label: "No playoffs — table topper wins",
      valid: true,
    };
  }
  switch (template) {
    case "final":
      return {
        format: "final-only",
        config: buildFinalOnlyConfig(),
        label: "Final (top 2)",
        valid: true,
      };
    case "eliminator-final":
      return {
        format: "custom",
        config: buildEliminatorFinalConfig(),
        label: "Eliminator + Final (top 3)",
        valid: true,
      };
    case "world-cup":
      return {
        format: "world-cup",
        config: buildWorldCupConfig(teamCount),
        label: "World Cup — Semis + Final (top 4)",
        valid: true,
      };
    case "league":
      return {
        format: "league",
        config: buildLeagueConfig(teamCount),
        label: "League/IPL — Q1, Eliminator, Q2, Final (top 4)",
        valid: true,
      };
    case "custom": {
      const config = { ...custom, qualifiers };
      return {
        format: "custom",
        config,
        label: "Custom bracket",
        valid: validatePlayoffConfig(config, teamCount).valid,
      };
    }
  }
}

interface PlayoffDesignerProps {
  teamCount: number;
  qualifiers: number;
  template: PlayoffTemplate;
  customConfig: PlayoffConfig;
  onQualifiersChange: (n: number) => void;
  onTemplateChange: (t: PlayoffTemplate) => void;
  onCustomConfigChange: (c: PlayoffConfig) => void;
}

export function PlayoffDesigner({
  teamCount,
  qualifiers,
  template,
  customConfig,
  onQualifiersChange,
  onTemplateChange,
  onCustomConfigChange,
}: PlayoffDesignerProps) {
  const templates = templatesFor(qualifiers);

  return (
    <VStack align="stretch" gap={5}>
      {/* How many qualify */}
      <Box>
        <Text fontSize="sm" fontWeight="medium" mb={2} color="fg.default">
          How many teams qualify for playoffs?
        </Text>
        <HStack gap={2} flexWrap="wrap">
          <QualifierChip
            active={qualifiers === 0}
            onClick={() => onQualifiersChange(0)}
          >
            None
          </QualifierChip>
          {Array.from({ length: Math.max(0, teamCount - 1) }, (_, i) => i + 2).map(
            (n) => (
              <QualifierChip
                key={n}
                active={qualifiers === n}
                onClick={() => onQualifiersChange(n)}
              >
                {n}
              </QualifierChip>
            ),
          )}
        </HStack>
        <Text fontSize="xs" color="fg.muted" mt={1.5}>
          {qualifiers === 0
            ? "The team that tops the standings is the champion."
            : `Top ${qualifiers} of ${teamCount} teams reach the playoffs.`}
        </Text>
      </Box>

      {/* Structure */}
      {qualifiers >= 2 && (
        <Box>
          <Text fontSize="sm" fontWeight="medium" mb={2} color="fg.default">
            Playoff structure
          </Text>
          <VStack align="stretch" gap={2.5}>
            {templates.map((t) => (
              <TemplateCard
                key={t}
                info={TEMPLATE_INFO[t]}
                selected={template === t}
                onClick={() => onTemplateChange(t)}
              />
            ))}
          </VStack>
        </Box>
      )}

      {/* Custom builder */}
      {qualifiers >= 2 && template === "custom" && (
        <Box>
          <Text fontSize="sm" color="fg.muted" mb={3}>
            Add matches and fill each side from a seed or another match&apos;s
            result. Mark exactly one match as the final.
          </Text>
          <CustomPlayoffBuilder
            teamCount={teamCount}
            value={{ ...customConfig, qualifiers }}
            onChange={onCustomConfigChange}
            showQualifiers={false}
          />
        </Box>
      )}
    </VStack>
  );
}

function TemplateCard({
  info,
  selected,
  onClick,
}: {
  info: TemplateInfo;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <Card.Root
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      w="full"
      borderWidth={2}
      borderRadius="lg"
      cursor="pointer"
      colorPalette="blue"
      borderColor={selected ? "colorPalette.500" : "border.default"}
      bg={selected ? { base: "blue.50", _dark: "blue.950" } : "card.bg"}
      transition="all 0.15s"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      _hover={selected ? {} : { borderColor: "colorPalette.300" }}
    >
      <Card.Body p={3.5}>
        <HStack justify="space-between" align="flex-start" gap={3}>
          <Box>
            <Text fontWeight="bold" fontSize="sm" color="fg.default" mb={0.5}>
              {info.name}
            </Text>
            <Text fontSize="xs" color="fg.muted" lineHeight="1.4">
              {info.description}
            </Text>
          </Box>
          <Box
            flexShrink={0}
            boxSize={5}
            borderRadius="full"
            borderWidth={2}
            borderColor={selected ? "colorPalette.500" : "border.emphasized"}
            bg={selected ? "colorPalette.500" : "transparent"}
            color="white"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            {selected && <LuCheck size={12} strokeWidth={3} />}
          </Box>
        </HStack>
      </Card.Body>
    </Card.Root>
  );
}

function QualifierChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Box
      as="button"
      onClick={onClick}
      colorPalette="blue"
      minW="44px"
      px={3}
      py={2}
      borderRadius="md"
      borderWidth={1}
      fontSize="sm"
      fontWeight="medium"
      cursor="pointer"
      transition="all 0.12s"
      borderColor={active ? "colorPalette.500" : "border.default"}
      bg={active ? "colorPalette.500" : "card.bg"}
      color={active ? "white" : "fg.default"}
      _hover={active ? {} : { borderColor: "colorPalette.300" }}
    >
      {children}
    </Box>
  );
}

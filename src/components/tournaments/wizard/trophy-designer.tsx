"use client";

import { Box, Grid, HStack, Input, Text, VStack } from "@chakra-ui/react";
import type {
  TrophyConfig,
  TrophyMetal,
} from "@/contexts/tournament-context/types";
import { TrophyBadge } from "@/components/trophies/trophy-badge";
import { TROPHY_SHAPES } from "@/components/trophies/trophy-art";

const METALS: { id: TrophyMetal; label: string; swatch: string }[] = [
  { id: "gold", label: "Gold", swatch: "#e6b23a" },
  { id: "silver", label: "Silver", swatch: "#c4ccd6" },
  { id: "bronze", label: "Bronze", swatch: "#bd7b3f" },
  { id: "custom", label: "Custom", swatch: "" },
];

const GROUPS = ["Cups", "Challenge"] as const;

interface TrophyDesignerProps {
  config: TrophyConfig;
  onChange: (config: TrophyConfig) => void;
}

export function TrophyDesigner({ config, onChange }: TrophyDesignerProps) {
  const set = (patch: Partial<TrophyConfig>) => onChange({ ...config, ...patch });

  return (
    <VStack align="stretch" gap={6}>
      {/* Live preview */}
      <Box
        py={6}
        borderRadius="xl"
        borderWidth="1px"
        borderColor="border.default"
        bg="bg.subtle"
      >
        <TrophyBadge config={config} size="lg" showWonBy={false} />
      </Box>

      {/* Shape — grouped Cups / Challenge, each a real trophy thumbnail */}
      <Box>
        <Text fontSize="sm" fontWeight="medium" mb={2} color="fg.default">
          Shape
        </Text>
        <VStack align="stretch" gap={4}>
          {GROUPS.map((group) => (
            <Box key={group}>
              <Text
                fontSize="xs"
                fontWeight="semibold"
                letterSpacing="0.05em"
                textTransform="uppercase"
                color="fg.muted"
                mb={2}
              >
                {group}
              </Text>
              <Grid templateColumns="repeat(3, 1fr)" gap={2}>
                {TROPHY_SHAPES.filter((s) => s.group === group).map(
                  ({ id, label }) => {
                    const selected = config.shape === id;
                    return (
                      <Box
                        key={id}
                        as="button"
                        aria-pressed={selected}
                        onClick={() => set({ shape: id })}
                        py={3}
                        borderRadius="lg"
                        borderWidth={selected ? 2 : 1}
                        colorPalette="brand"
                        borderColor={
                          selected ? "colorPalette.500" : "border.default"
                        }
                        bg={
                          selected
                            ? { base: "brand.50", _dark: "brand.950" }
                            : "card.bg"
                        }
                        cursor="pointer"
                        transition="all 0.15s"
                        _hover={
                          !selected ? { borderColor: "colorPalette.300" } : {}
                        }
                      >
                        <VStack gap={1.5}>
                          <TrophyBadge
                            config={{ ...config, shape: id }}
                            size="sm"
                            showWonBy={false}
                          />
                          <Text
                            fontSize="2xs"
                            fontWeight="medium"
                            color={selected ? "colorPalette.600" : "fg.muted"}
                          >
                            {label}
                          </Text>
                        </VStack>
                      </Box>
                    );
                  },
                )}
              </Grid>
            </Box>
          ))}
        </VStack>
      </Box>

      {/* Metal / color */}
      <Box>
        <Text fontSize="sm" fontWeight="medium" mb={2} color="fg.default">
          Finish
        </Text>
        <HStack gap={2} flexWrap="wrap">
          {METALS.map(({ id, label, swatch }) => {
            const selected = config.metal === id;
            const isCustom = id === "custom";
            return (
              <Box
                key={id}
                as="button"
                aria-pressed={selected}
                onClick={() => set({ metal: id })}
                px={3}
                py={2}
                borderRadius="lg"
                borderWidth={selected ? 2 : 1}
                colorPalette="brand"
                borderColor={selected ? "colorPalette.500" : "border.default"}
                bg="card.bg"
                cursor="pointer"
                transition="all 0.15s"
                _hover={!selected ? { borderColor: "colorPalette.300" } : {}}
              >
                <HStack gap={2}>
                  <Box
                    w="18px"
                    h="18px"
                    borderRadius="full"
                    borderWidth="1px"
                    borderColor="whiteAlpha.600"
                    style={{
                      background: isCustom
                        ? `linear-gradient(150deg, rgba(255,255,255,0.55), rgba(0,0,0,0.28)), ${config.color || "#8b5cf6"}`
                        : `linear-gradient(150deg, rgba(255,255,255,0.55), rgba(0,0,0,0.28)), ${swatch}`,
                    }}
                  />
                  <Text fontSize="sm" fontWeight="medium" color="fg.default">
                    {label}
                  </Text>
                </HStack>
              </Box>
            );
          })}
        </HStack>
        {config.metal === "custom" && (
          <HStack gap={3} mt={3} align="center">
            <Input
              type="color"
              value={config.color || "#8b5cf6"}
              onChange={(e) => set({ color: e.target.value })}
              w="52px"
              h="40px"
              p={1}
              cursor="pointer"
            />
            <Text fontSize="sm" color="fg.muted">
              Pick your team color
            </Text>
          </HStack>
        )}
      </Box>
    </VStack>
  );
}

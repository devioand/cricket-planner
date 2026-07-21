"use client";

import { useState } from "react";
import NextLink from "next/link";
import {
  Box,
  CloseButton,
  Dialog,
  Grid,
  HStack,
  Portal,
  Text,
  VStack,
} from "@chakra-ui/react";
import { LuMedal } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { TrophyBadge } from "@/components/trophies/trophy-badge";
import { useClub } from "@/lib/clubs/use-club";
import type { TrophyConfig } from "@/contexts/tournament-context/types";

export interface CabinetTrophy {
  id: string;
  name: string;
  winner: string;
  /** ISO date the tournament was completed. */
  wonAt: string;
  config: TrophyConfig;
}

/** A derived, cross-competition honour (e.g. most titles). */
export interface CabinetAward {
  key: string;
  title: string;
  subtitle: string;
  who: string;
}

// A warm "club room" case — maroon-tinted charcoal with gold trim, matching the
// Matchday identity. The interior stays dark in both themes so the metals read.
const CASE_BG =
  "radial-gradient(135% 92% at 50% 0%, #341F27 0%, #1C1216 52%, #0E0A0C 100%)";
const GOLD_EDGE =
  "linear-gradient(180deg, #EBCB80 0%, #C7A24C 46%, #8A6D2C 100%)";
const GLOW =
  "radial-gradient(60% 55% at 50% 42%, rgba(207,162,76,0.28) 0%, rgba(207,162,76,0.05) 45%, transparent 68%)";
const CASE_INK = "#F2ECE8";
const CASE_MUTED = "#AC9C93";
const CASE_FAINT = "#6E6058";
const GOLD = "#D8B273";
const CASE_LINE = "rgba(216,178,115,0.16)";

const PER_SHELF = 3;

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function TrophyCabinet({
  trophies,
  awards = [],
}: {
  trophies: CabinetTrophy[];
  awards?: CabinetAward[];
}) {
  const { club } = useClub();
  const [open, setOpen] = useState<CabinetTrophy | null>(null);

  const champions = new Set(trophies.map((t) => t.winner)).size;
  const [featured, ...rest] = trophies; // trophies arrive most-recent first

  return (
    <VStack align="stretch" gap={5}>
      {/* Header */}
      <VStack align="stretch" gap={1}>
        <Text
          fontFamily="heading"
          fontSize={{ base: "2xl", md: "3xl" }}
          fontWeight="bold"
          lineHeight="1.1"
          letterSpacing="-0.01em"
        >
          {club?.name ?? "Cabinet"}
        </Text>
        <Text fontSize="sm" color="fg.muted">
          {trophies.length > 0
            ? `${trophies.length} ${trophies.length === 1 ? "trophy" : "trophies"} · ${champions} ${champions === 1 ? "champion" : "champions"}`
            : "The shelf is bare — for now."}
        </Text>
      </VStack>

      {trophies.length === 0 ? (
        <EmptyCase />
      ) : (
        <Box
          borderRadius="2xl"
          overflow="hidden"
          background={CASE_BG}
          borderWidth="1px"
          borderColor={CASE_LINE}
        >
          <HStack justify="space-between" align="baseline" px={4} pt={4}>
            <Text
              fontFamily="mono"
              fontSize="2xs"
              letterSpacing="0.18em"
              textTransform="uppercase"
              color={CASE_MUTED}
            >
              Trophies
            </Text>
            <Text
              fontFamily="heading"
              fontWeight="bold"
              fontSize="lg"
              color={GOLD}
            >
              {trophies.length}
            </Text>
          </HStack>

          {/* The most recent win, spotlit. */}
          <Featured trophy={featured} onOpen={() => setOpen(featured)} />

          {/* Everything else, on shelves. */}
          {rest.length > 0 &&
            chunk(rest, PER_SHELF).map((row, i) => (
              <Shelf key={i} row={row} onOpen={setOpen} />
            ))}
        </Box>
      )}

      {awards.length > 0 && (
        <VStack align="stretch" gap={2.5}>
          <Text
            fontFamily="mono"
            fontSize="xs"
            letterSpacing="0.12em"
            textTransform="uppercase"
            color="fg.subtle"
          >
            Awards
          </Text>
          {awards.map((a) => (
            <AwardRow key={a.key} award={a} />
          ))}
        </VStack>
      )}

      <TrophyDetail trophy={open} onClose={() => setOpen(null)} />
    </VStack>
  );
}

function Featured({
  trophy,
  onOpen,
}: {
  trophy: CabinetTrophy;
  onOpen: () => void;
}) {
  return (
    <Box position="relative" px={4} pt={2} pb={5}>
      {/* Gold spotlight behind the trophy. */}
      <Box
        position="absolute"
        inset={0}
        background={GLOW}
        pointerEvents="none"
      />
      <VStack position="relative" gap={2}>
        <Text
          fontFamily="mono"
          fontSize="2xs"
          letterSpacing="0.2em"
          textTransform="uppercase"
          color={GOLD}
        >
          ★ Latest win
        </Text>
        <Box
          as="button"
          onClick={onOpen}
          aria-label={`${trophy.name}, won by ${trophy.winner}`}
          transition="transform 0.18s"
          _hover={{ transform: "translateY(-3px)" }}
          _focusVisible={{ outline: `2px solid ${GOLD}`, outlineOffset: "4px", borderRadius: "8px" }}
        >
          <TrophyBadge config={trophy.config} size="lg" showWonBy={false} />
        </Box>
        <VStack gap={0.5}>
          {/* The champion is the point — biggest line. */}
          <Text
            fontFamily="heading"
            fontWeight="bold"
            fontSize="2xl"
            color={CASE_INK}
            textAlign="center"
            lineHeight="1.1"
          >
            {trophy.winner}
          </Text>
          <Text fontSize="sm" color={GOLD} fontWeight="medium" textAlign="center">
            {trophy.name}
          </Text>
          <Text fontSize="xs" color={CASE_FAINT}>
            {shortDate(trophy.wonAt)}
          </Text>
        </VStack>
      </VStack>
    </Box>
  );
}

function Shelf({
  row,
  onOpen,
}: {
  row: CabinetTrophy[];
  onOpen: (t: CabinetTrophy) => void;
}) {
  return (
    <Box px={3}>
      <Grid
        templateColumns={`repeat(${PER_SHELF}, 1fr)`}
        alignItems="end"
        gap={1}
        px={1}
      >
        {row.map((t) => (
          <Box
            key={t.id}
            as="button"
            onClick={() => onOpen(t)}
            aria-label={`${t.name}, won by ${t.winner}`}
            display="flex"
            justifyContent="center"
            alignItems="flex-end"
            borderRadius="md"
            transition="transform 0.18s"
            _hover={{ transform: "translateY(-3px)" }}
            _focusVisible={{ outline: `2px solid ${GOLD}`, outlineOffset: "3px" }}
          >
            <TrophyBadge config={t.config} size="sm" showWonBy={false} />
          </Box>
        ))}
      </Grid>

      {/* Gold shelf edge — the trophies sit on this. */}
      <Box h="5px" mx={0.5} mt={1} borderRadius="sm" background={GOLD_EDGE} />

      {/* Museum-style labels, below the shelf. */}
      <Grid
        templateColumns={`repeat(${PER_SHELF}, 1fr)`}
        gap={1}
        px={1}
        pt={2}
        pb={5}
      >
        {row.map((t) => (
          <VStack key={t.id} gap={0.5} minW={0} textAlign="center">
            {/* Winner leads; the competition is the small caption under it. */}
            <Text
              fontSize="13px"
              fontWeight="semibold"
              lineHeight="1.2"
              color={CASE_INK}
              lineClamp={2}
              maxW="full"
            >
              {t.winner}
            </Text>
            <Text
              fontSize="9px"
              letterSpacing="0.06em"
              textTransform="uppercase"
              color={CASE_MUTED}
              truncate
              maxW="full"
            >
              {t.name}
            </Text>
          </VStack>
        ))}
      </Grid>
    </Box>
  );
}

function EmptyCase() {
  return (
    <Box
      borderRadius="2xl"
      overflow="hidden"
      background={CASE_BG}
      borderWidth="1px"
      borderColor={CASE_LINE}
      px={3}
      pt={6}
    >
      <Grid templateColumns={`repeat(${PER_SHELF}, 1fr)`} alignItems="end" gap={1} px={1}>
        {(["classic", "grand", "star"] as const).map((shape) => (
          <Box key={shape} display="flex" justifyContent="center" opacity={0.14}>
            <TrophyBadge config={{ shape, metal: "gold" }} size="sm" showWonBy={false} />
          </Box>
        ))}
      </Grid>
      <Box h="5px" mx={0.5} mt={1} borderRadius="sm" background={GOLD_EDGE} />
      <VStack gap={4} px={5} pt={6} pb={7} textAlign="center">
        <Text fontSize="sm" color={CASE_MUTED} maxW="280px">
          Win a competition and it lands here — engraved with the champion.
        </Text>
        <NextLink href="/tournaments/new" style={{ width: "100%" }}>
          <Button colorPalette="brand" size="md" w="full" h="44px">
            Start playing
          </Button>
        </NextLink>
      </VStack>
    </Box>
  );
}

function AwardRow({ award }: { award: CabinetAward }) {
  return (
    <HStack gap={3} borderWidth="1px" borderColor="border.default" borderRadius="xl" p={3}>
      <Box
        flexShrink={0}
        w="34px"
        h="34px"
        borderRadius="lg"
        display="grid"
        placeItems="center"
        bg={{ base: "gold.50", _dark: "gold.900" }}
        color={{ base: "gold.600", _dark: "gold.300" }}
      >
        <LuMedal size={17} />
      </Box>
      <Box flex="1" minW={0}>
        <Text fontWeight="semibold" fontSize="sm">
          {award.title}
        </Text>
        <Text fontSize="xs" color="fg.muted">
          {award.subtitle}
        </Text>
      </Box>
      <Text fontFamily="heading" fontWeight="bold" fontSize="sm" whiteSpace="nowrap">
        {award.who}
      </Text>
    </HStack>
  );
}

function TrophyDetail({
  trophy,
  onClose,
}: {
  trophy: CabinetTrophy | null;
  onClose: () => void;
}) {
  return (
    <Dialog.Root open={!!trophy} onOpenChange={(e) => !e.open && onClose()}>
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <Dialog.Positioner>
          <Dialog.Content
            maxW="360px"
            borderRadius="2xl"
            p={0}
            overflow="hidden"
            background={CASE_BG}
            borderWidth="1px"
            borderColor={CASE_LINE}
            boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.5)"
          >
            <Dialog.CloseTrigger asChild>
              <CloseButton
                position="absolute"
                top={3}
                right={3}
                zIndex={2}
                size="sm"
                color={CASE_MUTED}
                _hover={{ color: CASE_INK, bg: "whiteAlpha.100" }}
              />
            </Dialog.CloseTrigger>
            {trophy && (
              <Box position="relative" px={5} pt={7} pb={6}>
                <Box position="absolute" inset={0} background={GLOW} pointerEvents="none" />
                <VStack position="relative" gap={3}>
                  <TrophyBadge config={trophy.config} size="lg" showWonBy={false} />
                  <VStack gap={1}>
                    <Text
                      fontFamily="heading"
                      fontSize="xl"
                      fontWeight="bold"
                      textAlign="center"
                      color={CASE_INK}
                    >
                      {trophy.name}
                    </Text>
                    <HStack gap={1.5} color={GOLD}>
                      <LuMedal size={15} />
                      <Text fontSize="sm" fontWeight="medium">
                        {trophy.winner}
                      </Text>
                    </HStack>
                    <Text fontSize="xs" color={CASE_FAINT}>
                      {new Date(trophy.wonAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </Text>
                  </VStack>
                </VStack>
              </Box>
            )}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

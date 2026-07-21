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

/**
 * The case interior is deliberately dark in BOTH themes — a real display
 * cabinet has its own interior, and it keeps gold/silver/bronze on a ground
 * that flatters them. Inverting it for light mode makes silver disappear.
 */
const CASE_BG =
  "radial-gradient(120% 70% at 50% 0%, #1D2B24 0%, #16211C 58%, #0D1512 100%)";
const SHELF_EDGE =
  "linear-gradient(180deg, #D8B273 0%, #A8853F 45%, #7E6130 100%)";
const CASE_INK = "#E9EFE8";
const CASE_MUTED = "#8FA096";
const CASE_FAINT = "#63736A";

const PER_SHELF = 3;

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function formatDate(iso: string): string {
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

  return (
    <VStack align="stretch" gap={5}>
      <VStack align="stretch" gap={1}>
        <Text
          fontFamily="heading"
          fontSize={{ base: "2xl", md: "3xl" }}
          fontWeight="bold"
          lineHeight="1.15"
        >
          {club?.name ?? "Cabinet"}
        </Text>
        <Text fontSize="sm" color="fg.muted">
          {trophies.length > 0
            ? `${trophies.length} ${trophies.length === 1 ? "trophy" : "trophies"} won`
            : "Nothing won yet."}
        </Text>
      </VStack>

      <Box borderRadius="xl" overflow="hidden" background={CASE_BG} pt={4} pb={1}>
        <HStack justify="space-between" align="baseline" px={4} pb={4}>
          <Text
            fontSize="xs"
            letterSpacing="0.16em"
            textTransform="uppercase"
            color={CASE_MUTED}
          >
            Silverware
          </Text>
          <Text fontSize="lg" color="#D8B273" fontWeight="semibold">
            {trophies.length}
          </Text>
        </HStack>

        {trophies.length === 0 ? (
          <EmptyShelf />
        ) : (
          chunk(trophies, PER_SHELF).map((row, i) => (
            <Shelf key={i} row={row} onOpen={setOpen} />
          ))
        )}
      </Box>

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

function AwardRow({ award }: { award: CabinetAward }) {
  return (
    <HStack
      gap={3}
      borderWidth="1px"
      borderColor="border.default"
      borderRadius="xl"
      p={3}
    >
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
      <Text
        fontFamily="heading"
        fontWeight="bold"
        fontSize="sm"
        whiteSpace="nowrap"
      >
        {award.who}
      </Text>
    </HStack>
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
      <Grid templateColumns={`repeat(${PER_SHELF}, 1fr)`} alignItems="end" gap={1} px={1}>
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
            _focusVisible={{ outline: "2px solid #D8B273", outlineOffset: "3px" }}
          >
            <TrophyBadge config={t.config} size="sm" showWonBy={false} />
          </Box>
        ))}
      </Grid>

      {/* Brass shelf edge — the trophies sit on this. */}
      <Box h="5px" mx={0.5} mt={1} borderRadius="sm" background={SHELF_EDGE} />

      {/* Museum-style labels, below the shelf rather than beside the trophy. */}
      <Grid templateColumns={`repeat(${PER_SHELF}, 1fr)`} gap={1} px={1} pt={2} pb={5}>
        {row.map((t) => (
          <VStack key={t.id} gap={0} minW={0} textAlign="center">
            <Text
              fontSize="10px"
              letterSpacing="0.07em"
              textTransform="uppercase"
              color={CASE_INK}
              truncate
              maxW="full"
            >
              {t.name}
            </Text>
            <Text fontSize="xs" color={CASE_MUTED} lineHeight="1.3" truncate maxW="full">
              {t.winner}
            </Text>
            <Text fontSize="10px" color={CASE_FAINT}>
              {formatDate(t.wonAt)}
            </Text>
          </VStack>
        ))}
      </Grid>
    </Box>
  );
}

function EmptyShelf() {
  return (
    <Box px={3}>
      <Grid templateColumns={`repeat(${PER_SHELF}, 1fr)`} alignItems="end" gap={1} px={1}>
        {(["classic", "grand", "star"] as const).map((shape) => (
          <Box key={shape} display="flex" justifyContent="center" opacity={0.16}>
            <TrophyBadge
              config={{ shape, metal: "silver" }}
              size="sm"
              showWonBy={false}
            />
          </Box>
        ))}
      </Grid>
      <Box h="5px" mx={0.5} mt={1} borderRadius="sm" background={SHELF_EDGE} />
      <VStack gap={4} px={5} pt={5} pb={6} textAlign="center">
        <Text fontSize="sm" color={CASE_MUTED} maxW="280px">
          The shelf is empty. Win a tournament and it lands here.
        </Text>
        <NextLink href="/tournaments/new" style={{ width: "100%" }}>
          <Button colorPalette="brand" size="md" w="full" h="44px">
            Start a tournament
          </Button>
        </NextLink>
      </VStack>
    </Box>
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
        <Dialog.Backdrop bg="blackAlpha.500" backdropFilter="blur(4px)" />
        <Dialog.Positioner>
          <Dialog.Content
            maxW="380px"
            bg="dialog.bg"
            borderRadius="xl"
            p={5}
            boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
          >
            <Dialog.CloseTrigger asChild>
              <CloseButton
                position="absolute"
                top={3}
                right={3}
                size="sm"
                color="fg.muted"
                _hover={{ color: "fg.default", bg: "bg.subtle" }}
              />
            </Dialog.CloseTrigger>
            {trophy && (
              <VStack gap={3} pt={2}>
                <TrophyBadge
                  config={trophy.config}
                  size="lg"
                  wonBy={trophy.winner}
                  showWonBy={false}
                />
                <VStack gap={0.5}>
                  <Text fontSize="xl" fontWeight="bold" textAlign="center">
                    {trophy.name}
                  </Text>
                  <Text fontSize="sm" color="fg.muted" textAlign="center">
                    🏅 Won by {trophy.winner}
                  </Text>
                  <Text fontSize="xs" color="fg.subtle" textAlign="center">
                    {new Date(trophy.wonAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </Text>
                </VStack>
              </VStack>
            )}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

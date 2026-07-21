"use client";

import NextLink from "next/link";
import { Box, HStack, Link, Text, Wrap, WrapItem } from "@chakra-ui/react";
import { LuCheck, LuUsers } from "react-icons/lu";
import { ClubStore } from "@/lib/clubs/club-store";
import { useClub } from "@/lib/clubs/use-club";

interface ClubPlayerPickerProps {
  /** The wizard's team names — a picked player is simply a team name. */
  teams: string[];
  onChange: (teams: string[]) => void;
  max: number;
}

/**
 * Tap who turned up. Club players are matched to team names case-insensitively,
 * so a name typed by hand still reads as "picked", and a picked name that's
 * later edited in the list below just stops matching rather than breaking.
 *
 * This is the whole point of the saved player list: at the ground you tap six
 * names instead of typing them.
 */
export function ClubPlayerPicker({ teams, onChange, max }: ClubPlayerPickerProps) {
  const { club, hydrated } = useClub();

  if (!hydrated) return null;

  if (!club || club.players.length === 0) {
    return (
      <Box
        borderWidth="1px"
        borderStyle="dashed"
        borderColor="border.default"
        borderRadius="lg"
        px={4}
        py={3}
      >
        <HStack gap={2} color="fg.muted">
          <LuUsers />
          <Text fontSize="sm">
            Save your regular players in your{" "}
            <Link asChild color="brand.500" fontWeight="medium">
              <NextLink href="/club">club</NextLink>
            </Link>{" "}
            and you can tap them here instead of typing.
          </Text>
        </HStack>
      </Box>
    );
  }

  const picked = new Set(teams.map((t) => t.trim().toLowerCase()));
  const players = ClubStore.byRecency(club.players);
  const atCapacity = teams.length >= max;

  const toggle = (name: string) => {
    const key = name.toLowerCase();
    if (picked.has(key)) {
      onChange(teams.filter((t) => t.trim().toLowerCase() !== key));
      return;
    }
    if (atCapacity) return;
    onChange([...teams, name]);
  };

  return (
    <Box>
      <HStack justify="space-between" align="baseline" mb={2.5}>
        <Text fontSize="sm" fontWeight="medium">
          Who&apos;s playing?
        </Text>
        <Text fontSize="xs" color="fg.muted">
          {teams.length} of {max} picked
        </Text>
      </HStack>

      <Wrap gap={2}>
        {players.map((p) => {
          const isPicked = picked.has(p.name.toLowerCase());
          const disabled = !isPicked && atCapacity;
          return (
            <WrapItem key={p.id}>
              <Box
                as="button"
                onClick={() => toggle(p.name)}
                aria-disabled={disabled}
                aria-pressed={isPicked}
                h="44px"
                px={4}
                borderRadius="full"
                borderWidth="1px"
                display="flex"
                alignItems="center"
                gap={1.5}
                cursor={disabled ? "not-allowed" : "pointer"}
                opacity={disabled ? 0.45 : 1}
                transition="all 0.15s"
                bg={isPicked ? "brand.500" : "card.bg"}
                color={isPicked ? "white" : "fg.default"}
                borderColor={isPicked ? "brand.500" : "card.border"}
                _hover={disabled ? {} : { borderColor: "brand.300" }}
              >
                {isPicked && <LuCheck size={15} />}
                <Text fontSize="sm" fontWeight="medium">
                  {p.name}
                </Text>
              </Box>
            </WrapItem>
          );
        })}
      </Wrap>

      {atCapacity && (
        <Text fontSize="xs" color="fg.muted" mt={2}>
          That&apos;s the maximum of {max} teams.
        </Text>
      )}
    </Box>
  );
}

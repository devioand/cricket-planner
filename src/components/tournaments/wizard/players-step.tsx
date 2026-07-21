"use client";

// "Who's playing?" — pick who turned up from the club, as tappable cards.
// Adding a name saves it to the club (so it's there next time) and selects it.

import { useState } from "react";
import { Box, Grid, HStack, Input, Text, VStack } from "@chakra-ui/react";
import { LuCheck, LuPlus, LuUserPlus } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { clubStore, ClubStore } from "@/lib/clubs/club-store";
import { useClub } from "@/lib/clubs/use-club";
import { MAX_PLAYER_NAME_LENGTH } from "@/lib/clubs/types";

interface PlayersStepProps {
  selected: string[];
  onChange: (next: string[]) => void;
  max: number;
}

export function PlayersStep({ selected, onChange, max }: PlayersStepProps) {
  const { club, hydrated } = useClub();
  const [adding, setAdding] = useState(false);
  const [nameInput, setNameInput] = useState("");

  if (!hydrated) return null;

  const players = club ? ClubStore.byRecency(club.players) : [];
  const picked = new Set(selected.map((s) => s.toLowerCase()));
  const atCapacity = selected.length >= max;

  const toggle = (name: string) => {
    const key = name.toLowerCase();
    if (picked.has(key)) {
      onChange(selected.filter((s) => s.trim().toLowerCase() !== key));
    } else if (!atCapacity) {
      onChange([...selected, name]);
    }
  };

  const commitAdd = () => {
    const name = nameInput.trim();
    if (!name) return;
    clubStore.ensure();
    clubStore.addPlayer(name); // no-op if the name already exists
    if (!picked.has(name.toLowerCase()) && !atCapacity) {
      onChange([...selected, name]);
    }
    setNameInput("");
    setAdding(false);
  };

  const empty = players.length === 0;

  return (
    <VStack align="stretch" gap={4}>
      <HStack justify="space-between" align="baseline">
        <Text fontSize="sm" color="fg.muted">
          <Text as="span" fontWeight="semibold" color="fg.default">
            {selected.length}
          </Text>{" "}
          selected
        </Text>
        {selected.length > 0 && (
          <Box
            as="button"
            onClick={() => onChange([])}
            color="brand.fg"
            fontSize="xs"
            fontWeight="semibold"
          >
            Clear
          </Box>
        )}
      </HStack>

      {empty && !adding && (
        <VStack
          align="center"
          gap={2}
          py={8}
          px={4}
          borderWidth="1px"
          borderStyle="dashed"
          borderColor="border.default"
          borderRadius="xl"
          color="fg.muted"
        >
          <LuUserPlus size={22} />
          <Text fontSize="sm" textAlign="center">
            No players saved yet. Add the people you play with — you&apos;ll just
            tap them next time.
          </Text>
        </VStack>
      )}

      {!empty && (
        <Grid templateColumns={{ base: "repeat(2, 1fr)", sm: "repeat(3, 1fr)" }} gap={2.5}>
          {players.map((p) => {
            const isPicked = picked.has(p.name.toLowerCase());
            return (
              <PlayerCard
                key={p.id}
                name={p.name}
                picked={isPicked}
                disabled={!isPicked && atCapacity}
                onClick={() => toggle(p.name)}
              />
            );
          })}
          {!adding && !atCapacity && (
            <Box
              as="button"
              onClick={() => setAdding(true)}
              minH="60px"
              borderWidth="1px"
              borderStyle="dashed"
              borderColor="border.default"
              borderRadius="xl"
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              gap={1}
              color="brand.fg"
              cursor="pointer"
              transition="all 0.15s"
              _hover={{ borderColor: "brand.400" }}
            >
              <LuPlus size={18} />
              <Text fontSize="xs" fontWeight="medium">
                Add player
              </Text>
            </Box>
          )}
        </Grid>
      )}

      {(adding || empty) && (
        <HStack gap={2}>
          <Input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitAdd();
              if (e.key === "Escape") {
                setAdding(false);
                setNameInput("");
              }
            }}
            placeholder="Player name"
            maxLength={MAX_PLAYER_NAME_LENGTH}
            size="lg"
            autoFocus
            bg="input.bg"
            borderColor="input.border"
            color="fg.default"
            _placeholder={{ color: "fg.placeholder" }}
            _focus={{
              borderColor: "input.focusBorder",
              boxShadow: "0 0 0 1px var(--colors-input-focus-border)",
            }}
          />
          <Button onClick={commitAdd} disabled={!nameInput.trim()} minW="80px">
            Add
          </Button>
        </HStack>
      )}

      {atCapacity && (
        <Text fontSize="xs" color="fg.muted">
          That&apos;s the most players for one tournament ({max}).
        </Text>
      )}
    </VStack>
  );
}

function PlayerCard({
  name,
  picked,
  disabled,
  onClick,
}: {
  name: string;
  picked: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Box
      as="button"
      onClick={onClick}
      aria-pressed={picked}
      aria-disabled={disabled}
      minH="60px"
      px={3}
      py={2.5}
      borderRadius="xl"
      borderWidth={picked ? 2 : 1}
      colorPalette="brand"
      borderColor={picked ? "colorPalette.500" : "card.border"}
      bg={picked ? { base: "brand.50", _dark: "brand.950" } : "card.bg"}
      opacity={disabled ? 0.4 : 1}
      cursor={disabled ? "not-allowed" : "pointer"}
      transition="all 0.15s"
      display="flex"
      alignItems="center"
      gap={2.5}
      _hover={disabled || picked ? {} : { borderColor: "colorPalette.300" }}
    >
      <Box
        flexShrink={0}
        w="30px"
        h="30px"
        borderRadius="full"
        display="grid"
        placeItems="center"
        fontSize="xs"
        fontWeight="bold"
        bg={picked ? "colorPalette.500" : "bg.subtle"}
        color={picked ? "colorPalette.contrast" : "fg.muted"}
      >
        {name.slice(0, 1).toUpperCase()}
      </Box>
      <Text
        fontSize="sm"
        fontWeight="medium"
        color="fg.default"
        textAlign="left"
        lineClamp={1}
        flex="1"
        minW={0}
      >
        {name}
      </Text>
      {picked && (
        <Box color="colorPalette.500" flexShrink={0} display="flex">
          <LuCheck size={16} />
        </Box>
      )}
    </Box>
  );
}

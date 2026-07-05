"use client";

import {
  Box,
  Heading,
  Input,
  Text,
  VStack,
  HStack,
  NumberInput,
  Dialog,
  Portal,
  CloseButton,
  Card,
  IconButton,
} from "@chakra-ui/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlayoffFormatSelector } from "@/components/tournaments/playoff-format-selector";
import { Button } from "@/components/ui/button";
import { toaster } from "@/components/ui/toaster";
import { useLiveTournament } from "@/contexts/tournament-context/live-provider";
import type { PlayoffFormat } from "@/contexts/tournament-context/types";

export function SetupForm() {
  const router = useRouter();
  const { state, store } = useLiveTournament();
  const isLocked = state.isGenerated;

  // Local editable setup (persisted atomically when the tournament starts).
  const [teams, setTeams] = useState<string[]>(state.teams);
  const [maxOvers, setMaxOvers] = useState(state.maxOvers);
  const [maxWickets, setMaxWickets] = useState(state.maxWickets);
  const [playoffFormat, setPlayoffFormat] = useState<PlayoffFormat>(
    state.playoffFormat
  );

  const [teamInput, setTeamInput] = useState("");
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<{
    index: number;
    name: string;
  } | null>(null);

  // When generated, the persisted teams are the source of truth.
  const displayTeams = isLocked ? state.teams : teams;

  const handleAddTeam = () => {
    const name = teamInput.trim();
    if (!name || name.length > 10 || teams.includes(name)) return;
    setTeams([...teams, name]);
    setTeamInput("");
    setIsAddTeamOpen(false);
  };

  const handleRemoveTeam = (teamName: string) => {
    setTeams(teams.filter((t) => t !== teamName));
  };

  const handleEditTeam = (index: number, currentName: string) => {
    setEditingTeam({ index, name: currentName });
    setTeamInput(currentName);
    setIsAddTeamOpen(true);
  };

  const handleUpdateTeam = () => {
    const name = teamInput.trim();
    if (!editingTeam || !name || name.length > 10) return;
    if (name !== editingTeam.name && teams.includes(name)) return;
    setTeams(teams.map((t) => (t === editingTeam.name ? name : t)));
    setTeamInput("");
    setEditingTeam(null);
    setIsAddTeamOpen(false);
  };

  const handleDialogClose = () => {
    setIsAddTeamOpen(false);
    setEditingTeam(null);
    setTeamInput("");
  };

  const handleStartTournament = () => {
    // Generate locally (instant). The schedule lives in localStorage until Sync.
    const result = store.generate({
      teams,
      maxOvers,
      maxWickets,
      playoffFormat,
    });
    if (result.success) {
      router.push(`/tournament/round-robin/${store.id}/matches`);
    } else {
      toaster.create({
        title: "Couldn't start tournament",
        description: result.errors?.[0] ?? "Please try again.",
        type: "error",
        duration: 4000,
        closable: true,
      });
    }
  };

  return (
    <VStack gap={8} align="stretch">
      {/* Teams */}
      <Box>
        <VStack align="stretch" gap={1} mb={4}>
          <HStack justify="space-between" align="center">
            <Heading size="md">Teams ({displayTeams.length})</Heading>
            {isLocked && (
              <Text fontSize="xs" color="fg.muted" fontStyle="italic">
                🔒 Locked during tournament
              </Text>
            )}
          </HStack>
          <Text fontSize="sm" color="fg.muted">
            Add teams. Each team plays others once.
          </Text>
        </VStack>

        <VStack gap={3} align="stretch">
          {displayTeams.map((team, index) => (
            <TeamCard
              key={`${team}-${index}`}
              teamName={team}
              onEdit={() => handleEditTeam(index, team)}
              onDelete={() => handleRemoveTeam(team)}
              isLocked={isLocked}
            />
          ))}

          {!isLocked && (
            <Button
              onClick={() => setIsAddTeamOpen(true)}
              variant="outline"
              colorPalette="blue"
              w="full"
            >
              <HStack gap={2}>
                <Text fontSize="lg">+</Text>
                <Text>Add Team</Text>
              </HStack>
            </Button>
          )}
        </VStack>
      </Box>

      {/* Match Settings */}
      <VStack gap={4} align="stretch">
        <VStack align="stretch" gap={1} mb={4}>
          <HStack justify="space-between" align="center">
            <Heading size="md">Match Settings</Heading>
            {isLocked && (
              <Text fontSize="xs" color="fg.muted" fontStyle="italic">
                🔒 Locked during tournament
              </Text>
            )}
          </HStack>
          <Text fontSize="sm" color="fg.muted">
            Set overs and wickets for matches.
          </Text>
        </VStack>

        <Box>
          <Text fontSize="sm" fontWeight="medium" mb={2} color="fg.default">
            Max Overs
          </Text>
          <NumberInput.Root
            value={maxOvers.toString()}
            min={1}
            max={50}
            onValueChange={(details) => {
              if (isLocked) return;
              const value = parseInt(details.value);
              if (!isNaN(value)) setMaxOvers(value);
            }}
            size="lg"
            disabled={isLocked}
          >
            <NumberInput.Control />
            <NumberInput.Input
              readOnly={isLocked}
              bg="input.bg"
              borderColor="input.border"
              color="fg.default"
              _focus={{
                borderColor: "input.focusBorder",
                boxShadow: "0 0 0 1px var(--colors-input-focus-border)",
              }}
            />
          </NumberInput.Root>
          <Text fontSize="xs" color="fg.muted" mt={1}>
            T20 = 20, ODI = 50{isLocked && " (Locked during tournament)"}
          </Text>
        </Box>

        <Box>
          <Text fontSize="sm" fontWeight="medium" mb={2} color="fg.default">
            Max Wickets
          </Text>
          <NumberInput.Root
            value={maxWickets.toString()}
            min={1}
            max={11}
            onValueChange={(details) => {
              if (isLocked) return;
              const value = parseInt(details.value);
              if (!isNaN(value)) setMaxWickets(value);
            }}
            size="lg"
            disabled={isLocked}
          >
            <NumberInput.Control />
            <NumberInput.Input
              readOnly={isLocked}
              bg="input.bg"
              borderColor="input.border"
              color="fg.default"
              _focus={{
                borderColor: "input.focusBorder",
                boxShadow: "0 0 0 1px var(--colors-input-focus-border)",
              }}
            />
          </NumberInput.Root>
          <Text fontSize="xs" color="fg.muted" mt={1}>
            Standard: 10 wickets{isLocked && " (Locked during tournament)"}
          </Text>
        </Box>
      </VStack>

      {/* Playoff Format */}
      <VStack gap={4} align="stretch">
        <VStack align="stretch" gap={1} mb={4}>
          <HStack justify="space-between" align="center">
            <Heading size="md">Playoff Format</Heading>
            {isLocked && (
              <Text fontSize="xs" color="fg.muted" fontStyle="italic">
                🔒 Locked after tournament generated
              </Text>
            )}
          </HStack>
          <Text fontSize="sm" color="fg.muted">
            Choose playoff style for top teams.
          </Text>
        </VStack>

        <PlayoffFormatSelector
          value={isLocked ? state.playoffFormat : playoffFormat}
          onChange={setPlayoffFormat}
          disabled={isLocked}
        />
      </VStack>

      {/* Main Action */}
      <VStack gap={4}>
        {!isLocked ? (
          <Button
            onClick={handleStartTournament}
            disabled={teams.length < 2}
            w="full"
          >
            {teams.length < 2 ? "Add at least 2 teams" : "🚀 Start Tournament"}
          </Button>
        ) : (
          <Button
            onClick={() =>
              router.push(`/tournament/round-robin/${store.id}/matches`)
            }
            colorPalette="blue"
            w="full"
          >
            Go to Matches →
          </Button>
        )}
      </VStack>

      {/* Add/Edit Team Dialog */}
      <Dialog.Root
        open={isAddTeamOpen}
        onOpenChange={(e) => !e.open && handleDialogClose()}
      >
        <Portal>
          <Dialog.Backdrop bg="blackAlpha.400" backdropFilter="blur(4px)" />
          <Dialog.Positioner>
            <Dialog.Content
              maxW="380px"
              bg="dialog.bg"
              borderRadius="xl"
              p={4}
              boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
            >
              <Dialog.Header px={2} pb={3}>
                <VStack gap={1} w="full" align="center">
                  <Text fontSize="lg" fontWeight="500">
                    {editingTeam ? "Edit Team" : "Add New Team"}
                  </Text>
                </VStack>
                <Dialog.CloseTrigger asChild>
                  <CloseButton
                    position="absolute"
                    top={4}
                    right={4}
                    size="sm"
                    color="fg.muted"
                    _hover={{ color: "fg.default", bg: "bg.subtle" }}
                  />
                </Dialog.CloseTrigger>
              </Dialog.Header>

              <Dialog.Body p={2}>
                <VStack gap={4} w="full">
                  <Box w="full">
                    <Text fontSize="sm" fontWeight="medium" mb={2}>
                      Team Name (max 10 characters)
                    </Text>
                    <Input
                      placeholder="Enter team name"
                      value={teamInput}
                      onChange={(e) => setTeamInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          editingTeam ? handleUpdateTeam() : handleAddTeam();
                        }
                      }}
                      maxLength={10}
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
                    <Text fontSize="xs" color="fg.muted" mt={1}>
                      {teamInput.length}/10 characters
                    </Text>
                  </Box>

                  <HStack gap={3} w="full">
                    <Button
                      variant="outline"
                      flex="1"
                      size="md"
                      h="44px"
                      borderRadius="lg"
                      fontSize="sm"
                      colorPalette="gray"
                      fontWeight="500"
                      onClick={handleDialogClose}
                    >
                      Cancel
                    </Button>
                    <Button
                      colorPalette="blue"
                      flex="1"
                      size="md"
                      h="44px"
                      borderRadius="lg"
                      fontSize="sm"
                      fontWeight="500"
                      onClick={editingTeam ? handleUpdateTeam : handleAddTeam}
                      disabled={!teamInput.trim() || teamInput.trim().length > 10}
                    >
                      {editingTeam ? "Update" : "Add"}
                    </Button>
                  </HStack>
                </VStack>
              </Dialog.Body>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </VStack>
  );
}

interface TeamCardProps {
  teamName: string;
  onEdit: () => void;
  onDelete: () => void;
  isLocked?: boolean;
}

function TeamCard({
  teamName,
  onEdit,
  onDelete,
  isLocked = false,
}: TeamCardProps) {
  return (
    <Card.Root
      borderWidth={1}
      borderColor={isLocked ? "border.subtle" : "card.border"}
      bg={isLocked ? "bg.subtle" : "card.bg"}
      _hover={!isLocked ? { borderColor: "blue.300", shadow: "sm" } : {}}
      transition="all 0.2s"
      opacity={isLocked ? 0.7 : 1}
    >
      <Card.Body pl={4} pr={2} py={2}>
        <HStack justify="space-between" align="center">
          <HStack gap={2}>
            <Text
              fontWeight="medium"
              fontSize="md"
              color={isLocked ? "fg.muted" : "fg.default"}
            >
              {teamName}
            </Text>
            {isLocked && (
              <Text fontSize="xs" color="fg.subtle">
                🔒
              </Text>
            )}
          </HStack>
          {!isLocked && (
            <HStack gap={1}>
              <IconButton
                aria-label="Edit team"
                size="sm"
                variant="ghost"
                colorPalette="blue"
                onClick={onEdit}
              >
                ✏️
              </IconButton>
              <IconButton
                aria-label="Delete team"
                size="sm"
                variant="ghost"
                colorPalette="red"
                onClick={onDelete}
              >
                🗑️
              </IconButton>
            </HStack>
          )}
        </HStack>
      </Card.Body>
    </Card.Root>
  );
}

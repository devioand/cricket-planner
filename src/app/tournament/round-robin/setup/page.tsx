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
import {
  useTournament,
  logTournamentState,
} from "@/contexts/tournament-context";

import { PlayoffFormatSelector } from "@/components/tournaments/playoff-format-selector";
import { Button } from "@/components/ui/button";

export default function RoundRobinSetup() {
  const tournament = useTournament();
  const router = useRouter();
  const [teamInput, setTeamInput] = useState("");
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<{
    index: number;
    name: string;
  } | null>(null);

  const [showFinishConfirm, setShowFinishConfirm] = useState(false);

  const handleAddTeam = () => {
    if (teamInput.trim() && teamInput.trim().length <= 10) {
      const success = tournament.addTeam(teamInput.trim());
      if (success) {
        setTeamInput("");
        setIsAddTeamOpen(false);
      }
    }
  };

  const handleRemoveTeam = (teamName: string) => {
    tournament.removeTeam(teamName);
  };

  const handleEditTeam = (index: number, currentName: string) => {
    setEditingTeam({ index, name: currentName });
    setTeamInput(currentName);
    setIsAddTeamOpen(true);
  };

  const handleUpdateTeam = () => {
    if (editingTeam && teamInput.trim() && teamInput.trim().length <= 10) {
      // Remove old team and add new one
      tournament.removeTeam(editingTeam.name);
      const success = tournament.addTeam(teamInput.trim());
      if (success) {
        setTeamInput("");
        setEditingTeam(null);
        setIsAddTeamOpen(false);
      }
    }
  };

  const handleDialogClose = () => {
    setIsAddTeamOpen(false);
    setEditingTeam(null);
    setTeamInput("");
  };

  const handleStartTournament = () => {
    const result = tournament.generateMatches();
    if (result.success) {
      logTournamentState(tournament.state);
      // Navigate to matches page immediately after successful generation
      router.push("/tournament/round-robin/matches");
    } else if (result.errors) {
      console.error("❌ Failed to generate matches:", result.errors);
    }
  };

  const handleFinishTournament = () => {
    setShowFinishConfirm(true);
  };

  const confirmFinishTournament = () => {
    tournament.resetTournament();
    setShowFinishConfirm(false);
    console.log("🔄 Tournament finished and reset");
  };

  // Celebration should happen on matches page, not setup page

  return (
    <>
      <VStack gap={8} align="stretch">
        {/* Teams Section */}
        <Box>
          <VStack align="stretch" gap={1} mb={4}>
            <HStack justify="space-between" align="center">
              <Heading size="md">
                Teams ({tournament.state.teams.length})
              </Heading>
              {tournament.state.isGenerated && (
                <Text fontSize="xs" color="gray.500" fontStyle="italic">
                  🔒 Locked during tournament
                </Text>
              )}
            </HStack>
            <Text fontSize="sm" color="gray.600">
              Add teams. Each team plays others once.
            </Text>
          </VStack>

          <VStack gap={3} align="stretch">
            {/* Team Cards */}
            {tournament.state.teams.map((team: string, index: number) => (
              <TeamCard
                key={`${team}-${index}`}
                teamName={team}
                onEdit={() => handleEditTeam(index, team)}
                onDelete={() => handleRemoveTeam(team)}
                isLocked={tournament.state.isGenerated}
              />
            ))}

            {/* Add Team Button */}
            {!tournament.state.isGenerated && (
              <Button
                onClick={() => setIsAddTeamOpen(true)}
                variant="outline"
                colorPalette="blue"
                size="lg"
                w="full"
                minH="48px"
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
              {tournament.state.isGenerated && (
                <Text fontSize="xs" color="gray.500" fontStyle="italic">
                  🔒 Locked during tournament
                </Text>
              )}
            </HStack>
            <Text fontSize="sm" color="gray.600">
              Set overs and wickets for matches.
            </Text>
          </VStack>

          {/* Max Overs */}
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2} color="gray.700">
              Max Overs
            </Text>
            <NumberInput.Root
              value={tournament.state.maxOvers.toString()}
              min={1}
              max={50}
              onValueChange={(details) => {
                if (!tournament.state.isGenerated) {
                  const value = parseInt(details.value);
                  if (!isNaN(value)) {
                    tournament.setMaxOvers(value);
                  }
                }
              }}
              size="lg"
              disabled={tournament.state.isGenerated}
            >
              <NumberInput.Control />
              <NumberInput.Input readOnly={tournament.state.isGenerated} />
            </NumberInput.Root>
            <Text fontSize="xs" color="gray.500" mt={1}>
              T20 = 20, ODI = 50
              {tournament.state.isGenerated && " (Locked during tournament)"}
            </Text>
          </Box>

          {/* Max Wickets */}
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2} color="gray.700">
              Max Wickets
            </Text>
            <NumberInput.Root
              value={tournament.state.maxWickets.toString()}
              min={1}
              max={11}
              onValueChange={(details) => {
                if (!tournament.state.isGenerated) {
                  const value = parseInt(details.value);
                  if (!isNaN(value)) {
                    tournament.setMaxWickets(value);
                  }
                }
              }}
              size="lg"
              disabled={tournament.state.isGenerated}
            >
              <NumberInput.Control />
              <NumberInput.Input readOnly={tournament.state.isGenerated} />
            </NumberInput.Root>
            <Text fontSize="xs" color="gray.500" mt={1}>
              Standard: 10 wickets
              {tournament.state.isGenerated && " (Locked during tournament)"}
            </Text>
          </Box>
        </VStack>

        {/* Playoff Format Selection */}
        <VStack gap={4} align="stretch">
          <VStack align="stretch" gap={1} mb={4}>
            <HStack justify="space-between" align="center">
              <Heading size="md">Playoff Format</Heading>
              {tournament.state.matches.some((m) => m.isPlayoff) && (
                <Text fontSize="xs" color="gray.500" fontStyle="italic">
                  🔒 Locked after tournament generated
                </Text>
              )}
            </HStack>
            <Text fontSize="sm" color="gray.600">
              Choose playoff style for top teams.
            </Text>
          </VStack>

          <PlayoffFormatSelector
            disabled={tournament.state.matches.some((m) => m.isPlayoff)}
          />
        </VStack>

        {/* Main Action Button */}
        <VStack gap={4}>
          {!tournament.state.isGenerated ? (
            <Button
              onClick={handleStartTournament}
              disabled={tournament.state.teams.length < 2}
              // size="md"
              w="full"
            >
              {tournament.state.teams.length < 2
                ? "Add at least 2 teams"
                : "🚀 Start Tournament"}
            </Button>
          ) : (
            <Button
              onClick={handleFinishTournament}
              colorPalette="green"
              // size="xl"
              w="full"
            >
              Finish Tournament
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
                bg="white"
                borderRadius="xl"
                p={4}
                boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                border="1px solid"
                borderColor="gray.200"
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
                      color="gray.500"
                      _hover={{ color: "gray.700", bg: "gray.100" }}
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
                            if (editingTeam) {
                              handleUpdateTeam();
                            } else {
                              handleAddTeam();
                            }
                          }
                        }}
                        maxLength={10}
                        size="lg"
                        autoFocus
                      />
                      <Text fontSize="xs" color="gray.500" mt={1}>
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
                        disabled={
                          !teamInput.trim() || teamInput.trim().length > 10
                        }
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

        {/* Finish Tournament Confirmation Dialog */}
        <Dialog.Root
          open={showFinishConfirm}
          onOpenChange={(e) => !e.open && setShowFinishConfirm(false)}
        >
          <Portal>
            <Dialog.Backdrop bg="blackAlpha.400" backdropFilter="blur(4px)" />
            <Dialog.Positioner>
              <Dialog.Content
                maxW="420px"
                bg="white"
                borderRadius="xl"
                p={4}
                boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                border="1px solid"
                borderColor="gray.200"
              >
                <Dialog.Header pb={3}>
                  <VStack gap={1} w="full" align="center">
                    <Text fontSize="lg" fontWeight="500" color="red.600">
                      Finish Tournament?
                    </Text>
                  </VStack>
                  <Dialog.CloseTrigger asChild>
                    <CloseButton
                      position="absolute"
                      top={4}
                      right={4}
                      size="sm"
                      color="gray.500"
                      _hover={{ color: "gray.700", bg: "gray.100" }}
                    />
                  </Dialog.CloseTrigger>
                </Dialog.Header>

                <Dialog.Body px={2}>
                  <VStack gap={4} w="full">
                    <Text textAlign="center" color="gray.700">
                      This will permanently end the tournament and reset all
                      data. You&apos;ll lose all match results and team
                      statistics.
                    </Text>

                    <Text
                      fontSize="sm"
                      textAlign="center"
                      color="red.600"
                      fontWeight="medium"
                    >
                      This action cannot be undone.
                    </Text>

                    <HStack gap={3} w="full" pt={2}>
                      <Button
                        variant="outline"
                        flex="1"
                        size="md"
                        h="44px"
                        borderRadius="lg"
                        fontSize="sm"
                        fontWeight="500"
                        colorPalette="gray"
                        onClick={() => setShowFinishConfirm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        colorPalette="red"
                        flex="1"
                        size="md"
                        h="44px"
                        borderRadius="lg"
                        fontSize="sm"
                        fontWeight="500"
                        onClick={confirmFinishTournament}
                      >
                        Finish Tournament
                      </Button>
                    </HStack>
                  </VStack>
                </Dialog.Body>
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>
      </VStack>
    </>
  );
}

// Team Card Component
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
      borderColor={isLocked ? "gray.100" : "gray.200"}
      bg={isLocked ? "gray.50" : "white"}
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
              color={isLocked ? "gray.500" : "gray.800"}
            >
              {teamName}
            </Text>
            {isLocked && (
              <Text fontSize="xs" color="gray.400">
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

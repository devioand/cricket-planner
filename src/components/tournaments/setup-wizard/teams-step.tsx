"use client";

import React, { useState } from "react";
import {
  VStack,
  HStack,
  Input,
  Text,
  Card,
  IconButton,
  Dialog,
  Portal,
  CloseButton,
  Grid,
  Badge,
  Box,
} from "@chakra-ui/react";
import { Button } from "@/components/ui/button";
import { StepContainer } from "@/components/ui/stepper";
import { useTournament } from "@/contexts/tournament-context";

interface TeamsStepProps {
  onValidationChange: (isValid: boolean) => void;
}

export function TeamsStep({ onValidationChange }: TeamsStepProps) {
  const tournament = useTournament();
  const [teamInput, setTeamInput] = useState("");
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<{
    index: number;
    name: string;
  } | null>(null);

  const teams = tournament.state.teams;
  const isLocked = tournament.state.isGenerated;
  const isValid = teams.length >= 2;

  React.useEffect(() => {
    onValidationChange(isValid);
  }, [isValid, onValidationChange]);

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

  return (
    <StepContainer
      title="Add Teams"
      description="Add the teams that will participate in your tournament"
    >
      <VStack align="stretch" gap={6}>
        {/* Add Team Button */}
        <HStack justify="space-between" align="center">
          <VStack align="start" gap={0}>
            <Text fontSize="sm" fontWeight="medium" color="gray.700">
              Tournament Teams
            </Text>
            <Text fontSize="xs" color="gray.500">
              {teams.length} team{teams.length !== 1 ? "s" : ""} added
              {teams.length >= 2 && (
                <Badge ml={2} colorPalette="green" variant="solid" size="sm">
                  Ready!
                </Badge>
              )}
            </Text>
          </VStack>

          {!isLocked && (
            <Button
              onClick={() => setIsAddTeamOpen(true)}
              size="sm"
              disabled={teams.length >= 20}
            >
              + Add Team
            </Button>
          )}
        </HStack>

        {/* Teams Grid */}
        {teams.length > 0 ? (
          <Grid templateColumns="repeat(auto-fill, minmax(250px, 1fr))" gap={3}>
            {teams.map((teamName, index) => (
              <TeamCard
                key={teamName}
                teamName={teamName}
                onEdit={() => handleEditTeam(index, teamName)}
                onDelete={() => handleRemoveTeam(teamName)}
                isLocked={isLocked}
              />
            ))}
          </Grid>
        ) : (
          <Card.Root
            borderStyle="dashed"
            borderWidth={2}
            borderColor="gray.300"
          >
            <Card.Body p={8}>
              <VStack gap={3}>
                <Text fontSize="lg">🏏</Text>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  No teams added yet. Click "Add Team" to get started.
                </Text>
                <Text fontSize="xs" color="gray.500" textAlign="center">
                  You need at least 2 teams to start a tournament
                </Text>
              </VStack>
            </Card.Body>
          </Card.Root>
        )}

        {/* Validation Message */}
        {teams.length > 0 && teams.length < 2 && (
          <Box
            p={3}
            bg="orange.50"
            borderRadius="md"
            borderColor="orange.200"
            borderWidth={1}
          >
            <Text fontSize="sm" color="orange.700">
              ⚠️ Add at least 1 more team to continue
            </Text>
          </Box>
        )}

        {teams.length >= 2 && (
          <Box
            p={3}
            bg="green.50"
            borderRadius="md"
            borderColor="green.200"
            borderWidth={1}
          >
            <Text fontSize="sm" color="green.700">
              ✅ Great! You have {teams.length} teams ready for the tournament
            </Text>
          </Box>
        )}

        {/* Add/Edit Team Dialog */}
        <Dialog.Root
          open={isAddTeamOpen}
          onOpenChange={(e) => !e.open && handleDialogClose()}
        >
          <Portal>
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content maxW="md" bg="white" borderRadius="lg" p={6}>
                <Dialog.Header>
                  <Dialog.Title>
                    {editingTeam ? "Edit Team" : "Add New Team"}
                  </Dialog.Title>
                  <CloseButton onClick={handleDialogClose} />
                </Dialog.Header>

                <Dialog.Body>
                  <VStack gap={4} align="stretch">
                    <VStack align="stretch" gap={2}>
                      <Text fontSize="sm" fontWeight="medium">
                        Team Name
                      </Text>
                      <Input
                        placeholder="Enter team name"
                        value={teamInput}
                        onChange={(e) => setTeamInput(e.target.value)}
                        maxLength={10}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            editingTeam ? handleUpdateTeam() : handleAddTeam();
                          }
                        }}
                      />
                      <Text fontSize="xs" color="gray.500">
                        Maximum 10 characters ({teamInput.length}/10)
                      </Text>
                    </VStack>

                    <HStack gap={3} w="full">
                      <Button
                        variant="outline"
                        flex="1"
                        onClick={handleDialogClose}
                      >
                        Cancel
                      </Button>
                      <Button
                        flex="1"
                        onClick={editingTeam ? handleUpdateTeam : handleAddTeam}
                        disabled={
                          !teamInput.trim() || teamInput.trim().length > 10
                        }
                      >
                        {editingTeam ? "Update" : "Add"} Team
                      </Button>
                    </HStack>
                  </VStack>
                </Dialog.Body>
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>
      </VStack>
    </StepContainer>
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
      <Card.Body p={4}>
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

"use client";

import {
  Box,
  Card,
  CloseButton,
  Dialog,
  HStack,
  IconButton,
  Input,
  Portal,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const MAX_NAME_LENGTH = 10;

interface TeamListEditorProps {
  teams: string[];
  onChange: (teams: string[]) => void;
  disabled?: boolean;
}

/**
 * Add / edit / remove team names. Extracted from the old setup form so the
 * wizard's Teams step and any future editor share one implementation.
 */
export function TeamListEditor({
  teams,
  onChange,
  disabled = false,
}: TeamListEditorProps) {
  const [teamInput, setTeamInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<{ name: string } | null>(null);

  const nameTaken = (name: string) =>
    teams.some((t) => t.toLowerCase() === name.toLowerCase());

  const openAdd = () => {
    setEditing(null);
    setTeamInput("");
    setIsOpen(true);
  };

  const openEdit = (name: string) => {
    setEditing({ name });
    setTeamInput(name);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setEditing(null);
    setTeamInput("");
  };

  const invalid = (() => {
    const name = teamInput.trim();
    if (!name || name.length > MAX_NAME_LENGTH) return true;
    if (editing) return name !== editing.name && nameTaken(name);
    return nameTaken(name);
  })();

  const submit = () => {
    const name = teamInput.trim();
    if (invalid) return;
    if (editing) {
      onChange(teams.map((t) => (t === editing.name ? name : t)));
    } else {
      onChange([...teams, name]);
    }
    close();
  };

  const remove = (name: string) => onChange(teams.filter((t) => t !== name));

  return (
    <VStack gap={3} align="stretch">
      {teams.map((team, index) => (
        <TeamCard
          key={`${team}-${index}`}
          teamName={team}
          onEdit={() => openEdit(team)}
          onDelete={() => remove(team)}
          disabled={disabled}
        />
      ))}

      {!disabled && (
        <Button onClick={openAdd} variant="outline" colorPalette="brand" w="full">
          <HStack gap={2}>
            <Text fontSize="lg">+</Text>
            <Text>Add Team</Text>
          </HStack>
        </Button>
      )}

      <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && close()}>
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
                    {editing ? "Edit Team" : "Add New Team"}
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
                      Team Name (max {MAX_NAME_LENGTH} characters)
                    </Text>
                    <Input
                      placeholder="Enter team name"
                      value={teamInput}
                      onChange={(e) => setTeamInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") submit();
                      }}
                      maxLength={MAX_NAME_LENGTH}
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
                      {teamInput.length}/{MAX_NAME_LENGTH} characters
                      {teamInput.trim() && invalid && (
                        <Text as="span" color="red.500">
                          {" "}
                          · name already used or too long
                        </Text>
                      )}
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
                      onClick={close}
                    >
                      Cancel
                    </Button>
                    <Button
                      colorPalette="brand"
                      flex="1"
                      size="md"
                      h="44px"
                      borderRadius="lg"
                      fontSize="sm"
                      fontWeight="500"
                      onClick={submit}
                      disabled={invalid}
                    >
                      {editing ? "Update" : "Add"}
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
  disabled?: boolean;
}

function TeamCard({ teamName, onEdit, onDelete, disabled }: TeamCardProps) {
  return (
    <Card.Root
      borderWidth={1}
      borderColor={disabled ? "border.subtle" : "card.border"}
      bg={disabled ? "bg.subtle" : "card.bg"}
      _hover={!disabled ? { borderColor: "brand.300", shadow: "sm" } : {}}
      transition="all 0.2s"
      opacity={disabled ? 0.7 : 1}
    >
      <Card.Body pl={4} pr={2} py={2}>
        <HStack justify="space-between" align="center">
          <HStack gap={2}>
            <Text
              fontWeight="medium"
              fontSize="md"
              color={disabled ? "fg.muted" : "fg.default"}
            >
              {teamName}
            </Text>
            {disabled && (
              <Text fontSize="xs" color="fg.subtle">
                🔒
              </Text>
            )}
          </HStack>
          {!disabled && (
            <HStack gap={1}>
              <IconButton
                aria-label="Edit team"
                size="sm"
                variant="ghost"
                colorPalette="brand"
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

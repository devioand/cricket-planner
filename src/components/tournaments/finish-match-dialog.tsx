"use client";

import {
  Dialog,
  Portal,
  CloseButton,
  Text,
  VStack,
  HStack,
} from "@chakra-ui/react";
import { Button } from "@/components/ui/button";
import type { Match } from "@/contexts/tournament-context/types";

interface FinishMatchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  onNoResult: () => void;
}

/**
 * Shown when Finish Match is tapped without both scores entered (group stage
 * only). Lets the user finish an unplayed match as a No Result — both teams get
 * 1 point — or go back and enter scores.
 */
export function FinishMatchDialog({
  isOpen,
  onClose,
  match,
  onNoResult,
}: FinishMatchDialogProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.400" backdropFilter="blur(4px)" />
        <Dialog.Positioner>
          <Dialog.Content
            maxW="sm"
            mx={4}
            bg="dialog.bg"
            borderRadius="lg"
            shadow="lg"
          >
            <Dialog.Header>
              <HStack justify="space-between" align="center" w="full">
                <Dialog.Title fontSize="lg" fontWeight="semibold">
                  Finish without scores?
                </Dialog.Title>
                <CloseButton size="sm" onClick={onClose} />
              </HStack>
            </Dialog.Header>

            <Dialog.Body>
              <VStack align="stretch" gap={5} pb={2}>
                <Text fontSize="sm" color="fg.muted">
                  {match.team1} vs {match.team2} doesn&apos;t have both scores
                  yet. If the match wasn&apos;t played, you can finish it as a{" "}
                  <Text as="span" fontWeight="semibold" color="fg.default">
                    No Result
                  </Text>{" "}
                  — both teams get 1 point.
                </Text>

                <VStack align="stretch" gap={2}>
                  <Button colorPalette="orange" w="full" onClick={onNoResult}>
                    Finish as No Result (1 point each)
                  </Button>
                  <Button
                    variant="outline"
                    colorPalette="gray"
                    w="full"
                    onClick={onClose}
                  >
                    Cancel — enter scores
                  </Button>
                </VStack>
              </VStack>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

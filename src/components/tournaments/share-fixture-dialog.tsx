"use client";

// Live-tournament wrapper around the reusable FixtureShareDialog: pulls state +
// store from context and adds a match-window editor above the preview. The
// capture/preview/share plumbing lives in ./fixture-share-dialog.

import { Box, HStack, Input, Text, VStack } from "@chakra-ui/react";
import { LuCalendar } from "react-icons/lu";
import { useLiveTournament } from "@/contexts/tournament-context/live-provider";
import { FixtureShareDialog } from "./fixture-share-dialog";

/** ISO (UTC) → the `YYYY-MM-DDTHH:mm` a datetime-local input expects (local time). */
function isoToLocalInput(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

/** datetime-local value (local time) → ISO string, or undefined when empty. */
function localInputToIso(value: string): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

export function ShareFixtureDialog({
  open,
  onClose,
  name,
}: {
  open: boolean;
  onClose: () => void;
  name: string;
}) {
  const { state, store } = useLiveTournament();

  return (
    <FixtureShareDialog
      open={open}
      onClose={onClose}
      name={name}
      state={state}
      topSlot={
        <VStack align="stretch" gap={3}>
          <HStack gap={2} color="fg.default">
            <LuCalendar size={16} />
            <Text fontSize="sm" fontWeight="600">
              Match window
            </Text>
          </HStack>
          <VStack align="stretch" gap={2.5}>
            <Box>
              <Text fontSize="xs" color="fg.muted" mb={1}>
                Starts
              </Text>
              <Input
                type="datetime-local"
                size="md"
                value={isoToLocalInput(state.scheduledStart)}
                onChange={(e) =>
                  store.setSchedule(
                    localInputToIso(e.target.value),
                    state.scheduledEnd,
                  )
                }
              />
            </Box>
            <Box>
              <Text fontSize="xs" color="fg.muted" mb={1}>
                Ends
              </Text>
              <Input
                type="datetime-local"
                size="md"
                value={isoToLocalInput(state.scheduledEnd)}
                onChange={(e) =>
                  store.setSchedule(
                    state.scheduledStart,
                    localInputToIso(e.target.value),
                  )
                }
              />
            </Box>
          </VStack>
          <Text fontSize="xs" color="fg.muted">
            Saved on this device — Sync from the top bar to store it.
          </Text>
        </VStack>
      }
    />
  );
}

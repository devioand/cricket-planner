"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  CloseButton,
  Dialog,
  Input,
  Portal,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { toPng } from "html-to-image";
import { LuDownload, LuShare2 } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { toaster } from "@/components/ui/toaster";
import { useLiveTournament } from "@/contexts/tournament-context/live-provider";
import { FixtureCard, FIXTURE_CARD_WIDTH } from "@/components/tournaments/fixture-card";

/**
 * Share the pre-match fixture draft as an image. Lets the user set the match
 * window, previews the generated card, and shares it via the native share sheet
 * (WhatsApp etc.) with a download fallback. Fully on-device — no server needed.
 */

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

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "tournament"
  );
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
  const cardRef = useRef<HTMLDivElement>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);

  const render = useCallback(async () => {
    const node = cardRef.current;
    if (!node) return;
    setRendering(true);
    try {
      // Two frames so the off-screen card is laid out & painted before capture.
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const url = await toPng(node, {
        width: FIXTURE_CARD_WIDTH,
        pixelRatio: 1.5,
        cacheBust: true,
      });
      setDataUrl(url);
    } catch {
      toaster.create({
        title: "Couldn't build the image",
        description: "Please try again.",
        type: "error",
        duration: 3500,
      });
    } finally {
      setRendering(false);
    }
  }, []);

  // (Re)generate whenever the dialog is open and the schedule/teams/matches change.
  useEffect(() => {
    if (!open) return;
    void render();
  }, [open, render, state.scheduledStart, state.scheduledEnd, state.teams, state.matches]);

  const filename = `${slugify(name)}-fixtures.png`;

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    a.click();
  };

  const handleShare = async () => {
    if (!dataUrl) return;
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], filename, { type: "image/png" });
      const nav = navigator as Navigator & {
        canShare?: (data?: ShareData) => boolean;
      };
      if (nav.canShare?.({ files: [file] }) && nav.share) {
        await nav.share({
          files: [file],
          title: name,
          text: `${name} — fixtures 🏏`,
        });
        return;
      }
      // No file-share support (e.g. desktop): fall back to a download.
      handleDownload();
      toaster.create({
        title: "Image downloaded",
        description: "Sharing isn't supported here — attach the saved image.",
        type: "info",
        duration: 3500,
      });
    } catch (err) {
      // A user cancelling the share sheet throws AbortError — ignore it.
      if (err instanceof DOMException && err.name === "AbortError") return;
      toaster.create({
        title: "Couldn't share",
        description: "Try downloading the image instead.",
        type: "error",
        duration: 3500,
      });
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => !e.open && onClose()}
      scrollBehavior="inside"
    >
      <Portal>
        <Dialog.Backdrop bg="dialog.backdrop" backdropFilter="blur(4px)" />
        <Dialog.Positioner>
          <Dialog.Content maxW="480px" mx={4} bg="dialog.bg" borderRadius="xl">
            <Dialog.Header pb={2}>
              <Dialog.Title fontSize="lg" fontWeight="600">
                Share fixtures
              </Dialog.Title>
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

            <Dialog.Body pb={5}>
              <VStack align="stretch" gap={5}>
                {/* Match window editor */}
                <VStack align="stretch" gap={3}>
                  <Text fontSize="sm" fontWeight="600" color="fg.default">
                    🗓️ Match window
                  </Text>
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

                {/* Preview */}
                <Box
                  position="relative"
                  bg="bg.subtle"
                  borderRadius="lg"
                  borderWidth={1}
                  borderColor="border.subtle"
                  overflow="hidden"
                  minH="140px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  {dataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={dataUrl}
                      alt="Fixture card preview"
                      style={{ width: "100%", display: "block" }}
                    />
                  ) : (
                    <Spinner size="md" color="fg.muted" />
                  )}
                  {rendering && dataUrl && (
                    <Box
                      position="absolute"
                      top={2}
                      right={2}
                      bg="bg.canvas"
                      borderRadius="full"
                      p={1.5}
                    >
                      <Spinner size="xs" color="fg.muted" />
                    </Box>
                  )}
                </Box>

                {/* Actions */}
                <VStack align="stretch" gap={2.5}>
                  <Button
                    colorPalette="green"
                    size="lg"
                    onClick={handleShare}
                    disabled={!dataUrl || rendering}
                  >
                    <LuShare2 /> Share to WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    colorPalette="gray"
                    size="lg"
                    onClick={handleDownload}
                    disabled={!dataUrl || rendering}
                  >
                    <LuDownload /> Download image
                  </Button>
                </VStack>
              </VStack>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>

      {/* Off-screen full-size render target for the PNG capture. */}
      <Box
        position="fixed"
        top={0}
        left="-99999px"
        pointerEvents="none"
        aria-hidden
      >
        <FixtureCard ref={cardRef} tournamentName={name} state={state} />
      </Box>
    </Dialog.Root>
  );
}

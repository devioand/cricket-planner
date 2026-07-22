import { Box } from "@chakra-ui/react";
import { getActiveClub } from "@/lib/clubs/active-club";
import { listRoster } from "@/lib/repositories/club-repository";
import { ClubManager } from "@/components/clubs/club-manager";

export const dynamic = "force-dynamic";

/** Clubs now live in Neon (per account). Fetch the user's clubs + the active
 *  one, plus the whole roster (for "you already have them" add suggestions),
 *  on the server and hand off to the client manager. */
export default async function ClubPage() {
  const { userId, active, clubs } = await getActiveClub();
  const roster = await listRoster(userId);

  return (
    <Box p={{ base: 4, md: 8 }} maxW="600px" mx="auto" w="full">
      <ClubManager active={active} clubs={clubs} roster={roster} />
    </Box>
  );
}

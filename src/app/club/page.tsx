import { Box } from "@chakra-ui/react";
import { requireUser } from "@/lib/session";
import { ClubManager } from "@/components/clubs/club-manager";

export const dynamic = "force-dynamic";

/**
 * The club lives in localStorage (like a tournament in progress), so the page
 * only gates on auth and hands off to a client component.
 */
export default async function ClubPage() {
  await requireUser();

  return (
    <Box p={{ base: 4, md: 8 }} maxW="600px" mx="auto" w="full">
      <ClubManager />
    </Box>
  );
}

import { Box, Heading, Text, VStack } from "@chakra-ui/react";
import { requireUser } from "@/lib/session";
import { CreationWizard } from "@/components/tournaments/wizard/creation-wizard";

export const dynamic = "force-dynamic";

export default async function NewTournamentPage() {
  await requireUser();

  return (
    <Box p={{ base: 4, md: 8 }} maxW="600px" mx="auto" w="full">
      <VStack align="stretch" gap={6}>
        <VStack align="stretch" gap={1}>
          <Heading size={{ base: "lg", md: "xl" }}>New Tournament</Heading>
          <Text fontSize="sm" color="fg.muted">
            Set it up once — teams, match rules, and playoffs — then start playing.
          </Text>
        </VStack>
        <CreationWizard />
      </VStack>
    </Box>
  );
}

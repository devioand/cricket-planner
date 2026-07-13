import { Box, HStack, Text } from "@chakra-ui/react";
import { LuTrophy } from "react-icons/lu";

/**
 * Top bar shown when viewing a finished (completed) tournament, so it's
 * immediately clear the tournament is over and read-only.
 */
export function CompletedBanner({
  completed,
  winner,
}: {
  completed: boolean;
  winner: string | null;
}) {
  if (!completed) return null;

  return (
    <Box
      mb={4}
      bg={{ base: "green.50", _dark: "green.950" }}
      borderWidth={1}
      borderColor="green.400"
      borderRadius="lg"
      px={4}
      py={3}
    >
      <HStack gap={2} justify="center" align="center">
        <Box color={{ base: "green.600", _dark: "green.300" }} display="flex">
          <LuTrophy />
        </Box>
        <Text fontSize="sm" fontWeight="medium" color="fg.default">
          This tournament is finished
          {winner ? (
            <>
              {" · Champion: "}
              <Text as="span" fontWeight="bold">
                {winner}
              </Text>
            </>
          ) : null}
        </Text>
      </HStack>
    </Box>
  );
}

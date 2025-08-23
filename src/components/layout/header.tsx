"use client";

import { Box, Container, Flex, Heading, HStack, Text } from "@chakra-ui/react";
import { ColorModeButton } from "@/components/ui/color-mode";

export function Header() {
  return (
    <Box
      as="header"
      bg="bg.surface"
      borderBottomWidth="1px"
      borderBottomColor="border.default"
      py={4}
    >
      <Container maxW="7xl">
        <Flex justify="space-between" align="center">
          <HStack gap={3}>
            <Box fontSize="2xl" role="img" aria-label="Cricket">
              🏏
            </Box>
            <Box>
              <Heading size="md" lineHeight="1">
                Cricket Planner
              </Heading>
              <Text fontSize="sm" color="fg.muted">
                Tournament Management System
              </Text>
            </Box>
          </HStack>

          <HStack gap={2}>
            <ColorModeButton />
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
}

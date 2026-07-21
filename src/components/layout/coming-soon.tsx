import { Box, Heading, Text, VStack } from "@chakra-ui/react";
import type { IconType } from "react-icons";

interface ComingSoonProps {
  icon: IconType;
  title: string;
  description: string;
}

/**
 * Placeholder for a nav section that exists in navigation but isn't built yet.
 * Mobile-first: narrow, centered, generous vertical breathing room.
 */
export function ComingSoon({ icon: Icon, title, description }: ComingSoonProps) {
  return (
    <Box p={{ base: 4, md: 8 }} maxW="600px" mx="auto" w="full">
      <VStack gap={4} py={{ base: 16, md: 24 }} textAlign="center">
        <Box fontSize="5xl" color="brand.solid" lineHeight="1">
          <Icon />
        </Box>
        <Heading size={{ base: "lg", md: "xl" }}>{title}</Heading>
        <Text fontSize="sm" color="fg.muted" maxW="360px">
          {description}
        </Text>
        <Box
          fontSize="xs"
          fontWeight="semibold"
          color="brand.fg"
          bg="brand.subtle"
          px="3"
          py="1"
          borderRadius="full"
        >
          Coming soon
        </Box>
      </VStack>
    </Box>
  );
}

"use client";

import { Box, Container, Flex, Heading, HStack, Text } from "@chakra-ui/react";
import { Button } from "@/components/ui/button";
import { ColorModeButton } from "@/components/ui/color-mode";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "../icons/logo";
import { authClient, useSession } from "@/lib/auth-client";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isAuthed = !!session;

  // Inside a tournament, the tournament's own app bar takes over the top space
  // (name, progress, sync + the theme toggle), so the generic nav is hidden.
  if (pathname.startsWith("/tournament/round-robin/")) return null;

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  };

  const homeHref = isAuthed ? "/" : "/login";
  const onTournaments = pathname === "/tournaments";

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
          <Link
            href={homeHref}
            style={{ display: "flex", alignItems: "center", gap: "12px" }}
          >
            <Box
              fontSize="2xl"
              role="img"
              aria-label="Cricket"
              transition="transform 0.2s"
              _hover={{ transform: "scale(1.1)" }}
              color="fg.default"
            >
              <Logo />
            </Box>
            <Box minW={0}>
              <Heading
                size="md"
                lineHeight="1.1"
                _hover={{ color: "blue.500" }}
                transition="color 0.2s"
                truncate
              >
                Cricket Planner
              </Heading>
              <Text
                fontSize="sm"
                color="fg.muted"
                display={{ base: "none", sm: "block" }}
              >
                Tournament Management System
              </Text>
            </Box>
          </Link>

          <HStack gap={{ base: 1.5, md: 3 }}>
            {!isPending && isAuthed && !isAuthPage && (
              <>
                <Link href="/tournaments">
                  <Button
                    variant={onTournaments ? "subtle" : "ghost"}
                    size="sm"
                    colorPalette="blue"
                    aria-current={onTournaments ? "page" : undefined}
                  >
                    🏆 <Box as="span" display={{ base: "none", sm: "inline" }}>Tournaments</Box>
                  </Button>
                </Link>
                {session?.user?.email && (
                  <Text
                    fontSize="sm"
                    color="fg.muted"
                    display={{ base: "none", md: "block" }}
                    maxW="180px"
                    truncate
                  >
                    {session.user.email}
                  </Text>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  colorPalette="gray"
                  onClick={handleSignOut}
                >
                  Sign out
                </Button>
              </>
            )}
            <ColorModeButton />
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
}

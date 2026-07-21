"use client";

import {
  Avatar,
  Box,
  Container,
  Flex,
  Heading,
  HStack,
  Menu,
  Portal,
  Text,
} from "@chakra-ui/react";
import { Button } from "@/components/ui/button";
import { ColorModeButton } from "@/components/ui/color-mode";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { LuLogOut } from "react-icons/lu";
import { authClient, useSession } from "@/lib/auth-client";
import { isNavItemActive, NAV_ITEMS } from "./nav-items";

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
  const showNav = !isPending && isAuthed && !isAuthPage;

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
          <HStack gap={{ base: 3, md: 8 }}>
            <Link
              href={homeHref}
              style={{ display: "flex", alignItems: "center" }}
            >
              <Heading
                size="lg"
                lineHeight="1"
                fontWeight="bold"
                letterSpacing="-0.02em"
                whiteSpace="nowrap"
                transition="opacity 0.2s"
                _hover={{ opacity: 0.85 }}
              >
                <Box as="span" color="fg.default">
                  Cric
                </Box>
                <Box as="span" color="brand.500">
                  Matrix
                </Box>
              </Heading>
            </Link>

            {/* Desktop top nav. On mobile these live in the bottom tab bar. */}
            {showNav && (
              <HStack as="nav" display={{ base: "none", md: "flex" }} gap={1}>
                {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
                  const active = isNavItemActive(pathname, href);
                  return (
                    <Link key={href} href={href}>
                      <Button
                        variant={active ? "subtle" : "ghost"}
                        size="sm"
                        colorPalette="brand"
                        aria-current={active ? "page" : undefined}
                      >
                        <Icon />
                        {label}
                      </Button>
                    </Link>
                  );
                })}
              </HStack>
            )}
          </HStack>

          <HStack gap={{ base: 1.5, md: 3 }}>
            {showNav && (
              <Menu.Root positioning={{ placement: "bottom-end" }}>
                <Menu.Trigger asChild>
                  <Box
                    as="button"
                    borderRadius="full"
                    cursor="pointer"
                    transition="opacity 0.2s, box-shadow 0.2s"
                    aria-label="Account menu"
                    _hover={{ opacity: 0.85 }}
                    _focusVisible={{
                      outline: "2px solid",
                      outlineColor: "brand.500",
                      outlineOffset: "2px",
                    }}
                  >
                    <Avatar.Root size="sm" colorPalette="brand">
                      <Avatar.Fallback
                        name={session.user.name || session.user.email}
                      />
                      {session.user.image && (
                        <Avatar.Image src={session.user.image} />
                      )}
                    </Avatar.Root>
                  </Box>
                </Menu.Trigger>
                <Portal>
                  <Menu.Positioner>
                    <Menu.Content minW="220px">
                      <Box px="3" py="2">
                        {session.user.name && (
                          <Text fontSize="sm" fontWeight="medium" truncate>
                            {session.user.name}
                          </Text>
                        )}
                        <Text fontSize="xs" color="fg.muted" truncate>
                          {session.user.email}
                        </Text>
                      </Box>
                      <Menu.Separator />
                      <Menu.Item
                        value="signout"
                        onClick={handleSignOut}
                        color="red.fg"
                        _hover={{ bg: "red.subtle", color: "red.fg" }}
                      >
                        <LuLogOut />
                        <Box flex="1">Sign out</Box>
                      </Menu.Item>
                    </Menu.Content>
                  </Menu.Positioner>
                </Portal>
              </Menu.Root>
            )}
            <ColorModeButton />
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
}

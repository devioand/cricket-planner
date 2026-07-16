"use client";

import { Box, HStack, Text, VStack } from "@chakra-ui/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavItemActive, NAV_ITEMS, useNavVisible } from "./nav-items";

/**
 * Phone-first bottom tab bar. Fixed to the bottom of the viewport on small
 * screens only (desktop uses the top nav in the header). A matching in-flow
 * spacer reserves room so the fixed bar never covers the end of a page.
 */
export function BottomNav() {
  const pathname = usePathname();
  const visible = useNavVisible();

  if (!visible) return null;

  const barHeight = "calc(60px + env(safe-area-inset-bottom))";

  return (
    <>
      {/* Reserve scroll space beneath page content (mobile only). */}
      <Box
        aria-hidden
        display={{ base: "block", md: "none" }}
        h={barHeight}
      />
      <Box
        as="nav"
        aria-label="Primary"
        display={{ base: "block", md: "none" }}
        position="fixed"
        bottom="0"
        left="0"
        right="0"
        zIndex="docked"
        bg="bg.surface"
        borderTopWidth="1px"
        borderTopColor="border.default"
        pb="env(safe-area-inset-bottom)"
      >
        <HStack justify="space-around" align="stretch" gap="0">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = isNavItemActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                style={{ flex: 1 }}
              >
                <VStack
                  gap="1"
                  py="2"
                  color={active ? "blue.solid" : "fg.muted"}
                  transition="color 0.15s"
                  _active={{ opacity: 0.6 }}
                >
                  <Box fontSize="xl" lineHeight="1">
                    <Icon />
                  </Box>
                  <Text
                    fontSize="2xs"
                    fontWeight={active ? "semibold" : "medium"}
                    lineHeight="1"
                  >
                    {label}
                  </Text>
                </VStack>
              </Link>
            );
          })}
        </HStack>
      </Box>
    </>
  );
}

"use client";

import { Box, Heading, Text, VStack, Input, Field } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { authClient, useSession } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // A genuinely signed-in user (validated session) shouldn't see the login page.
  useEffect(() => {
    if (session && !isSubmitting) router.replace("/");
  }, [session, isSubmitting, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setIsSubmitting(true);
    const { error } = await authClient.signIn.email({
      email: email.trim(),
      password,
    });

    if (error) {
      setError(error.message ?? "Invalid email or password.");
      setIsSubmitting(false);
      return;
    }

    const redirectTo =
      new URLSearchParams(window.location.search).get("redirect") ||
      "/tournaments";
    router.push(redirectTo);
    router.refresh();
  };

  return (
    <Box
      minH="calc(100vh - 80px)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
    >
      <Box
        w="full"
        maxW="420px"
        bg="card.bg"
        borderWidth={1}
        borderColor="card.border"
        borderRadius="xl"
        p={{ base: 6, md: 8 }}
        boxShadow="sm"
      >
        <VStack gap={6} align="stretch">
          <VStack gap={1} align="center">
            <Heading size="lg">Welcome back</Heading>
            <Text fontSize="sm" color="fg.muted">
              Sign in to manage your cricket tournaments.
            </Text>
          </VStack>

          <form onSubmit={handleSubmit}>
            <VStack gap={4} align="stretch">
              <Field.Root>
                <Field.Label>Email</Field.Label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  size="lg"
                  bg="input.bg"
                  borderColor="input.border"
                  color="fg.default"
                  _placeholder={{ color: "fg.placeholder" }}
                  _focus={{
                    borderColor: "input.focusBorder",
                    boxShadow: "0 0 0 1px var(--colors-input-focus-border)",
                  }}
                />
              </Field.Root>

              <Field.Root>
                <Field.Label>Password</Field.Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  size="lg"
                  bg="input.bg"
                  borderColor="input.border"
                  color="fg.default"
                  _placeholder={{ color: "fg.placeholder" }}
                  _focus={{
                    borderColor: "input.focusBorder",
                    boxShadow: "0 0 0 1px var(--colors-input-focus-border)",
                  }}
                />
              </Field.Root>

              {error && (
                <Text fontSize="sm" color={{ base: "red.500", _dark: "red.300" }}>
                  {error}
                </Text>
              )}

              <Button
                type="submit"
                colorPalette="blue"
                w="full"
                size="lg"
                loading={isSubmitting}
              >
                Sign In
              </Button>
            </VStack>
          </form>

          <Text fontSize="sm" color="fg.muted" textAlign="center">
            Don&apos;t have an account?{" "}
            <Link href="/signup">
              <Text as="span" color={{ base: "blue.500", _dark: "blue.300" }} fontWeight="medium">
                Sign up
              </Text>
            </Link>
          </Text>
        </VStack>
      </Box>
    </Box>
  );
}

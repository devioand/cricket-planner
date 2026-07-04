"use client";

import { Box, Heading, Text, VStack, Input, Field } from "@chakra-ui/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);
    const { error } = await authClient.signUp.email({
      name: name.trim(),
      email: email.trim(),
      password,
    });

    if (error) {
      setError(error.message ?? "Could not create your account.");
      setIsSubmitting(false);
      return;
    }

    // autoSignIn is enabled, so the user is now authenticated.
    router.push("/tournaments");
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
            <Heading size="lg">Create your account</Heading>
            <Text fontSize="sm" color="fg.muted">
              Start planning cricket tournaments in seconds.
            </Text>
          </VStack>

          <form onSubmit={handleSubmit}>
            <VStack gap={4} align="stretch">
              <Field.Root>
                <Field.Label>Name</Field.Label>
                <Input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
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
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
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
                <Text fontSize="sm" color="red.500">
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
                Create Account
              </Button>
            </VStack>
          </form>

          <Text fontSize="sm" color="fg.muted" textAlign="center">
            Already have an account?{" "}
            <Link href="/login">
              <Text as="span" color="blue.500" fontWeight="medium">
                Sign in
              </Text>
            </Link>
          </Text>
        </VStack>
      </Box>
    </Box>
  );
}

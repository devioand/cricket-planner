"use client";

import { createAuthClient } from "better-auth/react";

/**
 * Browser-side Better Auth client. Base URL defaults to the current origin,
 * which is what we want (auth API is served from /api/auth on the same app).
 */
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;

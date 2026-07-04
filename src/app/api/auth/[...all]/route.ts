import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Serves every Better Auth endpoint under /api/auth/*
export const { GET, POST } = toNextJsHandler(auth);

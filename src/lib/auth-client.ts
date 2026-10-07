"use client";

import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:3000",
  plugins: [twoFactorClient()],
});

// S1 : aucune création de Compte via le navigateur. `signUp` n'est pas
// exporté : l'inscription client passe par /sign-up, le staff par invitation.
export const { signIn, signOut, useSession, getSession } = authClient;

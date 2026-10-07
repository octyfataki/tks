import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { twoFactor } from "better-auth/plugins/two-factor";
import { db } from "./db/client";

// Socle S1 : TOUS les comptes (client comme staff) utilisent email + mot de
// passe. Le téléphone n'est plus un identifiant de connexion : il reste une
// info de contact non-unique sur le dossier client (S4). Client et staff se
// distinguent par leurs tables custom — comptes_clients (EN_ATTENTE_VALIDATION
// à l'inscription) vs comptes_staff (VALIDE, créé par un admin ou bootstrap)
// — jamais par le type d'identifiant.
// 2FA TOTP obligatoire pour les administrateurs (vérifiée en couche applicative S1-T02).
// Validation, rattachement, invitation agent et réinitialisation sur pièce
// d'identité vivent en tables custom (ticket S1-01 et suivants), pas dans better-auth.
export const auth = betterAuth({
  appName: "TKS",
  database: drizzleAdapter(db, { provider: "mysql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    requireEmailVerification: false,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: 30 * 60,
    sendResetPassword: async ({ user, url }) => {
      // S1 : aucune réinitialisation automatique. Mock conservé pour le câblage.
      console.log(`[auth] reset password demandé pour ${user.email} : ${url}`);
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      // S1 : la validation est humaine sur pièce d'identité, pas par email.
      console.log(`[auth] vérification email pour ${user.email} : ${url}`);
    },
  },
  session: {
    // S1-T06 : session locale à durée bornée (quelques jours), survit à la
    // coupure réseau mais expire quand même. Révocation effective au sync.
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 3 },
    },
  },
  trustedOrigins: [process.env.BETTER_AUTH_URL ?? "http://localhost:3000"],
  account: {
    // Infos tierces (OAuth) chiffrées au repos — AES-256-GCM via BETTER_AUTH_SECRET.
    encryptOAuthTokens: true,
  },
  databaseHooks: {
    // Prépare S2 journal_audit : toute action tracée, sans valeur secrète.
    // Les hooks ne bloquent rien ici, ils journalisent (console) en attendant
    // la table append-only.
    session: {
      create: {
        // Signature better-auth : after(created, context) — pas ({ data }).
        after: async (session) => {
          const s = session as { id?: string; userId?: string } | null | undefined;
          console.log(`[audit] session.created user=${s?.userId}`);
        },
      },
    },
    user: {
      update: {
        // Signature better-auth : after(updated, context) — pas ({ data, oldData }).
        after: async (user) => {
          const apres = user as { id?: string; email?: string } | null | undefined;
          console.log(`[audit] user.updated user=${apres?.id} email=${apres?.email}`);
        },
      },
    },
    account: {
      create: {
        // Signature better-auth : after(created, context).
        after: async (account) => {
          const compte = account as
            | { userId?: string; providerId?: string }
            | null
            | undefined;
          console.log(
            `[audit] account.linked user=${compte?.userId} provider=${compte?.providerId}`,
          );
        },
      },
    },
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  plugins: [twoFactor({ issuer: "TKS" }), nextCookies()],
});

export type Session = typeof auth.$Infer.Session;

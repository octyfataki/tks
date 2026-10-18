import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { twoFactor } from "better-auth/plugins/two-factor";
import { eq } from "drizzle-orm";
import { db } from "./db/client";
import {
  clePreferenceMethode2fa,
  estMethodeEnvoi2fa,
  type MethodeEnvoi2fa,
} from "./2fa-method";
import { verification } from "./db/schema/auth-schema";
import { comptesClients, comptesStaff } from "./db/schema/accounts";

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
      if (process.env.NODE_ENV === "production") {
        console.log(`[auth] reset password demandé pour ${user.email}`);
      } else {
        console.log(`[auth] reset password demandé pour ${user.email} : ${url}`);
      }
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      if (process.env.NODE_ENV === "production") {
        console.log(`[auth] vérification email pour ${user.email}`);
      } else {
        console.log(`[auth] vérification email pour ${user.email} : ${url}`);
      }
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 3 },
      "/two-factor/send-otp": { window: 60, max: 3 },
      "/two-factor/verify-otp": { window: 60, max: 5 },
    },
  },
  trustedOrigins: [process.env.BETTER_AUTH_URL ?? "http://localhost:3000"],
  account: {
    encryptOAuthTokens: true,
  },
  databaseHooks: {
    session: {
      create: {
        after: async (session) => {
          const s = session as { id?: string; userId?: string } | null | undefined;
          console.log(`[audit] session.created user=${s?.userId}`);
        },
      },
    },
    user: {
      update: {
        after: async (user) => {
          const apres = user as { id?: string; email?: string } | null | undefined;
          console.log(`[audit] user.updated user=${apres?.id} email=${apres?.email}`);
        },
      },
    },
    account: {
      create: {
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
  plugins: [
    twoFactor({
      issuer: "TKS",
      otpOptions: {
        sendOTP: async ({ user, otp }, ctx) => {
          let methode: MethodeEnvoi2fa | null = null;
          try {
            const jar = ctx?.context.createAuthCookie("two_factor");
            const defi =
              jar && ctx
                ? await ctx.getSignedCookie(jar.name, ctx.context.secret)
                : null;
            if (typeof defi === "string" && defi.length > 0) {
              const lignes = await db
                .select({ valeur: verification.value })
                .from(verification)
                .where(
                  eq(
                    verification.identifier,
                    clePreferenceMethode2fa(defi),
                  ),
                )
                .limit(1);
              const pref = lignes[0]?.valeur;
              if (estMethodeEnvoi2fa(pref)) {
                methode = pref;
              } else if (process.env.NODE_ENV !== "production") {
                console.warn(
                  `[auth] 2FA : aucune préférence pour le défi …${defi.slice(-6)} (repli sms+email)`,
                );
              }
            } else if (process.env.NODE_ENV !== "production") {
              console.warn(
                "[auth] 2FA : défi illisible dans le cookie (repli sms+email)",
              );
            }
          } catch {
            methode = null;
          }
          let telephone: string | null = null;
          try {
            const lignesStaff = await db
              .select({ telephone: comptesStaff.telephone })
              .from(comptesStaff)
              .where(eq(comptesStaff.betterAuthUserId, user.id))
              .limit(1);
            telephone = lignesStaff[0]?.telephone ?? null;
            if (telephone === null) {
              const lignesClients = await db
                .select({ telephone: comptesClients.telephone })
                .from(comptesClients)
                .where(eq(comptesClients.betterAuthUserId, user.id))
                .limit(1);
              telephone = lignesClients[0]?.telephone ?? null;
            }
          } catch {
            telephone = null;
          }
          const versSms = (methode === null || methode === "sms") && telephone !== null;
          const versEmail = methode === null || methode === "email" || telephone === null;
          if (process.env.NODE_ENV === "production") {
            console.log(
              `[auth] code 2FA demandé pour ${user.email} (méthode : ${methode ?? "sms+email"})`,
            );
            if (versSms) console.log("[auth] méthode SMS utilisée pour le second facteur");
          } else {
            if (versEmail) console.log(`[auth] code 2FA pour ${user.email} : ${otp}`);
            if (versSms) console.log(`[auth] SMS 2FA vers ${telephone} : ${otp}`);
            else if (methode === "sms")
              console.log("[auth] SMS 2FA : aucun numéro de contact, repli email");
          }
        },
        period: 5,
        digits: 6,
        allowedAttempts: 5,
        storeOTP: "encrypted",
      },
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;

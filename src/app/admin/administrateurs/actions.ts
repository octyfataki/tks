"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { comptesStaff, telephoneStaffValide } from "@/lib/db/schema/s1-comptes";
import {
  creerAdminPrincipal,
  creerInvitationAdminPrincipal,
  ouvrirPremierAccesAdmin,
  StaffError,
} from "@/lib/s1-comptes/staff";

export type ResultatCreationAdmin =
  | { ok: true; email: string; lienPremierAcces?: string; expireLe?: string }
  | { ok: false; erreur: string };

export type ResultatInvitationAdmin =
  | { ok: true; lien: string }
  | { ok: false; erreur: string };

async function idStaffConnecte(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) return null;
  const lignes = await db
    .select({ id: comptesStaff.id })
    .from(comptesStaff)
    .where(eq(comptesStaff.betterAuthUserId, userId));
  return lignes[0]?.id ?? null;
}

function messageErreur(code: string): string {
  switch (code) {
    case "NON_AUTORISE":
      return "Seul un administrateur principal ou un administrateur technique validé peut créer ce compte.";
    case "TELEPHONE_INVALIDE":
      return "Numéro de téléphone invalide (chiffres, espaces et + uniquement).";
    default:
      return "Création impossible (identifiant déjà utilisé ou données invalides).";
  }
}

/**
 * Crée un compte ADMIN_PRINCIPAL (le distributeur, qui gère les dossiers
 * clients). Appelée depuis /admin/create par un administrateur
 * technique ou un administrateur principal validé (S1 : peutCreerAdminPrincipal).
 * Le contrôle réel est dans creerAdminPrincipal — ici on ne fait que
 * résoudre le créateur depuis la session.
 */
export async function creerAdministrateurPrincipalAction(
  _precedent: ResultatCreationAdmin | null,
  donnees: FormData,
): Promise<ResultatCreationAdmin> {
  const email = String(donnees.get("email") ?? "").trim().toLowerCase();
  const prenom = String(donnees.get("prenom") ?? "").trim();
  const nom = String(donnees.get("nom") ?? "").trim();
  const nomComplet = `${prenom} ${nom}`.trim();
  const motDePasseSaisi = String(donnees.get("motDePasse") ?? "");
  const telephone = String(donnees.get("telephone") ?? "").trim();
  // Lien de premier accès coché : aucun secret n'est choisi ni transmis —
  // un secret aléatoire jamais révélé verrouille le compte jusqu'à ce que
  // la personne choisisse elle-même son mot de passe via le lien.
  const lienDemande = donnees.get("lienPremierAcces") === "on";
  const motDePasse = lienDemande
    ? randomBytes(32).toString("hex")
    : motDePasseSaisi;

  if (!email.includes("@") || !prenom || !nom || motDePasse.length < 8) {
    return {
      ok: false,
      erreur:
        "Email valide, prénom, nom et mot de passe d'au moins 8 caractères exigés.",
    };
  }
  if (!telephoneStaffValide(telephone)) {
    return { ok: false, erreur: messageErreur("TELEPHONE_INVALIDE") };
  }

  const createurId = await idStaffConnecte();
  if (!createurId) {
    return { ok: false, erreur: messageErreur("NON_AUTORISE") };
  }

  try {
    const cree = await creerAdminPrincipal(createurId, {
      email,
      password: motDePasse,
      name: nomComplet,
      telephone,
    });
    if (!lienDemande) {
      revalidatePath("/admin/list");
      return { ok: true, email };
    }
    const acces = await ouvrirPremierAccesAdmin(createurId, cree.id);
    revalidatePath("/admin/list");
    revalidatePath("/admin/invitations");
    return {
      ok: true,
      email,
      lienPremierAcces: `/premier-acces/${acces.jeton}`,
      expireLe: acces.expireLe.toISOString(),
    };
  } catch (erreur) {
    if (erreur instanceof StaffError) {
      return { ok: false, erreur: messageErreur(erreur.code) };
    }
    return { ok: false, erreur: messageErreur("INCONNU") };
  }
}

/**
 * Génère un lien d'invitation ADMIN_PRINCIPAL (usage unique, durée limitée).
 * La personne crée elle-même son compte via /invite/[jeton] : elle choisit
 * son email + mot de passe, le rôle vient du lien. Même autorisation que la
 * création directe.
 */
export async function creerLienInvitationAdminAction(
  _precedent: ResultatInvitationAdmin | null,
  donnees: FormData,
): Promise<ResultatInvitationAdmin> {
  const dureeJours = Math.min(
    Math.max(Number(donnees.get("dureeJours") ?? 7) || 7, 1),
    30,
  );

  const createurId = await idStaffConnecte();
  if (!createurId) {
    return { ok: false, erreur: messageErreur("NON_AUTORISE") };
  }

  try {
    const invitation = await creerInvitationAdminPrincipal(createurId, {
      dureeJours,
    });
    revalidatePath("/admin/invites");
    revalidatePath("/admin/invitations");
    return { ok: true, lien: `/invite/${invitation.jeton}` };
  } catch (erreur) {
    if (erreur instanceof StaffError) {
      return { ok: false, erreur: messageErreur(erreur.code) };
    }
    return { ok: false, erreur: messageErreur("INCONNU") };
  }
}

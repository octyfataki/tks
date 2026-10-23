import type { CompteProfil, SessionEnCoursProfil } from "@/components/profile";
import { ProfilUtilisateur } from "@/components/profile";
import { profilSession } from "@/lib/accounts/session-profile";
import {
  motifCoordonneesVerrouillees,
  peutModifierSesCoordonnees,
} from "@/lib/accounts/compte-profil";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { session as tableSession, user } from "@/lib/db/schema/auth-schema";
import { comptesStaff, facteurs2faAdmin } from "@/lib/db/schema/accounts";
import { FormulaireMonProfil } from "@/app/admin/profile/my-profile-form";
import { FormulaireMotDePasse } from "@/components/profile/change-password-form";
import { ActivationSecondFacteur, DesactivationSecondFacteur } from "@/components/profile";
import { listerActiviteRecente } from "@/lib/authorizations/activite";
import { and, desc, eq, gt } from "drizzle-orm";
import { headers } from "next/headers";

export default async function AgentProfilePage() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  const email = session?.user?.email ?? "";
  const userId = session?.user?.id;
  const currentSessionId =
    (session as unknown as { session?: { id?: string } } | null)?.session?.id ?? null;
  const name =
    session?.user?.name?.trim() ||
    (email ? email.split("@")[0] : "") ||
    "Agent de service";
  const avatarUrl = session?.user?.image ?? null;

  const profile = await profilSession();
  const account: CompteProfil =
    profile.type === "STAFF"
      ? { type: "STAFF", role: profile.role, etat: profile.etat }
      : { type: "CLIENT" };

  let telephone: string | null = null;
  let staffNumber: string | null = null;
  let createdAt: Date | null = null;
  let createdBy: string | null = null;
  let secondFactorEnabled: boolean | null = null;
  let secondFactorDevice: string | null = null;
  let staffAccountId: string | null = null;

  if (userId && profile.type === "STAFF") {
    const rows = await db
      .select({
        id: comptesStaff.id,
        telephone: comptesStaff.telephone,
        createdAt: comptesStaff.createdAt,
        createdBy: comptesStaff.creePar,
        name: user.name,
      })
      .from(comptesStaff)
      .leftJoin(user, eq(user.id, comptesStaff.betterAuthUserId))
      .where(eq(comptesStaff.betterAuthUserId, userId))
      .limit(1);
    const row = rows[0];
    if (row) {
      telephone = row.telephone ?? null;
      staffNumber = row.id.slice(0, 8).toUpperCase();
      createdAt = row.createdAt;
      staffAccountId = row.id;
      if (row.createdBy) {
        const creators = await db
          .select({ email: comptesStaff.email, name: user.name })
          .from(comptesStaff)
          .leftJoin(user, eq(user.id, comptesStaff.betterAuthUserId))
          .where(eq(comptesStaff.id, row.createdBy))
          .limit(1);
        const creator = creators[0];
        createdBy = creator
          ? creator.name?.trim() || creator.email || "Compte supprimé"
          : "Compte supprimé";
      } else {
        createdBy = "Système (bootstrap)";
      }
      const factors = await db
        .select({ deviceName: facteurs2faAdmin.nomAppareil, actif: facteurs2faAdmin.actif })
        .from(facteurs2faAdmin)
        .where(eq(facteurs2faAdmin.compteStaffId, row.id))
        .limit(1);
      const factor = factors[0];
      if (factor) {
        secondFactorEnabled = factor.actif;
        secondFactorDevice = factor.deviceName;
      } else {
        secondFactorEnabled = null;
      }
    }
  }

  let sessions: SessionEnCoursProfil[] = [];
  if (userId) {
    const sessionRows = await db
      .select({
        id: tableSession.id,
        appareil: tableSession.userAgent,
        adresse: tableSession.ipAddress,
        creeLe: tableSession.createdAt,
        expireLe: tableSession.expiresAt,
      })
      .from(tableSession)
      .where(and(eq(tableSession.userId, userId), gt(tableSession.expiresAt, new Date())))
      .orderBy(desc(tableSession.createdAt))
      .limit(20);
    sessions = sessionRows;
  }

  const activite = staffAccountId ? await listerActiviteRecente(staffAccountId) : [];

  const canEditContactDetails =
    profile.type === "STAFF" && peutModifierSesCoordonnees(profile.role, profile.etat);

  return (
    <div className="flex flex-1 flex-col gap-4 bg-background p-4 sm:p-6">
      <ProfilUtilisateur
        nom={name}
        email={email || "Espace agent"}
        telephone={telephone}
        avatarUrl={avatarUrl}
        compte={account}
        profilClient={null}
        secondFacteurActif={secondFactorEnabled}
        appareilSecondFacteur={secondFactorDevice}
        matricule={staffNumber}
        creeLe={createdAt}
        creePar={createdBy}
        sessions={sessions}
        activite={activite}
        peutModifierCoordonnees={canEditContactDetails}
        motifCoordonneesVerrouillees={
          profile.type === "STAFF"
            ? motifCoordonneesVerrouillees(profile.role, profile.etat)
            : "Lecture seule : la correction est indisponible."
        }
        cleCoordonnees={`${name}-${telephone ?? ""}`}
        formulaireCoordonnees={
          <FormulaireMonProfil nomInitial={name} telephoneInitial={telephone ?? ""} />
        }
        sessionActuelleId={currentSessionId}
        formulaireMotDePasse={
          profile.type === "STAFF" && profile.etat === "VALIDE" ? (
            <FormulaireMotDePasse />
          ) : undefined
        }
        formulaireSecondFacteur={
          profile.type === "STAFF" && profile.etat === "VALIDE" ? (
            secondFactorEnabled === true ? (
              <DesactivationSecondFacteur />
            ) : (
              <ActivationSecondFacteur email={email} telephone={telephone} />
            )
          ) : undefined
        }
      />
    </div>
  );
}

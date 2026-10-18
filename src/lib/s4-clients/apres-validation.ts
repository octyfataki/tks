import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db, type ExecuteurDb } from "@/lib/db/client";
import { comptesClients } from "@/lib/db/schema/s1-comptes";
import {
  accesProfilClients,
  demandesAccesProfil,
  profilsClients,
} from "@/lib/db/schema/s4-clients";
import { enregistrerEvenement } from "@/lib/s2-autorisations/journal";

export type IssueProfilApresValidation =
  | { statut: "AUCUNE"; profilClientId: null }
  | { statut: "ACCES_AUTOMATIQUE"; profilClientId: string }
  | { statut: "A_CONFIRMER"; profilClientId: string };

/**
 * Ce qu'il reste à faire au profil quand le compte vient d'être validé.
 *
 * - aucun profil : rien à faire, le compte est utilisable sans données
 *   financières ;
 * - profil créé par **cette** inscription : l'accès est accordé dans le même
 *   parcours contrôlé, sans intermédiaire. C'est la seule origine qui l'autorise ;
 * - profil existant retrouvé : on n'accorde rien, une demande part vers un agent.
 */
export async function resoudreProfilApresValidation(
  compteClientId: string,
  ex: ExecuteurDb = db,
): Promise<IssueProfilApresValidation> {
  const comptes = await ex
    .select({ profilCandidatId: comptesClients.profilCandidatId })
    .from(comptesClients)
    .where(eq(comptesClients.id, compteClientId))
    .limit(1);
  const profilCandidatId = comptes[0]?.profilCandidatId ?? null;

  if (profilCandidatId) {
    return { statut: "A_CONFIRMER", profilClientId: profilCandidatId };
  }

  const siens = await ex
    .select({ id: profilsClients.id })
    .from(profilsClients)
    .where(
      and(
        eq(profilsClients.creePar, compteClientId),
        eq(profilsClients.origine, "INSCRIPTION"),
      ),
    )
    .limit(1);
  const profil = siens[0];

  return profil
    ? { statut: "ACCES_AUTOMATIQUE", profilClientId: profil.id }
    : { statut: "AUCUNE", profilClientId: null };
}

/**
 * À appeler juste après la validation du compte. N'écrit aucune donnée
 * financière : elle accorde un droit de lecture sur le profil du shop, et
 * ouvre une demande quand un humain doit trancher.
 */
export async function appliquerIssueApresValidation(input: {
  compteClientId: string;
  acteurId: string;
  roleAuMoment: string;
  horodatageLocal: Date;
}): Promise<IssueProfilApresValidationResult> {
  const issue = await resoudreProfilApresValidation(input.compteClientId);

  if (issue.statut === "AUCUNE") {
    return { statut: "AUCUNE", cree: false };
  }

  if (issue.statut === "A_CONFIRMER") {
    const demandes = await db
      .select({ id: demandesAccesProfil.id })
      .from(demandesAccesProfil)
      .where(
        and(
          eq(demandesAccesProfil.compteClientId, input.compteClientId),
          eq(demandesAccesProfil.statut, "EN_ATTENTE"),
        ),
      )
      .limit(1);
    if (demandes.length > 0) {
      return { statut: "A_CONFIRMER", cree: false };
    }
    await db.insert(demandesAccesProfil).values({
      id: randomUUID(),
      compteClientId: input.compteClientId,
      profilClientId: issue.profilClientId,
      statut: "EN_ATTENTE",
      indiceDetection: "correspondance a l'inscription",
      horodatageLocal: input.horodatageLocal,
    });
    await enregistrerEvenement({
      acteurId: input.acteurId,
      roleAuMoment: input.roleAuMoment,
      typeAction: "profil.acces.demande",
      entite: "demandes_acces_profil",
      entiteId: input.compteClientId,
      apres: { profilClientId: issue.profilClientId, origine: "validation" },
      horodatageLocal: input.horodatageLocal,
    });
    return { statut: "A_CONFIRMER", cree: true };
  }

  const accesId = randomUUID();
  await db.insert(accesProfilClients).values({
    id: accesId,
    compteClientId: input.compteClientId,
    profilClientId: issue.profilClientId,
    statut: "ACCORDE",
    decidePar: input.acteurId,
    horodatageLocal: input.horodatageLocal,
  });
  await enregistrerEvenement({
    acteurId: input.acteurId,
    roleAuMoment: input.roleAuMoment,
    typeAction: "profil.acces.automatique",
    entite: "acces_profil_clients",
    entiteId: accesId,
    apres: {
      compteClientId: input.compteClientId,
      profilClientId: issue.profilClientId,
      origine: "INSCRIPTION",
    },
    horodatageLocal: input.horodatageLocal,
  });
  return { statut: "ACCES_AUTOMATIQUE", cree: true };
}

export type IssueProfilApresValidationResult = {
  statut: IssueProfilApresValidation["statut"];
  cree: boolean;
};
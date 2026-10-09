import { headers } from "next/headers";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { comptesStaff } from "@/lib/db/schema/s1-comptes";
import { journalAudit } from "@/lib/db/schema/s2-autorisations";
import { peutConsulterJournal } from "@/lib/db/schema/s2-autorisations";
import { PermissionRefusee } from "@/components/permission-refusee";
import { Badge } from "@/components/ui/badge";
import { RegistreJournal, type LigneJournal } from "./registre-journal";

const LIGNES = 50;

function texteJson(valeur: unknown): string | null {
  if (valeur === null || valeur === undefined) return null;
  try {
    return JSON.stringify(valeur, null, 2);
  } catch {
    return String(valeur);
  }
}

/**
 * /admin/journal — Lecture du journal d'audit : les 50 derniers événements,
 * dans le même dessin que les registres d'invitations (barre d'outils en
 * carte, tableau à lignes dépliables, pagination locale).
 * La consultation n'est pas journalisée (sinon boucle — S2 issue 01).
 * Append-only garanti par la base : lecture seule, aucun bouton d'écriture.
 */
export default async function JournalPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id ?? "";
  const lignesMoi = userId
    ? await db
        .select({ role: comptesStaff.role, etat: comptesStaff.etat })
        .from(comptesStaff)
        .where(eq(comptesStaff.betterAuthUserId, userId))
    : [];
  const moi = lignesMoi[0];
  if (!moi || !peutConsulterJournal(moi.role, moi.etat)) {
    return (
      <PermissionRefusee
        titre="Journal d'audit"
        detail="Seul un administrateur principal ou technique validé consulte le journal."
        action="Votre rôle ne permet pas de consulter le journal d'audit."
      />
    );
  }

  const evenements = await db
    .select()
    .from(journalAudit)
    .orderBy(desc(journalAudit.recuLe))
    .limit(LIGNES);

  const lignes: LigneJournal[] = evenements.map((e) => ({
    id: e.id,
    acteurId: e.acteurId,
    role: e.roleAuMoment,
    typeAction: e.typeAction,
    entite: e.entite,
    entiteId: e.entiteId,
    avant: texteJson(e.avant),
    apres: texteJson(e.apres),
    appareilId: e.appareilId,
    ecritLe: e.horodatageLocal.toISOString(),
    recuLe: e.recuLe.toISOString(),
    statut: e.statut,
    motif: e.motif,
  }));

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight">
            Journal d&apos;audit
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Registre scellé : ni modification ni suppression possibles, même
            en base. Les {LIGNES} dernières lignes reçues, heures de Kinshasa.
          </p>
        </div>
        <Badge variant="outline" className="shrink-0">
          Lecture seule
        </Badge>
      </div>
      <RegistreJournal lignes={lignes} />
    </div>
  );
}

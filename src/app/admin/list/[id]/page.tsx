import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { ArrowLeftIcon } from "lucide-react";
import { db } from "@/lib/db/client";
import { user } from "@/lib/db/schema/auth-schema";
import {
  comptesStaff,
  facteurs2faAdmin,
  premiersAccesAdmin,
} from "@/lib/db/schema/s1-comptes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const LIBELLE_ROLE: Record<string, string> = {
  ADMIN_PRINCIPAL: "Administrateur principal",
  ADMIN_TECHNIQUE: "Administrateur technique",
};

const ROLES_LISTE = ["ADMIN_PRINCIPAL", "ADMIN_TECHNIQUE"];

function initiales(nom: string): string {
  const lettres = nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot.charAt(0).toUpperCase())
    .join("");
  return lettres || "AD";
}

function dateLongue(valeur: Date): string {
  return valeur.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function Champ({ etiquette, valeur }: { etiquette: string; valeur: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-muted-foreground">{etiquette}</p>
      <p className="mt-0.5 text-xs">{valeur}</p>
    </div>
  );
}

/** Lien de premier accès en attente : non consommé et non expiré. */
function premierAccesEnAttente(
  acces: { expireLe: Date; consommeLe: Date | null } | undefined,
  maintenant: number = Date.now(),
): boolean {
  if (!acces || acces.consommeLe !== null) return false;
  return acces.expireLe.getTime() > maintenant;
}

/**
 * /admin/list/[id] — Profil d'un compte d'administration (lecture seule).
 * Réservé à l'espace /admin (garde du layout). Un identifiant inconnu ou
 * hors administration rend 404 : les agents de service ont leur propre
 * liste, et un compte ne se consulte jamais par une autre porte.
 */
export default async function ProfilAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Le créateur se résout en seconde requête : les jointures aliasées sur
  // la même table font s'effondrer le typage Drizzle en never[].
  const lignes = await db
    .select({
      id: comptesStaff.id,
      email: comptesStaff.email,
      telephone: comptesStaff.telephone,
      role: comptesStaff.role,
      etat: comptesStaff.etat,
      creePar: comptesStaff.creePar,
      createdAt: comptesStaff.createdAt,
      revokedAt: comptesStaff.revokedAt,
      nom: user.name,
    })
    .from(comptesStaff)
    .leftJoin(user, eq(user.id, comptesStaff.betterAuthUserId))
    .where(eq(comptesStaff.id, id))
    .limit(1);

  const compte = lignes[0];
  if (!compte || !ROLES_LISTE.includes(compte.role)) notFound();

  const nom =
    compte.nom?.trim() || compte.email.split("@")[0] || "Administrateur";

  const lignesCreateur = compte.creePar
    ? await db
        .select({ email: comptesStaff.email, nom: user.name })
        .from(comptesStaff)
        .leftJoin(user, eq(user.id, comptesStaff.betterAuthUserId))
        .where(eq(comptesStaff.id, compte.creePar))
        .limit(1)
    : [];
  const createur = compte.creePar
    ? (lignesCreateur[0]?.nom?.trim() ||
      lignesCreateur[0]?.email ||
      "Compte supprimé")
    : "Système (bootstrap)";

  const facteurs = await db
    .select({
      nomAppareil: facteurs2faAdmin.nomAppareil,
      actif: facteurs2faAdmin.actif,
      createdAt: facteurs2faAdmin.createdAt,
    })
    .from(facteurs2faAdmin)
    .where(eq(facteurs2faAdmin.compteStaffId, compte.id))
    .limit(1);
  const facteur = facteurs[0];

  const acces = await db
    .select({
      expireLe: premiersAccesAdmin.expireLe,
      consommeLe: premiersAccesAdmin.consommeLe,
    })
    .from(premiersAccesAdmin)
    .where(eq(premiersAccesAdmin.compteStaffCible, compte.id))
    .orderBy(desc(premiersAccesAdmin.createdAt))
    .limit(1);
  const dernierAcces = acces[0];
  const accesEnAttente = premierAccesEnAttente(dernierAcces);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
      <Button
        variant="ghost"
        size="sm"
        className="self-start"
        render={<Link href="/admin/list" />}
      >
        <ArrowLeftIcon />
        Retour à la liste
      </Button>

      <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
        <span
          aria-hidden
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
        >
          {initiales(nom)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold">{nom}</p>
          <p className="truncate text-xs text-muted-foreground">
            {compte.email}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
          <Badge variant="outline">
            {LIBELLE_ROLE[compte.role] ?? compte.role}
          </Badge>
          <Badge
            variant={compte.etat === "VALIDE" ? "secondary" : "destructive"}
          >
            {compte.etat}
          </Badge>
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-4">
          <h2 className="text-sm font-medium">Connexion</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Champ etiquette="Adresse email" valeur={compte.email} />
            <Champ
              etiquette="Téléphone (contact uniquement)"
              valeur={compte.telephone || "—"}
            />
            <Champ etiquette="Compte créé le" valeur={dateLongue(compte.createdAt)} />
            <Champ etiquette="Créé par" valeur={createur} />
            {compte.revokedAt ? (
              <Champ
                etiquette="Révoqué le"
                valeur={dateLongue(compte.revokedAt)}
              />
            ) : null}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            Le rôle est immuable : tout changement passe par révocation +
            recréation tracées (S2).
          </p>
        </section>

        <section className="rounded-xl border bg-card p-4">
          <h2 className="text-sm font-medium">Sécurité</h2>
          <div className="mt-3 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs">Second facteur (TOTP)</p>
              {!facteur ? (
                <Badge variant="outline">Non configuré</Badge>
              ) : facteur.actif ? (
                <Badge variant="secondary">Actif</Badge>
              ) : (
                <Badge variant="destructive">Remplacé</Badge>
              )}
            </div>
            {facteur ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Champ etiquette="Appareil" valeur={facteur.nomAppareil} />
                <Champ
                  etiquette="Enregistré le"
                  valeur={dateLongue(facteur.createdAt)}
                />
              </div>
            ) : (
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Obligatoire pour un administrateur principal ou technique :
                application d&apos;authentification, jamais par SMS.
              </p>
            )}
            <div className="flex items-center justify-between gap-2 border-t pt-3">
              <p className="text-xs">Lien de premier accès</p>
              {accesEnAttente ? (
                <Badge variant="outline">En attente</Badge>
              ) : dernierAcces ? (
                <Badge variant="secondary">Consommé</Badge>
              ) : (
                <Badge variant="outline">Aucun</Badge>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

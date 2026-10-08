import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeftIcon } from "lucide-react";
import { db } from "@/lib/db/client";
import { user } from "@/lib/db/schema/auth-schema";
import { comptesStaff, peutInviterAgent } from "@/lib/db/schema/s1-comptes";
import {
  PERMISSIONS_FERMEES,
  peutConsulterJournal,
  peutGererPermissions,
} from "@/lib/db/schema/s2-autorisations";
import { listerPermissions } from "@/lib/s2-autorisations/autorisations";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { nomAffiche, initiales, dateCourte } from "../../list/affichage-admin";
import { InterrupteurPermission, ProfilEmbauche } from "./permissions-agent";
import { InterrupteurAgent } from "../interrupteur-agent";
import { HistoriqueAgent } from "./historique-agent";
import { BoutonRevocationAgent } from "./bouton-revocation";
import { FormulaireCoordonneesAgent } from "./formulaire-coordonnees";
import { FormulaireEmailAgent } from "./formulaire-email";
import { SectionModifiable } from "../../list/[id]/section-modifiable";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

function Champ({ etiquette, valeur }: { etiquette: string; valeur: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-muted-foreground">{etiquette}</p>
      <p className="mt-0.5 text-xs">{valeur}</p>
    </div>
  );
}

/**
 * /admin/agents/[id] — Fiche d'un agent de service : identité, traçabilité,
 * état, et ses permissions une par une. Un identifiant inconnu ou non-agent
 * rend 404 : un compte ne se consulte jamais par une autre porte.
 */
export default async function FicheAgentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const lignes = await db
    .select({
      id: comptesStaff.id,
      email: comptesStaff.email,
      telephone: comptesStaff.telephone,
      etat: comptesStaff.etat,
      role: comptesStaff.role,
      creePar: comptesStaff.creePar,
      createdAt: comptesStaff.createdAt,
      revokedAt: comptesStaff.revokedAt,
      suspendedAt: comptesStaff.suspendedAt,
      nom: user.name,
    })
    .from(comptesStaff)
    .leftJoin(user, eq(user.id, comptesStaff.betterAuthUserId))
    .where(eq(comptesStaff.id, id))
    .limit(1);

  const compte = lignes[0];
  if (!compte || compte.role !== "AGENT") notFound();

  const nom = nomAffiche({ nom: compte.nom, email: compte.email });

  const lignesCreateur = compte.creePar
    ? await db
        .select({ email: comptesStaff.email, nom: user.name })
        .from(comptesStaff)
        .leftJoin(user, eq(user.id, comptesStaff.betterAuthUserId))
        .where(eq(comptesStaff.id, compte.creePar))
        .limit(1)
    : [];
  const createur = compte.creePar
    ? (lignesCreateur[0]?.nom?.trim() || lignesCreateur[0]?.email || "Compte supprimé")
    : "Lien d'invitation";

  const detenues = await listerPermissions(compte.id);
  const ensemble = new Set(detenues);

  const session = await auth.api.getSession({ headers: await headers() });
  const lignesMoi = session?.user?.id
    ? await db
        .select({ id: comptesStaff.id, role: comptesStaff.role, etat: comptesStaff.etat })
        .from(comptesStaff)
        .where(eq(comptesStaff.betterAuthUserId, session.user.id))
        .limit(1)
    : [];
  const moi = lignesMoi[0];
  const puisJeGerer = moi ? peutGererPermissions(moi.role, moi.etat) : false;
  const puisJeCorriger = moi ? peutInviterAgent(moi.role, moi.etat) : false;
  const puisJeVoirHistorique = moi
    ? peutConsulterJournal(moi.role, moi.etat)
    : false;
  const valide = compte.etat === "VALIDE";
  const suspendu = compte.etat === "SUSPENDU";
  const verrouille = !puisJeGerer || !valide;
  const estMoi = !!moi && moi.id === compte.id;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
      <Link
        href="/admin/agents"
        className={buttonVariants({ variant: "ghost", size: "sm", className: "self-start" })}
      >
        <ArrowLeftIcon />
        Retour aux agents
      </Link>

      <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
        <span
          aria-hidden
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
        >
          {initiales(nom)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold">{nom}</p>
          <p className="truncate text-xs text-muted-foreground">{compte.email}</p>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
          <Badge variant="outline">Agent de service</Badge>
          <Badge variant={valide ? "secondary" : suspendu ? "default" : "destructive"}>{compte.etat}</Badge>
        </div>
      </div>

      <Tabs defaultValue="compte" className="mt-0 w-full">
        <TabsList aria-label="Sections de la fiche agent" className="inline-flex h-auto w-fit max-w-full flex-wrap items-center gap-1 p-1">
          <TabsTrigger value="compte" className="flex-none px-3 py-1.5 text-sm">
            Compte
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex-none px-3 py-1.5 text-sm">
            Permissions
          </TabsTrigger>
          {puisJeVoirHistorique ? (
            <TabsTrigger value="historique" className="flex-none px-3 py-1.5 text-sm">
              Historique
            </TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="compte" className="mt-4">
          <div className="grid items-start gap-4 lg:grid-cols-2">
            <section className="rounded-xl border bg-card p-4">
              <SectionModifiable
                titre="Coordonnées"
                description="Nom et téléphone retouchables par un administrateur principal."
                peutModifier={puisJeCorriger && valide}
                motifVerrouille={
                  !puisJeCorriger
                    ? "Lecture seule : seul un administrateur principal validé corrige cette fiche."
                    : suspendu
                      ? "Compte suspendu : lever la suspension pour corriger."
                      : "Compte révoqué : définitif, aucune correction."
                }
                cleRepli={`${nom}-${compte.telephone ?? ""}`}
                lecture={
                  <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Champ etiquette="Nom affiché" valeur={nom} />
                    <Champ etiquette="Téléphone (contact uniquement)" valeur={compte.telephone || "—"} />
                    <Champ etiquette="Adresse email" valeur={compte.email} />
                    <Champ etiquette="Compte créé le" valeur={dateCourte(compte.createdAt)} />
                    <Champ etiquette="Créé par" valeur={createur} />
                    {compte.revokedAt ? (
                      <Champ etiquette="Révoqué le" valeur={dateCourte(compte.revokedAt)} />
                    ) : null}
                    {compte.suspendedAt && suspendu ? (
                      <Champ etiquette="Suspendu le" valeur={dateCourte(compte.suspendedAt)} />
                    ) : null}
                  </dl>
                }
                formulaire={
                  <FormulaireCoordonneesAgent
                    id={compte.id}
                    nomInitial={nom}
                    telephoneInitial={compte.telephone ?? ""}
                  />
                }
              />
              <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                Le rôle est immuable : tout changement passe par révocation +
                recréation tracées (S2). Pas de second facteur pour un agent : la
                confiance passe par l&apos;email.
              </p>
            </section>

            <section className="rounded-xl border bg-card p-4">
              <SectionModifiable
                titre="Identifiant de connexion"
                description="Adresse email : l'agent s'y connecte. Changement confirmé deux fois."
                peutModifier={puisJeCorriger && valide}
                motifVerrouille={
                  !puisJeCorriger
                    ? "Lecture seule : seul un administrateur principal validé corrige cette fiche."
                    : suspendu
                      ? "Compte suspendu : lever la suspension pour corriger."
                      : "Compte révoqué : définitif, aucune correction."
                }
                cleRepli={compte.email}
                lecture={
                  <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Champ etiquette="Adresse actuelle" valeur={compte.email} />
                  </dl>
                }
                formulaire={
                  <FormulaireEmailAgent
                    id={compte.id}
                    emailInitial={compte.email}
                  />
                }
              />
            </section>

            <section className="rounded-xl border border-destructive/30 bg-card p-4">
              <h2 className="text-sm font-medium">Accès au compte</h2>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {estMoi
                  ? "Votre propre compte : la suspension est impossible."
                  : "La suspension est réversible : le compte ne se connecte plus, la levée reste possible."}
              </p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="text-xs">
                  État actuel : <span className="font-medium">{compte.etat}</span>
                </p>
                <InterrupteurAgent
                  id={compte.id}
                  nom={nom}
                  etat={suspendu ? "SUSPENDU" : valide ? "VALIDE" : "REVOQUE"}
                  desactive={estMoi}
                  motifDesactive="Vous ne pouvez pas suspendre votre propre compte."
                  sansRevocation
                />
              </div>
            </section>

            <ProfilEmbauche agentId={compte.id} detenues={detenues} desactive={verrouille} />
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="mt-4">
          <section className="rounded-xl border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-sm font-medium">Permissions, une par une</h2>
              {verrouille ? (
                <Badge variant="outline" className="shrink-0">Lecture seule</Badge>
              ) : null}
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {verrouille
                ? "Seul un administrateur principal validé modifie les permissions, et jamais sur un compte suspendu ou révoqué."
                : "Absence = refus. Chaque bascule est tracée au journal."}
            </p>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {PERMISSIONS_FERMEES.map((permission) => (
                <InterrupteurPermission
                  key={permission}
                  agentId={compte.id}
                  permission={permission}
                  accordee={ensemble.has(permission)}
                  desactive={verrouille}
                />
              ))}
            </div>
          </section>
        </TabsContent>

        {puisJeVoirHistorique ? (
          <TabsContent value="historique" className="mt-4">
            <HistoriqueAgent agentId={compte.id} />
          </TabsContent>
        ) : null}
      </Tabs>

      <section className="rounded-xl border border-destructive bg-card p-4">
        <h2 className="text-sm font-medium text-destructive">Zone dangereuse</h2>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          La révocation est définitive : rouvrir un accès exige révocation +
          recréation tracées. Volontairement éloignée des gestes courants.
        </p>
        <div className="mt-3 flex items-center justify-end gap-2">
          <BoutonRevocationAgent
            id={compte.id}
            nom={nom}
            revoque={!valide && !suspendu}
            desactive={estMoi}
            motifDesactive="Vous ne pouvez pas révoquer votre propre compte."
          />
        </div>
      </section>
    </div>
  );
}

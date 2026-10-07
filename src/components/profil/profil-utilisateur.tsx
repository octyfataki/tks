import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// Profil standard, piloté par la session. Un seul composant pour tout type
// d'utilisateur : le parent serveur passe les données de session, le
// composant n'affiche que les parties pertinentes (compte toujours, dossier
// client si rattaché, mission si agent de service, administration si admin).
// Vocabulaire : GLOSSARY (compte, dossier client, jamais shop / vente /
// réalisation). Affichage seul : aucune écriture directe (invariant 1).

export type CompteProfil =
  | { type: "CLIENT" }
  | {
      type: "STAFF";
      role: "ADMIN_PRINCIPAL" | "ADMIN_TECHNIQUE" | "AGENT";
      etat: "VALIDE" | "REVOQUE";
    };

export type DossierRattacheProfil = {
  nom: string;
  statut: "EN_EVALUATION" | "PRIVILEGIE";
  adresse?: string | null;
};

export type ProfilUtilisateurProps = {
  nom: string;
  email: string;
  telephone?: string | null;
  avatarUrl?: string | null;
  compte: CompteProfil;
  dossier?: DossierRattacheProfil | null;
  secondFacteurActif?: boolean | null;
  className?: string;
};

function initiales(nom: string): string {
  const lettres = nom
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return lettres || "–";
}

function libelleRole(compte: CompteProfil): string {
  if (compte.type === "CLIENT") return "Client";
  switch (compte.role) {
    case "ADMIN_PRINCIPAL":
      return "Administrateur principal · Distributeur";
    case "ADMIN_TECHNIQUE":
      return "Administrateur technique · Diagnostic";
    case "AGENT":
      return "Agent de service · Terrain";
  }
}

function libelleEtat(compte: CompteProfil): string {
  if (compte.type === "CLIENT") return "Compte client";
  return compte.etat === "VALIDE" ? "VALIDE" : "REVOQUE";
}

function libelleSecondFacteur(actif: boolean | null | undefined): string {
  if (actif === true) return "Actif";
  if (actif === false) return "À activer";
  return "Non vérifié";
}

function Champ({ etiquette, valeur }: { etiquette: string; valeur: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{etiquette}</dt>
      <dd className="mt-0.5 truncate text-sm font-medium text-foreground">
        {valeur}
      </dd>
    </div>
  );
}

export function ProfilUtilisateur({
  nom,
  email,
  telephone,
  avatarUrl,
  compte,
  dossier,
  secondFacteurActif,
  className,
}: ProfilUtilisateurProps) {
  const estStaff = compte.type === "STAFF";
  const estAgent = estStaff && compte.role === "AGENT";
  const estAdmin = estStaff && compte.role !== "AGENT";
  const dossierAffiche = compte.type === "CLIENT" ? dossier ?? null : null;

  const onglets = [
    { valeur: "compte", etiquette: "Profil du compte" },
    ...(compte.type === "CLIENT"
      ? [{ valeur: "dossier", etiquette: "Dossier client" }]
      : []),
    ...(estStaff ? [{ valeur: "acces", etiquette: "Accès et mission" }] : []),
  ];

  return (
    <section aria-label="Profil du compte" className={cn("mx-auto w-full max-w-5xl", className)}>
      <Tabs defaultValue="compte" className="mt-0 w-full">
        <TabsList
          aria-label="Sections du profil"
          className="inline-flex h-auto w-fit max-w-full flex-wrap items-center gap-1 p-1"
        >
          {onglets.map((onglet) => (
            <TabsTrigger
              key={onglet.valeur}
              value={onglet.valeur}
              className="flex-none px-3 py-1.5 text-sm"
            >
              {onglet.etiquette}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="compte" className="mt-4">
          <Card>
            <CardContent className="flex flex-col gap-6 py-6 sm:flex-row">
              <div className="flex items-center gap-4 sm:min-w-72">
                <Avatar className="size-16 shrink-0 sm:size-20">
                  {avatarUrl ? <AvatarImage src={avatarUrl} alt={nom} /> : null}
                  <AvatarFallback className="text-lg">{initiales(nom)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h1 className="truncate text-lg font-semibold tracking-tight">
                    {nom}
                  </h1>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {libelleRole(compte)}
                  </p>
                  <p className="mt-1 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {libelleEtat(compte)}
                  </p>
                </div>
              </div>
              <Separator orientation="vertical" className="hidden sm:block" />
              <Separator className="sm:hidden" />
              <dl className="grid flex-1 grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <Champ etiquette="Identifiant" valeur={email} />
                <Champ
                  etiquette="Numéro de contact"
                  valeur={telephone?.trim() ? telephone : "Non renseigné"}
                />
                <Champ etiquette="Type de compte" valeur={libelleRole(compte)} />
                <Champ etiquette="État du compte" valeur={libelleEtat(compte)} />
              </dl>
            </CardContent>
          </Card>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Informations du compte</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                  <Champ etiquette="Nom affiché" valeur={nom} />
                  <Champ etiquette="Identifiant" valeur={email} />
                  <Champ
                    etiquette="Numéro de contact"
                    valeur={telephone?.trim() ? telephone : "Non renseigné"}
                  />
                  <Champ
                    etiquette="Espace"
                    valeur={
                      compte.type === "CLIENT"
                        ? "Espace client"
                        : compte.role === "AGENT"
                          ? "Espace agent"
                          : "Espace distributeur"
                    }
                  />
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sécurité</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                  <Champ etiquette="Connexion" valeur="Mot de passe" />
                  {estAdmin ? (
                    <Champ
                      etiquette="Second facteur"
                      valeur={libelleSecondFacteur(secondFacteurActif)}
                    />
                  ) : (
                    <Champ etiquette="Session" valeur="Durée bornée, survit à la coupure" />
                  )}
                </dl>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {compte.type === "CLIENT" ? (
          <TabsContent value="dossier" className="mt-4">
            {dossierAffiche ? (
              <Card>
                <CardHeader>
                  <CardTitle>Dossier client rattaché</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                    <Champ etiquette="Nom du dossier" valeur={dossierAffiche.nom} />
                    <Champ
                      etiquette="Statut"
                      valeur={
                        dossierAffiche.statut === "PRIVILEGIE"
                          ? "PRIVILEGIE"
                          : "EN_EVALUATION"
                      }
                    />
                    <div className="sm:col-span-2">
                      <Champ
                        etiquette="Adresse"
                        valeur={dossierAffiche.adresse?.trim() ? dossierAffiche.adresse : "Non renseignée"}
                      />
                    </div>
                  </dl>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Dossier client</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Aucun dossier rattaché : aucun dossier ni solde n&apos;est
                    visible tant que le rattachement n&apos;est pas fait.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ) : null}

        {estStaff ? (
          <TabsContent value="acces" className="mt-4">
            {estAgent ? (
              <Card>
                <CardHeader>
                  <CardTitle>Mission de terrain</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                    <Champ etiquette="Fonction" valeur="Agent de service" />
                    <Champ etiquette="Mode de travail" valeur="Hors-ligne capable" />
                  </dl>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    Sert les commandes, encaisse au comptoir, valide les preuves
                    de paiement.
                  </p>
                </CardContent>
              </Card>
            ) : null}

            {estAdmin ? (
              <Card>
                <CardHeader>
                  <CardTitle>Administration</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                    <Champ
                      etiquette="Pouvoir métier"
                      valeur={
                        compte.role === "ADMIN_PRINCIPAL"
                          ? "Distributeur : taux, plafonds, promotions"
                          : "Diagnostic seul, action tracée"
                      }
                    />
                    <Champ
                      etiquette="Second facteur"
                      valeur={libelleSecondFacteur(secondFacteurActif)}
                    />
                  </dl>
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>
        ) : null}
      </Tabs>
    </section>
  );
}

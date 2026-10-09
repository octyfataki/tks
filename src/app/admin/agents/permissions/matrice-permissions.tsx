"use client";

import * as React from "react";
import {
  ArrowDownUpIcon,
  BadgeCheckIcon,
  BanknoteIcon,
  BookOpenIcon,
  CheckIcon,
  ChevronDownIcon,
  CircleXIcon,
  ClipboardListIcon,
  FolderPlusIcon,
  HandIcon,
  HistoryIcon,
  LandmarkIcon,
  LinkIcon,
  ListFilterIcon,
  LoaderCircleIcon,
  PackageCheckIcon,
  ScaleIcon,
  SearchIcon,
  SettingsIcon,
  ShieldCheckIcon,
  UnlinkIcon,
  UserCogIcon,
  UserPlusIcon,
  UsersIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { accorderSocleAction, appliquerSocleLotAction, retirerSocleAction } from "../actions";
import { LIBELLES_PERMISSION } from "../[id]/permissions-agent";

/**
 * Groupes métier des 18 permissions : le distributeur raisonne
 * « que peut-il toucher », pas en codes. Jamais de numérotation —
 * ce n'est pas une séquence.
 */
const GROUPES: { titre: string; detail: string; permissions: string[] }[] = [
  {
    titre: "Clients",
    detail: "Dossiers, rattachements, plafond et statut.",
    permissions: [
      "dossier.creer",
      "dossier.rattacher",
      "dossier.detacher",
      "plafond.modifier",
      "statut.modifier",
    ],
  },
  {
    titre: "Commandes",
    detail: "Créer, prendre, servir, annuler.",
    permissions: [
      "commande.creer",
      "commande.prendre",
      "commande.servir",
      "commande.annuler",
    ],
  },
  {
    titre: "Argent",
    detail: "Preuves, encaissements, corrections, trésorerie.",
    permissions: [
      "preuve.valider",
      "paiement.creer",
      "creance.creer",
      "ecriture.corriger",
      "tresorerie.mouvement",
    ],
  },
  {
    titre: "Pilotage",
    detail: "Taux, grille, réconciliation, journal.",
    permissions: [
      "taux.saisir",
      "grille.tarif",
      "reconciliation.trancher",
      "journal.consulter",
    ],
  },
];

const ICONES: Record<string, LucideIcon> = {
  "dossier.creer": FolderPlusIcon,
  "dossier.rattacher": LinkIcon,
  "dossier.detacher": UnlinkIcon,
  "plafond.modifier": ScaleIcon,
  "statut.modifier": UserCogIcon,
  "commande.creer": ClipboardListIcon,
  "commande.prendre": HandIcon,
  "commande.servir": PackageCheckIcon,
  "commande.annuler": CircleXIcon,
  "preuve.valider": BadgeCheckIcon,
  "paiement.creer": BanknoteIcon,
  "creance.creer": WalletIcon,
  "ecriture.corriger": HistoryIcon,
  "tresorerie.mouvement": LandmarkIcon,
  "taux.saisir": SettingsIcon,
  "grille.tarif": BookOpenIcon,
  "reconciliation.trancher": ShieldCheckIcon,
  "journal.consulter": UsersIcon,
};

const FILTRES_SOCLE = [
  { valeur: "", etiquette: "Toutes les permissions" },
  { valeur: "accordees", etiquette: "Accordées à tous" },
  { valeur: "refusees", etiquette: "Refusées" },
  { valeur: "sensibles", etiquette: "Sensibles seulement" },
] as const;

const TRIS_SOCLE = [
  { valeur: "", etiquette: "Ordre des blocs" },
  { valeur: "az", etiquette: "Titre A–Z" },
  { valeur: "accordees-dabord", etiquette: "Accordées d'abord" },
] as const;

function etiquetteSocle(
  valeurs: readonly { valeur: string; etiquette: string }[],
  actif: string,
) {
  return valeurs.find((v) => v.valeur === actif)?.etiquette ?? valeurs[0].etiquette;
}

const SENSIBLES = new Set([
  "taux.saisir",
  "plafond.modifier",
  "statut.modifier",
  "grille.tarif",
  "reconciliation.trancher",
  "journal.consulter",
  "creance.creer",
  "ecriture.corriger",
  "tresorerie.mouvement",
  "dossier.rattacher",
  "dossier.detacher",
]);

function BasculeSocle({
  permission,
  accordee,
  onResultat,
}: {
  permission: string;
  accordee: boolean;
  onResultat: (accordee: boolean, erreur: string | null) => void;
}) {
  const [enCours, demarrer] = React.useTransition();
  const titre = LIBELLES_PERMISSION[permission]?.titre ?? permission;

  function basculer() {
    demarrer(async () => {
      const resultat = accordee
        ? await retirerSocleAction(permission)
        : await accorderSocleAction(permission);
      if (resultat.ok) {
        onResultat(!accordee, null);
      } else {
        onResultat(accordee, resultat.erreur ?? "Action impossible.");
      }
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={accordee}
      aria-label={`${titre} : ${accordee ? "accordée à tous" : "refusée à tous"}`}
      title={titre}
      disabled={enCours}
      onClick={basculer}
      className={cn(
        "relative h-5 w-9 shrink-0 rounded-full transition-colors",
        accordee ? "bg-primary" : "bg-input",
        enCours ? "cursor-wait opacity-70" : "cursor-pointer",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform",
          accordee ? "translate-x-4" : null,
        )}
      />
    </button>
  );
}

/**
 * Une carte par permission : état lisible d'un coup d'œil (bordure et
 * mot d'état), description courte (3 lignes max), interrupteur en
 * pied de carte. Mémoïsée : seule la carte basculée se réaffiche.
 */
const CarteSocle = React.memo(function CarteSocle({
  permission,
  accordee,
  onResultat,
}: {
  permission: string;
  accordee: boolean;
  onResultat: (permission: string, accordee: boolean, erreur: string | null) => void;
}) {
  const libelle = LIBELLES_PERMISSION[permission] ?? { titre: permission, detail: "" };
  const Icone = ICONES[permission] ?? ClipboardListIcon;
  const [erreur, setErreur] = React.useState<string | null>(null);

  const gererResultat = React.useCallback(
    (nouvelle: boolean, message: string | null) => {
      setErreur(message);
      onResultat(permission, nouvelle, message);
    },
    [onResultat, permission],
  );

  return (
    <article
      aria-label={libelle.titre}
      className={cn(
        "flex flex-col gap-2.5 rounded-lg border bg-card p-3.5 transition-colors",
        accordee ? "border-primary/40 bg-primary/[0.03]" : null,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          aria-hidden
          className={cn(
            "flex size-8 items-center justify-center rounded-lg transition-colors",
            accordee ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
          )}
        >
          <Icone className="size-4" />
        </span>
        <span
          className={cn(
            "text-[11px] font-medium",
            accordee ? "text-primary" : "text-muted-foreground",
          )}
        >
          {accordee ? "Accordée à tous" : "Refusée"}
        </span>
      </div>

      <div>
        <h3 className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
          {libelle.titre}
          {SENSIBLES.has(permission) ? (
            <Badge variant="outline" className="text-[10px]">
              Sensible
            </Badge>
          ) : null}
        </h3>
        {libelle.detail ? (
          <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
            {libelle.detail}
          </p>
        ) : null}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t pt-2.5">
        <code className="min-w-0 truncate font-mono text-[10px] text-muted-foreground">
          {permission}
        </code>
        <BasculeSocle permission={permission} accordee={accordee} onResultat={gererResultat} />
      </div>

      {erreur ? (
        <p role="alert" className="text-[11px] font-medium text-destructive">
          {erreur}
        </p>
      ) : null}
    </article>
  );
});

/**
 * Un bloc par partie métier : titre, couverture et jauge, puis grille
 * de cartes. Aucune liste d'agents ici — ce qui est accordé vaut pour
 * chacun, y compris les nouveaux. Les exceptions se gèrent sur la fiche.
 */
export function SoclePermissions({ initiales }: { initiales: string[] }) {
  const [socle, setSocle] = React.useState<string[]>(initiales);
  const [message, setMessage] = React.useState<string | null>(null);
  const [recherche, setRecherche] = React.useState("");
  const [filtre, setFiltre] = React.useState<string>("");
  const [tri, setTri] = React.useState<string>("");
  const [lotEnCours, demarrerLot] = React.useTransition();

  const changer = React.useCallback(
    (permission: string, accordee: boolean, erreur: string | null) => {
      if (erreur) return;
      setMessage(
        accordee
          ? "Permission accordée à tous les agents."
          : "Permission retirée à tous les agents (sauf exception sur fiche).",
      );
      setSocle((precedent) =>
        accordee
          ? [...new Set([...precedent, permission])].sort()
          : precedent.filter((p) => p !== permission),
      );
    },
    [],
  );

  const accordees = React.useMemo(() => new Set(socle), [socle]);
  const total = GROUPES.reduce((n, g) => n + g.permissions.length, 0);

  const groupesVisibles = React.useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return GROUPES.map((groupe) => {
      const filtrees = groupe.permissions.filter((permission) => {
        const estAccordee = accordees.has(permission);
        if (filtre === "accordees" && !estAccordee) return false;
        if (filtre === "refusees" && estAccordee) return false;
        if (filtre === "sensibles" && !SENSIBLES.has(permission)) return false;
        if (!q) return true;
        const libelle = LIBELLES_PERMISSION[permission] ?? { titre: permission, detail: "" };
        return `${libelle.titre} ${libelle.detail} ${permission}`.toLowerCase().includes(q);
      });
      const rangees = [...filtrees];
      if (tri === "az") {
        rangees.sort((a, b) => {
          const titreA = LIBELLES_PERMISSION[a]?.titre ?? a;
          const titreB = LIBELLES_PERMISSION[b]?.titre ?? b;
          return titreA.localeCompare(titreB, "fr");
        });
      } else if (tri === "accordees-dabord") {
        rangees.sort((a, b) => Number(accordees.has(b)) - Number(accordees.has(a)));
      }
      return { ...groupe, permissions: rangees };
    }).filter((groupe) => groupe.permissions.length > 0);
  }, [recherche, filtre, tri, accordees]);

  const nbVisibles = groupesVisibles.reduce((n, g) => n + g.permissions.length, 0);
  const filtresActifs = recherche.trim() !== "" || filtre !== "" || tri !== "";

  function reinitialiser() {
    setRecherche("");
    setFiltre("");
    setTri("");
  }

  /** Lot en cours : un seul aller-retour serveur, état indéterminé. */

  /**
   * Préremplissage en lot (équivalent du « Ajouter ») : la liste des 18
   * permissions est fermée, on ne peut donc pas en créer — on remplit le
   * socle d'un coup, en un seul aller-retour serveur (un seul revalidate,
   * chaque accord/retrait restant journalisé un par un côté serveur).
   */
  function appliquerLot(cible: "profil" | "tout" | "rien") {
    demarrerLot(async () => {
      const resultat = await appliquerSocleLotAction(cible);
      if (!resultat.ok) {
        setMessage(resultat.erreur);
        return;
      }
      if (cible === "rien") {
        const retirees = resultat.retirees;
        setSocle((precedent) => precedent.filter((p) => !retirees.includes(p)));
        setMessage(
          retirees.length === 0
            ? "Socle déjà vide : tout est refusé par défaut."
            : `Socle vidé : ${retirees.length} permission${retirees.length > 1 ? "s" : ""} retirée${retirees.length > 1 ? "s" : ""} à tous.`,
        );
        return;
      }
      const ajoutees = resultat.ajoutees;
      setSocle((precedent) => [...new Set([...precedent, ...ajoutees])].sort());
      setMessage(
        ajoutees.length === 0
          ? "Rien à ajouter : ces permissions sont déjà au socle."
          : cible === "profil"
            ? `Profil d'embauche appliqué : ${ajoutees.length} permission${ajoutees.length > 1 ? "s" : ""} du quotidien accordée${ajoutees.length > 1 ? "s" : ""} à tous.`
            : `Socle complet : ${ajoutees.length} permission${ajoutees.length > 1 ? "s" : ""} accordée${ajoutees.length > 1 ? "s" : ""} à tous, y compris les sensibles.`,
      );
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card size="sm">
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-0 flex-1 basis-52 sm:max-w-xs">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                role="searchbox"
                aria-label="Rechercher une permission"
                placeholder="Titre, description, code…"
                value={recherche}
                onChange={(event) => setRecherche(event.target.value)}
                className="pl-8"
              />
            </div>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="outline" aria-label="Filtrer les permissions">
                      <ListFilterIcon />
                      {filtre ? etiquetteSocle(FILTRES_SOCLE, filtre) : "Filtrer"}
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-56">
                  {FILTRES_SOCLE.map((option) => (
                    <DropdownMenuItem
                      key={option.valeur || "toutes"}
                      onClick={() => setFiltre(option.valeur)}
                    >
                      {filtre === option.valeur ? <CheckIcon /> : null}
                      {option.etiquette}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="outline" aria-label="Trier les permissions">
                      <ArrowDownUpIcon />
                      {tri ? etiquetteSocle(TRIS_SOCLE, tri) : "Trier"}
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-56">
                  {TRIS_SOCLE.map((option) => (
                    <DropdownMenuItem
                      key={option.valeur || "defaut"}
                      onClick={() => setTri(option.valeur)}
                    >
                      {tri === option.valeur ? <CheckIcon /> : null}
                      {option.etiquette}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button aria-label="Préremplir le socle" disabled={lotEnCours}>
                      {lotEnCours ? (
                        <LoaderCircleIcon className="animate-spin" />
                      ) : (
                        <ChevronDownIcon />
                      )}
                      {lotEnCours ? "Application…" : "Préremplir"}
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuItem onClick={() => appliquerLot("profil")}>
                    <UserPlusIcon />
                    <span className="flex min-w-0 flex-col">
                      <span className="text-xs font-medium">Profil d&apos;embauche</span>
                      <span className="text-[11px] whitespace-normal text-muted-foreground">
                        Les 7 permissions du quotidien, sans les sensibles.
                      </span>
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => appliquerLot("tout")}>
                    <ShieldCheckIcon />
                    <span className="flex min-w-0 flex-col">
                      <span className="text-xs font-medium">Tout accorder</span>
                      <span className="text-[11px] whitespace-normal text-muted-foreground">
                        Les 18 permissions, y compris les sensibles.
                      </span>
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => appliquerLot("rien")}>
                    <CircleXIcon />
                    <span className="flex min-w-0 flex-col">
                      <span className="text-xs font-medium">Tout retirer</span>
                      <span className="text-[11px] whitespace-normal text-muted-foreground">
                        Socle vide : tout est refusé, sauf exceptions sur fiche.
                      </span>
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 border-t pt-2">
            <p className="text-xs text-muted-foreground" role="status">
              {lotEnCours
                ? "Application en cours…"
                : filtresActifs
                  ? `${nbVisibles} sur ${total} affichées`
                  : socle.length === 0
                    ? "Aucune permission au socle, tout est refusé par défaut"
                    : `${socle.length} accordées à tous sur ${total}`}
            </p>
            {socle.length > 0 ? (
              <Badge variant="secondary" className="ml-auto">
                Socle actif
              </Badge>
            ) : (
              <Badge variant="outline" className="ml-auto">
                Socle vide
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {groupesVisibles.length === 0 ? (
        <div className="rounded-xl border bg-card p-6 text-center">
          <p className="text-sm font-medium">Aucune permission ne correspond</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {filtre === ""
              ? `Rien pour « ${recherche.trim()} ».`
              : "Essayez un autre mot ou un autre filtre."}
          </p>
          <button
            type="button"
            onClick={reinitialiser}
            className="mt-2 text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            Réinitialiser la recherche, le filtre et le tri
          </button>
        </div>
      ) : (
        groupesVisibles.map((groupe) => {
        const complet = GROUPES.find((g) => g.titre === groupe.titre) ?? groupe;
        const detenues = complet.permissions.filter((p) => accordees.has(p)).length;
        const totalBloc = complet.permissions.length;
        return (
          <section key={groupe.titre} aria-label={groupe.titre}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold tracking-tight">{groupe.titre}</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">{groupe.detail}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                {detenues === totalBloc
                  ? "Tout accordé"
                  : detenues === 0
                    ? "Tout refusé"
                    : `${detenues} sur ${totalBloc} accordées`}
              </p>
            </div>
            <div className="mt-3 grid items-stretch gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {groupe.permissions.map((permission) => (
                <CarteSocle
                  key={permission}
                  permission={permission}
                  accordee={accordees.has(permission)}
                  onResultat={changer}
                />
              ))}
            </div>
          </section>
        );
      }))}
      {message ? (
        <p role="status" className="text-[11px] text-muted-foreground">
          {message}
        </p>
      ) : null}

      <p className="text-[11px] text-muted-foreground">
        Les cas particuliers se gèrent sur la fiche de chaque agent : une
        permission accordée là-bas s&apos;ajoute au socle pour cet agent seul.
        Pour retirer une permission du socle à un seul agent, retirez-la ici —
        le socle ne connaît pas d&apos;exception négative.
      </p>
    </div>
  );
}

/** Alias conservé pour les imports existants. */
export const MatricePermissions = SoclePermissions;
export type LigneMatrice = { id: string; nom: string; email: string; permissions: string[] };
export const PERMISSIONS_QUOTIDIEN = [
  "dossier.creer",
  "commande.creer",
  "commande.prendre",
  "commande.servir",
  "commande.annuler",
  "preuve.valider",
  "paiement.creer",
] as const;

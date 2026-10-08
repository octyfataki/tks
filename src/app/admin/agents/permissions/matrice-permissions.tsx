"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowUpRightIcon,
  BadgeCheckIcon,
  BanknoteIcon,
  CircleXIcon,
  ClipboardListIcon,
  FolderPlusIcon,
  HandIcon,
  PackageCheckIcon,
  SearchIcon,
  UserPlusIcon,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  accorderPermissionAction,
  appliquerProfilAction,
  retirerPermissionAction,
} from "../actions";
import { LIBELLES_PERMISSION } from "../[id]/permissions-agent";
import { initiales } from "../../list/affichage-admin";

/** Les 7 permissions du quotidien : bascule rapide dans la matrice. */
export const PERMISSIONS_QUOTIDIEN = [
  "dossier.creer",
  "commande.creer",
  "commande.prendre",
  "commande.servir",
  "commande.annuler",
  "preuve.valider",
  "paiement.creer",
] as const;

export type LigneMatrice = {
  id: string;
  nom: string;
  email: string;
  permissions: string[];
};

/**
 * Les 7 permissions rangées par objet métier, pas par slug : le
 * distributeur raisonne « que peut-il toucher » (un dossier, une
 * commande, un paiement), pas en codes. Trois groupes, jamais de
 * numérotation — ce n'est pas une séquence.
 */
const GROUPES: { titre: string; permissions: string[] }[] = [
  { titre: "Clients", permissions: ["dossier.creer"] },
  {
    titre: "Commandes",
    permissions: [
      "commande.creer",
      "commande.prendre",
      "commande.servir",
      "commande.annuler",
    ],
  },
  { titre: "Paiements", permissions: ["preuve.valider", "paiement.creer"] },
];

const ICONES: Record<string, LucideIcon> = {
  "dossier.creer": FolderPlusIcon,
  "commande.creer": ClipboardListIcon,
  "commande.prendre": HandIcon,
  "commande.servir": PackageCheckIcon,
  "commande.annuler": CircleXIcon,
  "preuve.valider": BadgeCheckIcon,
  "paiement.creer": BanknoteIcon,
};

function Bascule({
  agentId,
  permission,
  accordee,
  onResultat,
}: {
  agentId: string;
  permission: string;
  accordee: boolean;
  onResultat: (accordee: boolean, erreur: string | null) => void;
}) {
  const [enCours, demarrer] = React.useTransition();
  const titre = LIBELLES_PERMISSION[permission]?.titre ?? permission;

  function basculer() {
    demarrer(async () => {
      const resultat = accordee
        ? await retirerPermissionAction(agentId, permission)
        : await accorderPermissionAction(agentId, permission);
      onResultat(!accordee, resultat.ok ? null : (resultat.erreur ?? "Action impossible."));
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={accordee}
      aria-label={`${titre} : ${accordee ? "accordée" : "refusée"}`}
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
          accordee && "translate-x-4",
        )}
      />
    </button>
  );
}

function LignePermission({
  agentId,
  permission,
  accordee,
  onResultat,
}: {
  agentId: string;
  permission: string;
  accordee: boolean;
  onResultat: (permission: string, accordee: boolean, erreur: string | null) => void;
}) {
  const libelle = LIBELLES_PERMISSION[permission] ?? { titre: permission, detail: "" };
  const Icone = ICONES[permission] ?? ClipboardListIcon;
  const [erreur, setErreur] = React.useState<string | null>(null);

  return (
    <div>
      <div className="flex items-center gap-2.5 py-1.5">
        <span
          aria-hidden
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors",
            accordee ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
          )}
        >
          <Icone className="size-3.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-medium">{libelle.titre}</span>
          {libelle.detail ? (
            <span className="block truncate text-[11px] text-muted-foreground">
              {libelle.detail}
            </span>
          ) : null}
        </span>
        <Bascule
          agentId={agentId}
          permission={permission}
          accordee={accordee}
          onResultat={(nouvelle, message) => {
            setErreur(message);
            onResultat(permission, nouvelle, message);
          }}
        />
      </div>
      {erreur ? (
        <p role="alert" className="pb-1 pl-9 text-[11px] font-medium text-destructive">
          {erreur}
        </p>
      ) : null}
    </div>
  );
}

function CarteTrousseau({
  ligne,
  onPermissions,
}: {
  ligne: LigneMatrice;
  onPermissions: (agentId: string, permissions: string[]) => void;
}) {
  const [message, setMessage] = React.useState<string | null>(null);
  const [enCours, demarrer] = React.useTransition();

  const detenues = PERMISSIONS_QUOTIDIEN.filter((p) => ligne.permissions.includes(p));
  const couverture = detenues.length;
  const complet = couverture === PERMISSIONS_QUOTIDIEN.length;
  const vide = couverture === 0;

  function changer(permission: string, accordee: boolean, erreur: string | null) {
    if (erreur) return;
    onPermissions(
      ligne.id,
      accordee
        ? [...ligne.permissions, permission]
        : ligne.permissions.filter((p) => p !== permission),
    );
  }

  function appliquerProfil() {
    setMessage(null);
    demarrer(async () => {
      const resultat = await appliquerProfilAction(ligne.id);
      if (resultat.ok) {
        onPermissions(
          ligne.id,
          [...new Set([...ligne.permissions, ...PERMISSIONS_QUOTIDIEN])].sort(),
        );
        setMessage("Profil appliqué : les permissions manquantes ont été ajoutées.");
      } else {
        setMessage(resultat.erreur ?? "Application impossible.");
      }
    });
  }

  return (
    <article className="flex flex-col rounded-xl border bg-card p-4">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary"
        >
          {initiales(ligne.nom)}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-medium">
            <Link href={`/admin/agents/${ligne.id}`} className="underline-offset-4 hover:underline">
              {ligne.nom}
            </Link>
          </h2>
          <p className="truncate text-xs text-muted-foreground">{ligne.email}</p>
        </div>
        {vide ? (
          <Badge variant="outline">Sans permission</Badge>
        ) : complet ? (
          <Badge variant="secondary">Complet</Badge>
        ) : (
          <Badge variant="outline">
            {couverture}/{PERMISSIONS_QUOTIDIEN.length}
          </Badge>
        )}
      </div>

      <div
        className="mt-3 h-1 overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={`${couverture} permissions sur ${PERMISSIONS_QUOTIDIEN.length}`}
      >
        <div
          className={cn("h-full rounded-full", vide ? "bg-input" : "bg-primary")}
          style={{ width: `${(couverture / PERMISSIONS_QUOTIDIEN.length) * 100}%` }}
        />
      </div>

      <div className="mt-2 flex flex-col divide-y divide-border/60">
        {GROUPES.map((groupe) => (
          <section key={groupe.titre} aria-label={groupe.titre} className="py-1">
            <p className="pt-1 text-[11px] font-medium text-muted-foreground">
              {groupe.titre}
            </p>
            {groupe.permissions.map((permission) => (
              <LignePermission
                key={permission}
                agentId={ligne.id}
                permission={permission}
                accordee={ligne.permissions.includes(permission)}
                onResultat={changer}
              />
            ))}
          </section>
        ))}
      </div>

      {message ? (
        <p role="status" className="mt-2 text-[11px] text-muted-foreground">
          {message}
        </p>
      ) : null}

      <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3">
        <Button size="sm" variant="outline" onClick={appliquerProfil} disabled={enCours}>
          <UserPlusIcon />
          {enCours ? "Application…" : "Profil d'embauche"}
        </Button>
        <Link
          href={`/admin/agents/${ligne.id}`}
          className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground underline-offset-4 hover:underline"
        >
          Fiche complète
          <ArrowUpRightIcon className="size-3" />
        </Link>
      </div>
    </article>
  );
}

/**
 * Matrice globale : un trousseau par agent validé — jauge de couverture,
 * permissions rangées par objet métier, profil d'embauche en un clic.
 * Les échecs de bascule s'affichent sur la ligne (avant : silence).
 * Les 11 autres permissions (taux, plafond, statut, grille,
 * trésorerie…) se gèrent sur la fiche — friction volontaire, pas
 * d'accord sensible en un clic.
 */
export function MatricePermissions({ initiales }: { initiales: LigneMatrice[] }) {
  const [lignes, setLignes] = React.useState(initiales);
  const [recherche, setRecherche] = React.useState("");

  function mettreAJour(agentId: string, permissions: string[]) {
    setLignes((precedentes) =>
      precedentes.map((ligne) => (ligne.id === agentId ? { ...ligne, permissions } : ligne)),
    );
  }

  const q = recherche.trim().toLowerCase();
  const visibles = q
    ? lignes.filter(
        (ligne) =>
          ligne.nom.toLowerCase().includes(q) || ligne.email.toLowerCase().includes(q),
      )
    : lignes;
  const sansPermission = lignes.filter((l) => l.permissions.length === 0).length;

  if (lignes.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6 text-center">
        <p className="text-sm font-medium">Aucun agent validé</p>
        <p className="mt-1 text-xs text-muted-foreground">
          <Link href="/admin/agents/create" className="underline-offset-4 hover:underline">
            Créez la première fiche
          </Link>{" "}
          ou envoyez un lien d&apos;invitation.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 basis-52 sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label="Rechercher un agent"
            placeholder="Nom, email…"
            value={recherche}
            onChange={(event) => setRecherche(event.target.value)}
            className="pl-8"
          />
        </div>
        <p className="ml-auto text-xs text-muted-foreground" role="status">
          {q
            ? `${visibles.length} sur ${lignes.length} agent${lignes.length > 1 ? "s" : ""}`
            : `${lignes.length} agent${lignes.length > 1 ? "s" : ""}`}
          {sansPermission > 0
            ? ` · ${sansPermission} sans permission`
            : " · tous dotés"}
        </p>
      </div>

      {visibles.length === 0 ? (
        <div className="rounded-xl border bg-card p-6 text-center">
          <p className="text-sm font-medium">Aucun agent ne correspond à « {recherche.trim()} »</p>
          <button
            type="button"
            onClick={() => setRecherche("")}
            className="mt-1 text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibles.map((ligne) => (
            <CarteTrousseau key={ligne.id} ligne={ligne} onPermissions={mettreAJour} />
          ))}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">
        Les 11 autres permissions (taux, plafond, statut, grille, trésorerie,
        réconciliation, journal…) se gèrent sur la fiche de chaque agent —
        jamais en un clic ici.
      </p>
    </div>
  );
}

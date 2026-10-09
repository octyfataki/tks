"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  accorderPermissionAction,
  appliquerProfilAction,
  retirerPermissionAction,
} from "../actions";

/** Libellés métier des 18 permissions (vocabulaire GLOSSARY, jamais technique seul). */
export const LIBELLES_PERMISSION: Record<string, { titre: string; detail: string }> = {
  "taux.saisir": { titre: "Saisir le taux", detail: "Taux du jour 1 USD = X CDF." },
  "creance.creer": { titre: "Créer une créance", detail: "Dette née d'une commande crédit servie." },
  "paiement.creer": { titre: "Encaisser un paiement", detail: "Enregistrer un versement client, toute devise." },
  "ecriture.corriger": { titre: "Corriger par écriture inverse", detail: "Jamais de suppression : on annule par l'inverse tracé." },
  "tresorerie.mouvement": { titre: "Mouvement de trésorerie", detail: "Caisse et comptes mobile money." },
  "plafond.modifier": { titre: "Modifier un plafond", detail: "Limite d'exposition d'un client." },
  "statut.modifier": { titre: "Changer un statut client", detail: "Promotion EN_EVALUATION → PRIVILEGIE, décision humaine." },
  "dossier.creer": { titre: "Créer un dossier client", detail: "Fiche financière : nom, adresse, créances." },
  "dossier.rattacher": { titre: "Rattacher un compte", detail: "Lier un compte validé à son dossier." },
  "dossier.detacher": { titre: "Détacher un compte", detail: "Défaire un rattachement." },
  "grille.tarif": { titre: "Gérer la grille tarifaire", detail: "Prix de l'unité par réseau, historisé." },
  "preuve.valider": { titre: "Valider une preuve", detail: "Valider ou refuser une preuve de paiement." },
  "commande.creer": { titre: "Créer une commande", detail: "Y compris la caisse rapide au comptoir." },
  "commande.prendre": { titre: "Prendre une commande", detail: "Poser un verrou local dans la file." },
  "commande.servir": { titre: "Servir une commande", detail: "Envoyer le crédit, crée la créance." },
  "commande.annuler": { titre: "Annuler une commande", detail: "Avant service, tracée au journal." },
  "reconciliation.trancher": { titre: "Trancher un conflit", detail: "Réconciliation humaine, jamais automatique." },
  "journal.consulter": { titre: "Consulter le journal", detail: "Lire l'audit de l'activité." },
};

/**
 * Interrupteur d'une permission : accordée (ON) ou non (OFF). Chaque
 * bascule appelle la server action une par une — attribuer en masse
 * passe par le profil d'embauche, pas par ici.
 */
export function InterrupteurPermission({
  agentId,
  permission,
  accordee,
  desactive,
  heriteeSocle,
}: {
  agentId: string;
  permission: string;
  accordee: boolean;
  desactive?: boolean;
  heriteeSocle?: boolean;
}) {
  const [erreur, setErreur] = React.useState<string | null>(null);
  const [enCours, demarrer] = React.useTransition();

  function basculer() {
    setErreur(null);
    demarrer(async () => {
      const resultat = accordee
        ? await retirerPermissionAction(agentId, permission)
        : await accorderPermissionAction(agentId, permission);
      if (!resultat.ok) setErreur(resultat.erreur);
    });
  }

  const libelle = LIBELLES_PERMISSION[permission] ?? { titre: permission, detail: "" };
  const verrouille = desactive || enCours || (heriteeSocle && !accordee);

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
          <span>{libelle.titre}</span>
          {heriteeSocle ? <Badge variant="secondary">Socle</Badge> : null}
        </p>
        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{permission}</p>
        {libelle.detail ? (
          <p className="mt-0.5 text-[11px] text-muted-foreground">{libelle.detail}</p>
        ) : null}
        {heriteeSocle && !accordee ? (
          <p className="mt-1 text-[11px] text-muted-foreground">
            Accordée à tous par le socle — pour la retirer à cet agent,
            retirez-la du socle.
          </p>
        ) : null}
        {erreur ? (
          <p role="alert" className="mt-1 text-[11px] font-medium text-destructive">
            {erreur}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={accordee || !!heriteeSocle}
        aria-label={`${libelle.titre} : ${accordee || heriteeSocle ? "accordée" : "refusée"}`}
        disabled={verrouille}
        onClick={basculer}
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
          accordee || heriteeSocle ? "bg-primary" : "bg-input",
          verrouille ? "cursor-not-allowed opacity-70" : "cursor-pointer",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform",
            (accordee || heriteeSocle) && "translate-x-4",
          )}
        />
      </button>
    </div>
  );
}

/** Résumé + bouton d'application du profil d'embauche (raccourci). */
export function ProfilEmbauche({
  agentId,
  detenues,
  desactive,
}: {
  agentId: string;
  detenues: readonly string[];
  desactive?: boolean;
}) {
  const [message, setMessage] = React.useState<string | null>(null);
  const [enCours, demarrer] = React.useTransition();

  function appliquer() {
    setMessage(null);
    demarrer(async () => {
      const resultat = await appliquerProfilAction(agentId);
      setMessage(
        resultat.ok
          ? "Profil appliqué : les permissions manquantes ont été ajoutées, les autres sont intactes."
          : (resultat.erreur ?? "Application impossible."),
      );
    });
  }

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium">Profil d&apos;embauche</h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Raccourci : ajoute les permissions du quotidien qui manquent, sans
            toucher aux autres ni réaccorder un retrait. {detenues.length}{" "}
            permission{detenues.length > 1 ? "s" : ""} détenue{detenues.length > 1 ? "s" : ""}.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={appliquer} disabled={desactive || enCours}>
          {enCours ? "Application…" : "Appliquer le profil"}
        </Button>
      </div>
      {message ? (
        <p role="status" className="mt-2 text-[11px] text-muted-foreground">
          {message}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {detenues.length === 0 ? (
          <Badge variant="outline">Aucune permission — tout est refusé</Badge>
        ) : (
          detenues.map((p) => <Badge key={p} variant="secondary">{p}</Badge>)
        )}
      </div>
    </div>
  );
}

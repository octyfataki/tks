"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { revoquerCompteClientAction } from "@/components/clients/actions";
import {
  retirerPermissionAction,
  retirerSocleAction,
  revoquerAgentAction,
  suspendreAgentAction,
} from "../agents/actions";
import {
  correctivesPour,
  type CorrectiveProposee,
} from "@/lib/s2-autorisations/contestation";

function decoderJson(brut: string | null): Record<string, unknown> | null {
  if (!brut) return null;
  try {
    const valeur: unknown = JSON.parse(brut);
    return typeof valeur === "object" && valeur !== null && !Array.isArray(valeur)
      ? (valeur as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function texte(valeur: unknown): string | null {
  return typeof valeur === "string" && valeur !== "" ? valeur : null;
}

/**
 * Contestation d'une ligne du journal : propose les actions correctives
 * applicables (S2 issue 15), chacune exécutée comme une NOUVELLE ligne liée
 * (`contesteId`) avec motif obligatoire — jamais une suppression ni une
 * modification. Un refus (permission manquante) est lui-même journalisé
 * comme échec par l'action appelée.
 */
export function ContestationLigne({
  ligne,
}: {
  ligne: {
    id: string;
    typeAction: string;
    statut: string;
    entiteId: string | null;
    avant: string | null;
    apres: string | null;
  };
}) {
  const contestation = correctivesPour({
    typeAction: ligne.typeAction,
    statut: ligne.statut,
  });
  const [motif, setMotif] = React.useState("");
  const [message, setMessage] = React.useState<string | null>(null);
  const [enEchec, setEnEchec] = React.useState(false);
  const [enCours, demarrer] = React.useTransition();

  if (!contestation.contestable) {
    return (
      <div className="mt-2 rounded-md border bg-background p-2 text-[12px]">
        <p className="text-[11px] text-muted-foreground">Contestation</p>
        <p className="mt-0.5 text-muted-foreground">{contestation.explication}</p>
      </div>
    );
  }

  async function executer(corrective: CorrectiveProposee): Promise<string> {
    const donnees = decoderJson(ligne.apres) ?? decoderJson(ligne.avant);
    switch (corrective.cle) {
      case "client.revoquer": {
        if (!ligne.entiteId) return "Compte visé introuvable.";
        const formulaire = new FormData();
        formulaire.set("compteId", ligne.entiteId);
        formulaire.set("motif", motif);
        formulaire.set("contesteId", ligne.id);
        const resultat = await revoquerCompteClientAction(null, formulaire);
        return resultat.ok ? "" : (resultat.erreur ?? "Révocation impossible.");
      }
      case "permission.retirer": {
        const agentId =
          texte(donnees?.["agentId"]) ?? ligne.entiteId?.split(":")[0] ?? null;
        const permission =
          texte(donnees?.["permission"]) ??
          (ligne.entiteId?.includes(":") ? ligne.entiteId.split(":")[1] : null);
        if (!agentId || !permission) return "Permission visée introuvable.";
        const resultat = await retirerPermissionAction(agentId, permission, ligne.id);
        return resultat.ok ? "" : (resultat.erreur ?? "Retrait impossible.");
      }
      case "permission.socle.retirer": {
        const permission =
          texte(donnees?.["permission"]) ?? ligne.entiteId;
        if (!permission) return "Permission visée introuvable.";
        const resultat = await retirerSocleAction(permission, ligne.id);
        return resultat.ok ? "" : (resultat.erreur ?? "Retrait impossible.");
      }
      case "agent.suspendre": {
        if (!ligne.entiteId) return "Agent visé introuvable.";
        const resultat = await suspendreAgentAction(ligne.entiteId, ligne.id);
        return resultat.ok ? "" : (resultat.erreur ?? "Suspension impossible.");
      }
      case "agent.revoquer": {
        if (!ligne.entiteId) return "Agent visé introuvable.";
        const resultat = await revoquerAgentAction(ligne.entiteId, ligne.id);
        return resultat.ok ? "" : (resultat.erreur ?? "Révocation impossible.");
      }
    }
  }

  function contester(corrective: CorrectiveProposee) {
    if (motif.trim().length < 3) {
      setEnEchec(true);
      setMessage("Motif exigé : une contestation sans motif n'explique rien.");
      return;
    }
    setMessage(null);
    setEnEchec(false);
    demarrer(async () => {
      const erreur = await executer(corrective);
      if (erreur === "") {
        setMotif("");
        setEnEchec(false);
        setMessage(
          "Correction enregistrée comme nouvelle ligne liée — rien n'a été effacé.",
        );
      } else {
        setEnEchec(true);
        setMessage(erreur);
      }
    });
  }

  return (
    <div className="mt-2 rounded-md border bg-background p-2 text-[12px]">
      <p className="text-[11px] text-muted-foreground">Contester cette action</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        La correction s&apos;ajoute comme une nouvelle ligne liée — rien ne
        s&apos;efface.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Input
          type="text"
          aria-label="Motif de la contestation"
          placeholder="Motif de la contestation (exigé)…"
          value={motif}
          onChange={(event) => setMotif(event.target.value)}
          disabled={enCours}
          className="min-w-0 flex-1 basis-52"
        />
        {contestation.correctives.map((corrective) => (
          <Button
            key={corrective.cle}
            type="button"
            size="sm"
            variant="outline"
            disabled={enCours}
            onClick={() => contester(corrective)}
          >
            {enCours ? "Exécution…" : corrective.libelle}
          </Button>
        ))}
      </div>
      {message ? (
        <p
          role={enEchec ? "alert" : "status"}
          className={
            enEchec
              ? "mt-1.5 font-medium text-destructive"
              : "mt-1.5 text-muted-foreground"
          }
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}

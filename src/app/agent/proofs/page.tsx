import type { Metadata } from "next";
import { PermissionRefusee } from "@/components/permission-denied";
import { ProofBoard } from "@/components/proofs/proof-board";
import { staffActorWith } from "@/lib/authorizations/staff-actor";
import {
  readProofQueue,
  readProofStats,
  readRecentDecisions,
} from "@/modules/proofs/read";

export const metadata: Metadata = {
  title: "Preuves de paiement — Agent — TKS",
  description:
    "Preuves de paiement téléversées par les clients : valider ou refuser.",
};

const MESSAGES: Record<string, string> = {
  "proof-validated": "Preuve validée : la commande rejoint la file.",
  "proof-refused": "Preuve refusée. Le client peut en déposer une autre.",
};

export default async function AgentProofsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const acteur = await staffActorWith("preuve.valider");
  if (!acteur) {
    return (
      <PermissionRefusee
        titre="Preuves de paiement"
        detail="Trancher une preuve exige la permission « preuve.valider »."
        action="Le socle de permissions l'accorde déjà à tout agent de service validé."
      />
    );
  }

  const [preuves, decisions] = await Promise.all([
    readProofQueue(),
    readRecentDecisions(8),
  ]);
  const stats = await readProofStats(preuves);
  const params = await searchParams;
  const message = params.ok ? (MESSAGES[params.ok] ?? params.ok) : null;

  return (
    <ProofBoard
      surTitre="Preuves"
      titre="Preuves de paiement"
      chapeau="Une preuve ne s'écrase jamais : un refus laisse le client en déposer une autre, et l'ancienne reste consultable."
      preuves={preuves}
      decisions={decisions}
      stats={stats}
      retour="/agent/proofs"
      message={message}
      erreur={params.erreur ?? null}
    />
  );
}

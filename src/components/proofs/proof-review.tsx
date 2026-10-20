"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { refuseProofAction, validateProofAction } from "@/modules/proofs/actions";

function PendingButton({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant?: "default" | "outline";
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="sm"
      variant={variant ?? "default"}
      disabled={pending}
    >
      {pending ? "…" : children}
    </Button>
  );
}

export function ProofReview({
  proofId,
  retour,
}: {
  proofId: string;
  retour: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <form action={validateProofAction}>
        <input type="hidden" name="proofId" value={proofId} />
        <input type="hidden" name="retour" value={retour} />
        <PendingButton>Valider la preuve</PendingButton>
      </form>
      <form action={refuseProofAction} className="flex flex-col gap-2">
        <input type="hidden" name="proofId" value={proofId} />
        <input type="hidden" name="retour" value={retour} />
        <Label htmlFor={`reason-${proofId}`} className="text-xs">
          Motif du refus, si la preuve ne convient pas
        </Label>
        <Input
          id={`reason-${proofId}`}
          name="reason"
          placeholder="Capture illisible, montant différent…"
          autoComplete="off"
        />
        <PendingButton variant="outline">Refuser</PendingButton>
      </form>
    </div>
  );
}

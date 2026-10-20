"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { refuseProofAction, validateProofAction } from "@/modules/proofs/actions";

function PendingButton({
  children,
  variant,
  className,
}: {
  children: React.ReactNode;
  variant?: "default" | "outline" | "destructive";
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="sm"
      variant={variant ?? "default"}
      className={className}
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
  const [refusOuvert, setRefusOuvert] = useState(false);
  const champMotif = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (refusOuvert) champMotif.current?.focus();
  }, [refusOuvert]);

  return (
    <div className="mt-auto flex flex-col gap-2 border-t pt-3">
      {refusOuvert ? (
        <form action={refuseProofAction} className="flex flex-col gap-2">
          <input type="hidden" name="proofId" value={proofId} />
          <input type="hidden" name="retour" value={retour} />
          <Label htmlFor={`reason-${proofId}`}>Motif du refus</Label>
          <Input
            ref={champMotif}
            id={`reason-${proofId}`}
            name="reason"
            placeholder="Capture illisible, montant différent…"
            autoComplete="off"
          />
          <div className="flex items-center gap-2">
            <PendingButton variant="destructive" className="flex-1">
              Refuser la preuve
            </PendingButton>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setRefusOuvert(false)}
            >
              Annuler
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex items-center gap-2">
          <form action={validateProofAction} className="flex-1">
            <input type="hidden" name="proofId" value={proofId} />
            <input type="hidden" name="retour" value={retour} />
            <PendingButton className="w-full">Valider la preuve</PendingButton>
          </form>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setRefusOuvert(true)}
          >
            Refuser
          </Button>
        </div>
      )}
    </div>
  );
}

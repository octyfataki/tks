import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";

const ATTENTE = [
  { email: "boutique.maman@example.cd", anciennete: "3 jours" },
  { email: "kiosque.lumumba@example.cd", anciennete: "1 jour" },
];

export default function AdminPendingPage() {
  return (
    <AuthShell
      title="Validation des comptes clients"
      description="File des comptes EN_ATTENTE_VALIDATION avec leur ancienneté. Valider exige d'avoir vu une pièce d'identité. Valider et rattacher sont deux décisions tracées séparément."
    >
      <FieldGroup>
        {ATTENTE.map((ligne) => (
          <Field key={ligne.email}>
            <div className="flex w-full items-center justify-between gap-2 rounded-md border p-2">
              <div>
                <p className="text-xs font-medium">{ligne.email}</p>
                <p className="text-xs text-muted-foreground">
                  En attente depuis {ligne.anciennete}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm">Valider</Button>
                <Button size="sm" variant="outline">
                  Refuser
                </Button>
              </div>
            </div>
          </Field>
        ))}
        <Field>
          <p className="text-xs text-muted-foreground">
            Le rattachement désigne le dossier client par son nom (nom, adresse,
            solde affichés) — jamais par le seul identifiant de connexion.
          </p>
        </Field>
      </FieldGroup>
    </AuthShell>
  );
}

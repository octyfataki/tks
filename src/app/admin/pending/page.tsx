import { Button } from "@/components/ui/button";

const ATTENTE = [
  { email: "boutique.maman@example.cd", anciennete: "3 jours" },
  { email: "kiosque.lumumba@example.cd", anciennete: "1 jour" },
];

// Contenu seul : le shell SidebarProvider + AdminHeader vit dans /admin/layout.
export default function AdminPendingPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
        <div>
          <h1 className="text-lg font-semibold">
            Validation des comptes clients
          </h1>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            File des comptes EN_ATTENTE_VALIDATION avec leur ancienneté.
            Valider exige d&apos;avoir vu une pièce d&apos;identité. Valider et
            rattacher sont deux décisions tracées séparément.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {ATTENTE.map((ligne) => (
            <div
              key={ligne.email}
              className="flex w-full items-center justify-between gap-2 rounded-md border p-2"
            >
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
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Le rattachement désigne le dossier client par son nom (nom, adresse,
          solde affichés) — jamais par le seul identifiant de connexion.
        </p>
    </div>
  );
}

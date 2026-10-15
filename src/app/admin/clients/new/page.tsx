import { PermissionRefusee } from "@/components/permission-denied";
import {
  acteurPeutOuvrirDossier,
  rechercherDossiers,
} from "@/modules/clients/deposit";
import { FormulaireDossier } from "./client-record-form";

/**
 * /admin/clients/new — Ouvrir un dossier client (fiche financière :
 * nom, contact, adresse). Distributeur validé, ou agent tenant
 * `dossier.creer`. Jamais un client : aucun chemin ne mène ici depuis
 * l'espace client.
 *
 * La recherche (`?q=`) retrouve un dossier par nom, contact ou adresse —
 * plusieurs dossiers peuvent répondre, aucun n'est retenu
 * automatiquement : l'humain choisit, toujours par le nom.
 *
 * Le pré-remplissage (`?nom=` et `?contact=`) vient de la fiche du compte
 * (`/admin/clients/[id]`) : le nom et le téléphone connus ne sont pas
 * retapés. Ce n'est qu'un confort de saisie — la création revalide tout
 * et ne rattache rien toute seule.
 */
export default async function NouveauDossierPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; nom?: string; contact?: string }>;
}) {
  const acteur = await acteurPeutOuvrirDossier();
  if (!acteur) {
    return (
      <div className="flex flex-1 flex-col p-4 pt-4">
        <PermissionRefusee
          titre="Ouvrir un dossier client"
          detail="Seul le distributeur ou un agent autorisé peut ouvrir un dossier client."
          action="Pour ouvrir un dossier, contactez un administrateur principal."
        />
      </div>
    );
  }

  const filtres = await searchParams;
  const recherche = (filtres.q ?? "").trim();
  const resultats = recherche ? await rechercherDossiers(recherche) : [];
  const preRempli =
    (filtres.nom ?? "").trim() || (filtres.contact ?? "").trim()
      ? {
          nom: (filtres.nom ?? "").trim(),
          contact: (filtres.contact ?? "").trim(),
        }
      : undefined;

  return (
    <div className="flex flex-1 flex-col">
      <form
        action="/admin/clients/new"
        method="get"
        className="flex flex-wrap items-end gap-2 px-4 pt-4"
        role="search"
      >
        <div className="min-w-52 flex-1">
          <label htmlFor="q" className="mb-1.5 block text-xs font-medium">
            Retrouver un dossier
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={recherche}
            placeholder="Nom, numéro ou adresse…"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          Chercher
        </button>
      </form>

      {recherche ? (
        <div className="px-4 pt-3" aria-live="polite">
          {resultats.length === 0 ? (
            <p className="rounded-lg border bg-card px-3 py-2 text-xs text-muted-foreground">
              Aucun dossier pour « {recherche} » — le formulaire ci-dessous ouvre
              un dossier neuf.
            </p>
          ) : (
            <div className="rounded-lg border bg-card px-3 py-2">
              <p className="text-xs text-muted-foreground">
                {resultats.length} dossier{resultats.length > 1 ? "s" : ""} pour
                « {recherche} » — vérifiez le nom avant d&apos;ouvrir un doublon :
              </p>
              <ul className="mt-1.5 flex flex-col gap-1">
                {resultats.map((dossier) => (
                  <li
                    key={dossier.id}
                    className="flex flex-wrap items-baseline gap-x-2 text-xs"
                  >
                    <span className="font-medium">{dossier.nom}</span>
                    <span className="text-muted-foreground">{dossier.contact}</span>
                    <span className="text-muted-foreground">{dossier.adresse}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}

      <FormulaireDossier initial={preRempli} />
    </div>
  );
}

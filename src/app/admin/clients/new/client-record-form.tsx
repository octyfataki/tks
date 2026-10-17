"use client";

import * as React from "react";
import { useActionState } from "react";
import Link from "next/link";
import {
  CircleAlertIcon,
  MapPinIcon,
  PhoneIcon,
  ScrollTextIcon,
  StoreIcon,
  UserPlusIcon,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { FieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { ouvrirDossierAction, type ResultatOuverture } from "./actions";

const ETAT_INITIAL: ResultatOuverture | null = null;

const ETAPES_APRES = [
  {
    icone: UserPlusIcon,
    titre: "Le dossier existe, vide de dette",
    texte: "Aucune créance, aucun plafond touché : ouvrir un dossier ne déplace pas un franc.",
  },
  {
    icone: ScrollTextIcon,
    titre: "Tout est tracé",
    texte: "Qui l'a ouvert, quand : la création laisse une trace au journal.",
  },
];

/**
 * Ouverture d'un dossier client au comptoir : nom, contact, adresse.
 * Le nom est libre et non unique, le contact peut déjà exister — quand
 * c'est le cas, les dossiers qui le portent s'affichent pour vérification
 * à voix haute, sans jamais fusionner.
 */
export function FormulaireDossier({
  initial,
}: {
  /** Pré-remplissage depuis la fiche du compte : confort, jamais une preuve. */
  initial?: { nom: string; contact: string };
}) {
  const [resultat, action, enCours] = useActionState(ouvrirDossierAction, ETAT_INITIAL);
  const [nom, setNom] = React.useState(initial?.nom ?? "");
  const [contact, setContact] = React.useState(initial?.contact ?? "");
  const [adresse, setAdresse] = React.useState("");
  const dernierResultat = React.useRef<ResultatOuverture | null>(null);

  React.useEffect(() => {
    if (!resultat || dernierResultat.current === resultat) return;
    dernierResultat.current = resultat;
    if (resultat.ok) {
      toast.add({
        type: "success",
        title: "Dossier ouvert",
        description: `« ${resultat.nom} » rejoint le registre.`,
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect -- réinitialise le formulaire après succès, une fois par résultat
      setNom("");
      setContact("");
      setAdresse("");
    } else {
      toast.add({
        type: "error",
        title: "Ouverture impossible",
        description: resultat.erreur,
      });
    }
  }, [resultat]);

  const partages = resultat?.ok ? resultat.partagentContact : [];
  const montreOrigine = initial !== undefined && (nom !== "" || contact !== "");

  return (
    <form action={action} className="flex flex-1 flex-col gap-4 p-4 pt-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Ouvrir un dossier client</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            La fiche financière d&apos;une entreprise : nom, contact, adresse.
            Le dossier ne voit sa dette qu&apos;avec ses créances — pas avant.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/clients" className={buttonVariants({ variant: "outline" })}>
            Annuler
          </Link>
          <Button type="submit" disabled={enCours}>
            {enCours ? "Ouverture…" : "Ouvrir le dossier"}
          </Button>
        </div>
      </div>

      {montreOrigine ? (
        <p className="rounded-lg border bg-card px-3 py-2 text-xs text-muted-foreground">
          Pré-rempli depuis le compte client — vérifiez l&apos;orthographe du
          nom avant d&apos;ouvrir. L&apos;adresse reste à saisir.
        </p>
      ) : null}

      {partages.length > 0 && resultat?.ok ? (
        <section
          aria-live="polite"
          className="flex gap-3 rounded-xl border border-amber-600/40 bg-amber-500/10 p-4"
        >
          <CircleAlertIcon className="mt-0.5 size-4 shrink-0 text-amber-700" />
          <div className="min-w-0">
            <p className="text-sm font-medium">
              Même numéro, autre dossier — vérifiez le nom à voix haute
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              « {resultat.nom} » est ouvert. {partages.length} autre
              {partages.length > 1 ? "s" : ""} dossier
              {partages.length > 1 ? "s" : ""} porte{partages.length > 1 ? "nt" : ""} déjà
              ce numéro : c&apos;est normal, deux clients partagent couramment un
              téléphone. Rien n&apos;a fusionné.
            </p>
            <ul className="mt-2 flex flex-col gap-1.5">
              {partages.map((dossier) => (
                <li
                  key={dossier.id}
                  className="flex flex-wrap items-baseline gap-x-2 rounded-lg border bg-card px-2.5 py-1.5 text-xs"
                >
                  <span className="font-medium">{dossier.nom}</span>
                  <span className="text-muted-foreground">{dossier.adresse}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <div className="grid items-start gap-4 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-xl border bg-card p-4 sm:p-5">
          <div className="flex flex-col gap-4">
            <div>
              <label htmlFor="nom" className="mb-1.5 block text-xs font-medium">
                Nom du client (entreprise)
              </label>
              <div className="group relative">
                <StoreIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  id="nom"
                  name="nom"
                  type="text"
                  autoComplete="organization"
                  required
                  minLength={2}
                  maxLength={255}
                  placeholder="Alimentation Chez Marie"
                  className="rounded-lg pl-9"
                  value={nom}
                  onChange={(event) => setNom(event.target.value)}
                />
              </div>
              <FieldDescription className="mt-1.5">
                Libre et non unique : deux homonymes restent deux dossiers, leurs
                dettes ne se mélangent jamais.
              </FieldDescription>
            </div>
            <div>
              <label htmlFor="contact" className="mb-1.5 block text-xs font-medium">
                Numéro de contact
              </label>
              <div className="group relative">
                <PhoneIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  id="contact"
                  name="contact"
                  type="tel"
                  autoComplete="tel"
                  required
                  placeholder="+243 …"
                  className="rounded-lg pl-9"
                  value={contact}
                  onChange={(event) => setContact(event.target.value)}
                />
              </div>
              <FieldDescription className="mt-1.5">
                Pour retrouver le dossier au comptoir, pas pour l&apos;identifier :
                un numéro partagé est accepté.
              </FieldDescription>
            </div>
            <div>
              <label htmlFor="adresse" className="mb-1.5 block text-xs font-medium">
                Adresse
              </label>
              <div className="group relative">
                <MapPinIcon className="pointer-events-none absolute top-3 left-2.5 size-3.5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Textarea
                  id="adresse"
                  name="adresse"
                  required
                  minLength={2}
                  maxLength={500}
                  rows={2}
                  placeholder="12, avenue de la Nation, Kinshasa"
                  className="rounded-lg pl-9"
                  value={adresse}
                  onChange={(event) => setAdresse(event.target.value)}
                />
              </div>
              <FieldDescription className="mt-1.5">
                Texte libre, modifiable plus tard depuis la fiche.
              </FieldDescription>
            </div>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-4">
          <h2 className="text-sm font-medium">Après l&apos;ouverture</h2>
          <ol className="mt-3 flex flex-col">
            {ETAPES_APRES.map((etape, index) => (
              <li key={etape.titre} className="relative flex gap-3 pb-4 last:pb-0">
                {index < ETAPES_APRES.length - 1 ? (
                  <span aria-hidden className="absolute top-8 bottom-0 left-4 w-px bg-border" />
                ) : null}
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-muted/50">
                  <etape.icone className="size-3.5 text-primary" />
                </span>
                <div>
                  <p className="text-xs font-medium">{etape.titre}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                    {etape.texte}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </form>
  );
}

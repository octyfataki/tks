import type { Metadata } from "next";
import Link from "next/link";
import {
  BanknoteIcon,
  ClipboardListIcon,
  UserCheckIcon,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Tableau de bord agent — TKS",
  description:
    "Journée de l'agent de service : commandes à servir, encaissements au comptoir, comptes clients à valider.",
};

const zones = [
  {
    icone: <ClipboardListIcon aria-hidden className="size-5" />,
    titre: "Commandes",
    texte:
      "La file d'attente et la caisse rapide : servir les commandes des clients.",
    href: "/agent/commandes",
    lien: "Ouvrir les commandes",
  },
  {
    icone: <BanknoteIcon aria-hidden className="size-5" />,
    titre: "Encaissements",
    texte:
      "Encaisser au comptoir et suivre les créances restant dues.",
    href: "/agent/encaissements",
    lien: "Ouvrir les encaissements",
  },
  {
    icone: <UserCheckIcon aria-hidden className="size-5" />,
    titre: "Validation des comptes",
    texte:
      "Valider les comptes des clients au comptoir, pièce d'identité vue.",
    href: "/agent/clients/validation",
    lien: "Ouvrir la validation",
  },
];

/**
 * Espace agent de service — écran d'accueil. Contenu seul : la coquille
 * (navigation + en-tête) vit dans /agent/layout et persiste pendant la
 * navigation. Les trois zones décrivent la journée de l'agent ; les
 * fonctions métier arrivent avec S4 à S6, les pages existent déjà.
 */
export default function AgentDashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold tracking-tight">
          La journée au comptoir
        </h1>
        <p className="text-sm text-muted-foreground">
          Trois gestes, dans l&apos;ordre du terrain : servir, encaisser,
          valider.
        </p>
      </div>
      <ul className="grid gap-4 md:grid-cols-3">
        {zones.map((zone) => (
          <li
            key={zone.titre}
            className="flex flex-col gap-2 rounded-xl border bg-card p-4"
          >
            <span
              aria-hidden
              className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary"
            >
              {zone.icone}
            </span>
            <h2 className="text-sm font-medium">{zone.titre}</h2>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {zone.texte}
            </p>
            <Link
              href={zone.href}
              className="mt-auto pt-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {zone.lien}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

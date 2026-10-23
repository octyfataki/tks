import type { Metadata } from "next";
import Link from "next/link";
import { OrderBand } from "@/components/orders/order-band";
import { OrderQueue } from "@/components/orders/order-queue";
import type {
  OngletNom,
  PaginationOnglet,
} from "@/components/orders/order-queue";
import { OrderReadout, type OrderStat } from "@/components/orders/order-readout";
import { OrderToolbar } from "@/components/orders/order-toolbar";
import { aPermission } from "@/lib/authorizations/permissions";
import {
  currentStaffAccount,
  staffActorWithAny,
} from "@/lib/authorizations/staff-actor";
import {
  filtreCommandes,
  normaliserFiltres,
  paginerCommandes,
  separatesCommandes,
  trieCommandes,
  type FenetreCommandes,
} from "@/modules/orders/filtres";
import { readAllOrders, readOrderStats } from "@/modules/orders/read";

export const metadata: Metadata = {
  title: "Commandes — Agent — TKS",
  description:
    "File d'attente et caisse rapide : servir les commandes des clients.",
};

const MESSAGES: Record<string, string> = {
  "order-taken": "Commande prise. Elle est à vous jusqu'à ce que vous la serviez.",
  "order-served": "Commande servie.",
  "order-cancelled": "Commande annulée.",
};

const ONGLETS = ["prendre", "cours", "terminees"] as const;

type Onglet = (typeof ONGLETS)[number];

function ongletValide(valeur: string | undefined): Onglet {
  return ONGLETS.includes(valeur as Onglet) ? (valeur as Onglet) : "prendre";
}

type Filtres = {
  q?: string;
  etat?: string;
  reseau?: string;
  tri?: string;
  page?: string;
  onglet?: string;
  ok?: string;
  erreur?: string;
};

export default async function AgentOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Filtres>;
}) {
  const acteur = await staffActorWithAny([
    "commande.creer",
    "commande.prendre",
    "commande.servir",
    "commande.annuler",
  ]);
  if (!acteur) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="max-w-md text-center">
          <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
            Comptoir
          </p>
          <h1 className="mt-1 text-lg font-semibold">Commandes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Votre compte n&apos;a aucune permission sur les commandes.
            Demandez « commande.creer » ou « commande.prendre » à un
            administrateur.
          </p>
        </div>
      </div>
    );
  }

  const params = await searchParams;
  const filtres = normaliserFiltres(params);
  const onglet = ongletValide(params.onglet);
  const compte = await currentStaffAccount();
  const [toutes, stats, canServe, canCancel] = await Promise.all([
    readAllOrders(),
    readOrderStats(),
    compte ? aPermission(compte.id, "commande.servir") : false,
    compte ? aPermission(compte.id, "commande.annuler") : false,
  ]);

  const filtrees = trieCommandes(
    filtreCommandes(toutes, filtres, new Date()),
    filtres.tri,
  );
  const groupes = separatesCommandes(filtrees);
  const pageDemandee = Number.parseInt(params.page ?? "1", 10);
  const demande = Number.isNaN(pageDemandee) ? 1 : pageDemandee;

  const fenetrePrendre = paginerCommandes(groupes.prendre, demande);
  const fenetreCours = paginerCommandes(groupes.cours, demande);
  const fenetreTerminees = paginerCommandes(groupes.terminees, demande);

  const conserves = new URLSearchParams();
  if (filtres.q) conserves.set("q", filtres.q);
  if (filtres.etat) conserves.set("etat", filtres.etat);
  if (filtres.reseau) conserves.set("reseau", filtres.reseau);
  if (filtres.tri) conserves.set("tri", filtres.tri);

  const paginationOnglet = (
    nom: OngletNom,
    fenetre: FenetreCommandes,
  ): PaginationOnglet => {
    const parametres = new URLSearchParams(conserves);
    parametres.set("onglet", nom);
    return {
      page: fenetre.page,
      totalPages: fenetre.totalPages,
      total: fenetre.total,
      hrefBase: `/agent/orders?${parametres.toString()}`,
    };
  };

  const message = params.ok ? (MESSAGES[params.ok] ?? params.ok) : null;

  const lecture: OrderStat[] = [
    {
      label: "À prendre",
      value: String(stats.aPrendre),
      hint: "en attente de prise",
      accent: stats.aPrendre > 0,
    },
    {
      label: "En main",
      value: String(stats.enCours),
      hint: "prises, pas servies",
      secondary: true,
    },
    {
      label: "Preuve attendue",
      value: String(stats.preuveAttendue),
      hint: "le client doit déposer",
      accent: stats.preuveAttendue > 0,
    },
    {
      label: "Servies aujourd'hui",
      value: String(stats.serviesAujourdhui),
      hint: "tous agents confondus",
      secondary: true,
    },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
      <div>
        <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
          Comptoir
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          File d&apos;attente
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {stats.aPrendre === 0
            ? "Aucune commande à prendre pour le moment."
            : `${stats.aPrendre} commande${stats.aPrendre > 1 ? "s" : ""} à prendre.`}{" "}
          Une commande se prend, puis se sert : passé quinze minutes sans
          service, elle retourne dans la file.
        </p>
        <div className="mt-3">
          <Link
            href="/agent/orders/new"
            className="inline-flex items-center rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Ouvrir une commande
          </Link>
        </div>
      </div>

      {message ? (
        <p className="rounded-lg border border-emerald-600/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-800 dark:text-emerald-300">
          {message}
        </p>
      ) : null}
      {params.erreur ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          {params.erreur}
        </p>
      ) : null}

      <OrderReadout stats={lecture} />

      {stats.preuveAttendue > 0 ? (
        <OrderBand
          alerte
          titre={`${stats.preuveAttendue} commande${stats.preuveAttendue > 1 ? "s" : ""} attend${stats.preuveAttendue > 1 ? "ent" : ""} sa preuve`}
          detail="— le client doit déposer un reçu avant le service."
          lien="/agent/proofs"
          libelle="Ouvrir les preuves"
          compte={stats.preuveAttendue}
        />
      ) : null}

      <OrderToolbar
        lignes={filtrees.length}
        exportLignes={[]}
        complet={false}
      />

      <OrderQueue
        ongletInitial={onglet}
        prendre={fenetrePrendre.visibles}
        cours={fenetreCours.visibles}
        terminees={fenetreTerminees.visibles}
        totaux={{
          prendre: groupes.prendre.length,
          cours: groupes.cours.length,
          terminees: groupes.terminees.length,
        }}
        pagination={{
          prendre: paginationOnglet("prendre", fenetrePrendre),
          cours: paginationOnglet("cours", fenetreCours),
          terminees: paginationOnglet("terminees", fenetreTerminees),
        }}
        acteurId={acteur.id}
        canServe={canServe}
        canCancel={canCancel}
        retour="/agent/orders"
      />
    </div>
  );
}

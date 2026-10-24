import type { Metadata } from "next";
import { OrderBand } from "@/components/orders/order-band";
import { OrderQueue } from "@/components/orders/order-queue";
import type {
  OngletNom,
  PaginationOnglet,
} from "@/components/orders/order-queue";
import { OrderIllisibles } from "@/components/orders/order-illisibles";
import { OrderReadout, type OrderStat } from "@/components/orders/order-readout";
import { OrderToolbar } from "@/components/orders/order-toolbar";
import { PermissionRefusee } from "@/components/permission-denied";
import { aPermission } from "@/lib/authorizations/permissions";
import {
  currentStaffAccount,
  staffActorWithAny,
} from "@/lib/authorizations/staff-actor";
import {
  filtreCommandes,
  filtresActifs,
  normaliserFiltres,
  paginerCommandes,
  separatesCommandes,
  trieCommandes,
  type FenetreCommandes,
} from "@/modules/orders/filtres";
import {
  readOrdersAndStats,
} from "@/modules/orders/read";

export const metadata: Metadata = {
  title: "Commandes — Administration — TKS",
  description:
    "Toutes les commandes, tous agents confondus : file ouverte et historique.",
};

const MESSAGES: Record<string, string> = {
  "order-taken": "Commande prise.",
  "order-served": "Commande servie.",
  "order-cancelled": "Commande annulée.",
};

function montant(valeur: number, devise: string): string {
  return `${valeur.toLocaleString("fr-FR")} ${devise}`;
}

type Filtres = {
  q?: string;
  etat?: string;
  reseau?: string;
  type?: string;
  periode?: string;
  tri?: string;
  page?: string;
  onglet?: string;
  ok?: string;
  erreur?: string;
};

const ONGLETS = ["prendre", "cours", "terminees"] as const;

type Onglet = (typeof ONGLETS)[number];

function ongletValide(valeur: string | undefined): Onglet {
  return ONGLETS.includes(valeur as Onglet) ? (valeur as Onglet) : "prendre";
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Filtres>;
}) {
  const acteur = await staffActorWithAny([
    "commande.prendre",
    "commande.servir",
    "commande.annuler",
  ]);
  if (!acteur) {
    return (
      <PermissionRefusee
        titre="Commandes"
        detail="Le pilotage des commandes exige au moins la permission « commande.prendre »."
        action="Le socle de permissions l'accorde déjà à tout agent de service validé."
      />
    );
  }

  const params = await searchParams;
  const filtres = normaliserFiltres(params);
  const onglet = ongletValide(params.onglet);
  const compte = await currentStaffAccount();
  const [flux, canServe, canCancel] = await Promise.all([
    readOrdersAndStats(),
    compte ? aPermission(compte.id, "commande.servir") : false,
    compte ? aPermission(compte.id, "commande.annuler") : false,
  ]);
  const toutes = flux.commandes;
  const stats = flux.stats;

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
  if (filtres.type) conserves.set("type", filtres.type);
  if (filtres.periode) conserves.set("periode", filtres.periode);
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
      hrefBase: `/admin/orders?${parametres.toString()}`,
    };
  };

  const exportLignes = filtrees.map((commande) => ({
    client: commande.profileName,
    telephone: commande.profilePhone,
    reseau: commande.network,
    etat: commande.state,
    type: commande.type,
    unites: String(commande.units),
    montant: String(commande.amount),
    devise: commande.currency,
    creeLe: commande.createdAt.toISOString(),
  }));

  const message = params.ok ? (MESSAGES[params.ok] ?? params.ok) : null;

  const lecture: OrderStat[] = [
    {
      label: "Commandes ouvertes",
      value: String(stats.ouvertes),
      hint: `${stats.aPrendre} à prendre`,
      accent: stats.aPrendre > 0,
    },
    {
      label: "En main d'un agent",
      value: String(stats.enCours),
      hint: "verrou de quinze minutes",
      secondary: true,
    },
    {
      label: "Preuve attendue",
      value: String(stats.preuveAttendue),
      hint: "le client doit déposer",
      accent: stats.preuveAttendue > 0,
    },
    {
      label: "Engagé à crédit",
      value:
        stats.engageCredit.length === 0
          ? "0"
          : montant(stats.engageCredit[0].amount, stats.engageCredit[0].currency),
      hint: "à recouvrer",
      secondary: true,
    },
  ];

  const filtre = filtresActifs(filtres);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
      <div>
        <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
          Pilotage
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Toutes les commandes
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {stats.ouvertes === 0
            ? "Aucune commande ouverte pour le moment."
            : `${stats.ouvertes} commande${stats.ouvertes > 1 ? "s" : ""} ouverte${stats.ouvertes > 1 ? "s" : ""}, tous agents confondus.`}{" "}
          Une commande à crédit servie devient une créance.
        </p>
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
      <OrderIllisibles illisibles={flux.illisibles} />

      <OrderReadout stats={lecture} />

      {stats.preuveAttendue > 0 ? (
        <OrderBand
          alerte
          titre={`${stats.preuveAttendue} commande${stats.preuveAttendue > 1 ? "s" : ""} attend${stats.preuveAttendue > 1 ? "ent" : ""} sa preuve`}
          detail="— le client doit déposer un reçu avant le service."
          lien="/admin/proofs"
          libelle="Ouvrir les preuves"
          compte={stats.preuveAttendue}
        />
      ) : (
        <OrderBand
          alerte={false}
          titre="Aucune preuve en attente"
          detail="— les commandes en ligne passent au comptoir dès que le client a déposé."
        />
      )}

      <OrderToolbar
        lignes={filtrees.length}
        exportLignes={exportLignes}
        complet
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
        retour="/admin/orders"
        filtres={filtre}
      />

      {filtre && filtrees.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Aucune commande ne correspond à ces filtres.
        </p>
      ) : null}
    </div>
  );
}

import type { Metadata } from "next";
import { OrderBand } from "@/components/orders/order-band";
import { OrderHistory } from "@/components/orders/order-history";
import { OrderQueue } from "@/components/orders/order-queue";
import { OrderReadout, type OrderStat } from "@/components/orders/order-readout";
import { OrderRegister } from "@/components/orders/order-register";
import {
  OrderToolbar,
  type LigneExportCommande,
} from "@/components/orders/order-toolbar";
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
  trieCommandes,
} from "@/modules/orders/filtres";
import {
  readAllOrders,
  readOrderStats,
  readQueue,
  readRecentOrders,
} from "@/modules/orders/read";
import { PaginationListe } from "@/app/admin/list/list-pagination";

export const metadata: Metadata = {
  title: "Commandes — Administration — TKS",
  description:
    "Toutes les commandes, tous agents confondus : file ouverte et historique.",
};

const LIGNES_PAR_PAGE = 15;

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
  ok?: string;
  erreur?: string;
};

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
  const compte = await currentStaffAccount();
  const [toutes, queue, recents, stats, canServe, canCancel] = await Promise.all([
    readAllOrders(),
    readQueue(),
    readRecentOrders(15),
    readOrderStats(),
    compte ? aPermission(compte.id, "commande.servir") : false,
    compte ? aPermission(compte.id, "commande.annuler") : false,
  ]);

  const filtrees = trieCommandes(
    filtreCommandes(toutes, filtres, new Date()),
    filtres.tri,
  );
  const totalPages = Math.max(1, Math.ceil(filtrees.length / LIGNES_PAR_PAGE));
  const demandee = Number.parseInt(params.page ?? "1", 10);
  const page = Math.min(
    Math.max(1, Number.isNaN(demandee) ? 1 : demandee),
    totalPages,
  );
  const visibles = filtrees.slice(
    (page - 1) * LIGNES_PAR_PAGE,
    page * LIGNES_PAR_PAGE,
  );

  const conserves = new URLSearchParams();
  if (filtres.q) conserves.set("q", filtres.q);
  if (filtres.etat) conserves.set("etat", filtres.etat);
  if (filtres.reseau) conserves.set("reseau", filtres.reseau);
  if (filtres.type) conserves.set("type", filtres.type);
  if (filtres.periode) conserves.set("periode", filtres.periode);
  if (filtres.tri) conserves.set("tri", filtres.tri);
  const chaine = conserves.toString();
  const hrefBase = chaine ? `/admin/orders?${chaine}` : "/admin/orders";

  const exportLignes: LigneExportCommande[] = filtrees.map((commande) => ({
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

      {filtre ? (
        <section className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-medium">Commandes filtrées</h2>
            <span className="text-xs tabular-nums text-muted-foreground">
              {filtrees.length}
            </span>
          </div>
          {visibles.length === 0 ? (
            <div className="rounded-xl border bg-card p-6 text-center">
              <p className="text-sm font-medium">Aucune commande ne correspond</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Élargissez les filtres pour retrouver vos commandes.
              </p>
            </div>
          ) : (
            <OrderRegister
              commandes={visibles}
              acteurId={acteur.id}
              canServe={canServe}
              canCancel={canCancel}
              retour="/admin/orders"
            />
          )}
          <PaginationListe
            page={page}
            totalPages={totalPages}
            hrefBase={hrefBase}
          />
        </section>
      ) : (
        <>
          <OrderQueue
            commandes={queue}
            acteurId={acteur.id}
            canServe={canServe}
            canCancel={canCancel}
            retour="/admin/orders"
          />
          <section className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-sm font-medium">
                Dernières commandes terminées
              </h2>
              <span className="text-xs tabular-nums text-muted-foreground">
                {recents.length}
              </span>
            </div>
            <OrderHistory commandes={recents} />
          </section>
        </>
      )}
    </div>
  );
}

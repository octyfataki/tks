import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import {
  ClipboardListIcon,
  KeyRoundIcon,
  MailPlusIcon,
  WifiOffIcon,
} from "lucide-react";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import {
  comptesStaff,
  DEFAUT_DUREE_INVITATION_JOURS,
  MAX_DUREE_INVITATION_JOURS,
  MIN_DUREE_INVITATION_JOURS,
  peutModifierReglage,
} from "@/lib/db/schema/accounts";
import { lireDureeInvitationJours } from "@/lib/accounts/settings";
import { PermissionRefusee } from "@/components/permission-denied";
import { Badge } from "@/components/ui/badge";
import { FormulaireParametres } from "./form";

export const metadata: Metadata = {
  title: "Paramètres — Distribution — TKS",
  description:
    "Paramètres du distributeur : durée de validité des liens d'invitation.",
};

export default async function ParametresPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id ?? "";
  const lignes = userId
    ? await db
        .select({ role: comptesStaff.role, etat: comptesStaff.etat })
        .from(comptesStaff)
        .where(eq(comptesStaff.betterAuthUserId, userId))
    : [];
  const moi = lignes[0];
  const peutModifier = moi
    ? peutModifierReglage("duree_invitation_jours", moi.role, moi.etat)
    : false;

  if (!moi || !peutModifier) {
    return (
      <PermissionRefusee
        titre="Paramètres du système"
        detail="Seul un administrateur technique ou un administrateur principal validé peut consulter et modifier les réglages du système."
      />
    );
  }

  const dureeInvitationJours = await lireDureeInvitationJours();

  return (
    <div className="flex w-full flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-[22px] leading-tight font-semibold tracking-tight">
            Paramètres
          </h1>
          <Badge variant="secondary">
            <MailPlusIcon />
            {moi.role === "ADMIN_TECHNIQUE"
              ? "Administrateur technique"
              : "Administrateur principal"}
          </Badge>
        </div>
        <p className="max-w-[62ch] text-[13px] leading-relaxed text-muted-foreground">
          Le réglage que tient la durée des liens envoyés aux employés. Les
          crédits, clients et validations restent sur{" "}
          <Link
            href="/admin/dashboard"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            le tableau de bord
          </Link>
          .
        </p>
      </div>

      <section aria-labelledby="invitations-title" className="flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary-foreground [&_svg]:size-4">
            <KeyRoundIcon />
          </span>
          <div>
            <h2
              id="invitations-title"
              className="text-sm font-semibold tracking-tight"
            >
              Liens d&apos;invitation
            </h2>
            <p className="text-xs text-muted-foreground">
              Combien de temps un lien reste utilisable.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
          <FormulaireParametres
            dureeInvitationJours={dureeInvitationJours}
            minJours={MIN_DUREE_INVITATION_JOURS}
            maxJours={MAX_DUREE_INVITATION_JOURS}
            defautJours={DEFAUT_DUREE_INVITATION_JOURS}
          />
          <aside
            aria-label="Bon à savoir"
            className="h-fit overflow-hidden rounded-xl border bg-card shadow-sm"
          >
            <div className="flex items-center gap-2 border-b px-5 py-3.5">
              <ClipboardListIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
              <p className="text-[13px] font-semibold">Bon à savoir</p>
            </div>
            <ul className="flex flex-col gap-3.5 px-5 py-4">
              <li className="flex gap-2.5 text-xs leading-relaxed text-muted-foreground">
                Le réglage s&apos;applique aux liens administrateur principal
                et agent de service, sans distinction.
              </li>
              <li className="flex gap-2.5 text-xs leading-relaxed text-muted-foreground">
                Un lien périmé ne vaut plus rien : depuis{" "}
                <Link
                  href="/admin/invites"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Inviter
                </Link>
                , il faut en créer un nouveau.
              </li>
            </ul>
            <p className="mx-5 mb-2 flex gap-2.5 rounded-lg border border-primary/25 bg-primary/[0.07] px-3 py-2.5 text-xs leading-relaxed">
              <ClipboardListIcon className="mt-0.5 size-4 shrink-0 text-primary-foreground" />
              <span>
                <span className="font-semibold">Tout est tracé.</span>{" "}
                <span className="text-muted-foreground">
                  Chaque changement passe au{" "}
                  <Link
                    href="/admin/audit-log"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    journal
                  </Link>{" "}
                  avec son auteur et l&apos;ancienne valeur.
                </span>
              </span>
            </p>
            <p className="mx-5 mb-5 flex gap-2.5 rounded-lg bg-muted/60 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
              <WifiOffIcon className="mt-0.5 size-4 shrink-0" />
              Écran consultable hors réseau ; enregistre ton changement à la
              reconnexion, la valeur courante tient d&apos;ici là.
            </p>
          </aside>
        </div>
      </section>

      <p className="border-t border-dashed pt-4 text-xs leading-relaxed text-muted-foreground">
        Ici, ni taux ni grille ni plafond :{" "}
        <Link
          href="/admin/pricing"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          la grille tarifaire
        </Link>{" "}
        a son propre écran. Besoin d&apos;aide ?{" "}
        <Link
          href="/admin/help"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Ouvrir l&apos;aide
        </Link>
        .
      </p>
    </div>
  );
}

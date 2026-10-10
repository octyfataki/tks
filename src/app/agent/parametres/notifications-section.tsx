"use client";

import { useEffect, useState } from "react";
import { BellIcon, SlidersHorizontalIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FieldDescription } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  CANAUX_NOTIFICATION,
  CATALOGUE_NOTIFICATIONS,
  GROUPES_NOTIFICATION,
  type CanalNotification,
  type CleNotification,
} from "./preferences";
import { usePreferencesAgent } from "./use-preferences-agent";

type EtatPermission =
  | "indisponible"
  | "demande"
  | "accordee"
  | "refusee";

/**
 * Permission navigateur lue une fois après montage (rendu serveur :
 * `demande` par défaut, corrigé côté client sans désaccord visible).
 */
function usePermissionNotification(): {
  etat: EtatPermission;
  demander: () => void;
} {
  const [etat, setEtat] = useState<EtatPermission>("demande");

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture unique d'une API navigateur après montage
      setEtat("indisponible");
      return;
    }
    if (Notification.permission === "granted") setEtat("accordee");
    else if (Notification.permission === "denied") setEtat("refusee");
    else setEtat("demande");
  }, []);

  function demander() {
    try {
      const resultat = Notification.requestPermission();
      if (typeof (resultat as Promise<NotificationPermission>)?.then === "function") {
        (resultat as Promise<NotificationPermission>).then(
          (permission) =>
            setEtat(permission === "granted" ? "accordee" : "refusee"),
          () => {},
        );
      }
    } catch {
      // Navigateur ancien (rappel synchrone indisponible) : on relit l'état.
      try {
        setEtat(
          Notification.permission === "granted" ? "accordee" : "refusee",
        );
      } catch {
        // API通知 inaccessible : on reste sur la demande.
      }
    }
  }

  return { etat, demander };
}

/**
 * Demande d'activation des signaux du navigateur, en tête de section.
 * Trois issues honnêtes : accordée (pastille), refusée (marche à suivre
 * dans les réglages du site — le navigateur interdit de redemander),
 * en attente (bouton de demande). Renvoyée nulle quand l'API n'existe pas.
 */
function DemandeActivation() {
  const { etat, demander } = usePermissionNotification();

  if (etat === "indisponible") return null;

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
      <div className="flex min-w-0 items-start gap-3">
        <BellIcon
          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold">
            Notifications du navigateur
          </p>
          {etat === "refusee" ? (
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              Refusées dans le navigateur : réactivez-les dans les réglages
              du site pour recevoir les signaux. Chaque événement reste
              réglable ci-dessous.
            </p>
          ) : (
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              Autorisez ce téléphone à afficher les signaux. Chaque événement
              reste réglable ci-dessous.
            </p>
          )}
        </div>
      </div>
      {etat === "accordee" ? (
        <Badge variant="secondary" className="shrink-0 rounded-full">
          Activées
        </Badge>
      ) : etat === "refusee" ? (
        <Badge variant="outline" className="shrink-0 rounded-full">
          Refusées
        </Badge>
      ) : (
        <Button
          type="button"
          size="sm"
          className="shrink-0"
          onClick={demander}
        >
          Activer les notifications
        </Button>
      )}
    </div>
  );
}

/**
 * Signaux de l'appareil, par événement (section Notifications).
 *
 * Mise en page « réglages de notifications » : carte de demande
 * d'activation, puis colonne de groupe à gauche (titre + description),
 * lignes d'événements au centre (interrupteur + intitulé), menu du canal à
 * droite (son + vibration, vibration, silencieuse). `localStorage`
 * uniquement, via `usePreferencesAgent` : sur un téléphone partagé au
 * comptoir, ces réglages valent pour l'appareil.
 *
 * Honnêteté d'étape : les événements branchés sur S3, S5 et S8 le disent
 * (« branché avec… ») — aucun signal n'est promis avant son consommateur.
 */
export function NotificationsSection() {
  const { preferences, chargees, mettreAJour } = usePreferencesAgent();

  function reglerActif(cle: CleNotification, actif: boolean) {
    mettreAJour({
      notifications: {
        ...preferences.notifications,
        [cle]: { ...preferences.notifications[cle], actif },
      },
    });
  }

  function reglerCanal(cle: CleNotification, canal: CanalNotification) {
    mettreAJour({
      notifications: {
        ...preferences.notifications,
        [cle]: { ...preferences.notifications[cle], canal },
      },
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <DemandeActivation />

      <div className="flex flex-col">
        {GROUPES_NOTIFICATION.map((groupe, index) => (
          <div key={groupe.valeur}>
            {index > 0 ? <Separator className="my-6" /> : null}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] md:gap-8">
              <div>
                <p className="text-sm font-semibold">{groupe.titre}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {groupe.description}
                </p>
              </div>
              <ul className="flex flex-col gap-5">
                {CATALOGUE_NOTIFICATIONS.filter(
                  (entree) => entree.groupe === groupe.valeur,
                ).map((entree) => {
                  const reglage = preferences.notifications[entree.cle];
                  return (
                    <li
                      key={entree.cle}
                      className={cn(
                        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
                        !chargees && "opacity-60",
                      )}
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <Switch
                          checked={reglage.actif}
                          disabled={!chargees}
                          onCheckedChange={(suivant: boolean) =>
                            reglerActif(entree.cle, suivant)
                          }
                          aria-label={entree.titre}
                          className="mt-0.5"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{entree.titre}</p>
                          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                            {entree.description}
                          </p>
                        </div>
                      </div>
                      <Select
                        value={reglage.canal}
                        onValueChange={(valeur: unknown) =>
                          reglerCanal(entree.cle, valeur as CanalNotification)
                        }
                        disabled={!chargees || !reglage.actif}
                      >
                        <SelectTrigger
                          aria-label={`Canal pour ${entree.titre}`}
                          className="w-full shrink-0 text-xs sm:w-40"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CANAUX_NOTIFICATION.map((canal) => (
                            <SelectItem key={canal.valeur} value={canal.valeur}>
                              {canal.etiquette}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
        <div className="flex min-w-0 items-start gap-3">
          <SlidersHorizontalIcon
            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold">Signaux à venir</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              La caisse rapide et la file d&apos;attente (S5) liront ces
              réglages quand elles arriveront.
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="shrink-0 rounded-full">
          Bientôt
        </Badge>
      </div>

      <FieldDescription>
        Stocké sur cet appareil uniquement — jamais synchronisé.
      </FieldDescription>
    </div>
  );
}

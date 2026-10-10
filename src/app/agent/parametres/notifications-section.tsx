"use client";

import { Button } from "@/components/ui/button";
import { FieldDescription } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import {
  CANAUX_NOTIFICATION,
  CATALOGUE_NOTIFICATIONS,
  GROUPES_NOTIFICATION,
  type CanalNotification,
  type CleNotification,
} from "./preferences";
import { usePreferencesAgent } from "./use-preferences-agent";

/**
 * Signaux de l'appareil, par événement (section Notifications).
 *
 * Chaque événement du catalogue se règle en deux temps : interrupteur
 * (signal ou silence) puis canal (son + vibration, vibration, silencieuse).
 * `localStorage` uniquement, via `usePreferencesAgent` : sur un téléphone
 * partagé au comptoir, ces réglages valent pour l'appareil.
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
      {GROUPES_NOTIFICATION.map((groupe) => (
        <div key={groupe.valeur}>
          <p className="text-[13px] font-semibold">{groupe.titre}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {groupe.description}
          </p>
          <ul className="mt-2 flex flex-col gap-2">
            {CATALOGUE_NOTIFICATIONS.filter(
              (entree) => entree.groupe === groupe.valeur,
            ).map((entree) => {
              const reglage = preferences.notifications[entree.cle];
              return (
                <li
                  key={entree.cle}
                  className={cn(
                    "rounded-md border px-3 py-2.5",
                    !chargees && "opacity-60",
                  )}
                >
                  <label className="flex cursor-pointer items-center justify-between gap-4">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {entree.titre}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {entree.description}
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      className="size-4 shrink-0 accent-primary"
                      checked={reglage.actif}
                      disabled={!chargees}
                      onChange={(event) =>
                        reglerActif(entree.cle, event.target.checked)
                      }
                      aria-label={entree.titre}
                    />
                  </label>
                  {reglage.actif ? (
                    <div
                      className="mt-2 flex flex-wrap gap-1.5"
                      role="group"
                      aria-label={`Canal pour ${entree.titre}`}
                    >
                      {CANAUX_NOTIFICATION.map((canal) => (
                        <Button
                          key={canal.valeur}
                          type="button"
                          variant={
                            reglage.canal === canal.valeur
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          className="h-7 text-xs"
                          disabled={!chargees}
                          onClick={() => reglerCanal(entree.cle, canal.valeur)}
                          aria-pressed={reglage.canal === canal.valeur}
                        >
                          {canal.etiquette}
                        </Button>
                      ))}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <FieldDescription>
        Stocké sur cet appareil uniquement — jamais synchronisé. Les signaux
        seront consommés par la caisse rapide et la file d&apos;attente (S5)
        quand elles arriveront.
      </FieldDescription>
    </div>
  );
}

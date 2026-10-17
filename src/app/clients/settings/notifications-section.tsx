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
  NOTIFICATION_CHANNELS,
  NOTIFICATION_CATALOG,
  NOTIFICATION_GROUPS,
  type NotificationChannel,
  type ClientNotificationKey,
} from "./preferences";
import { useClientPreferences } from "./use-preferences-client";

type PermissionState = "unavailable" | "prompt" | "granted" | "denied";

function useNotificationPermission(): {
  state: PermissionState;
  request: () => void;
} {
  const [state, setState] = useState<PermissionState>("prompt");

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture unique d'une API navigateur après montage
      setState("unavailable");
      return;
    }
    if (Notification.permission === "granted") setState("granted");
    else if (Notification.permission === "denied") setState("denied");
    else setState("prompt");
  }, []);

  function request() {
    try {
      const permissionRequest = Notification.requestPermission();
      if (typeof (permissionRequest as Promise<NotificationPermission>)?.then === "function") {
        (permissionRequest as Promise<NotificationPermission>).then(
          (permission) =>
            setState(permission === "granted" ? "granted" : "denied"),
          () => {},
        );
      }
    } catch {
      try {
        setState(
          Notification.permission === "granted" ? "granted" : "denied",
        );
      } catch {
      }
    }
  }

  return { state, request };
}

function PermissionPrompt() {
  const { state, request } = useNotificationPermission();

  if (state === "unavailable") return null;

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
          {state === "denied" ? (
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
      {state === "granted" ? (
        <Badge variant="secondary" className="shrink-0 rounded-full">
          Activées
        </Badge>
      ) : state === "denied" ? (
        <Badge variant="outline" className="shrink-0 rounded-full">
          Refusées
        </Badge>
      ) : (
        <Button
          type="button"
          size="sm"
          className="shrink-0"
          onClick={request}
        >
          Activer les notifications
        </Button>
      )}
    </div>
  );
}

export function NotificationsSection() {
  const { preferences, loaded, update } = useClientPreferences();

  function updateNotification(key: ClientNotificationKey, patch: Partial<{ actif: boolean; canal: NotificationChannel }>) {
    update({
      notifications: {
        ...preferences.notifications,
        [key]: { ...preferences.notifications[key], ...patch },
      },
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <PermissionPrompt />

      <div className="flex flex-col">
        {NOTIFICATION_GROUPS.map((group, index) => (
          <div key={group.value}>
            {index > 0 ? <Separator className="my-6" /> : null}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] md:gap-8">
              <div>
                <p className="text-sm font-semibold">{group.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {group.description}
                </p>
              </div>
              <ul className="flex flex-col gap-5">
                {NOTIFICATION_CATALOG.filter(
                  (entry) => entry.group === group.value,
                ).map((entry) => {
                  const setting = preferences.notifications[entry.key];
                  return (
                      <li
                        key={entry.key}
                        className={cn(
                          "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
                          !loaded && "opacity-60",
                        )}
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          <Switch
                            checked={setting.actif}
                            disabled={!loaded}
                            onCheckedChange={(next: boolean) =>
                              updateNotification(entry.key, { actif: next })
                            }
                            aria-label={entry.title}
                            className="mt-0.5"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{entry.title}</p>
                            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                              {entry.description}
                            </p>
                          </div>
                        </div>
                        <Select
                          value={setting.canal}
                          onValueChange={(value: unknown) =>
                            updateNotification(entry.key, { canal: value as NotificationChannel })
                          }
                          disabled={!loaded || !setting.actif}
                        >
                          <SelectTrigger
                            aria-label={`Canal pour ${entry.title}`}
                            className="w-full shrink-0 text-xs sm:w-40"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {NOTIFICATION_CHANNELS.map((channel) => (
                              <SelectItem key={channel.value} value={channel.value}>
                                {channel.label}
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
              Les commandes (S5) et les paiements (S6) liront ces réglages
              quand ils arriveront.
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

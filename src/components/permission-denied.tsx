import { ShieldAlertIcon } from "lucide-react"

/**
 * Écran de permission refusée : remplace l'ancien simple `<p>` gris par un
 * panneau informatif qui dit quoi, pourquoi, et quoi faire.
 *
 * Conçu pour l'admin technique qui atterrit sur une page sans avoir le droit
 * d'agir — le message doit être clair, pas un mur.
 */
export function PermissionRefusee({
  titre,
  detail,
  action,
}: {
  titre: string
  detail: string
  action?: string
}) {
  return (
    <div className="flex flex-1 items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 text-center">
        <span
          aria-hidden
          className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary"
        >
          <ShieldAlertIcon className="size-6" />
        </span>
        <h1 className="mt-4 text-base font-semibold tracking-tight">{titre}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{detail}</p>
        {action ? (
          <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            {action}
          </p>
        ) : null}
      </div>
    </div>
  )
}

"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";

type PasswordInputProps = {
  id: string;
  name: string;
  autoComplete?: string;
  minLength?: number;
  required?: boolean;
  placeholder?: string;
};

/** Champ mot de passe avec bascule afficher/masquer (icône œil). Bouton
 * natif, pas le bouton générique : son effet d'enfoncement
 * (`active:translate-y-px`, plus spécifique) écraserait le centrage
 * `-translate-y-1/2` et ferait sauter l'œil à chaque clic. Ici aucun
 * mouvement au clic, simple fondu de couleur au survol — même parti que les
 * bascules sœurs des formulaires. */
export function PasswordInput({
  id,
  name,
  autoComplete = "current-password",
  minLength,
  required,
  placeholder = "••••••••",
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        minLength={minLength}
        required={required}
        placeholder={placeholder}
        className="pr-9"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        aria-pressed={visible}
        className="absolute top-1/2 right-1 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
      >
        {visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
      </button>
    </div>
  );
}

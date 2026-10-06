"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PasswordInputProps = {
  id: string;
  name: string;
  autoComplete?: string;
  minLength?: number;
  required?: boolean;
  placeholder?: string;
};

/** Champ mot de passe avec bascule afficher/masquer (icône œil). */
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
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        aria-pressed={visible}
        className="absolute top-1/2 right-1 -translate-y-1/2"
      >
        {visible ? <Eye /> : <EyeOff />}
      </Button>
    </div>
  );
}

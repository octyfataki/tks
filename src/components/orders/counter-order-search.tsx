"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CounterOrderSearch({
  retour,
  defaut,
}: {
  retour: string;
  defaut: string;
}) {
  const router = useRouter();
  const [valeur, setValeur] = useState(defaut);

  return (
    <Card size="sm">
      <CardContent>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const q = valeur.trim();
            router.push(q === "" ? retour : `${retour}?q=${encodeURIComponent(q)}`);
          }}
          className="flex items-center gap-2"
        >
          <div className="relative min-w-0 flex-1">
            <SearchIcon
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={valeur}
              onChange={(event) => setValeur(event.target.value)}
              placeholder="0812 345 678 ou nom"
              autoComplete="off"
              autoFocus
              className="h-10 pl-9"
            />
          </div>
          <Button type="submit" className="h-10">
            Chercher
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

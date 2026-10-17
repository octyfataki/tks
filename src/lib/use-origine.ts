import { useSyncExternalStore } from "react";

const sansEcoute = () => () => {};

export function useOrigine(): string {
  return useSyncExternalStore(
    sansEcoute,
    () => window.location.origin,
    () => "",
  );
}

export function useUrlAbsolue(lien: string | null | undefined): string {
  const origine = useOrigine();
  return origine && lien ? `${origine}${lien}` : (lien ?? "");
}
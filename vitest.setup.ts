import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Isole les tests composants : sans ça, les rendus s'accumulent
// dans le document entre les tests d'un même fichier.
afterEach(() => {
  cleanup();
});

// jsdom ne fournit pas ResizeObserver, requis par le positionnement
// des fenêtres flottantes (Dialog, DropdownMenu…).
class ObservateurDeTaille {
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = ObservateurDeTaille as unknown as typeof ResizeObserver;
}

// jsdom ne fait pas défiler : cmdk appelle scrollIntoView sur l'élément actif.
if (
  typeof Element !== "undefined" &&
  typeof Element.prototype.scrollIntoView !== "function"
) {
  Element.prototype.scrollIntoView = () => {};
}

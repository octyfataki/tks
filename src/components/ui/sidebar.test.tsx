import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
} from "./sidebar";

/**
 * Régression : sur mobile le tiroir de navigation restait ouvert après le
 * clic sur un lien. La coquille (SidebarProvider) persiste pendant la
 * navigation client-side, et rien ne remettait `openMobile` à false : le
 * Sheet restait donc affiché par-dessus la page d'arrivée.
 *
 * `useIsMobile` lit `window.innerWidth` et s'appuie sur `matchMedia`, absent
 * de jsdom : on le stube ici plutôt que globalement, aucun autre test de la
 * suite n'a besoin d'un viewport.
 */
function viewportMobile() {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: 500,
  });
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((requete: string) => ({
      matches: requete.includes("max-width"),
      media: requete,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      onchange: null,
      dispatchEvent: () => false,
    })),
  );
}

function TiroirDeTest() {
  return (
    <SidebarProvider>
      <SidebarTrigger />
      <Sidebar>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton render={<Link href="/admin/clients" />}>
                Gestion des clients
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton fermeAuClicMobile={false}>
                Opérations
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuSub>
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton render={<Link href="/admin/list" />}>
                    Liste des comptes
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              </SidebarMenuSub>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  );
}

describe("Sidebar sur mobile", () => {
  beforeEach(viewportMobile);

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("ferme le tiroir au clic sur un lien de navigation", () => {
    render(<TiroirDeTest />);
    fireEvent.click(screen.getByRole("button", { name: /toggle sidebar/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: "Gestion des clients" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("ferme le tiroir au clic sur un lien de sous-menu", () => {
    render(<TiroirDeTest />);
    fireEvent.click(screen.getByRole("button", { name: /toggle sidebar/i }));
    fireEvent.click(screen.getByRole("link", { name: "Liste des comptes" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("laisse le tiroir ouvert sur un bouton qui ne navigue pas", () => {
    // Le cas des groupes « Bientôt » et du déclencheur du menu utilisateur :
    // fermer le Sheet les démonterait au lieu de laisser l'action se faire.
    render(<TiroirDeTest />);
    fireEvent.click(screen.getByRole("button", { name: /toggle sidebar/i }));
    fireEvent.click(screen.getByRole("button", { name: "Opérations" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("ne ferme rien sur desktop", () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1280,
    });
    render(<TiroirDeTest />);
    // Hors mobile, le tiroir n'existe pas : le contenu est rendu directement,
    // un clic sur un lien ne doit changer ni l'un ni l'autre.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: "Gestion des clients" }));
    expect(screen.getByRole("link", { name: "Gestion des clients" })).toBeInTheDocument();
  });
});

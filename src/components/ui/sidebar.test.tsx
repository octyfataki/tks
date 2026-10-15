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
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: "Gestion des clients" }));
    expect(screen.getByRole("link", { name: "Gestion des clients" })).toBeInTheDocument();
  });
});

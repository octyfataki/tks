import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./breadcrumb";

describe("Breadcrumb", () => {
  it("rend un fil avec lien et page en cours", () => {
    render(
      <Breadcrumb aria-label="Fil d'Ariane">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/dashboard">
              Tableau de bord
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Mon compte</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );
    expect(screen.getByLabelText("Fil d'Ariane")).toBeInTheDocument();
    const lien = screen.getByRole("link", { name: "Tableau de bord" });
    expect(lien).toHaveAttribute("href", "/admin/dashboard");
    expect(screen.getByText("Mon compte")).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("rend une page seule sans séparateur", () => {
    render(
      <Breadcrumb aria-label="Fil d'Ariane">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Tableau de bord</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );
    expect(screen.getByText("Tableau de bord")).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});

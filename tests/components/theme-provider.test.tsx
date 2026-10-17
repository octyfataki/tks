import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import { THEME_STORAGE_KEY } from "@/components/theme-script";

function Panneau() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return (
    <div>
      <span
        data-testid="sonde"
        data-theme={theme}
        data-resolved={resolvedTheme}
      />
      <button type="button" onClick={() => setTheme("dark")}>
        Sombre
      </button>
      <button type="button" onClick={() => setTheme("light")}>
        Clair
      </button>
    </div>
  );
}

function matchMedia(assombri: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((requete: string) => ({
      matches: assombri && requete.includes("dark"),
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

describe("ThemeProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
    matchMedia(false);
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("ne lit pas le stockage au premier rendu", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    const html = renderToString(
      <ThemeProvider defaultTheme="system">
        <Panneau />
      </ThemeProvider>,
    );
    expect(html).toContain('data-theme="system"');
  });

  it("reprend le thème stocké après le montage", async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    render(
      <ThemeProvider defaultTheme="system">
        <Panneau />
      </ThemeProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("sonde")).toHaveAttribute("data-theme", "dark"),
    );
    expect(screen.getByTestId("sonde")).toHaveAttribute("data-resolved", "dark");
    expect(document.documentElement).toHaveClass("dark");
  });

  it("suit la préférence système quand le thème vaut « system »", async () => {
    matchMedia(true);
    render(
      <ThemeProvider defaultTheme="system">
        <Panneau />
      </ThemeProvider>,
    );
    await waitFor(() => expect(document.documentElement).toHaveClass("dark"));
    expect(screen.getByTestId("sonde")).toHaveAttribute("data-theme", "system");
    expect(screen.getByTestId("sonde")).toHaveAttribute("data-resolved", "dark");
  });

  it("écrit le thème choisi, l'affiche et l'applique au document", async () => {
    render(
      <ThemeProvider defaultTheme="system">
        <Panneau />
      </ThemeProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("sonde")).toHaveAttribute("data-theme", "system"),
    );

    fireEvent.click(screen.getByRole("button", { name: "Sombre" }));

    await waitFor(() =>
      expect(screen.getByTestId("sonde")).toHaveAttribute("data-theme", "dark"),
    );
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(document.documentElement).toHaveClass("dark");

    fireEvent.click(screen.getByRole("button", { name: "Clair" }));

    await waitFor(() =>
      expect(screen.getByTestId("sonde")).toHaveAttribute("data-theme", "light"),
    );
    expect(document.documentElement).not.toHaveClass("dark");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });
});
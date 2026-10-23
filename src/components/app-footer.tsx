import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { APP_VERSION } from "@/lib/app-version";
import { FOOTER_CONTACT, FOOTER_LINKS, FOOTER_TAGLINE } from "@/lib/footer";
import { cn } from "@/lib/utils";

const COPYRIGHT_YEAR = new Date().getFullYear();

const FOOTER_LINK_CLASS =
  "text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline";

export function AppFooter() {
  return (
    <footer className="mt-auto border-t border-dashed border-primary/40">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-x-6 gap-y-4 px-4 py-5 sm:grid-cols-[1fr_1.7fr_1fr] sm:gap-8">
        <div className="col-span-2 sm:col-span-1">
          <BrandLogo height={22} />
          <p className="mt-2 text-xs text-muted-foreground">{FOOTER_TAGLINE}</p>
        </div>

        <nav aria-label="Liens de pied de page">
          <p className="text-xs font-medium text-foreground">Liens</p>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={FOOTER_LINK_CLASS}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="text-xs font-medium text-foreground">Contact</p>
          <a
            href={`mailto:${FOOTER_CONTACT.email}`}
            className={cn("mt-2 block", FOOTER_LINK_CLASS)}
          >
            {FOOTER_CONTACT.email}
          </a>
          <p className="text-xs text-muted-foreground">{FOOTER_CONTACT.city}</p>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-6xl items-center justify-between border-t border-border/60 px-4 py-2.5 text-[11px] text-muted-foreground">
        <p>© TKS {COPYRIGHT_YEAR}</p>
        <p className="font-mono">version {APP_VERSION}</p>
      </div>
    </footer>
  );
}

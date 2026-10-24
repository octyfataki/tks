import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export type LegalSection = {
  heading: string;
  paragraphs: string[];
  items?: string[];
};

export function LegalPage({
  title,
  intro,
  sections,
  updatedAt,
}: {
  title: string;
  intro: string;
  sections: LegalSection[];
  updatedAt: string;
}) {
  return (
    <main className="flex-1">
      <article className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
        <Link href="/" aria-label="TKS — accueil" className="inline-flex">
          <BrandLogo height={26} />
        </Link>
        <h1 className="font-heading mt-6 text-2xl font-semibold tracking-tight">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {intro}
        </p>

        {sections.map((section) => (
          <section key={section.heading} className="mt-8">
            <h2 className="text-sm font-semibold">{section.heading}</h2>
            {section.paragraphs.map((paragraph, index) => (
              <p
                key={`${section.heading}-${index}`}
                className="mt-2 text-sm leading-relaxed text-muted-foreground"
              >
                {paragraph}
              </p>
            ))}
            {section.items ? (
              <ul className="mt-2 flex flex-col gap-1.5">
                {section.items.map((item, index) => (
                  <li
                    key={`${section.heading}-${index}`}
                    className="text-sm leading-relaxed text-muted-foreground"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}

        <p className="mt-10 text-xs text-muted-foreground">
          Dernière mise à jour : {updatedAt}
        </p>
      </article>
    </main>
  );
}

import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LANGUES, NOM_LANGUE, dico, estLangue } from "../../i18n/index.ts";

export function generateStaticParams() {
  return LANGUES.map((langue) => ({ langue }));
}

export default async function LangueLayout(
  { children, params }: { children: ReactNode; params: Promise<{ langue: string }> },
) {
  const { langue } = await params;
  if (!estLangue(langue)) notFound();
  const t = dico(langue);

  return (
    <html lang={langue}>
      <body>
        <a className="saut" href="#contenu">{t.nav.passerAuContenu}</a>

        <header className="entete">
          <div className="entete-interne">
            <Link className="marque" href={`/${langue}/decisions`}>{t.site}</Link>
            <span className="baseline">{t.baseline}</span>
            <nav aria-label={t.site}>
              <Link href={`/${langue}/decisions`}>{t.nav.decisions}</Link>
              <Link href={`/${langue}/a-propos`}>{t.nav.aPropos}</Link>
              <span className="langues" role="group" aria-label={t.nav.changerLangue}>
                {LANGUES.map((l) => (
                  <Link key={l} href={`/${l}/decisions`} hrefLang={l} lang={l}
                    aria-current={l === langue ? "true" : undefined}>
                    {NOM_LANGUE[l]}
                  </Link>
                ))}
              </span>
            </nav>
          </div>
        </header>

        <main id="contenu" className="enveloppe">{children}</main>

        <footer className="pied">
          <div className="pied-interne">
            <span>{t.pied.licence}</span>
            <span>
              {t.pied.source} :{" "}
              <a href="https://lokaalbeslist.vlaanderen.be" target="_blank" rel="noreferrer">
                Lokaal Beslist
              </a>{" "}
              — Modellicentie Gratis Hergebruik
            </span>
            <span>{t.pied.maquette}</span>
          </div>
        </footer>
      </body>
    </html>
  );
}

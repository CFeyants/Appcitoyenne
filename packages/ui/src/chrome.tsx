/**
 * Chrome applicatif — en-tête collant, échelle de territoire, coquille.
 *
 * Ces composants ne connaissent ni Next.js ni le routeur : ils reçoivent des
 * `href` déjà construits. C'est ce qui permet de les rendre côté serveur sans
 * une ligne de JavaScript client — cohérent avec « conçu pour rendre du temps ».
 */

import type { ReactNode } from "react";

export interface EntreeNav {
  id: string;
  libelle: string;
  href: string;
  actif: boolean;
}

export function EnteteApp({
  marque, complement, entrees, langues, theme, echelle,
}: {
  marque: string;
  complement?: string;
  entrees: EntreeNav[];
  langues: { code: string; libelle: string; href: string; actif: boolean }[];
  theme?: ReactNode;
  echelle?: ReactNode;
}) {
  return (
    <header className="entete">
      <div className="entete-barre">
        <a className="marque" href={entrees[0]?.href ?? "#"}>
          {marque} {complement && <span>· {complement}</span>}
        </a>
        <nav className="nav-principale" aria-label={marque}>
          {entrees.map((e) => (
            <a key={e.id} href={e.href} aria-current={e.actif ? "page" : undefined}>{e.libelle}</a>
          ))}
        </nav>
        <div className="entete-fin">
          <span className="langues" role="group" aria-label="Langue">
            {langues.map((l) => (
              <a key={l.code} className="fantome" href={l.href} hrefLang={l.code} lang={l.code}
                aria-current={l.actif ? "true" : undefined}>{l.libelle}</a>
            ))}
          </span>
          {theme}
        </div>
      </div>
      {echelle}
    </header>
  );
}

/**
 * L'échelle de territoire. Le niveau est un FILTRE : il ne change pas d'écran,
 * il change le cadrage. L'état vit dans l'URL, donc un lien partagé rouvre
 * exactement la même vue.
 */
export function SelecteurTerritoire({
  crans, libelle,
}: {
  crans: { code: string; nom: string; href: string; actif: boolean }[];
  libelle: string;
}) {
  return (
    <div className="echelle">
      <div className="echelle-interne" role="group" aria-label={libelle}>
        {crans.map((c, i) => (
          <span key={c.code} style={{ display: "contents" }}>
            {i > 0 && <span className="echelle-fleche" aria-hidden="true">›</span>}
            <a className="niveau" href={c.href} aria-current={c.actif ? "true" : undefined}>
              <span className="point" aria-hidden="true" />{c.nom}
            </a>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Grille principale + panneaux. La colonne de texte ne dépasse jamais 720 px. */
export function Coquille({ children, panneaux }: { children: ReactNode; panneaux?: ReactNode }) {
  return (
    <div className={panneaux ? "coquille" : "coquille coquille-large"}>
      <main id="contenu" className="colonne-lecture">{children}</main>
      {panneaux && <aside className="panneaux">{panneaux}</aside>}
    </div>
  );
}

export function PiedPage({ children }: { children: ReactNode }) {
  return (
    <footer className="pied-page">
      <div className="pied-page-interne">{children}</div>
    </footer>
  );
}

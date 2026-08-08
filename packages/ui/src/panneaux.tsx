/** Panneaux latéraux, tuiles, jauges, encarts juridiques et transverses. */

import type { ReactNode } from "react";

export function Panneau({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <section className="panneau">
      <h2>{titre}</h2>
      {children}
    </section>
  );
}

export function TuileIndicateur({ valeur, legende, children }: {
  valeur: string; legende: string; children?: ReactNode;
}) {
  return (
    <>
      <div className="stat">{valeur}</div>
      <div className="stat-legende">{legende}</div>
      {children}
    </>
  );
}

/**
 * Jauge avec marqueur de seuil. Le marqueur est doublé d'un anneau de surface :
 * sans lui, il disparaît dès qu'il tombe sur la partie remplie — défaut relevé
 * sur la maquette d'origine.
 */
export function Jauge({ pourcentage, seuilPourcentage, couleur = "var(--good)", libelle }: {
  pourcentage: number; seuilPourcentage?: number; couleur?: string; libelle: string;
}) {
  const p = Math.max(0, Math.min(100, pourcentage));
  return (
    <div className="jauge" role="img" aria-label={libelle}>
      <div className="jauge-remplissage" style={{ width: `${p}%`, background: couleur }} />
      {seuilPourcentage !== undefined && (
        <>
          <div className="jauge-anneau" style={{ left: `calc(${Math.min(100, seuilPourcentage)}% - 2px)` }} />
          <div className="jauge-repere" style={{ left: `calc(${Math.min(100, seuilPourcentage)}% - 1px)` }} />
        </>
      )}
    </div>
  );
}

/** « Pourquoi je vois ceci » — le § 5 l'exige sur chaque item affiché. */
export function PanneauPourquoi({ titre, phrase, lienLibelle, lienHref }: {
  titre: string; phrase: ReactNode; lienLibelle?: string; lienHref?: string;
}) {
  return (
    <Panneau titre={titre}>
      <p>{phrase}</p>
      {lienHref && <p><a href={lienHref}>{lienLibelle} →</a></p>}
    </Panneau>
  );
}

export function Encart({ variante = "neutre", children }: {
  variante?: "neutre" | "alerte" | "loi"; children: ReactNode;
}) {
  const cls = variante === "alerte" ? "encart encart-alerte"
    : variante === "loi" ? "encart encart-loi" : "encart";
  return <div className={cls}>{children}</div>;
}

/** Un article du décret, toujours avec son lien vers le texte consolidé. */
export function EncartJuridique({ article, obligation, url, libelleLien }: {
  article: string; obligation: string; url: string; libelleLien: string;
}) {
  return (
    <Encart variante="loi">
      <strong>{article}</strong> — {obligation}{" "}
      <a href={url} target="_blank" rel="noreferrer">{libelleLien} ↗</a>
    </Encart>
  );
}

/**
 * Un délai n'est jamais un nombre nu : soit légal avec son article, soit
 * conventionnel avec sa convention, soit absent — et alors on l'écrit.
 */
export function DelaiFonde({ delai, libelles }: {
  delai:
    | { fondement: "legal"; jours: number; article: string; url: string }
    | { fondement: "conventionnel"; jours: number; convention: string; signeeLe: string; url?: string }
    | { fondement: "aucun"; explication: string };
  libelles: { jours: string; selon: string; convention: string };
}) {
  if (delai.fondement === "aucun") {
    return <span className="delai delai-aucun"><span aria-hidden="true">— </span>{delai.explication}</span>;
  }
  if (delai.fondement === "legal") {
    return (
      <span className="delai">
        <strong>{delai.jours} {libelles.jours}</strong> — {libelles.selon}{" "}
        <a href={delai.url} target="_blank" rel="noreferrer">{delai.article} ↗</a>
      </span>
    );
  }
  return (
    <span className="delai">
      <strong>{delai.jours} {libelles.jours}</strong> — {libelles.convention} « {delai.convention} » ({delai.signeeLe})
    </span>
  );
}

export type EtatConf = "conforme" | "manquant" | "non_verifie" | "non_mesurable";
const ICONES: Record<EtatConf, string> = {
  conforme: "●", manquant: "■", non_verifie: "○", non_mesurable: "▲",
};

/** Quatre états, toujours icône + mot. « manquant » ≠ « non vérifié ». */
export function EtatConformiteBadge({ etat, libelle }: { etat: EtatConf; libelle: string }) {
  const cls = etat.replace("_", "-");
  return (
    <span className={`conformite conformite-${cls}`}>
      <span aria-hidden="true">{ICONES[etat]}</span>{libelle}
    </span>
  );
}

/* ---------------- transverses ---------------- */

export function VueTableau({ entetes, lignes, libelleOuvrir, libelleFermer }: {
  entetes: string[]; lignes: ReactNode[][]; libelleOuvrir: string; libelleFermer: string;
}) {
  return (
    <details style={{ marginTop: 16 }}>
      <summary className="puce" style={{ display: "inline-flex" }}>{libelleOuvrir}</summary>
      <div className="defilable" style={{ marginTop: 12 }}>
        <table>
          <thead>
            <tr>{entetes.map((h, i) => <th key={i} className={i ? "num" : undefined}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {lignes.map((r, i) => (
              <tr key={i}>{r.map((c, j) => <td key={j} className={j ? "num" : undefined}>{c}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
      <span className="u-invisible">{libelleFermer}</span>
    </details>
  );
}

export function BoutonExportJson({ href, libelle, note }: { href: string; libelle: string; note?: string }) {
  return (
    <Encart>
      <a className="bouton bouton-secondaire" href={href}>↓ {libelle}</a>
      {note && <p style={{ marginTop: 10, fontSize: 12.5 }}>{note}</p>}
    </Encart>
  );
}

/** Pagination explicite : jamais de défilement infini (règle n° 3). */
export function Pagination({ page, pages, hrefPrecedent, hrefSuivant, libelles }: {
  page: number; pages: number;
  hrefPrecedent?: string; hrefSuivant?: string;
  libelles: { page: string; precedent: string; suivant: string };
}) {
  if (pages <= 1) return null;
  return (
    <nav className="pagination" aria-label={libelles.page}>
      {hrefPrecedent && <a className="puce" href={hrefPrecedent}>← {libelles.precedent}</a>}
      <span>{libelles.page} {page} / {pages}</span>
      {hrefSuivant && <a className="puce" href={hrefSuivant}>{libelles.suivant} →</a>}
    </nav>
  );
}

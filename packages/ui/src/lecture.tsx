/**
 * La règle de lecture C0, implémentée comme un composant partagé — pas comme
 * une consigne répétée à la main.
 *
 * Trois niveaux partout : message clé → contexte → détail complet.
 */

import type { ReactNode } from "react";

/* ------------------------------------------------------------------ */

export interface SourceVisible {
  organisme: string;
  date: string;
  url: string;
  licence: string;
}

/**
 * Un message clé porte un FAIT, pas une catégorie. « Le budget environnement a
 * été exécuté à 61 % » est un message clé ; « Budget environnement » est une
 * étiquette.
 *
 * Sa source est visible SANS CLIC : c'est le détail qui se déplie, jamais la
 * provenance. Le composant refuse de se rendre sans elle.
 */
export function MessageCle({ fait, source, children }: {
  fait: string;
  source: SourceVisible;
  children?: ReactNode;
}) {
  const mots = fait.trim().split(/\s+/).length;
  if (process.env.NODE_ENV !== "production" && mots > 20) {
    console.warn(`[MessageCle] « ${fait} » fait ${mots} mots — la règle C0 en autorise vingt.`);
  }
  return (
    <div className="message-cle">
      <p className="message-cle-fait">{fait}</p>
      <p className="message-cle-source">
        <a href={source.url} target="_blank" rel="noreferrer">{source.organisme}</a>
        <span aria-hidden="true"> · </span>{source.date}
        <span aria-hidden="true"> · </span>{source.licence}
      </p>
      {children}
    </div>
  );
}

/**
 * Un graphique NE PART PAS en production sans son texte.
 *
 * `explication` est obligatoire et non vide : le composant lève en
 * développement s'il manque. Ce n'est pas une préférence rédactionnelle — sans
 * cette phrase, un écart devient une accusation ou une excuse ; avec elle, il
 * devient un fait discutable.
 */
export function Graphique({ titre, explication, children }: {
  titre: string;
  /** Trois à cinq lignes : ce que le graphique montre, ce qu'il ne montre pas,
   *  et pourquoi le chiffre bouge. */
  explication: string;
  children: ReactNode;
}) {
  if (!explication || explication.trim().length < 40) {
    const msg = `[Graphique] « ${titre} » est monté sans explication suffisante. ` +
      "Un graphique sans texte est un écran non terminé (Lot 9, étape C).";
    if (process.env.NODE_ENV !== "production") throw new Error(msg);
    console.error(msg);
  }
  return (
    <figure className="graphique">
      <figcaption className="graphique-titre">{titre}</figcaption>
      {children}
      <p className="graphique-explication">{explication}</p>
    </figure>
  );
}

/** Le troisième niveau : le détail, replié, jamais absent. */
export function Detail({ resume, children }: { resume: string; children: ReactNode }) {
  return (
    <details className="repli detail-bloc">
      <summary>{resume}</summary>
      <div style={{ marginTop: 10 }}>{children}</div>
    </details>
  );
}

/**
 * La ligne de contexte en tête d'un digest : période couverte, actes examinés,
 * actes retenus. Elle rend le tri vérifiable au lieu de demander confiance.
 */
export function LigneContexte({ texte, lienLibelle, lienHref }: {
  texte: string; lienLibelle?: string; lienHref?: string;
}) {
  return (
    <p className="ligne-contexte">
      {texte}
      {lienHref && <> <a href={lienHref}>{lienLibelle} →</a></>}
    </p>
  );
}

/** Sept éléments au maximum sur un premier écran, quelle que soit la partie. */
export const MAX_DIGEST = 7;

export function limiter<T>(xs: T[], max = MAX_DIGEST): T[] {
  return xs.slice(0, max);
}

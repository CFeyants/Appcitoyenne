/**
 * Filtres, carte de décision et états.
 *
 * La barre de filtres n'utilise AUCUN `<select>` natif : c'est un interdit
 * explicite du Lot 8. Les menus sont des `<details>` porteurs d'une puce, ce
 * qui les rend utilisables au clavier et sans JavaScript.
 */

import type { ReactNode } from "react";

/* ---------------- filtres ---------------- */

export function ChampRecherche({ nom, valeur, etiquette, placeholder }: {
  nom: string; valeur?: string; etiquette: string; placeholder?: string;
}) {
  return (
    <div className="recherche">
      <label className="u-invisible" htmlFor={nom}>{etiquette}</label>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2.2" aria-hidden="true">
        <circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" />
      </svg>
      <input id={nom} name={nom} type="search" defaultValue={valeur ?? ""} placeholder={placeholder} />
    </div>
  );
}

export function Puce({ href, actif, children }: { href: string; actif?: boolean; children: ReactNode }) {
  return <a className="puce" href={href} aria-current={actif ? "true" : undefined}>{children}</a>;
}

/** Menu déroulant sans `<select>` : `<details>` + liste de liens. */
export function PuceMenu({ libelle, valeurActive, options }: {
  libelle: string;
  valeurActive?: string;
  options: { valeur: string; libelle: string; href: string }[];
}) {
  const actif = Boolean(valeurActive);
  const courante = options.find((o) => o.valeur === valeurActive);
  return (
    <details className="puce-menu">
      <summary className="puce" aria-pressed={actif}>
        {courante ? `${libelle} : ${courante.libelle}` : libelle}
        <span className="puce-caret" aria-hidden="true">▾</span>
      </summary>
      <div className="puce-liste">
        {options.map((o) => (
          <a key={o.valeur} href={o.href} aria-current={o.valeur === valeurActive ? "true" : undefined}>
            {o.libelle}
          </a>
        ))}
      </div>
    </details>
  );
}

export function BarreFiltres({ action, children }: { action?: string; children: ReactNode }) {
  return <form className="filtres" method="get" action={action} role="search">{children}</form>;
}

/* ---------------- carte de décision ---------------- */

export type TonStatut = "faire" | "rien" | "echeance" | "qualifier";

/** Un statut porte toujours une icône ET un mot. Jamais la couleur seule. */
export function PuceStatut({ ton, icone, children }: { ton: TonStatut; icone: string; children: ReactNode }) {
  return (
    <span className={`statut statut-${ton}`}>
      <span aria-hidden="true">{icone}</span>{children}
    </span>
  );
}

export function BadgeProvenance({ variante, children }: { variante: "demo" | "brut"; children: ReactNode }) {
  return <span className={`drapeau drapeau-${variante}`}>{children}</span>;
}

export function LigneMeta({ organe, territoire, date, badges }: {
  organe: string; territoire: string; date?: string; badges?: ReactNode;
}) {
  return (
    <div className="meta">
      <span className="meta-organe">{organe}</span>
      <span className="meta-sep" aria-hidden="true">·</span>
      <span>{territoire}</span>
      {date && (<><span className="meta-sep" aria-hidden="true">·</span><span>{date}</span></>)}
      {badges}
    </div>
  );
}

export function Etiquettes({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="etiquettes">
      {items.map((t) => <span key={t} className="etiquette">{t}</span>)}
    </div>
  );
}

/**
 * Le texte de l'autorité est REPLIÉ. Il n'est jamais le contenu principal de la
 * carte — c'était le manque central que le Lot 8 vient corriger.
 */
export function TexteOfficielReplie({ resume, texte, langue }: {
  resume: string; texte: string; langue: string;
}) {
  return (
    <details className="repli">
      <summary>{resume}</summary>
      <p className="repli-texte" lang={langue}>{texte}</p>
    </details>
  );
}

export function PiedSource({ children }: { children: ReactNode }) {
  return <div className="pied-source">{children}</div>;
}

/**
 * Anatomie imposée, dans cet ordre : métadonnées · titre · impact · action et
 * thèmes · repli du texte officiel · pied de source.
 */
export function Carte({ meta, titre, lienTitre, impact, impactAbsent, action, etiquettes, officiel, source }: {
  meta: ReactNode;
  titre: string;
  lienTitre?: string;
  impact: string;
  impactAbsent?: boolean;
  action?: ReactNode;
  etiquettes?: ReactNode;
  officiel?: ReactNode;
  source?: ReactNode;
}) {
  return (
    <article className="carte">
      {meta}
      <h3 className="carte-titre">
        {lienTitre ? <a href={lienTitre}>{titre}</a> : titre}
      </h3>
      <p className={impactAbsent ? "impact impact-absent" : "impact"}>{impact}</p>
      {(action || etiquettes) && <div className="rangee">{action}{etiquettes}</div>}
      {officiel}
      {source}
    </article>
  );
}

/* ---------------- états ---------------- */

export function EtatVide({ titre, texte, action }: { titre: string; texte: string; action?: ReactNode }) {
  return (
    <div className="etat">
      <h2>{titre}</h2>
      <p>{texte}</p>
      {action && <p style={{ marginTop: 16 }}>{action}</p>}
    </div>
  );
}

export function EtatChargement({ lignes = 3 }: { lignes?: number }) {
  return (
    <div aria-busy="true" aria-live="polite">
      {Array.from({ length: lignes }, (_, i) => (
        <div key={i} className="carte">
          <div className="squelette" style={{ height: 11, width: "45%", marginBottom: 10 }} />
          <div className="squelette" style={{ height: 17, width: "80%", marginBottom: 9 }} />
          <div className="squelette" style={{ height: 14, width: "95%" }} />
        </div>
      ))}
    </div>
  );
}

/** Mode dégradé explicite : dire que la donnée est vieille vaut mieux que de
 *  la servir comme si elle était fraîche. */
export function EtatSourceIndisponible({ titre, texte }: { titre: string; texte: string }) {
  return (
    <div className="etat etat-erreur">
      <h2><span aria-hidden="true">▲ </span>{titre}</h2>
      <p style={{ margin: 0 }}>{texte}</p>
    </div>
  );
}

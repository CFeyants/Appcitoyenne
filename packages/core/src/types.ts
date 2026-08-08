/**
 * Types du noyau — brief § 4.
 *
 * Ces types sont la frontière du produit : un connecteur ne rend rien d'autre,
 * et l'interface ne connaît rien d'autre. Toute donnée qui ne s'y coule pas est
 * rejetée par les schémas Zod (voir `schemas.ts`), avec un journal explicite.
 */

export type Niveau = "commune" | "region" | "pays" | "europe";

/**
 * Règle non négociable n° 1 : aucune information sans source. Il n'existe aucun
 * chemin dans ce dépôt qui produise un objet affichable sans ce bloc rempli.
 */
export interface Source {
  /** L'organisme émetteur, tel qu'il se nomme lui-même. */
  organisme: string;
  /** Lien direct vers l'acte — pas vers une page d'accueil. */
  url: string;
  /** Date de la donnée elle-même (ISO 8601). */
  dateDonnee: string;
  /** Licence de réutilisation, citée telle qu'elle est publiée. */
  licence: string;
  /** Date à laquelle nous l'avons lue (ISO 8601). */
  consulteLe: string;
}

export type TypeItem =
  | "decision" | "regle" | "budget" | "consultation" | "droit" | "alerte" | "seance";

/**
 * Le champ `action` n'est jamais vide. `aucune_action` est une réponse légitime
 * — et c'est déjà un service que de l'écrire noir sur blanc (§ 3).
 */
export type Action =
  | { kind: "aucune_action"; explication: string }
  | { kind: "demarche"; libelle: string; url: string; delai?: string }
  | { kind: "consultation"; libelle: string; url: string; clotureLe: string }
  | { kind: "seance"; libelle: string; date: string; lieu: string; inscription?: string }
  | { kind: "demande"; destinataireId: string };

/**
 * ÉCART ASSUMÉ AU § 4 — deux champs ajoutés, documentés ici plutôt que glissés.
 *
 * `langue` : le brief suppose des titres « en français ordinaire ». La source
 * flamande publie en néerlandais, et nous n'avons pas le droit de traduire un
 * acte administratif sans que la traduction ait valeur juridique. Le titre est
 * donc rendu dans sa langue d'origine, et cette langue est affichée. Pour une
 * commune à facilités dont plus de 80 % des habitants sont francophones, cet
 * écart n'est pas un détail technique : c'est le problème que la plateforme
 * existe pour rendre visible.
 *
 * `impactEtabli` : dit si le champ `impact` reprend un texte publié par
 * l'autorité, ou s'il a été construit à partir des seuls champs de la source
 * (organe, date, objet). Sans cette distinction, une phrase fabriquée serait
 * indiscernable d'une phrase officielle — ce qui viderait la règle n° 1.
 */
export type Langue = "nl" | "fr" | "de" | "en";
export type ImpactEtabli = "texte_publie" | "construit";

export interface Item {
  id: string;
  niveau: Niveau;
  /** Code INS/NIS, code région, ISO pays, ou "EU". */
  territoire: string;
  type: TypeItem;
  /** ≤ 90 caractères. */
  titre: string;
  /** Langue du `titre` et de l'`impact` lorsqu'il vient de la source. */
  langue: Langue;
  /** Ce qui change, pour qui, à partir de quand. */
  impact: string;
  impactEtabli: ImpactEtabli;
  action: Action;
  /** Vocabulaire fermé — voir `themes.ts`. */
  themes: string[];
  /** Vocabulaire fermé — voir `publics.ts`. */
  publics: string[];
  entreeEnVigueur?: string;
  echeance?: string;
  source: Source;
  /** Ids d'objectifs — voir `Objectif`. */
  objectifsLies: string[];
}

export interface Objectif {
  id: string;
  niveau: Niveau;
  territoire: string;
  intitule: string;
  cible: { valeur: number; unite: string; echeance: string };
  mesure?: { valeur: number; dateMesure: string; source: Source };
  /** Ids d'objectifs de niveau supérieur — la chaîne commune → Europe. */
  rattachements: string[];
  source: Source;
}

export interface Condition {
  libelle: string;
  source: Source;
}

export interface Droit {
  id: string;
  intitule: string;
  niveau: Niveau;
  territoire: string;
  conditions: Condition[];
  /** Toujours indicatif. Jamais un calcul ferme. */
  montantIndicatif?: string;
  automatique: boolean;
  demarche?: { libelle: string; url: string; delai?: string };
  source: Source;
}

/** Ce qu'un connecteur rend, et rien d'autre. */
export type Produit = Item | Objectif | Droit;

/**
 * Mode dégradé explicite : quand une source n'a pas répondu, on l'affiche
 * plutôt que de servir une valeur périmée sans le dire.
 */
export interface EtatSource {
  connecteurId: string;
  organisme: string;
  dernierSucces: string | null;
  derniereTentative: string;
  ok: boolean;
  message?: string;
  /** Nombre d'objets rejetés par la validation au dernier passage. */
  rejetes: number;
}

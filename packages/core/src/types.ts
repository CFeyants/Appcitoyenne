/**
 * Types du noyau — brief § 4, révisés au Lot 8.
 *
 * Trois changements de fond par rapport au Lot 1, chacun documenté ici plutôt
 * que glissé dans un diff.
 */

/** § 4 n'en listait que quatre ; le sélecteur de territoire en exige cinq. */
export type Niveau = "commune" | "province" | "region" | "pays" | "europe";

export interface Source {
  organisme: string;
  url: string;
  dateDonnee: string;
  licence: string;
  consulteLe: string;
}

/**
 * CHANGEMENT 1 — la provenance remplace `source`.
 *
 * La règle non négociable n° 1 dit qu'un objet sans source ne se rend pas. Le
 * Lot 8 demande pourtant d'afficher des objets fictifs. Plutôt que d'affaiblir
 * la règle avec un `demo: true` posé à côté d'une fausse source, on la rend
 * EXPLICITE : un objet a toujours une provenance, et celle-ci est soit une
 * source réelle, soit une démonstration assumée. Conséquences :
 *   · le schéma refuse toujours un objet sans provenance ;
 *   · oublier le badge devient impossible, puisqu'il découle du type ;
 *   · la part de réel se calcule sans champ supplémentaire.
 */
export type Provenance =
  | { kind: "source"; source: Source }
  | { kind: "demonstration"; explication: string; ecranIllustre: string };

export const estReel = (p: Provenance): p is { kind: "source"; source: Source } =>
  p.kind === "source";
export const sourceDe = (p: Provenance): Source | null =>
  p.kind === "source" ? p.source : null;

export type TypeItem =
  | "decision" | "regle" | "budget" | "consultation" | "droit" | "alerte" | "seance";

export type Action =
  | { kind: "aucune_action"; explication: string }
  | { kind: "a_qualifier"; explication: string }
  | { kind: "demarche"; libelle: string; url: string; delai?: string }
  | { kind: "consultation"; libelle: string; url: string; clotureLe: string }
  | { kind: "seance"; libelle: string; date: string; lieu: string; inscription?: string }
  | { kind: "demande"; destinataireId: string };

export type Langue = "nl" | "fr" | "de" | "en";

/**
 * CHANGEMENT 2 — le texte de l'acte n'est plus le contenu de la carte.
 *
 * Au Lot 1, `titre` et `impact` venaient directement du néerlandais
 * administratif. C'était la promesse centrale du produit non tenue : le
 * citoyen lisait un article de délibération, pas ce que ça changeait pour lui.
 *
 * Désormais deux blocs distincts et jamais confondus :
 *   · `officiel` — ce que l'autorité a publié, dans sa langue, replié ;
 *   · `redige`   — ce qu'un humain a écrit en français ordinaire, ou `null`.
 *
 * `redige` n'est JAMAIS rempli avec un extrait de l'acte. Quand il vaut `null`,
 * l'interface écrit « pas encore reformulé » — un aveu, pas un remplissage.
 */
export interface TexteOfficiel {
  titre: string;
  texte: string | null;
  langue: Langue;
}

export interface Reformulation {
  titre: string;   // ≤ 90 caractères, en français ordinaire
  impact: string;  // ce qui change, pour qui, à partir de quand
  redigeLe: string;
  /** Fonction ou rôle — jamais un nom de personne (règle n° 4). */
  par: string;
  /** Une aide à la rédaction produit un brouillon, jamais du publié. */
  brouillon: boolean;
}

export interface Item {
  id: string;
  niveau: Niveau;
  territoire: string;
  type: TypeItem;
  officiel: TexteOfficiel;
  redige: Reformulation | null;
  action: Action;
  themes: string[];
  publics: string[];
  entreeEnVigueur?: string;
  echeance?: string;
  provenance: Provenance;
  objectifsLies: string[];
  /** Date d'adoption en séance — distincte de la date de publication. */
  dateAdoption?: string;
}

/** Ce que la carte affiche en titre : le rédigé s'il existe, sinon l'officiel. */
export const titreAffiche = (i: Item): string => i.redige?.titre ?? i.officiel.titre;
export const estReformule = (i: Item): boolean => i.redige !== null && !i.redige.brouillon;

export interface Objectif {
  id: string;
  niveau: Niveau;
  territoire: string;
  intitule: string;
  cible: { valeur: number; unite: string; echeance: string };
  mesure?: { valeur: number; dateMesure: string; provenance: Provenance };
  /** La chaîne commune → province → région → pays → Europe. */
  rattachements: string[];
  provenance: Provenance;
}

export interface Condition { libelle: string; provenance: Provenance; }

export interface Droit {
  id: string;
  intitule: string;
  niveau: Niveau;
  territoire: string;
  conditions: Condition[];
  montantIndicatif?: string;
  automatique: boolean;
  demarche?: { libelle: string; url: string; delai?: string };
  provenance: Provenance;
}

/** Triple comptabilité, jamais fondue en un score (§ 8). */
export interface Projet {
  id: string;
  titre: string;
  niveau: Niveau;
  territoire: string;
  objectif: number;
  collecte: number;
  contributeurs: number;
  economique: string;
  social: string;
  environnemental: string;
  /** Rendement OBSERVÉ, jamais le plafond légal. */
  rendementObserve: string;
  avertissement: string;
  lienExterne?: string;
  provenance: Provenance;
}

/** Entraide : la demande d'abord, l'offre ensuite (§ 9). */
export interface Demande {
  id: string;
  mode: "demande" | "offre";
  categorie: string;
  titre: string;
  detail: string;
  quartier: string;
  territoire: string;
  /** Pseudonyme ou prénom : jamais une identité vérifiable sans nécessité. */
  auteur: string;
  provenance: Provenance;
}

export interface EtatSource {
  connecteurId: string;
  organisme: string;
  dernierSucces: string | null;
  derniereTentative: string;
  ok: boolean;
  message?: string;
  rejetes: number;
}

export type Produit = Item | Objectif | Droit | Projet | Demande;

/**
 * Algorithme de pertinence — brief § 5.
 *
 * Transparent, déterministe, explicable en une phrase à l'écran. Pas de modèle
 * appris, pas de signal comportemental : `scorer` ne reçoit qu'un item et un
 * profil DÉCLARÉ. Deux profils identiques produisent le même ordre, toujours.
 *
 * Le Lot 3 branchera l'interface de profil ; les poids et l'explication vivent
 * ici dès le Lot 1 pour qu'aucune autre logique de classement ne s'installe
 * ailleurs entre-temps.
 */

import type { Item, Niveau } from "./types.ts";
import { RANG_NIVEAU } from "./territoires.ts";
import { themeParId } from "./themes.ts";
import { publicParId } from "./publics.ts";

/** Les poids sont des données, pas des constantes cachées : ils sont exportés
 *  dans le JSON de chaque écran et affichés dans l'interface. */
export const POIDS = {
  theme: 3,
  public: 2,
  territoire: 2,
  action: 1.5,
  echeance: 2.5,
} as const;

export const VERSION_PERTINENCE = "1.0.0";

export interface Profil {
  themes: string[];
  publics: string[];
  /** Codes de territoires suivis, du plus proche au plus lointain. */
  territoires: string[];
  /** Interrupteur « tout voir » : désactive le filtre, jamais le tri. */
  toutVoir: boolean;
}

export const PROFIL_VIDE: Profil = { themes: [], publics: [], territoires: [], toutVoir: true };

const recouvrement = (a: string[], b: string[]) => {
  if (b.length === 0) return 0;
  const inter = a.filter((x) => b.includes(x)).length;
  return inter / Math.max(1, Math.min(a.length, b.length));
};

const proximite = (item: Item, profil: Profil) => {
  if (profil.territoires.includes(item.territoire)) return 1;
  // Un item d'un niveau plus large reste pertinent, mais moins.
  return 1 / (RANG_NIVEAU[item.niveau as Niveau] + 1);
};

/** Décroissance linéaire sur 30 jours : une échéance passée ne compte plus. */
const urgence = (echeance: string | undefined, maintenant: Date) => {
  if (!echeance) return 0;
  const jours = (Date.parse(echeance) - maintenant.getTime()) / 86_400_000;
  if (Number.isNaN(jours) || jours < 0) return 0;
  return Math.max(0, 1 - jours / 30);
};

export interface Raison {
  facteur: keyof typeof POIDS;
  /** Contribution au score, déjà pondérée. */
  apport: number;
  /** Phrase affichable, dans la langue de l'interface. */
  phrase: string;
}

export interface Classe {
  item: Item;
  score: number;
  raisons: Raison[];
}

/**
 * `maintenant` est un paramètre, jamais `Date.now()` en dur : sans cela, le
 * classement cesserait d'être reproductible et deux exécutions du même test
 * pourraient diverger.
 */
export function scorer(item: Item, profil: Profil, maintenant: Date, langue: "fr" | "nl" | "en" = "fr"): Classe {
  const nomTheme = (id: string) => themeParId(id)?.label[langue] ?? id;
  const nomPublic = (id: string) => publicParId(id)?.label[langue] ?? id;

  const raisons: Raison[] = [];
  const pousser = (facteur: keyof typeof POIDS, brut: number, phrase: string) => {
    if (brut <= 0) return;
    raisons.push({ facteur, apport: +(brut * POIDS[facteur]).toFixed(3), phrase });
  };

  const rTheme = recouvrement(item.themes, profil.themes);
  const communs = item.themes.filter((t) => profil.themes.includes(t));
  pousser("theme", rTheme, communs.length ? `vous avez déclaré ${communs.map(nomTheme).join(", ")}` : "");

  const rPublic = recouvrement(item.publics, profil.publics);
  const pubs = item.publics.filter((p) => profil.publics.includes(p));
  pousser("public", rPublic, pubs.length ? `cela concerne ${pubs.map(nomPublic).join(", ")}` : "");

  const rTerr = proximite(item, profil);
  pousser("territoire", rTerr,
    profil.territoires.includes(item.territoire)
      ? "la décision concerne votre commune"
      : `la décision est de niveau ${item.niveau}`);

  const rAction = item.action.kind !== "aucune_action" ? 1 : 0;
  pousser("action", rAction, "il y a quelque chose à faire");

  const rEch = urgence(item.echeance, maintenant);
  pousser("echeance", rEch, "l'échéance approche");

  const score = +raisons.reduce((s, r) => s + r.apport, 0).toFixed(3);
  return { item, score, raisons };
}

/**
 * Tri stable : à score égal, on départage par date de donnée décroissante puis
 * par id. Sans cette clause, l'ordre dépendrait de l'ordre d'arrivée — donc du
 * hasard — et la promesse « même profil, même écran » tomberait.
 */
export function classer(items: Item[], profil: Profil, maintenant: Date, langue: "fr" | "nl" | "en" = "fr"): Classe[] {
  const notes = items.map((i) => scorer(i, profil, maintenant, langue));
  const retenus = profil.toutVoir ? notes : notes.filter((n) => n.score > 0);
  return retenus.sort((a, b) =>
    b.score - a.score ||
    Date.parse(b.item.source.dateDonnee) - Date.parse(a.item.source.dateDonnee) ||
    a.item.id.localeCompare(b.item.id));
}

/** Ce que l'interface affiche sous « pourquoi je vois ceci ». */
export const expliquer = (c: Classe): string =>
  c.raisons.length === 0
    ? "Aucun critère déclaré ne correspond : cet item apparaît parce que le filtre est désactivé."
    : c.raisons.sort((a, b) => b.apport - a.apport).map((r) => r.phrase).filter(Boolean).join(" ; ");

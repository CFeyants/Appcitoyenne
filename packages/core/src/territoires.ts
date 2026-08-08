/**
 * Territoires — les cinq niveaux du sélecteur.
 *
 * Le niveau est un FILTRE, pas une rubrique : le même écran, la même grammaire,
 * quel que soit le cran. Les six communes à facilités restent le pilote ; les
 * niveaux supérieurs existent dans l'échelle même sans données, et l'écran le
 * dit plutôt que de disparaître du menu.
 *
 * Codes NIS et dénominations officielles vérifiés le 8 août 2026 contre
 * https://api.basisregisters.vlaanderen.be/v2/gemeenten/<nis>
 */

import type { Niveau } from "./types.ts";

export interface Territoire {
  code: string;
  niveau: Niveau;
  nom: { nl: string; fr: string; en: string };
  /** Nom attendu par le filtre Lokaal Beslist. Absent hors communes. */
  nomLokaalBeslist?: string;
  parent: string | null;
  facilites?: boolean;
}

export const CODE_PROVINCE = "BE-VBR";
export const CODE_REGION = "BE-VLG";
export const CODE_PAYS = "BE";
export const CODE_EUROPE = "EU";

export const TERRITOIRES: Territoire[] = [
  { code: "23098", niveau: "commune", nom: { nl: "Drogenbos", fr: "Drogenbos", en: "Drogenbos" },
    nomLokaalBeslist: "Drogenbos", parent: CODE_PROVINCE, facilites: true },
  { code: "23099", niveau: "commune", nom: { nl: "Kraainem", fr: "Kraainem", en: "Kraainem" },
    nomLokaalBeslist: "Kraainem", parent: CODE_PROVINCE, facilites: true },
  { code: "23100", niveau: "commune", nom: { nl: "Linkebeek", fr: "Linkebeek", en: "Linkebeek" },
    nomLokaalBeslist: "Linkebeek", parent: CODE_PROVINCE, facilites: true },
  { code: "23101", niveau: "commune", nom: { nl: "Sint-Genesius-Rode", fr: "Rhode-Saint-Genèse", en: "Sint-Genesius-Rode" },
    nomLokaalBeslist: "Sint-Genesius-Rode", parent: CODE_PROVINCE, facilites: true },
  { code: "23102", niveau: "commune", nom: { nl: "Wemmel", fr: "Wemmel", en: "Wemmel" },
    nomLokaalBeslist: "Wemmel", parent: CODE_PROVINCE, facilites: true },
  { code: "23103", niveau: "commune", nom: { nl: "Wezembeek-Oppem", fr: "Wezembeek-Oppem", en: "Wezembeek-Oppem" },
    nomLokaalBeslist: "Wezembeek-Oppem", parent: CODE_PROVINCE, facilites: true },

  { code: CODE_PROVINCE, niveau: "province", nom: { nl: "Vlaams-Brabant", fr: "Brabant flamand", en: "Flemish Brabant" }, parent: CODE_REGION },
  { code: CODE_REGION, niveau: "region", nom: { nl: "Vlaanderen", fr: "Flandre", en: "Flanders" }, parent: CODE_PAYS },
  { code: CODE_PAYS, niveau: "pays", nom: { nl: "België", fr: "Belgique", en: "Belgium" }, parent: CODE_EUROPE },
  { code: CODE_EUROPE, niveau: "europe", nom: { nl: "Europese Unie", fr: "Union européenne", en: "European Union" }, parent: null },
];

export const COMMUNES = TERRITOIRES.filter((t) => t.niveau === "commune");
export const TERRITOIRE_DEFAUT = "23099";

export const territoireParCode = (code: string): Territoire | undefined =>
  TERRITOIRES.find((t) => t.code === code);

export const nomTerritoire = (code: string, langue: "fr" | "nl" | "en"): string =>
  territoireParCode(code)?.nom[langue] ?? code;

/**
 * L'échelle affichée : du territoire choisi jusqu'à l'Union, en remontant la
 * chaîne des parents. Pour une commune, cinq crans ; pour la Flandre, trois.
 */
export function echelle(code: string): Territoire[] {
  const chaine: Territoire[] = [];
  let courant = territoireParCode(code);
  while (courant) {
    chaine.push(courant);
    courant = courant.parent ? territoireParCode(courant.parent) : undefined;
  }
  return chaine;
}

/** Un objet d'un territoire est visible depuis ce territoire et ses ascendants. */
export function couvre(territoireChoisi: string, territoireObjet: string): boolean {
  if (territoireChoisi === territoireObjet) return true;
  return echelle(territoireObjet).some((t) => t.code === territoireChoisi);
}

export const RANG_NIVEAU: Record<Niveau, number> = {
  commune: 1, province: 2, region: 3, pays: 4, europe: 5,
};

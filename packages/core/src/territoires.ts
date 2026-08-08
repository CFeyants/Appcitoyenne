/**
 * Territoires du pilote — les six communes à facilités de la périphérie
 * bruxelloise (Vlaams-Brabant).
 *
 * Codes NIS et dénominations officielles vérifiés le 8 août 2026 contre
 * https://api.basisregisters.vlaanderen.be/v2/gemeenten/<nis>
 * Les noms français ne sont pas des traductions de confort : ce sont les
 * dénominations officielles publiées par le registre. Là où le registre n'en
 * publie qu'une, `fr` et `nl` sont identiques — et c'est un fait, pas un oubli.
 */

import type { Niveau } from "./types.ts";

export interface Territoire {
  /** Code NIS/INS — l'identifiant qui fait foi en Belgique. */
  code: string;
  niveau: Niveau;
  nom: { nl: string; fr: string };
  /** Nom exact attendu par le filtre Lokaal Beslist (administrative-unit). */
  nomLokaalBeslist: string;
  /** Rattachement au niveau supérieur, pour la lecture à quatre niveaux. */
  parent: string;
  facilites: boolean;
}

export const REGION_VLAANDEREN = "BE-VLG";
export const PAYS_BE = "BE";
export const EUROPE = "EU";

export const TERRITOIRES: Territoire[] = [
  { code: "23098", niveau: "commune", nom: { nl: "Drogenbos", fr: "Drogenbos" },
    nomLokaalBeslist: "Drogenbos", parent: REGION_VLAANDEREN, facilites: true },
  { code: "23099", niveau: "commune", nom: { nl: "Kraainem", fr: "Kraainem" },
    nomLokaalBeslist: "Kraainem", parent: REGION_VLAANDEREN, facilites: true },
  { code: "23100", niveau: "commune", nom: { nl: "Linkebeek", fr: "Linkebeek" },
    nomLokaalBeslist: "Linkebeek", parent: REGION_VLAANDEREN, facilites: true },
  { code: "23101", niveau: "commune", nom: { nl: "Sint-Genesius-Rode", fr: "Rhode-Saint-Genèse" },
    nomLokaalBeslist: "Sint-Genesius-Rode", parent: REGION_VLAANDEREN, facilites: true },
  { code: "23102", niveau: "commune", nom: { nl: "Wemmel", fr: "Wemmel" },
    nomLokaalBeslist: "Wemmel", parent: REGION_VLAANDEREN, facilites: true },
  { code: "23103", niveau: "commune", nom: { nl: "Wezembeek-Oppem", fr: "Wezembeek-Oppem" },
    nomLokaalBeslist: "Wezembeek-Oppem", parent: REGION_VLAANDEREN, facilites: true },
];

export const territoireParCode = (code: string): Territoire | undefined =>
  TERRITOIRES.find((t) => t.code === code);

/**
 * Proximité territoriale, pour l'algorithme de pertinence (§ 5) : la commune
 * prime sur la région, qui prime sur le pays, qui prime sur l'Europe.
 */
export const RANG_NIVEAU: Record<Niveau, number> = {
  commune: 1, region: 2, pays: 3, europe: 4,
};

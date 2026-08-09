/**
 * Noms d'organes — B2 du Lot 9.
 *
 * La source les publie en néerlandais. Les afficher bruts dans une interface
 * française, pour une population majoritairement francophone, c'est reproduire
 * exactement l'obstacle que la plateforme prétend lever.
 *
 * Ce n'est PAS une traduction d'acte : un organe est une institution, et sa
 * dénomination française est officielle en Belgique. Le nom d'origine reste
 * affiché en second — c'est lui qui figure sur le document.
 */

export interface Organe {
  /** Forme canonique, sans le nom de commune. */
  cle: string;
  nom: { fr: string; nl: string; en: string };
  court: { fr: string; nl: string; en: string };
}

export const ORGANES: Organe[] = [
  {
    cle: "college",
    nom: {
      fr: "Collège des bourgmestre et échevins",
      nl: "College van Burgemeester en Schepenen",
      en: "College of Mayor and Aldermen",
    },
    court: { fr: "Collège", nl: "College", en: "College" },
  },
  {
    cle: "gemeenteraad",
    nom: { fr: "Conseil communal", nl: "Gemeenteraad", en: "Municipal council" },
    court: { fr: "Conseil communal", nl: "Gemeenteraad", en: "Council" },
  },
  {
    cle: "vast-bureau",
    nom: { fr: "Bureau permanent du CPAS", nl: "Vast Bureau", en: "Standing Committee" },
    court: { fr: "Bureau permanent", nl: "Vast Bureau", en: "Standing Cttee" },
  },
  {
    cle: "ocmw-raad",
    nom: {
      fr: "Conseil de l'action sociale",
      nl: "Raad voor Maatschappelijk Welzijn",
      en: "Social welfare council",
    },
    court: { fr: "CPAS", nl: "OCMW-raad", en: "Welfare council" },
  },
  {
    cle: "burgemeester",
    nom: { fr: "Bourgmestre", nl: "Burgemeester", en: "Mayor" },
    court: { fr: "Bourgmestre", nl: "Burgemeester", en: "Mayor" },
  },
];

const MOTIFS: [RegExp, string][] = [
  [/college van burgemeester/i, "college"],
  [/gemeenteraad/i, "gemeenteraad"],
  [/vast bureau/i, "vast-bureau"],
  [/(ocmw ?raad|raad voor maatschappelijk welzijn|ocmwraad)/i, "ocmw-raad"],
  [/^burgemeester/i, "burgemeester"],
];

export const organeParCle = (cle: string) => ORGANES.find((o) => o.cle === cle);

/** Reconnaît l'organe dans la dénomination brute de la source. */
export const cleOrgane = (brut: string): string | null =>
  MOTIFS.find(([re]) => re.test(brut))?.[1] ?? null;

/**
 * Nom affichable. À défaut de reconnaissance, on rend le nom d'origine tel
 * quel : une dénomination inconnue vaut mieux qu'une traduction inventée.
 */
export function nomOrgane(brut: string, langue: "fr" | "nl" | "en"): string {
  const cle = cleOrgane(brut);
  return cle ? organeParCle(cle)!.nom[langue] : brut;
}

export function nomOrganeCourt(brut: string, langue: "fr" | "nl" | "en"): string {
  const cle = cleOrgane(brut);
  return cle ? organeParCle(cle)!.court[langue] : brut;
}

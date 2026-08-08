/**
 * Vocabulaire de publics — FERMÉ et VERSIONNÉ, comme les thèmes (§ 5).
 *
 * Un « public » est une situation déclarée par l'utilisateur, jamais déduite de
 * son comportement (règle non négociable n° 2). C'est pourquoi la liste reste
 * courte et lisible : elle doit pouvoir être cochée en connaissance de cause.
 */

export const VERSION_PUBLICS = "1.0.0";

export interface PublicCible {
  id: string;
  label: { fr: string; nl: string; en: string };
}

export const PUBLICS: PublicCible[] = [
  { id: "parents", label: { fr: "Parents", nl: "Ouders", en: "Parents" } },
  { id: "jeunes", label: { fr: "Jeunes", nl: "Jongeren", en: "Young people" } },
  { id: "aines", label: { fr: "Aînés", nl: "Senioren", en: "Older people" } },
  { id: "locataires", label: { fr: "Locataires", nl: "Huurders", en: "Tenants" } },
  { id: "proprietaires", label: { fr: "Propriétaires", nl: "Eigenaars", en: "Owners" } },
  { id: "independants", label: { fr: "Indépendants", nl: "Zelfstandigen", en: "Self-employed" } },
  { id: "commercants", label: { fr: "Commerçants", nl: "Handelaars", en: "Shopkeepers" } },
  { id: "associations", label: { fr: "Associations", nl: "Verenigingen", en: "Associations" } },
  { id: "personnes-handicapees", label: { fr: "Personnes handicapées", nl: "Personen met een handicap", en: "Disabled people" } },
  { id: "demandeurs-emploi", label: { fr: "Demandeurs d'emploi", nl: "Werkzoekenden", en: "Jobseekers" } },
  { id: "usagers-velo", label: { fr: "Cyclistes & piétons", nl: "Fietsers & voetgangers", en: "Cyclists & pedestrians" } },
  { id: "automobilistes", label: { fr: "Automobilistes", nl: "Automobilisten", en: "Drivers" } },
  { id: "riverains", label: { fr: "Riverains d'un chantier", nl: "Omwonenden", en: "Nearby residents" } },
  { id: "francophones", label: { fr: "Francophones en commune à facilités", nl: "Franstaligen in faciliteitengemeente", en: "French speakers in a facilities municipality" } },
  { id: "tous", label: { fr: "Tout le monde", nl: "Iedereen", en: "Everyone" } },
];

export const IDS_PUBLICS = PUBLICS.map((p) => p.id);
export const estPublic = (id: string) => IDS_PUBLICS.includes(id);
export const publicParId = (id: string) => PUBLICS.find((p) => p.id === id);

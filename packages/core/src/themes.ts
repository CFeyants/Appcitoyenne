/**
 * Vocabulaire de thèmes — FERMÉ et VERSIONNÉ (brief § 5).
 *
 * Fermé : un connecteur ne peut pas inventer un thème ; le schéma le rejette.
 * Versionné : sans version, un filtre cesse d'être comparable entre territoires
 * et dans le temps, et toute mesure d'évolution devient une illusion.
 *
 * Ajouter un thème = incrémenter VERSION_THEMES et le noter dans le journal
 * ci-dessous. Ne jamais renommer un identifiant : les instantanés de /data y
 * font référence.
 */

export const VERSION_THEMES = "1.0.0";

export const JOURNAL_THEMES = [
  { version: "1.0.0", date: "2026-08-08", note: "Vocabulaire initial, calibré sur les délibérations communales flamandes." },
] as const;

export interface Theme {
  id: string;
  label: { fr: string; nl: string; en: string };
}

export const THEMES: Theme[] = [
  { id: "mobilite", label: { fr: "Mobilité", nl: "Mobiliteit", en: "Mobility" } },
  { id: "logement", label: { fr: "Logement", nl: "Wonen", en: "Housing" } },
  { id: "urbanisme", label: { fr: "Urbanisme & permis", nl: "Ruimtelijke ordening", en: "Planning & permits" } },
  { id: "environnement", label: { fr: "Environnement", nl: "Milieu", en: "Environment" } },
  { id: "energie", label: { fr: "Énergie", nl: "Energie", en: "Energy" } },
  { id: "eau", label: { fr: "Eau & assainissement", nl: "Water & riolering", en: "Water & sanitation" } },
  { id: "dechets", label: { fr: "Déchets & propreté", nl: "Afval & netheid", en: "Waste & cleanliness" } },
  { id: "education", label: { fr: "Enseignement", nl: "Onderwijs", en: "Education" } },
  { id: "enfance", label: { fr: "Enfance & accueil", nl: "Kinderopvang", en: "Childcare" } },
  { id: "jeunesse", label: { fr: "Jeunesse", nl: "Jeugd", en: "Youth" } },
  { id: "aines", label: { fr: "Aînés", nl: "Senioren", en: "Older people" } },
  { id: "sante", label: { fr: "Santé", nl: "Gezondheid", en: "Health" } },
  { id: "social", label: { fr: "Action sociale & CPAS", nl: "Welzijn & OCMW", en: "Social welfare" } },
  { id: "emploi", label: { fr: "Emploi", nl: "Werk", en: "Employment" } },
  { id: "economie", label: { fr: "Économie & commerce", nl: "Economie & handel", en: "Economy & trade" } },
  { id: "agriculture", label: { fr: "Agriculture & alimentation", nl: "Landbouw & voeding", en: "Farming & food" } },
  { id: "culture", label: { fr: "Culture", nl: "Cultuur", en: "Culture" } },
  { id: "sport", label: { fr: "Sport", nl: "Sport", en: "Sport" } },
  { id: "patrimoine", label: { fr: "Patrimoine", nl: "Erfgoed", en: "Heritage" } },
  { id: "securite", label: { fr: "Sécurité & police", nl: "Veiligheid & politie", en: "Safety & policing" } },
  { id: "finances", label: { fr: "Finances & fiscalité", nl: "Financiën & belastingen", en: "Finance & taxation" } },
  { id: "marches", label: { fr: "Marchés publics", nl: "Overheidsopdrachten", en: "Public procurement" } },
  { id: "personnel", label: { fr: "Personnel communal", nl: "Personeel", en: "Municipal staff" } },
  { id: "administration", label: { fr: "Administration & état civil", nl: "Bestuur & burgerzaken", en: "Administration & civil registry" } },
  { id: "participation", label: { fr: "Participation & consultation", nl: "Inspraak", en: "Participation" } },
  { id: "numerique", label: { fr: "Numérique", nl: "Digitalisering", en: "Digital" } },
  { id: "langues", label: { fr: "Facilités linguistiques", nl: "Taalfaciliteiten", en: "Language facilities" } },
  { id: "autre", label: { fr: "Autre", nl: "Andere", en: "Other" } },
];

export const IDS_THEMES = THEMES.map((t) => t.id);
export const estTheme = (id: string) => IDS_THEMES.includes(id);
export const themeParId = (id: string) => THEMES.find((t) => t.id === id);

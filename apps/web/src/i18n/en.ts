import type { fr } from "./fr.ts";

export const en: typeof fr = {
  langue: "en",
  site: "Citizen platform",
  baseline: "What public decisions change for you",

  nav: {
    decisions: "Decisions",
    aPropos: "How this works",
    passerAuContenu: "Skip to content",
    changerLangue: "Language",
  },

  decisions: {
    titre: "Decisions of the six language-facility municipalities",
    intro:
      "Deliberations actually adopted by municipal councils, executives and public welfare centres. Every decision carries its source, date and licence. Nothing is added and nothing is summarised automatically.",
    unite: "decisions",
    communesUnite: "municipalities",
    releveLe: "retrieved on",
    aucune: "No decision matches this filter.",
    filtrer: "Filter",
    filtreCommune: "Municipality",
    filtreTheme: "Theme",
    filtreOrgane: "Governing body",
    toutes: "All",
    tous: "All",
    recherche: "Search the titles",
    rechercheAide: "The search covers the text as published by the municipality, in Dutch.",
    voirSource: "View the act",
    exporter: "Download this data (JSON)",
    exportNote: "Reusable raw data. No account is required to obtain it.",
    page: "Page",
    precedent: "Previous",
    suivant: "Next",
  },

  item: {
    impact: "What the decision says",
    action: "What you need to do",
    source: "Source",
    consulteLe: "Retrieved on",
    licence: "Licence",
    publieLe: "Published on",
    langueSource: "Text published in Dutch by the municipality",
    impactConstruit:
      "The body of the deliberation is not published in machine-readable form. This statement is built from the source fields alone; the original text prevails.",
    impactPublie: "Text published by the authority.",
  },

  action: {
    aucune: "Nothing to do",
    demarche: "Procedure",
    consultation: "Open consultation",
    seance: "Public session",
    demande: "Request",
  },

  couverture: {
    titre: "What this page does not show",
    intro:
      "Municipalities do not all publish at the same level of detail. Below, municipality by municipality, what the source did not allow us to keep.",
    retenues: "Kept",
    sansDeliberation: "No published deliberation",
    sansIntitule: "No usable title",
    sansLien: "No link to the act",
    seancesLues: "Sessions read",
    rien: "No item set aside.",
  },

  apropos: {
    titre: "How this works",
    admissionTitre: "What gets in, and what does not",
    admissionTexte:
      "Content is published only if it answers yes to three questions: is there an act behind it? does it change something for someone? is there something to do, or nothing? This filter is a schema validation, not an editorial guideline: what fails is not displayed.",
    sourceTitre: "No information without a source",
    sourceTexte:
      "Every decision carries the issuing body, the date, the link to the act and the licence. An object without a source is not rendered.",
    profilTitre: "Your interests are declared, never inferred",
    profilTexte:
      "This platform does not observe you. No tracker is loaded, no behaviour is recorded, and two people who declared the same criteria see exactly the same thing in the same order. Relevance ranking arrives in the next stage; its formula and weights are already public below.",
    tempsTitre: "Built to give time back",
    tempsTexte:
      "No infinite scroll, no notifications, no badges, no score. Success is measured by what happens away from this page.",
    langueTitre: "On language",
    langueTexte:
      "The six pilot municipalities are Flemish and publish their acts in Dutch. The interface is available in French, Dutch and English, but the text of the decisions is rendered in its original language: translating an administrative act would strip it of legal force. For a largely French-speaking population, that gap is not a technical detail — it is the very problem this platform makes visible.",
    poidsTitre: "The ranking weights",
    licencesTitre: "Licences",
  },

  degrade: {
    titre: "Data not refreshed",
    texte: (date: string) => `The source did not respond on the last run. Data unchanged since ${date}.`,
  },

  pied: {
    licence: "Code under the EUPL-1.2 licence · raw data exportable on every screen",
    source: "Source of the decisions",
    maquette: "No fictional data on this screen.",
  },
};

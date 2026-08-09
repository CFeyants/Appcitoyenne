/**
 * Le test d'admission du § 3, exécuté à l'ingestion — étape A du Lot 9.
 *
 * Avant ce lot, la question 1 (« y a-t-il un acte ? ») était seule appliquée :
 * 3 017 items étaient publiés, dont une écrasante majorité d'actes de
 * fonctionnement interne — approbations de procès-verbaux, fixations d'ordre du
 * jour, nominations. Ils ont bien un acte derrière eux, mais ils échouent à la
 * question 2 : ils ne changent rien pour personne.
 *
 * Trois registres, et AUCUN item n'est supprimé de la base :
 *   · digest — passe les trois questions, apparaît dans les vues principales ;
 *   · permis — publié dans un registre dédié, hors flux principal ;
 *   · ecarte — sorti des vues, jamais de l'export ni du registre complet.
 *
 * NOTE DE MÉTHODE, apprise deux fois. Aucun motif ne porte de `\b` final : le
 * néerlandais suffixe et compose (vergunning → signalisatievergunning,
 * concessie → concessies). Une limite de mot finale fait silencieusement
 * échouer la règle sur la forme suffixée — c'est ce qui laissait passer les
 * autorisations de signalisation.
 */

export type Registre = "digest" | "permis" | "ecarte";

export interface Motif {
  id: string;
  libelle: { fr: string; nl: string; en: string };
  motif: RegExp;
}

export interface Admission {
  publie: boolean;
  registre: Registre;
  /** Identifiant du motif retenu — jamais une phrase libre. */
  motif: string;
}

/* ------------------------------------------------------------------ */
/* Ce qui n'entre pas : l'acte existe, mais il ne change rien pour     */
/* personne hors de l'administration elle-même.                        */
/* ------------------------------------------------------------------ */

export const MOTIFS_EXCLUSION: Motif[] = [
  {
    id: "proces-verbal",
    libelle: {
      fr: "Approbation d'un procès-verbal",
      nl: "Goedkeuring van notulen",
      en: "Approval of minutes",
    },
    motif: /\b(notulen|verslag van de (vorige|zitting)|goedkeuring verslag)/i,
  },
  {
    id: "ordre-du-jour",
    libelle: {
      fr: "Fixation d'un ordre du jour",
      nl: "Vaststelling van de dagorde",
      en: "Setting of an agenda",
    },
    motif: /\b(dagorde|vastlegging.{0,20}agenda|agendering van de zitting)/i,
  },
  {
    id: "personnel",
    libelle: {
      fr: "Acte de personnel individuel",
      nl: "Individuele personeelsbeslissing",
      en: "Individual staffing decision",
    },
    motif: /\b(aanstelling|aanwerving|ontslag|pensionering|loopbaanonderbreking|ouderschapsverlof|ziekteverlof|vervanging van|selectieproced|brevet van laureaat|vacantverklaring)/i,
  },
  {
    id: "fournitures-internes",
    libelle: {
      fr: "Marché de fournitures internes sous seuil",
      nl: "Interne leveringsopdracht onder de drempel",
      en: "Internal supply contract below threshold",
    },
    motif: /\b(bestelbon|betalingsbevel|bestelling van|aankoop van (kantoor|informatica|meubilair)|kantoorbenodigdheden)/i,
  },
  {
    id: "autorisation-individuelle",
    libelle: {
      fr: "Autorisation individuelle sans effet sur des tiers",
      nl: "Individuele vergunning zonder effect op derden",
      en: "Individual authorisation with no third-party effect",
    },
    // NB : les autorisations de signalisation et d'occupation du domaine public
    // n'y figurent PAS. Un chantier de trois mois devant chez soi a un effet
    // sur des tiers : c'est même l'information la plus utile au riverain.
    motif: /\b(IBP[ -]?vergunning|taxivergunning|begraving|begraafplaats|grafconcessie|concessie op|naamswijziging|nationaliteitsverklaring)/i,
  },
  {
    id: "procedure-interne",
    libelle: {
      fr: "Acte de pure procédure interne",
      nl: "Zuiver interne proceduredaad",
      en: "Purely internal procedural act",
    },
    motif: /\b(kennisname|aktename|briefwisseling|delegatie van|volmacht|bevoegdheidsverdeling|machtiging tot|kwartaalrapport|verslaggeving aan|algemene vergadering van)/i,
  },
];

/* ------------------------------------------------------------------ */
/* Ce qui entre en priorité : un habitant peut dire ce que ça change   */
/* pour lui.                                                            */
/* ------------------------------------------------------------------ */

/*
 * ORDRE : du plus SPÉCIFIQUE au plus générique.
 *
 * « Mobiliteit - Aanvullend reglement zone 30 » est à la fois un règlement et
 * une mesure de mobilité. Si le motif générique passe en premier, toute
 * réglementation de circulation ressort comme « règlement ou taxe » — exact,
 * mais moins informatif pour l'habitant et pour la page des écartés. Le domaine
 * l'emporte donc sur l'instrument juridique.
 */
export const MOTIFS_INCLUSION: Motif[] = [
  { id: "consultation", libelle: { fr: "Consultation ouverte", nl: "Openbaar onderzoek", en: "Open consultation" },
    motif: /\b(openbaar onderzoek|bevraging|inspraak|participatietraject)/i },
  { id: "travaux-voirie", libelle: { fr: "Travaux et voirie", nl: "Werken en wegenis", en: "Works and roads" },
    motif: /\b(wegenis|openbare werken|heraanleg|riolering|voetpad|fietspad|grondwerken|herinrichting|nutswerken)/i },
  { id: "mobilite", libelle: { fr: "Mobilité", nl: "Mobiliteit", en: "Mobility" },
    motif: /\b(mobiliteit|verkeer|parkeer|snelheid|zone 30|circulatie|signalisatie|openbaar vervoer|inname openbaar domein)/i },
  { id: "ecole-accueil", libelle: { fr: "École et accueil", nl: "School en opvang", en: "School and childcare" },
    motif: /\b(school|onderwijs|kinderopvang|academie|buitenschoolse)/i },
  { id: "securite", libelle: { fr: "Sécurité", nl: "Veiligheid", en: "Safety" },
    motif: /\b(politie|brandweer|noodplan|hulpverleningszone|veiligheid)/i },
  { id: "tarifs-aides", libelle: { fr: "Tarifs, aides et primes", nl: "Tarieven, steun en premies", en: "Tariffs, benefits and grants" },
    motif: /\b(tarief|premie|subsidie|toelage|steunmaatregel)/i },
  { id: "budget-comptes", libelle: { fr: "Budget et comptes", nl: "Budget en rekeningen", en: "Budget and accounts" },
    motif: /\b(budget|meerjarenplan|jaarrekening|kredietverschuiving|budgetwijziging)/i },
  { id: "reglement-taxe", libelle: { fr: "Règlement ou taxe", nl: "Reglement of belasting", en: "Regulation or tax" },
    motif: /\b(reglement|verordening|belasting|retributie|politiereglement|huishoudelijk reglement)/i },
];

/**
 * Les permis d'urbanisme. Leur registre est séparé parce que la source ne
 * permet PAS de trancher : les intitulés sont des codes (« OMV 37/26 -
 * OMV_2026079510 »), aucun ne mentionne d'enquête publique, et rien ne
 * distingue une lucarne d'un lotissement de quarante logements. Les écarter
 * serait arbitraire, les mêler au flux principal le noierait.
 */
export const MOTIF_PERMIS: Motif = {
  id: "permis",
  libelle: {
    fr: "Permis d'urbanisme — effet sur des tiers non établi par la source",
    nl: "Omgevingsvergunning — effect op derden niet vast te stellen uit de bron",
    en: "Planning permit — third-party effect not established by the source",
  },
  motif: /\b(omgevingsvergunning|OMV[ \/_]|verkavelingsvergunning|stedenbouwkundige vergunning)/i,
};

/**
 * Les objets de démonstration ne passent pas le test : ils l'illustrent. Leur
 * motif est explicite pour qu'aucun d'eux ne se glisse dans un décompte
 * d'actes réels.
 */
export const MOTIF_DEMONSTRATION: Motif = {
  id: "demonstration",
  libelle: {
    fr: "Objet de démonstration — n'est pas un acte",
    nl: "Demonstratieobject — geen akte",
    en: "Demonstration object — not an act",
  },
  motif: /(?:)/,
};

export const MOTIF_HORS_PERIMETRE: Motif = {
  id: "hors-perimetre",
  libelle: {
    fr: "Aucun motif d'inclusion prioritaire",
    nl: "Geen prioritair opnamemotief",
    en: "No priority inclusion ground",
  },
  motif: /(?:)/,
};

export const TOUS_MOTIFS: Motif[] = [
  ...MOTIFS_EXCLUSION, ...MOTIFS_INCLUSION, MOTIF_PERMIS, MOTIF_HORS_PERIMETRE, MOTIF_DEMONSTRATION,
];
export const motifParId = (id: string) => TOUS_MOTIFS.find((m) => m.id === id);

/**
 * L'ordre compte :
 *   1. les permis d'abord — ils ont leur registre, quoi qu'ils contiennent ;
 *   2. l'exclusion ensuite — un procès-verbal reste un procès-verbal même s'il
 *      mentionne le mot « budget » ;
 *   3. l'inclusion enfin ;
 *   4. à défaut, hors périmètre.
 */
export function evaluer(titre: string, texte: string | null): Admission {
  const t = `${titre} ${texte ?? ""}`;

  if (MOTIF_PERMIS.motif.test(t)) {
    return { publie: true, registre: "permis", motif: MOTIF_PERMIS.id };
  }
  const exclu = MOTIFS_EXCLUSION.find((m) => m.motif.test(t));
  if (exclu) return { publie: false, registre: "ecarte", motif: exclu.id };

  const inclus = MOTIFS_INCLUSION.find((m) => m.motif.test(t));
  if (inclus) return { publie: true, registre: "digest", motif: inclus.id };

  return { publie: false, registre: "ecarte", motif: MOTIF_HORS_PERIMETRE.id };
}

/* ------------------------------------------------------------------ */
/* Datation — A2                                                       */
/* ------------------------------------------------------------------ */

/**
 * Ce que la source fournit réellement, établi par appel le 8 août 2026 :
 *   · `started-at`       — date de la SÉANCE. Fiable.
 *   · `publication-date` — n'est PAS la date de publication au sens de
 *                          l'art. 287. Elle précède fréquemment la séance de
 *                          4 à 7 jours : c'est vraisemblablement la date de
 *                          publication de la CONVOCATION.
 *
 * 321 items sur 3 017 (11 %) présentent une publication antérieure à
 * l'adoption. Plutôt que d'afficher un délai négatif ou de prendre la valeur
 * absolue, on refuse de calculer et on le dit.
 */
export type Datation =
  | { etat: "coherente"; adoption: string; publication: string; delaiJours: number }
  | { etat: "incoherente"; adoption: string; publication: string }
  | { etat: "incomplete"; adoption: string | null; publication: string | null };

const jour = (s: string | null | undefined): string | null =>
  s && !Number.isNaN(Date.parse(s)) ? s.slice(0, 10) : null;

export function dater(adoptionBrute: string | null | undefined, publicationBrute: string | null | undefined): Datation {
  const adoption = jour(adoptionBrute);
  const publication = jour(publicationBrute);
  if (!adoption || !publication) return { etat: "incomplete", adoption, publication };
  if (publication < adoption) return { etat: "incoherente", adoption, publication };
  const delaiJours = Math.round((Date.parse(publication) - Date.parse(adoption)) / 86_400_000);
  return { etat: "coherente", adoption, publication, delaiJours };
}

/** Le délai de l'art. 287, ou `null`. Jamais un nombre faux. */
export const delaiPublication = (d: Datation): number | null =>
  d.etat === "coherente" ? d.delaiJours : null;

/* ------------------------------------------------------------------ */
/* Statut — A1                                                         */
/* ------------------------------------------------------------------ */

/**
 * Un point inscrit à l'ordre du jour d'une séance à VENIR n'est pas une
 * décision adoptée. Le connecteur ingérait les deux sans les distinguer, et
 * l'interface affichait « Adoptée le 11 août 2026 » — une date future.
 */
export type StatutActe = "a_venir" | "adoptee";

export const statutDe = (dateSeance: string | null, maintenant: Date): StatutActe =>
  dateSeance && dateSeance.slice(0, 10) > maintenant.toISOString().slice(0, 10) ? "a_venir" : "adoptee";

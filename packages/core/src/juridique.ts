/**
 * Ancrage institutionnel — Decreet over het lokaal bestuur du 22 décembre 2017.
 *
 * Chaque article cité porte sa source. Le texte consolidé est publié sur Justel
 * (vérifié le 8 août 2026, HTTP 200). Ces articles sont des CONTRAINTES : le
 * code les applique, l'interface les cite, et aucun écran ne les paraphrase
 * sans lien vers le texte.
 *
 * Interdiction structurante du lot : la plateforme n'est JAMAIS le support de
 * publication officielle. L'art. 285-286 confie la publication à la
 * webtoepassing de la commune. Nous republions, indexons et mesurons — un
 * affichage ici ne produit aucun effet de droit.
 */

export const URL_DECRET =
  "https://www.ejustice.just.fgov.be/eli/decreet/2017/12/22/2018030427/justel";

export const SOURCE_DECRET = {
  organisme: "Vlaamse overheid — Decreet over het lokaal bestuur (22 décembre 2017)",
  url: URL_DECRET,
  dateDonnee: "2017-12-22",
  licence: "Texte légal — reproduction libre",
  consulteLe: "2026-08-08",
} as const;

export interface ArticleDecret {
  id: string;
  intitule: { fr: string; nl: string; en: string };
  /** Ce que l'article impose, en une phrase vérifiable. */
  obligation: { fr: string; nl: string; en: string };
  /** Délai en jours quand l'article en fixe un. */
  jours: number | null;
  url: string;
}

export const ARTICLES: ArticleDecret[] = [
  {
    id: "art. 285-286",
    intitule: {
      fr: "Publication par la commune", nl: "Bekendmaking door de gemeente",
      en: "Publication by the municipality",
    },
    obligation: {
      fr: "La commune publie via sa propre application web la liste des décisions et le contenu intégral des règlements.",
      nl: "De gemeente maakt via haar eigen webtoepassing de lijst van de besluiten en de integrale tekst van de reglementen bekend.",
      en: "The municipality publishes the list of decisions and the full text of regulations through its own web application.",
    },
    jours: null, url: URL_DECRET,
  },
  {
    id: "art. 287",
    intitule: { fr: "Délai de publication", nl: "Bekendmakingstermijn", en: "Publication deadline" },
    obligation: {
      fr: "La publication intervient dans les dix jours de l'adoption, avec mention de la date de publication et de la voie de plainte.",
      nl: "De bekendmaking gebeurt binnen tien dagen na de vaststelling, met vermelding van de datum van bekendmaking en de klachtenmogelijkheid.",
      en: "Publication must occur within ten days of adoption, stating the publication date and the complaint procedure.",
    },
    jours: 10, url: URL_DECRET,
  },
  {
    id: "art. 288",
    intitule: { fr: "Entrée en vigueur", nl: "Inwerkingtreding", en: "Entry into force" },
    obligation: {
      fr: "Les règlements entrent en vigueur le cinquième jour après leur publication ; la publication et sa date doivent ressortir d'un registre.",
      nl: "De reglementen treden in werking op de vijfde dag na de bekendmaking; de bekendmaking en de datum ervan moeten blijken uit een register.",
      en: "Regulations take effect on the fifth day after publication; publication and its date must appear in a register.",
    },
    jours: 5, url: URL_DECRET,
  },
  {
    id: "art. 302",
    intitule: { fr: "Traitement des plaintes", nl: "Klachtenbehandeling", en: "Complaints handling" },
    obligation: {
      fr: "Le conseil organise par règlement un système de traitement des plaintes.",
      nl: "De raad organiseert bij reglement een systeem van klachtenbehandeling.",
      en: "The council must establish a complaints-handling system by regulation.",
    },
    jours: null, url: URL_DECRET,
  },
  {
    id: "art. 303 §3",
    intitule: { fr: "Rapport annuel des plaintes", nl: "Jaarlijks klachtenrapport", en: "Annual complaints report" },
    obligation: {
      fr: "Le directeur général fait annuellement rapport au conseil sur les plaintes reçues et leur traitement.",
      nl: "De algemeen directeur rapporteert jaarlijks aan de raad over de ontvangen klachten en de behandeling ervan.",
      en: "The general director reports annually to the council on complaints received and how they were handled.",
    },
    jours: null, url: URL_DECRET,
  },
  {
    id: "art. 304 §1",
    intitule: { fr: "Droit de proposition des habitants", nl: "Voorstelrecht van de inwoners", en: "Residents' right of proposal" },
    obligation: {
      fr: "Les habitants ont le droit de porter des propositions et des questions à l'ordre du jour du conseil.",
      nl: "De inwoners hebben het recht voorstellen en vragen op de agenda van de raad te laten plaatsen.",
      en: "Residents have the right to place proposals and questions on the council's agenda.",
    },
    jours: null, url: URL_DECRET,
  },
  {
    id: "art. 304 §3",
    intitule: { fr: "Composition des organes consultatifs", nl: "Samenstelling adviesraden", en: "Composition of advisory bodies" },
    obligation: {
      fr: "Deux tiers au maximum des membres d'un organe consultatif sont du même sexe.",
      nl: "Ten hoogste twee derde van de leden van een adviesraad is van hetzelfde geslacht.",
      en: "At most two-thirds of an advisory body's members may be of the same sex.",
    },
    jours: null, url: URL_DECRET,
  },
  {
    id: "art. 304 §5",
    intitule: { fr: "Règlement de participation obligatoire", nl: "Verplicht participatiereglement", en: "Mandatory participation regulation" },
    obligation: {
      fr: "Le conseil communal DOIT adopter un règlement organisant ce droit. Le décret ne fixe ni seuil, ni âge, ni délai : tout vient du règlement communal.",
      nl: "De gemeenteraad MOET een reglement vaststellen dat dat recht organiseert. Het decreet legt geen drempel, leeftijd of termijn op: alles komt uit het gemeentelijk reglement.",
      en: "The municipal council MUST adopt a regulation organising this right. The decree sets no threshold, age or deadline: everything comes from the local regulation.",
    },
    jours: null, url: URL_DECRET,
  },
  {
    id: "art. 304 §6",
    intitule: { fr: "Budgets confiés aux initiatives citoyennes", nl: "Budgetten voor burgerinitiatieven", en: "Budgets entrusted to citizen initiatives" },
    obligation: {
      fr: "Le collège peut confier la gestion de budgets à des comités de quartier et initiatives citoyennes, aux conditions fixées par le conseil.",
      nl: "Het college kan het beheer van budgetten toevertrouwen aan wijkcomités en burgerinitiatieven, onder de voorwaarden bepaald door de raad.",
      en: "The executive may entrust budget management to neighbourhood committees and citizen initiatives, under conditions set by the council.",
    },
    jours: null, url: URL_DECRET,
  },
  {
    id: "art. 271",
    intitule: { fr: "Exécution par un agent communal", nl: "Uitvoering door een gemeentelijk personeelslid", en: "Execution by a municipal officer" },
    obligation: {
      fr: "L'exécution pratique d'un budget confié reste assurée par un agent communal ; la délégation tombe six mois après le renouvellement du conseil.",
      nl: "De praktische uitvoering blijft verzekerd door een gemeentelijk personeelslid; de delegatie vervalt zes maanden na de vernieuwing van de raad.",
      en: "Practical execution remains the responsibility of a municipal officer; delegation lapses six months after the council is renewed.",
    },
    jours: null, url: URL_DECRET,
  },
  {
    id: "art. 332",
    intitule: { fr: "Plainte à la tutelle", nl: "Klacht bij de toezichthoudende overheid", en: "Complaint to the supervisory authority" },
    obligation: {
      fr: "Une plainte à l'autorité de tutelle n'est recevable que dans les trente jours suivant la publication.",
      nl: "Een klacht bij de toezichthoudende overheid is slechts ontvankelijk binnen dertig dagen na de bekendmaking.",
      en: "A complaint to the supervisory authority is admissible only within thirty days of publication.",
    },
    jours: 30, url: URL_DECRET,
  },
];

export const articleParId = (id: string) => ARTICLES.find((a) => a.id === id);

/**
 * Un délai affiché porte TOUJOURS son fondement. Interdiction n° 2 du lot :
 * aucune promesse de réponse qui ne repose sur un texte ou une convention.
 * L'absence de délai est une information, pas un champ vide.
 */
export type Delai =
  | { fondement: "legal"; jours: number; article: string; url: string }
  | { fondement: "conventionnel"; jours: number; convention: string; signeeLe: string; url?: string }
  | { fondement: "aucun"; explication: string };

export const delaiLegal = (articleId: string): Delai => {
  const a = articleParId(articleId);
  if (!a || a.jours === null) {
    throw new Error(`L'article « ${articleId} » ne fixe aucun délai — utiliser { fondement: "aucun" }.`);
  }
  return { fondement: "legal", jours: a.jours, article: a.id, url: a.url };
};

export const AUCUN_DELAI: Delai = {
  fondement: "aucun",
  explication:
    "Aucun texte ni convention ne fixe de délai de réponse. Nous ne pouvons donc en promettre aucun.",
};

/**
 * Date de caducité d'une délégation de budget (art. 271) : six mois après le
 * renouvellement du conseil. Les conseils communaux flamands sont renouvelés au
 * 1er janvier suivant les élections d'octobre.
 */
export const CADUCITE_DELEGATIONS = "2031-07-01";
export const PROCHAIN_RENOUVELLEMENT = "2031-01-01";

/**
 * Les quatre états du registre de conformité. « manquant » et « non_verifie »
 * ne se confondent jamais : le premier est un constat qui exige une source, le
 * second est l'aveu qu'on n'a pas regardé.
 */
export type EtatConformite = "conforme" | "manquant" | "non_verifie" | "non_mesurable";

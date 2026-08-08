import type { fr } from "./fr.ts";

export const nl: typeof fr = {
  langue: "nl",
  site: "Burgerplatform",
  baseline: "Wat het overheidsbesluit voor u verandert",

  nav: {
    decisions: "Besluiten",
    aPropos: "Hoe dit werkt",
    passerAuContenu: "Naar de inhoud",
    changerLangue: "Taal",
  },

  decisions: {
    titre: "Besluiten van de zes faciliteitengemeenten",
    intro:
      "De besluiten die werkelijk zijn genomen door gemeenteraden, colleges en OCMW's. Elk besluit draagt zijn bron, datum en licentie. Er wordt niets toegevoegd en niets automatisch samengevat.",
    unite: "besluiten",
    communesUnite: "gemeenten",
    releveLe: "opgehaald op",
    aucune: "Geen enkel besluit voldoet aan deze filter.",
    filtrer: "Filteren",
    filtreCommune: "Gemeente",
    filtreTheme: "Thema",
    filtreOrgane: "Bestuursorgaan",
    toutes: "Alle",
    tous: "Alle",
    recherche: "Zoeken in de titels",
    rechercheAide: "De zoekopdracht doorzoekt de tekst zoals de gemeente die publiceert, in het Nederlands.",
    voirSource: "Besluit bekijken",
    exporter: "Deze gegevens downloaden (JSON)",
    exportNote: "Herbruikbare ruwe gegevens. U hebt geen account nodig om ze te krijgen.",
    page: "Pagina",
    precedent: "Vorige",
    suivant: "Volgende",
  },

  item: {
    impact: "Wat het besluit zegt",
    action: "Wat u moet doen",
    source: "Bron",
    consulteLe: "Opgehaald op",
    licence: "Licentie",
    publieLe: "Gepubliceerd op",
    langueSource: "Tekst door de gemeente in het Nederlands gepubliceerd",
    impactConstruit:
      "De tekst van het besluit is niet in bruikbare vorm gepubliceerd. Deze formulering is opgebouwd uit de velden van de bron alleen; de brontekst is bindend.",
    impactPublie: "Tekst gepubliceerd door het bestuur.",
  },

  action: {
    aucune: "Niets te doen",
    demarche: "Aanvraag",
    consultation: "Openbaar onderzoek",
    seance: "Openbare zitting",
    demande: "Verzoek",
  },

  couverture: {
    titre: "Wat deze pagina niet toont",
    intro:
      "Niet elke gemeente publiceert even gedetailleerd. Hieronder, gemeente per gemeente, wat de bron niet toeliet op te nemen.",
    retenues: "Opgenomen",
    sansDeliberation: "Zonder gepubliceerd besluit",
    sansIntitule: "Zonder bruikbare titel",
    sansLien: "Zonder link naar het besluit",
    seancesLues: "Gelezen zittingen",
    rien: "Geen enkel punt weggelaten.",
  },

  apropos: {
    titre: "Hoe dit werkt",
    admissionTitre: "Wat wel en niet wordt opgenomen",
    admissionTexte:
      "Inhoud wordt alleen gepubliceerd als drie vragen met ja worden beantwoord: ligt er een besluit aan ten grondslag? verandert het iets voor iemand? valt er iets te doen, of niets? Deze filter is een schemavalidatie, geen redactionele richtlijn: wat zakt, wordt niet getoond.",
    sourceTitre: "Geen informatie zonder bron",
    sourceTexte:
      "Elk besluit draagt het uitvaardigende bestuur, de datum, de link naar het besluit en de licentie. Een object zonder bron wordt niet weergegeven.",
    profilTitre: "Uw interesses worden verklaard, nooit afgeleid",
    profilTexte:
      "Dit platform observeert u niet. Er worden geen trackers geladen, geen gedrag geregistreerd, en twee personen met dezelfde verklaarde criteria zien exact hetzelfde in dezelfde volgorde. De relevantierangschikking komt in de volgende fase; de formule en gewichten staan hieronder al publiek.",
    tempsTitre: "Gemaakt om tijd terug te geven",
    tempsTexte:
      "Geen oneindig scrollen, geen meldingen, geen badges, geen score. Het succes wordt gemeten aan wat er buiten deze pagina gebeurt.",
    langueTitre: "Over de taal",
    langueTexte:
      "De zes gemeenten van dit pilootproject zijn Vlaams en publiceren hun besluiten in het Nederlands. De interface is beschikbaar in het Frans, Nederlands en Engels, maar de tekst van de besluiten wordt in de oorspronkelijke taal weergegeven: een bestuurshandeling vertalen zou haar rechtskracht ontnemen. Voor een overwegend Franstalige bevolking is dat verschil geen technisch detail — het is precies het probleem dat dit platform zichtbaar maakt.",
    poidsTitre: "De gewichten van de rangschikking",
    licencesTitre: "Licenties",
  },

  degrade: {
    titre: "Gegevens niet vernieuwd",
    texte: (date: string) => `De bron antwoordde niet bij de laatste poging. Gegevens ongewijzigd sinds ${date}.`,
  },

  pied: {
    licence: "Code onder EUPL-1.2-licentie · ruwe gegevens exporteerbaar op elk scherm",
    source: "Bron van de besluiten",
    maquette: "Geen fictieve gegevens op dit scherm.",
  },
};

/**
 * Rattachement d'une délibération aux vocabulaires fermés (thèmes, publics).
 *
 * CE QUE CECI EST : une aide à la navigation, dérivée de mots-clés
 * néerlandais présents dans l'intitulé publié.
 * CE QUE CECI N'EST PAS : une affirmation sur le contenu de l'acte. En cas de
 * doute, on retombe sur « autre » et « tout le monde » plutôt que de deviner —
 * un mauvais rangement est réparable, une affirmation fausse ne l'est pas.
 *
 * Le rattachement est recalculé à chaque ingestion : corriger la table ici
 * corrige tout l'historique, sans retoucher les instantanés.
 */

type Regle = { theme: string; mots: RegExp };

// Ordre significatif : la première règle qui matche donne le thème principal,
// mais toutes les règles qui matchent sont conservées.
/*
 * Note de méthode : les motifs ne portent PAS de limite de mot finale. Le
 * néerlandais forme ses pluriels en -en/-s (subsidie → subsidies, bevoegdheid →
 * bevoegdheden) et compose librement (wegeniswerken). Un `\b` final ferait
 * silencieusement échouer une règle sur un mot au pluriel — c'est ce qui
 * classait 47 % du corpus en « autre ».
 */
const REGLES: Regle[] = [
  { theme: "marches", mots: /\b(gunning|opdracht|bestek|offerte|aanbesteding|raamovereenkomst|lastvoorwaarde|prijsvraag)/i },
  { theme: "personnel", mots: /\b(aanstelling|aanwerving|personeel|vacature|ontslag|pensioen|arbeidsreglement|statutair|contractueel|brevet van laureaat|selectieprocedure)/i },
  { theme: "finances", mots: /\b(budget|meerjarenplan|rekening|belasting|retributie|krediet|subsidie|toelage|jaarrekening|kohier|betalingsbevel|kwartaalrapport|aandel|dividend|factu(ur|ren))/i },
  // OMV/2026/068 est la référence d'un dossier de permis d'environnement : c'est
  // le marqueur le plus fréquent du corpus, et il ne contient aucun mot.
  { theme: "urbanisme", mots: /(\bOMV[\/ -]?\d|\b(omgevingsvergunning|stedenbouw|verkaveling|ruimtelijk|bouwaanvraag|rooilijn|bestemmingsplan|dakkapel|sloop|bouwmisdrijf|vergunningsbetwisting|splitsing|hoogspanning)\b)/i },
  // « Openbare werken » et « grondwerken » désignent les chantiers de voirie :
  // c'est de la mobilité vécue, pas de l'administration.
  { theme: "mobilite", mots: /\b(mobiliteit|verkeer|parkeren|parkeer|fiets|wegenis|signalisatie|snelheid|zone 30|openbaar vervoer|voetpad|openbare werken|grondwerken|straatnaam|IBP[ -]?vergunning|taxi|inname openbaar domein)/i },
  { theme: "environnement", mots: /\b(milieu|natuur|groen|bomen|boom(kap|gaard)|klimaat|biodiversiteit|geluid|luchtkwaliteit|pesticide|hinder)/i },
  { theme: "energie", mots: /\b(energie|zonnepane|fotovolta|warmte|isolatie|elektriciteit|fluvius|sibelgas|renovatie)/i },
  { theme: "eau", mots: /\b(riolering|water|afvalwater|waterloop|beek|zuivering|hemelwater|overstroming)/i },
  { theme: "dechets", mots: /\b(afval|recyclage|containerpark|huisvuil|sluikstort|netheid|zwerfvuil)/i },
  { theme: "education", mots: /\b(school|onderwijs|leerling|gbs\b|academie|kleuter|turnzaal)/i },
  { theme: "enfance", mots: /\b(kinderopvang|buitenschools|ibo\b|crèche|kinderdagverblijf|kinderhoogdag)/i },
  { theme: "jeunesse", mots: /\b(jeugd|jongeren|speelplein)/i },
  { theme: "aines", mots: /\b(senioren|ouderen|woonzorg|dienstencentrum)/i },
  { theme: "sante", mots: /\b(gezondheid|zorg|medisch|huisarts|vaccinatie|apothe)/i },
  { theme: "social", mots: /\b(ocmw|welzijn|leefloon|maatschappelijk|armoede|sociale dienst|vast bureau)/i },
  { theme: "emploi", mots: /\b(tewerkstelling|werk(zoekend|loos)|vdab|arbeidsmarkt)/i },
  { theme: "economie", mots: /\b(handel|middenstand|markt|horeca|ondernem|winkel|kermis|lokale economie|evenement)/i },
  { theme: "agriculture", mots: /\b(landbouw|voeding|hoeve|korte keten|moestuin)/i },
  { theme: "culture", mots: /\b(cultuur|bibliothe|tentoonstelling|concert|gemeenschapscentrum|evenementaanvraag|feest|garden party)/i },
  { theme: "sport", mots: /\b(sport|zwembad|voetbal|tennis|pilates|turnz)/i },
  { theme: "patrimoine", mots: /\b(erfgoed|monument|kerkfabriek|kerk\b|beschermd|kasteel|orgel|begraafplaats|begraving|begraafnis)/i },
  { theme: "securite", mots: /\b(politie|brandweer|veiligheid|noodplan|gas-boete|hulpverleningszone|openbare orde)/i },
  { theme: "logement", mots: /\b(woning|huisvesting|leegstand|woonbeleid|verhuur|huur\b|recht van voorkoop)/i },
  { theme: "participation", mots: /\b(inspraak|openbaar onderzoek|adviesraad|participatie|bevraging|burgerbudget)/i },
  { theme: "numerique", mots: /\b(digitaal|informatica|software|website|ict\b|e-loket)/i },
  { theme: "langues", mots: /\b(taalwetgeving|faciliteiten|taalgebruik|franstalig|nederlandstalig)/i },
  { theme: "administration", mots: /\b(burgerzaken|bevolking|reglement|notulen|verslag|delegatie|bevoegdhe|volmacht|mandaat|briefwisseling|zitting|kennisname|aktename|algemene vergadering|statuten|intercommunale|fusie)/i },
];

const PUBLICS_REGLES: { id: string; mots: RegExp }[] = [
  { id: "parents", mots: /\b(school|kinderopvang|leerling|kleuter|opvang|schoolmaaltijd)\b/i },
  { id: "jeunes", mots: /\b(jeugd|jongeren|speelplein|student)\b/i },
  { id: "aines", mots: /\b(senioren|ouderen|woonzorg|pensioen)\b/i },
  { id: "commercants", mots: /\b(handel|horeca|markt|middenstand|winkel)\b/i },
  { id: "associations", mots: /\b(vereniging|vzw\b|subsidie|toelage|adviesraad)\b/i },
  { id: "usagers-velo", mots: /\b(fiets|voetpad|voetganger|trage weg)\b/i },
  { id: "automobilistes", mots: /\b(parkeren|verkeer|wegenis|snelheid|signalisatie)\b/i },
  { id: "riverains", mots: /\b(werken|wegenis|omgevingsvergunning|verkaveling|hinder)\b/i },
  { id: "proprietaires", mots: /\b(omgevingsvergunning|belasting|leegstand|verkaveling)\b/i },
  { id: "demandeurs-emploi", mots: /\b(tewerkstelling|vdab|werkzoekend)\b/i },
  { id: "francophones", mots: /\b(taal|faciliteiten|franstalig)\b/i },
];

/** Thèmes rattachés, dans l'ordre de la table. Jamais vide : « autre » ferme la liste. */
export function themesDe(texte: string): string[] {
  const t = REGLES.filter((r) => r.mots.test(texte)).map((r) => r.theme);
  return t.length ? [...new Set(t)].slice(0, 4) : ["autre"];
}

/** Publics concernés. Par défaut « tout le monde » — l'aveu d'ignorance le plus honnête. */
export function publicsDe(texte: string): string[] {
  const p = PUBLICS_REGLES.filter((r) => r.mots.test(texte)).map((r) => r.id);
  return p.length ? [...new Set(p)].slice(0, 4) : ["tous"];
}

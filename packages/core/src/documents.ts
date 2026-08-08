/**
 * Génération des documents de dépôt — § 7.2.
 *
 * Ce sont des fonctions pures : elles produisent un texte, rien d'autre. La
 * plateforme n'envoie rien, n'accuse réception de rien et ne promet aucun
 * traitement. C'est l'habitant qui dépose, par le canal officiel.
 *
 * Deux documents seulement :
 *   · le dépôt d'une proposition, quand un règlement communal existe ;
 *   · la demande d'adoption du règlement, quand il n'existe pas — car sans lui,
 *     le droit de l'art. 304 §1 reste théorique.
 */

import { articleParId, URL_DECRET } from "./juridique.ts";
import type { CadreJuridique, Proposition } from "./participation.ts";

export interface Document {
  objet: string;
  corps: string;
  /** Destinataire proposé, jamais imposé (§ 7 : le routage est suggéré). */
  destinataire: string;
  /** Rappel du fondement, affiché avec le document. */
  fondement: { article: string; url: string };
  /** Lien mailto prêt à l'emploi quand un courriel officiel est connu. */
  mailto: string | null;
}

const mailto = (courriel: string | null, objet: string, corps: string): string | null =>
  courriel ? `mailto:${courriel}?subject=${encodeURIComponent(objet)}&body=${encodeURIComponent(corps)}` : null;

const ligne = (etiquette: string, valeur: string) => `${etiquette} : ${valeur}`;

/**
 * Dépôt d'une proposition au titre de l'art. 304 §1.
 * Les conditions rappelées viennent du RÈGLEMENT COMMUNAL, jamais du décret :
 * celui-ci ne fixe ni seuil, ni âge, ni délai.
 */
export function documentDepot(
  p: Pick<Proposition, "titre" | "demande" | "motif" | "changement" | "destinataire" | "auteur">,
  cadre: NonNullable<CadreJuridique>,
  commune: string,
): Document {
  const a = articleParId("art. 304 §1")!;
  const conditions: string[] = [];
  if (cadre.seuilSignatures !== null) conditions.push(`${cadre.seuilSignatures} signatures requises`);
  if (cadre.seuilPourcentage !== null) conditions.push(`${cadre.seuilPourcentage} % des habitants requis`);
  if (cadre.ageMinimum !== null) conditions.push(`âge minimum des signataires : ${cadre.ageMinimum} ans`);
  if (cadre.delaiDepot.fondement !== "aucun") conditions.push(`dépôt au moins ${cadre.delaiDepot.jours} jours avant la séance`);

  const objet = `Proposition à inscrire à l'ordre du jour du conseil — ${p.titre}`;
  const corps = [
    `À l'attention de ${p.destinataire}, commune de ${commune}.`,
    "",
    `Je souhaite faire inscrire la proposition suivante à l'ordre du jour du conseil, en application de l'${a.id} du Decreet over het lokaal bestuur du 22 décembre 2017.`,
    "",
    `OBJET : ${p.titre}`,
    "",
    ligne("Ce qui est demandé", p.demande),
    "",
    ligne("Pourquoi", p.motif),
    "",
    ligne("Ce que cela change", p.changement),
    "",
    conditions.length
      ? `Conditions fixées par le règlement communal du ${cadre.reglementAdopteLe} : ${conditions.join(" ; ")}.`
      : "Le règlement communal ne fixe ni seuil de signatures, ni âge, ni délai de dépôt.",
    "",
    cadre.delaiTraitement.fondement === "aucun"
      ? "Le règlement communal ne fixe aucun délai de traitement."
      : `Délai de traitement prévu : ${cadre.delaiTraitement.jours} jours.`,
    "",
    `Déposé par : ${p.auteur.pseudonyme}`,
    "",
    "— Document préparé par une plateforme citoyenne. Il n'a de valeur que déposé par vous, par le canal officiel. La plateforme n'est pas le support de publication officielle et n'assure aucun suivi automatique.",
  ].join("\n");

  return {
    objet,
    corps,
    destinataire: cadre.canalDepot.libelle,
    fondement: { article: a.id, url: a.url },
    mailto: mailto(cadre.canalDepot.courriel, objet, corps),
  };
}

/**
 * Quand aucun règlement n'existe, le droit reste théorique : le conseil DOIT
 * en adopter un (art. 304 §5). Ce courrier le lui demande.
 */
export function documentDemandeReglement(commune: string, courriel: string | null = null): Document {
  const a = articleParId("art. 304 §5")!;
  const objet = `Demande d'adoption du règlement prévu à l'article 304 §5 — commune de ${commune}`;
  const corps = [
    `À l'attention du conseil communal de ${commune}.`,
    "",
    `L'${a.id} du Decreet over het lokaal bestuur du 22 décembre 2017 impose au conseil communal d'adopter un règlement organisant le droit des habitants de porter des propositions et des questions à l'ordre du jour.`,
    "",
    "À ce jour, je n'ai pas trouvé trace d'un tel règlement pour cette commune. En son absence, le droit reconnu par le décret existe sans qu'aucune règle locale n'en organise l'exercice : ni seuil, ni délai, ni canal de dépôt ne sont connus des habitants.",
    "",
    "Je demande donc au conseil :",
    "  1. de confirmer si un tel règlement a été adopté et, le cas échéant, d'en indiquer la référence et la date ;",
    "  2. dans la négative, d'inscrire son adoption à l'ordre du jour d'une prochaine séance.",
    "",
    `Le texte consolidé du décret est consultable ici : ${URL_DECRET}`,
    "",
    "— Document préparé par une plateforme citoyenne. Il n'a de valeur que déposé par vous, par le canal officiel.",
  ].join("\n");

  return {
    objet,
    corps,
    destinataire: `Conseil communal de ${commune}`,
    fondement: { article: a.id, url: a.url },
    mailto: mailto(courriel, objet, corps),
  };
}

/** Un fichier téléchargeable sans serveur : data: URL, aucun aller-retour. */
export const lienTelechargement = (d: Document, nom: string): string =>
  `data:text/plain;charset=utf-8,${encodeURIComponent(`${d.objet}\n\n${d.corps}`)}#${nom}`;

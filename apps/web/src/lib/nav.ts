/**
 * Navigation — étape C du Lot 9 : cinq parties, dans cet ordre exact.
 *
 * L'ordre n'est pas décoratif : il va de ce qui touche l'utilisateur
 * aujourd'hui à ce qu'il peut engager demain. Il remplace les quatre entrées
 * héritées de la maquette communale (Décider · Agir · Vivre), qui découpaient
 * par organe plutôt que par ce que le citoyen cherche.
 *
 * Une partie ne renvoie jamais vers une autre pour dire l'essentiel ; elle dit
 * l'essentiel et renvoie pour le détail.
 */

import { TERRITOIRE_DEFAUT } from "@pc/core";

export const SECTIONS = ["pour-vous", "objectifs", "statuts", "participer", "soutenir"] as const;
export type Section = (typeof SECTIONS)[number];

export interface Ecran {
  section: Section;
  chemin: string;
  cle: string;
  /** Un écran d'entrée obéit à la règle de lecture C0 : sept éléments au plus. */
  entree?: boolean;
}

export const ECRANS: Ecran[] = [
  /* 1 — ce qui vous concerne */
  { section: "pour-vous", chemin: "pour-vous", cle: "pourVous", entree: true },

  /* 2 — où l'on veut aller */
  { section: "objectifs", chemin: "objectifs", cle: "objectifs", entree: true },
  { section: "objectifs", chemin: "objectifs/cap", cle: "cap" },
  { section: "objectifs", chemin: "objectifs/engagements", cle: "engagements" },
  { section: "objectifs", chemin: "objectifs/propositions", cle: "propositions" },

  /* 3 — où l'on en est */
  { section: "statuts", chemin: "statuts", cle: "statuts", entree: true },
  { section: "statuts", chemin: "statuts/decisions", cle: "decisions" },
  { section: "statuts", chemin: "statuts/permis", cle: "permis" },
  { section: "statuts", chemin: "statuts/ecartes", cle: "ecartes" },
  { section: "statuts", chemin: "statuts/budget", cle: "budget" },
  { section: "statuts", chemin: "statuts/publication", cle: "publication" },
  { section: "statuts", chemin: "statuts/conformite", cle: "conformite" },

  /* 4 — s'inscrire, rencontrer */
  { section: "participer", chemin: "participer", cle: "participer", entree: true },
  { section: "participer", chemin: "participer/seances", cle: "seances" },
  { section: "participer", chemin: "participer/consultations", cle: "consultations" },
  { section: "participer", chemin: "participer/familles-jeunes", cle: "famillesJeunes" },
  { section: "participer", chemin: "participer/entraide", cle: "entraide" },
  { section: "participer", chemin: "participer/questions", cle: "questions" },

  /* 5 — financer */
  { section: "soutenir", chemin: "soutenir", cle: "soutenir", entree: true },
  { section: "soutenir", chemin: "soutenir/projets", cle: "projets" },
  { section: "soutenir", chemin: "soutenir/enveloppes", cle: "enveloppes" },

  /* hors navigation : la page qui explique le filtre */
  { section: "statuts", chemin: "ce-qui-entre", cle: "ceQuiEntre" },
  { section: "pour-vous", chemin: "comment-ca-marche", cle: "commentCaMarche" },
];

export const ACCUEIL_SECTION: Record<Section, string> = {
  "pour-vous": "pour-vous",
  objectifs: "objectifs",
  statuts: "statuts",
  participer: "participer",
  soutenir: "soutenir",
};

/** Anciennes URL : redirigées, jamais orphelines. */
export const REDIRECTIONS: Record<string, string> = {
  decisions: "statuts/decisions",
  "a-propos": "comment-ca-marche",
  "decider/decisions": "statuts/decisions",
  "decider/cap": "objectifs/cap",
  "decider/budget": "statuts/budget",
  "decider/engagements": "objectifs/engagements",
  "decider/publication": "statuts/publication",
  "decider/conformite": "statuts/conformite",
  "agir/propositions": "objectifs/propositions",
  "agir/questions": "participer/questions",
  "agir/consultations": "participer/consultations",
  "agir/seances": "participer/seances",
  "agir/enveloppes": "soutenir/enveloppes",
  "vivre/droits": "participer",
  "vivre/entraide": "participer/entraide",
  "vivre/familles-jeunes": "participer/familles-jeunes",
  "vivre/projets": "soutenir/projets",
  decider: "objectifs",
  agir: "participer",
  vivre: "participer",
};

export interface Contexte {
  langue: string;
  territoire: string;
  extra?: Record<string, string | number | undefined>;
}

/** Le territoire est propagé par tous les liens : changer de page ne le perd jamais. */
export function lien(chemin: string, ctx: Contexte, extra: Record<string, string | number | undefined> = {}): string {
  const p = new URLSearchParams();
  if (ctx.territoire && ctx.territoire !== TERRITOIRE_DEFAUT) p.set("t", ctx.territoire);
  else if (ctx.territoire) p.set("t", ctx.territoire);
  for (const [k, v] of Object.entries({ ...(ctx.extra ?? {}), ...extra })) {
    if (v === undefined || v === "" || v === null) continue;
    p.set(k, String(v));
  }
  const qs = p.toString();
  return `/${ctx.langue}/${chemin}${qs ? `?${qs}` : ""}`;
}

export const sectionDe = (chemin: string): Section =>
  ECRANS.find((e) => e.chemin === chemin)?.section ?? "pour-vous";
export const ecranDe = (chemin: string) => ECRANS.find((e) => e.chemin === chemin);

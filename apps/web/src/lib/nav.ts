/**
 * Navigation — cinq entrées, et le territoire porté par l'URL.
 *
 * Le niveau est un FILTRE, pas une rubrique : `?t=` traverse tous les liens,
 * si bien qu'un lien partagé rouvre exactement le même cadrage. Aucun état
 * caché, aucun cookie, rien à mémoriser côté serveur.
 */

import { TERRITOIRE_DEFAUT } from "@pc/core";

export const SECTIONS = ["pour-vous", "decider", "agir", "vivre", "comment-ca-marche"] as const;
export type Section = (typeof SECTIONS)[number];

export interface Ecran { section: Section; chemin: string; cle: string; }

/** Les seize écrans. Aucun ne disparaît quand un niveau n'a pas de données. */
export const ECRANS: Ecran[] = [
  { section: "pour-vous", chemin: "pour-vous", cle: "pourVous" },

  { section: "decider", chemin: "decider/decisions", cle: "decisions" },
  { section: "decider", chemin: "decider/cap", cle: "cap" },
  { section: "decider", chemin: "decider/budget", cle: "budget" },
  { section: "decider", chemin: "decider/engagements", cle: "engagements" },
  { section: "decider", chemin: "decider/publication", cle: "publication" },
  { section: "decider", chemin: "decider/conformite", cle: "conformite" },

  { section: "agir", chemin: "agir/propositions", cle: "propositions" },
  { section: "agir", chemin: "agir/questions", cle: "questions" },
  { section: "agir", chemin: "agir/consultations", cle: "consultations" },
  { section: "agir", chemin: "agir/seances", cle: "seances" },
  { section: "agir", chemin: "agir/enveloppes", cle: "enveloppes" },

  { section: "vivre", chemin: "vivre/droits", cle: "droits" },
  { section: "vivre", chemin: "vivre/entraide", cle: "entraide" },
  { section: "vivre", chemin: "vivre/familles-jeunes", cle: "famillesJeunes" },
  { section: "vivre", chemin: "vivre/projets", cle: "projets" },

  { section: "comment-ca-marche", chemin: "comment-ca-marche", cle: "commentCaMarche" },
];

/** Écran d'entrée de chaque section. */
export const ACCUEIL_SECTION: Record<Section, string> = {
  "pour-vous": "pour-vous",
  decider: "decider/decisions",
  agir: "agir/propositions",
  vivre: "vivre/droits",
  "comment-ca-marche": "comment-ca-marche",
};

export interface Contexte {
  langue: string;
  territoire: string;
  /** Paramètres à conserver d'un lien à l'autre (filtres de l'écran courant). */
  extra?: Record<string, string | number | undefined>;
}

/** Construit une URL en propageant systématiquement le territoire. */
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

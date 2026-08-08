/**
 * Participation — modèles du Lot 7, fusionnés au Lot 8.
 *
 * Interdiction n° 3 du lot : aucune collecte de signatures présentée comme
 * valide tant qu'un règlement communal ne l'a pas autorisée. Tant que
 * `cadreJuridique` vaut `null`, une proposition est un BROUILLON PARTAGEABLE,
 * jamais une pétition. Le schéma le fait respecter, l'interface le dit.
 */

import { z } from "zod";
import { iso, urlAbsolue, ProvenanceSchema, NiveauSchema } from "./schemas.ts";
import { IDS_THEMES } from "./themes.ts";
import type { Delai, EtatConformite } from "./juridique.ts";

export const DelaiSchema = z.discriminatedUnion("fondement", [
  z.object({ fondement: z.literal("legal"), jours: z.number().int().positive(),
             article: z.string().min(3), url: urlAbsolue }),
  z.object({ fondement: z.literal("conventionnel"), jours: z.number().int().positive(),
             convention: z.string().min(3), signeeLe: iso, url: urlAbsolue.optional() }),
  z.object({ fondement: z.literal("aucun"), explication: z.string().min(20) }),
]);

/** Le règlement communal de l'art. 304 §5 — ou son absence, qui est un fait. */
export const CadreJuridiqueSchema = z.object({
  reglementAdopteLe: iso,
  seuilSignatures: z.number().int().nonnegative().nullable(),
  seuilPourcentage: z.number().nullable(),
  ageMinimum: z.number().int().nullable(),
  delaiDepot: DelaiSchema,
  delaiTraitement: DelaiSchema,
  canalDepot: z.object({
    libelle: z.string().min(3),
    url: urlAbsolue.nullable(),
    courriel: z.string().email().nullable(),
  }),
  provenance: ProvenanceSchema,
}).nullable();

export const PropositionSchema = z.object({
  id: z.string().min(3),
  territoire: z.string().min(2),
  titre: z.string().min(6).max(90),
  demande: z.string().min(30),
  destinataire: z.string().min(3),
  motif: z.string().min(30),
  changement: z.string().min(30),
  themes: z.array(z.enum(IDS_THEMES as [string, ...string[]])).min(1),
  auteur: z.object({ pseudonyme: z.string().min(2), verifie: z.literal(false) }),
  etat: z.enum(["brouillon", "deposee", "a_l_ordre_du_jour", "traitee"]),
  dates: z.object({
    redigeeLe: iso,
    deposeeLe: iso.nullable(),
    inscriteLe: iso.nullable(),
    traiteeLe: iso.nullable(),
  }),
  cadreJuridique: CadreJuridiqueSchema,
  /** Id de l'Item Lokaal Beslist quand la proposition atteint l'ordre du jour. */
  itemLie: z.string().nullable(),
}).refine(
  (p) => p.etat === "brouillon" || p.cadreJuridique !== null || p.itemLie !== null,
  { message: "sans règlement communal ni acte publié, une proposition reste un brouillon — jamais une pétition" },
);

export const QuestionSchema = z.object({
  id: z.string().min(3),
  territoire: z.string().min(2),
  texte: z.string().min(20),
  poseeLe: iso,
  /** Institution, jamais une personne (règle n° 4). */
  destinataire: z.string().min(3),
  fondementDestinataire: z.string().min(5),
  estPlainte: z.boolean(),
  delaiReponse: DelaiSchema,
  reponse: z.object({ texte: z.string().min(10), recueLe: iso, provenance: ProvenanceSchema }).nullable(),
  itemLie: z.string().nullable(),
  propositionLiee: z.string().nullable(),
});

export const EnveloppeSchema = z.object({
  id: z.string().min(3),
  territoire: z.string().min(2),
  intitule: z.string().min(5),
  montant: z.number().nonnegative(),
  perimetre: z.string().min(10),
  criteresRepresentativite: z.string().min(10),
  /** Art. 271 : une FONCTION, jamais un nom. */
  agentResponsable: z.string().min(3),
  decideeLe: iso,
  /** Calculée : six mois après le prochain renouvellement du conseil. */
  caduqueLe: iso,
  projets: z.array(z.object({
    titre: z.string().min(3),
    montantEngage: z.number().nonnegative(),
    decisionLiee: z.string().nullable(),
  })),
  provenance: ProvenanceSchema,
});

export const LigneConformiteSchema = z.object({
  article: z.string().min(3),
  etat: z.enum(["conforme", "manquant", "non_verifie", "non_mesurable"]),
  provenance: ProvenanceSchema.nullable(),
  verifieLe: iso.nullable(),
  precision: z.string().nullable(),
}).refine(
  (l) => !["conforme", "manquant"].includes(l.etat) || (l.provenance !== null && l.verifieLe !== null),
  { message: "un état affirmatif sans source ni date de vérification est un jugement, pas un constat" },
);

export const FicheConformiteSchema = z.object({
  territoire: z.string().min(2),
  etabliLe: iso,
  lignes: z.array(LigneConformiteSchema).min(1),
});

export type Delai_ = Delai;
export type EtatConformite_ = EtatConformite;
export type CadreJuridique = z.infer<typeof CadreJuridiqueSchema>;
export type Proposition = z.infer<typeof PropositionSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type Enveloppe = z.infer<typeof EnveloppeSchema>;
export type LigneConformite = z.infer<typeof LigneConformiteSchema>;
export type FicheConformite = z.infer<typeof FicheConformiteSchema>;

/** Le message imposé quand aucun règlement n'existe (§ 7.2). */
export const MESSAGE_SANS_REGLEMENT = {
  fr: "Cette commune n'a pas encore adopté le règlement prévu à l'article 304 §5 du décret. Votre proposition peut être déposée, mais aucune règle locale n'en organise le traitement.",
  nl: "Deze gemeente heeft het reglement bepaald in artikel 304 §5 van het decreet nog niet vastgesteld. Uw voorstel kan worden ingediend, maar geen enkele lokale regel organiseert de behandeling ervan.",
  en: "This municipality has not yet adopted the regulation required by article 304 §5 of the decree. Your proposal may be submitted, but no local rule organises how it will be handled.",
};

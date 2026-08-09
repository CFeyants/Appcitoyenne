/**
 * Schémas Zod — le test d'admission du § 3, implémenté comme une validation.
 *
 * Trois questions, trois contraintes vérifiables :
 *   1. Y a-t-il un acte derrière ?      → provenance complète, URL absolue.
 *   2. Cela change-t-il quelque chose ? → un texte officiel OU une reformulation.
 *   3. Y a-t-il quelque chose à faire ? → action présente, jamais muette.
 */

import { z } from "zod";
import { IDS_THEMES } from "./themes.ts";
import { IDS_PUBLICS } from "./publics.ts";

export const iso = z.string().refine((s) => !Number.isNaN(Date.parse(s)), {
  message: "date ISO 8601 invalide",
});
export const urlAbsolue = z.string().url().refine((u) => /^https?:\/\//i.test(u), {
  message: "l'URL doit être absolue et en http(s)",
});

export const SourceSchema = z.object({
  organisme: z.string().min(2),
  url: urlAbsolue,
  dateDonnee: iso,
  licence: z.string().min(2),
  consulteLe: iso,
});

/**
 * La règle n° 1 vit ici. Un objet réel exige une source complète ; un objet de
 * démonstration exige de dire qu'il en est un ET pourquoi il existe. Aucune
 * troisième voie : le champ est obligatoire et l'union est fermée.
 */
export const ProvenanceSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("source"), source: SourceSchema }),
  z.object({
    kind: z.literal("demonstration"),
    explication: z.string().min(20, "dire « ceci est fictif » exige de dire ce que ça illustre"),
    ecranIllustre: z.string().min(3),
  }),
]);

export const NiveauSchema = z.enum(["commune", "province", "region", "pays", "europe"]);
export const LangueSchema = z.enum(["nl", "fr", "de", "en"]);

export const ActionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("aucune_action"), explication: z.string().min(15) }),
  // « À qualifier » est l'aveu honnête tant que personne n'a lu l'acte.
  z.object({ kind: z.literal("a_qualifier"), explication: z.string().min(15) }),
  z.object({ kind: z.literal("demarche"), libelle: z.string().min(3), url: urlAbsolue, delai: z.string().optional() }),
  z.object({ kind: z.literal("consultation"), libelle: z.string().min(3), url: urlAbsolue, clotureLe: iso }),
  z.object({ kind: z.literal("seance"), libelle: z.string().min(3), date: iso, lieu: z.string().min(2), inscription: z.string().optional() }),
  z.object({ kind: z.literal("demande"), destinataireId: z.string().min(2) }),
]);

export const TexteOfficielSchema = z.object({
  titre: z.string().min(3),
  texte: z.string().nullable(),
  langue: LangueSchema,
});

export const ReformulationSchema = z.object({
  titre: z.string().min(6).max(90, "un titre de plus de 90 caractères n'est pas un titre"),
  impact: z.string().min(30, "un impact de moins de 30 caractères n'énonce rien"),
  redigeLe: iso,
  par: z.string().min(2),
  brouillon: z.boolean(),
});

export const ItemSchema = z.object({
  id: z.string().min(6),
  niveau: NiveauSchema,
  territoire: z.string().min(2),
  type: z.enum(["decision", "regle", "budget", "consultation", "droit", "alerte", "seance"]),
  officiel: TexteOfficielSchema,
  redige: ReformulationSchema.nullable(),
  action: ActionSchema,
  themes: z.array(z.enum(IDS_THEMES as [string, ...string[]])).min(1),
  publics: z.array(z.enum(IDS_PUBLICS as [string, ...string[]])).min(1),
  entreeEnVigueur: iso.optional(),
  echeance: iso.optional(),
  provenance: ProvenanceSchema,
  objectifsLies: z.array(z.string()),
  statut: z.enum(["a_venir", "adoptee"]),
  // A2 : la datation porte son état de cohérence. Un délai n'est présent que
  // lorsqu'il a un sens ; il n'existe pas de branche où l'on calcule sur des
  // dates absurdes.
  datation: z.discriminatedUnion("etat", [
    z.object({ etat: z.literal("coherente"), adoption: iso, publication: iso, delaiJours: z.number().int().nonnegative() }),
    z.object({ etat: z.literal("incoherente"), adoption: iso, publication: iso }),
    z.object({ etat: z.literal("incomplete"), adoption: iso.nullable(), publication: iso.nullable() }),
  ]),
  admission: z.object({
    publie: z.boolean(),
    registre: z.enum(["digest", "permis", "ecarte"]),
    motif: z.string().min(3),
  }),
}).refine(
  // A1 : un acte adopté ne peut pas l'avoir été demain.
  (i) => i.statut !== "adoptee" || !i.datation.adoption || i.datation.adoption <= new Date().toISOString().slice(0, 10),
  { message: "un acte de statut « adoptee » ne peut pas porter une date d'adoption future" },
);

export const ObjectifSchema = z.object({
  id: z.string().min(3),
  niveau: NiveauSchema,
  territoire: z.string().min(2),
  intitule: z.string().min(10),
  cible: z.object({ valeur: z.number(), unite: z.string().min(1), echeance: z.string().min(4) }),
  mesure: z.object({ valeur: z.number(), dateMesure: iso, provenance: ProvenanceSchema }).optional(),
  rattachements: z.array(z.string()),
  provenance: ProvenanceSchema,
});

export const DroitSchema = z.object({
  id: z.string().min(3),
  intitule: z.string().min(5),
  niveau: NiveauSchema,
  territoire: z.string().min(2),
  conditions: z.array(z.object({ libelle: z.string().min(5), provenance: ProvenanceSchema })).min(1),
  montantIndicatif: z.string().optional(),
  automatique: z.boolean(),
  demarche: z.object({ libelle: z.string().min(3), url: urlAbsolue, delai: z.string().optional() }).optional(),
  provenance: ProvenanceSchema,
});

export const ProjetSchema = z.object({
  id: z.string().min(3),
  titre: z.string().min(5),
  niveau: NiveauSchema,
  territoire: z.string().min(2),
  objectif: z.number().positive(),
  collecte: z.number().nonnegative(),
  contributeurs: z.number().int().nonnegative(),
  economique: z.string().min(10),
  social: z.string().min(10),
  environnemental: z.string().min(10),
  rendementObserve: z.string().min(3),
  // § 8 : l'avertissement sur le risque de perte en capital n'est pas optionnel.
  avertissement: z.string().min(30),
  lienExterne: urlAbsolue.optional(),
  provenance: ProvenanceSchema,
});

export const DemandeSchema = z.object({
  id: z.string().min(3),
  mode: z.enum(["demande", "offre"]),
  categorie: z.string().min(2),
  titre: z.string().min(5),
  detail: z.string().min(10),
  quartier: z.string().min(2),
  territoire: z.string().min(2),
  auteur: z.string().min(2),
  provenance: ProvenanceSchema,
});

/* ------------------------------------------------------------------------- */

export interface Rejet { index: number; id?: string; problemes: string[]; }
export interface Tri<T> { valides: T[]; rejets: Rejet[]; }

export function trier<T>(schema: z.ZodType<T>, brut: unknown[]): Tri<T> {
  const valides: T[] = [];
  const rejets: Rejet[] = [];
  brut.forEach((x, index) => {
    const r = schema.safeParse(x);
    if (r.success) valides.push(r.data);
    else rejets.push({
      index,
      id: (x as { id?: string })?.id,
      problemes: r.error.issues.map((i) => `${i.path.join(".") || "(racine)"} : ${i.message}`),
    });
  });
  return { valides, rejets };
}

export function exigerValide<T>(schema: z.ZodType<T>, brut: unknown[], contexte: string): T[] {
  const { valides, rejets } = trier(schema, brut);
  if (rejets.length > 0) {
    const apercu = rejets.slice(0, 5)
      .map((r) => `  · [${r.index}] ${r.id ?? "sans id"} — ${r.problemes.join(" ; ")}`).join("\n");
    const msg = `${contexte} : ${rejets.length} objet(s) rejeté(s) sur ${brut.length}\n${apercu}`;
    if (process.env.NODE_ENV !== "production") throw new Error(msg);
    console.warn(msg);
  }
  return valides;
}

export type ItemValide = z.infer<typeof ItemSchema>;

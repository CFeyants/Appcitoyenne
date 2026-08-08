/**
 * Schémas Zod — le test d'admission du § 3, implémenté comme une validation,
 * pas comme une consigne éditoriale.
 *
 * Trois questions, trois contraintes vérifiables :
 *   1. Y a-t-il un acte derrière ?      → `source` complète, URL absolue, date.
 *   2. Cela change-t-il quelque chose ? → `impact` substantiel et daté.
 *   3. Y a-t-il quelque chose à faire ? → `action` présente, `aucune_action`
 *                                          n'étant recevable qu'avec explication.
 *
 * Un item qui échoue n'est pas publié. En développement, `exigerValide` lève ;
 * en production, `filtrerValides` écarte et journalise. Les deux comportements
 * viennent de la même fonction, pour qu'aucun chemin ne contourne le filtre.
 */

import { z } from "zod";
import { IDS_THEMES } from "./themes.ts";
import { IDS_PUBLICS } from "./publics.ts";

const iso = z
  .string()
  .refine((s) => !Number.isNaN(Date.parse(s)), { message: "date ISO 8601 invalide" });

const urlAbsolue = z
  .string()
  .url()
  .refine((u) => /^https?:\/\//i.test(u), { message: "l'URL doit être absolue et en http(s)" });

/** Règle non négociable n° 1 : aucune information sans source. */
export const SourceSchema = z.object({
  organisme: z.string().min(2),
  url: urlAbsolue,
  dateDonnee: iso,
  licence: z.string().min(2),
  consulteLe: iso,
});

export const ActionSchema = z.discriminatedUnion("kind", [
  // `aucune_action` est légitime — mais jamais muette. L'explication EST le service.
  z.object({
    kind: z.literal("aucune_action"),
    explication: z.string().min(15, "dire « rien à faire » exige de dire pourquoi"),
  }),
  z.object({
    kind: z.literal("demarche"),
    libelle: z.string().min(3), url: urlAbsolue, delai: z.string().optional(),
  }),
  z.object({
    kind: z.literal("consultation"),
    libelle: z.string().min(3), url: urlAbsolue, clotureLe: iso,
  }),
  z.object({
    kind: z.literal("seance"),
    libelle: z.string().min(3), date: iso, lieu: z.string().min(2),
    inscription: z.string().optional(),
  }),
  z.object({ kind: z.literal("demande"), destinataireId: z.string().min(2) }),
]);

export const NiveauSchema = z.enum(["commune", "region", "pays", "europe"]);
export const LangueSchema = z.enum(["nl", "fr", "de", "en"]);

export const ItemSchema = z.object({
  id: z.string().min(6),
  niveau: NiveauSchema,
  territoire: z.string().min(2),
  type: z.enum(["decision", "regle", "budget", "consultation", "droit", "alerte", "seance"]),
  titre: z.string().min(6).max(90, "un titre de plus de 90 caractères n'est pas un titre"),
  langue: LangueSchema,
  // Question 2 du test d'admission : sans portée énonçable, l'item n'entre pas.
  impact: z.string().min(30, "un impact de moins de 30 caractères n'énonce rien"),
  impactEtabli: z.enum(["texte_publie", "construit"]),
  action: ActionSchema,
  // Vocabulaires fermés : un connecteur ne peut pas inventer une catégorie.
  themes: z.array(z.enum(IDS_THEMES as [string, ...string[]])).min(1),
  publics: z.array(z.enum(IDS_PUBLICS as [string, ...string[]])).min(1),
  entreeEnVigueur: iso.optional(),
  echeance: iso.optional(),
  source: SourceSchema,
  objectifsLies: z.array(z.string()),
});

export const ObjectifSchema = z.object({
  id: z.string().min(3),
  niveau: NiveauSchema,
  territoire: z.string().min(2),
  intitule: z.string().min(10),
  cible: z.object({ valeur: z.number(), unite: z.string().min(1), echeance: iso }),
  mesure: z.object({ valeur: z.number(), dateMesure: iso, source: SourceSchema }).optional(),
  rattachements: z.array(z.string()),
  source: SourceSchema,
});

export const DroitSchema = z.object({
  id: z.string().min(3),
  intitule: z.string().min(5),
  niveau: NiveauSchema,
  territoire: z.string().min(2),
  conditions: z.array(z.object({ libelle: z.string().min(5), source: SourceSchema })).min(1),
  montantIndicatif: z.string().optional(),
  automatique: z.boolean(),
  demarche: z.object({ libelle: z.string().min(3), url: urlAbsolue, delai: z.string().optional() }).optional(),
  source: SourceSchema,
});

/* ------------------------------------------------------------------------- */

export interface Rejet {
  index: number;
  id?: string;
  problemes: string[];
}
export interface Tri<T> {
  valides: T[];
  rejets: Rejet[];
}

/**
 * Trie un lot en gardant la trace de ce qui a été écarté et pourquoi.
 * Le journal des rejets n'est pas un détail de mise au point : c'est ce qui
 * permet de dire « 12 décisions écartées, faute de portée énonçable » plutôt
 * que de laisser croire à une couverture complète.
 */
export function trier<T>(schema: z.ZodType<T>, brut: unknown[]): Tri<T> {
  const valides: T[] = [];
  const rejets: Rejet[] = [];
  brut.forEach((x, index) => {
    const r = schema.safeParse(x);
    if (r.success) valides.push(r.data);
    else
      rejets.push({
        index,
        id: (x as { id?: string })?.id,
        problemes: r.error.issues.map((i) => `${i.path.join(".") || "(racine)"} : ${i.message}`),
      });
  });
  return { valides, rejets };
}

/**
 * En développement, un rejet est une erreur : on veut le voir tout de suite.
 * En production, on filtre et on journalise — un écran incomplet vaut mieux
 * qu'un écran faux, et le mode dégradé est affiché à l'utilisateur.
 */
export function exigerValide<T>(schema: z.ZodType<T>, brut: unknown[], contexte: string): T[] {
  const { valides, rejets } = trier(schema, brut);
  if (rejets.length > 0) {
    const apercu = rejets.slice(0, 5)
      .map((r) => `  · [${r.index}] ${r.id ?? "sans id"} — ${r.problemes.join(" ; ")}`)
      .join("\n");
    const msg = `${contexte} : ${rejets.length} objet(s) rejeté(s) sur ${brut.length}\n${apercu}`;
    if (process.env.NODE_ENV !== "production") throw new Error(msg);
    console.warn(msg);
  }
  return valides;
}

export type ItemValide = z.infer<typeof ItemSchema>;
export type ObjectifValide = z.infer<typeof ObjectifSchema>;
export type DroitValide = z.infer<typeof DroitSchema>;

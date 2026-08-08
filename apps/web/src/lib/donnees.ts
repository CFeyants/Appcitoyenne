/**
 * Lecture des instantanés — brief § 10 : « l'interface lit la base ; aucun
 * appel à une API tierce pendant le rendu d'une page ».
 *
 * Ici, la « base » est le dossier /data rempli par `scripts/ingest.ts`. Le jour
 * où elle devient un vrai entrepôt, seul ce fichier change.
 */

import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { ItemSchema, trier, TERRITOIRES, type Item, type EtatSource } from "@pc/core";

const RACINE_DATA = join(process.cwd(), "..", "..", "data");

export interface Instantane {
  territoire: (typeof TERRITOIRES)[number];
  organisme: string;
  licence: string;
  genereLe: string;
  seancesLues: number;
  total: number;
  rejetes: number;
  ecarte: { sansDeliberation: number; sansIntitule: number; sansLien: number };
  items: Item[];
}

let cache: { corpus: Item[]; instantanes: Instantane[]; etats: EtatSource[] } | null = null;

/**
 * La validation est rejouée À LA LECTURE, pas seulement à l'ingestion. Un
 * instantané modifié à la main, un schéma durci entre-temps : dans les deux
 * cas, un item non conforme n'atteint pas l'écran.
 */
export async function charger() {
  if (cache) return cache;

  const dossier = join(RACINE_DATA, "snapshots");
  const fichiers = (await readdir(dossier)).filter((f) => f.endsWith(".json")).sort();

  const instantanes: Instantane[] = [];
  const corpus: Item[] = [];

  for (const f of fichiers) {
    const brut = JSON.parse(await readFile(join(dossier, f), "utf8")) as Instantane;
    const { valides, rejets } = trier<Item>(ItemSchema, brut.items ?? []);
    if (rejets.length) {
      console.warn(`[donnees] ${f} : ${rejets.length} item(s) écarté(s) à la lecture — ${rejets[0]?.problemes[0]}`);
    }
    instantanes.push({ ...brut, items: valides });
    corpus.push(...valides);
  }

  let etats: EtatSource[] = [];
  try {
    etats = JSON.parse(await readFile(join(RACINE_DATA, "etat-sources.json"), "utf8")).etats ?? [];
  } catch {
    // Absence d'état de source = mode dégradé assumé, pas une erreur fatale.
  }

  cache = { corpus, instantanes, etats };
  return cache;
}

export interface Filtres {
  commune?: string;
  theme?: string;
  organe?: string;
  q?: string;
}

/** Filtrage déterministe et explicite. Aucun signal comportemental n'entre ici. */
export function filtrer(corpus: Item[], f: Filtres): Item[] {
  const q = f.q?.trim().toLowerCase();
  return corpus.filter((i) => {
    if (f.commune && i.territoire !== f.commune) return false;
    if (f.theme && !i.themes.includes(f.theme)) return false;
    if (f.organe && i.source.organisme !== f.organe) return false;
    if (q && !(`${i.titre} ${i.impact}`.toLowerCase().includes(q))) return false;
    return true;
  });
}

/**
 * Tri stable : date décroissante, puis id. Sans la clause de départage, deux
 * rendus successifs pourraient différer — et la promesse « même critères, même
 * écran » tomberait.
 */
export const trierParDate = (items: Item[]): Item[] =>
  [...items].sort(
    (a, b) =>
      Date.parse(b.source.dateDonnee) - Date.parse(a.source.dateDonnee) ||
      a.id.localeCompare(b.id),
  );

export const organes = (corpus: Item[]): string[] =>
  [...new Set(corpus.map((i) => i.source.organisme))].sort((a, b) => a.localeCompare(b, "nl"));

export const themesPresents = (corpus: Item[]): string[] =>
  [...new Set(corpus.flatMap((i) => i.themes))].sort();

/**
 * Lecture des données — l'interface lit la base, jamais une API tierce.
 *
 * Trois gisements fusionnés ici :
 *   · data/snapshots/<nis>.json      décisions réelles (Lokaal Beslist)
 *   · data/reformulations/<nis>.json ce qu'un humain a écrit en français
 *   · data/demonstration.json        la maquette communale, toute badgée
 *
 * La reformulation est appliquée À LA LECTURE, pas gravée dans l'instantané :
 * corriger un texte ne demande donc jamais de réingérer la source. Le journal
 * daté et l'auteur, c'est l'historique git du fichier de reformulations.
 */

import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  ItemSchema, ObjectifSchema, ProjetSchema, DemandeSchema, FicheConformiteSchema, trier,
  estReel, couvre, TERRITOIRE_DEFAUT, territoireParCode,
  type Item, type Objectif, type Projet, type Demande, type EtatSource, type FicheConformite,
} from "@pc/core";

/**
 * Où vit /data. Résolu PARESSEUSEMENT, jamais à l'import du module : Next
 * importe les modules de route pour collecter les pages au moment du build, et
 * une exception levée à ce moment-là fait échouer la compilation entière au
 * lieu d'une seule requête.
 */
function racineData(): string {
  const candidats = [
    join(process.cwd(), "..", "..", "data"),  // monorepo, cwd = apps/web
    join(process.cwd(), "data"),              // cwd = racine du dépôt
  ];
  const trouve = candidats.find((c) => existsSync(join(c, "snapshots")));
  if (!trouve) {
    throw new Error(
      "Instantanés introuvables. Chemins essayés :\n" + candidats.map((c) => `  · ${c}`).join("\n") +
      `\n(cwd = ${process.cwd()})\n` +
      "Lancer « node scripts/ingest.ts » depuis la racine, ou vérifier outputFileTracingIncludes.",
    );
  }
  return trouve;
}

export interface Couverture {
  territoire: string;
  seancesLues: number;
  retenues: number;
  ecarte: { sansDeliberation: number; sansIntitule: number; sansLien: number };
  genereLe: string;
}

export interface Base {
  items: Item[];
  objectifs: Objectif[];
  projets: Projet[];
  demandes: Demande[];
  conformite: FicheConformite[];
  reglements: any;
  budget: any;
  couverture: Couverture[];
  etats: EtatSource[];
  genereLe: string;
}

let cache: Base | null = null;
let racine: string | null = null;
const dataDir = () => (racine ??= racineData());

export async function charger(): Promise<Base> {
  if (cache) return cache;

  /* --- décisions réelles + reformulations --- */
  const dossier = join(dataDir(), "snapshots");
  const fichiers = (await readdir(dossier)).filter((f) => f.endsWith(".json")).sort();
  const items: Item[] = [];
  const couverture: Couverture[] = [];
  let genereLe = "";

  for (const f of fichiers) {
    const snap = JSON.parse(await readFile(join(dossier, f), "utf8"));
    genereLe = snap.genereLe ?? genereLe;

    let reformulations: Record<string, Item["redige"]> = {};
    const chemin = join(dataDir(), "reformulations", f);
    if (existsSync(chemin)) {
      reformulations = JSON.parse(await readFile(chemin, "utf8")).reformulations ?? {};
    }

    const enrichis = (snap.items ?? []).map((i: Item) => {
      const r = reformulations[i.id];
      if (!r) return i;
      // Une aide à la rédaction ne publie pas : un brouillon reste un brouillon.
      return { ...i, redige: r, action: r.brouillon ? i.action : i.action };
    });

    // Revalidé à la lecture : un fichier retouché à la main n'atteint pas l'écran.
    const { valides, rejets } = trier<Item>(ItemSchema, enrichis);
    if (rejets.length) console.warn(`[donnees] ${f} : ${rejets.length} écarté(s) — ${rejets[0]?.problemes[0]}`);
    items.push(...valides);

    couverture.push({
      territoire: snap.territoire?.code ?? f.replace(".json", ""),
      seancesLues: snap.seancesLues ?? 0,
      retenues: valides.length,
      ecarte: snap.ecarte ?? { sansDeliberation: 0, sansIntitule: 0, sansLien: 0 },
      genereLe: snap.genereLe ?? "",
    });
  }

  /* --- démonstration : fictive, mais validée par les mêmes schémas --- */
  let objectifs: Objectif[] = [], projets: Projet[] = [], demandes: Demande[] = [], budget: any = null;
  const cheminDemo = join(dataDir(), "demonstration.json");
  if (existsSync(cheminDemo)) {
    const d = JSON.parse(await readFile(cheminDemo, "utf8"));
    objectifs = trier<Objectif>(ObjectifSchema, d.objectifs ?? []).valides;
    projets = trier<Projet>(ProjetSchema, d.projets ?? []).valides;
    demandes = trier<Demande>(DemandeSchema, d.demandes ?? []).valides;
    items.push(...trier<Item>(ItemSchema, d.seances ?? []).valides);
    budget = d.budget ?? null;
  }

  /* --- conformité --- */
  const conformite: FicheConformite[] = [];
  const dossierConf = join(dataDir(), "conformite");
  if (existsSync(dossierConf)) {
    for (const f of (await readdir(dossierConf)).filter((x) => x.endsWith(".json"))) {
      const brut = JSON.parse(await readFile(join(dossierConf, f), "utf8"));
      conformite.push(...trier<FicheConformite>(FicheConformiteSchema, [brut]).valides);
    }
  }

  /* --- règlements de participation (chaque valeur porte son état) --- */
  let reglements: any = null;
  const cheminRegl = join(dataDir(), "reglements-participation.json");
  if (existsSync(cheminRegl)) reglements = JSON.parse(await readFile(cheminRegl, "utf8"));

  let etats: EtatSource[] = [];
  try { etats = JSON.parse(await readFile(join(dataDir(), "etat-sources.json"), "utf8")).etats ?? []; } catch { /* mode dégradé */ }

  cache = { items, objectifs, projets, demandes, conformite, reglements, budget, couverture, etats, genereLe };
  return cache;
}

/* ------------------------------------------------------------------ */

/** Le niveau est un filtre : un objet est visible depuis son territoire et ses ascendants. */
export const dansTerritoire = <T extends { territoire: string }>(xs: T[], code: string): T[] =>
  xs.filter((x) => couvre(code, x.territoire));

export interface Filtres { theme?: string; organe?: string; q?: string; aFaire?: boolean; }

export function filtrer(items: Item[], f: Filtres): Item[] {
  const q = f.q?.trim().toLowerCase();
  return items.filter((i) => {
    if (f.theme && !i.themes.includes(f.theme)) return false;
    if (f.organe && organeDe(i) !== f.organe) return false;
    if (f.aFaire && (i.action.kind === "aucune_action" || i.action.kind === "a_qualifier")) return false;
    if (q) {
      const foin = `${i.officiel.titre} ${i.officiel.texte ?? ""} ${i.redige?.titre ?? ""} ${i.redige?.impact ?? ""}`;
      if (!foin.toLowerCase().includes(q)) return false;
    }
    return true;
  });
}

export const organeDe = (i: Item): string =>
  i.provenance.kind === "source" ? i.provenance.source.organisme : "Maquette communale";

export const dateDe = (i: Item): string =>
  i.dateAdoption ?? (i.provenance.kind === "source" ? i.provenance.source.dateDonnee : "");

/** Tri stable : date décroissante, puis id. Deux rendus donnent le même ordre. */
export const parDate = (items: Item[]): Item[] =>
  [...items].sort((a, b) => (dateDe(b) || "").localeCompare(dateDe(a) || "") || a.id.localeCompare(b.id));

export const organes = (items: Item[]): string[] =>
  [...new Set(items.map(organeDe))].sort((a, b) => a.localeCompare(b, "nl"));

export const themesPresents = (items: Item[]): string[] =>
  [...new Set(items.flatMap((i) => i.themes))].sort();

/** Le compteur de vérité : part de réel, part de reformulé. */
export function parts(items: Item[]) {
  const total = items.length;
  const reels = items.filter((i) => estReel(i.provenance)).length;
  const reformules = items.filter((i) => i.redige !== null && !i.redige.brouillon).length;
  const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 100));
  return { total, reels, demo: total - reels, reformules,
           pctReel: pct(reels), pctReformule: pct(reformules) };
}

export const territoireValide = (code: string | undefined): string =>
  code && territoireParCode(code) ? code : TERRITOIRE_DEFAUT;

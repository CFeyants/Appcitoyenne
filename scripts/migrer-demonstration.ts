/**
 * Migration des données de démonstration de l'ancienne application communale.
 *
 * Elles ne sont PAS jetées : elles font vivre les écrans que la donnée réelle
 * ne couvre pas encore. Mais chacune sort d'ici avec une provenance
 * `demonstration` — impossible d'en afficher une sans badge, puisque le type
 * l'impose (voir types.ts, CHANGEMENT 1).
 *
 *   node scripts/migrer-demonstration.ts [--source=../Appcommunale]
 */

import { writeFile } from "node:fs/promises";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  ObjectifSchema, ProjetSchema, DemandeSchema, ItemSchema, trier,
  type Objectif, type Projet, type Demande, type Item, type Provenance,
} from "../packages/core/src/index.ts";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (n: string, d: string) =>
  process.argv.find((a) => a.startsWith(`--${n}=`))?.split("=")[1] ?? d;

const SOURCE = resolve(RACINE, arg("source", "../Appcommunale"));
const KRAAINEM = "23099";

const demo = (ecran: string, quoi: string): Provenance => ({
  kind: "demonstration",
  explication: `Donnée fictive reprise de la maquette communale pour illustrer ${quoi}. Elle ne correspond à aucun acte réel.`,
  ecranIllustre: ecran,
});

const ANCRAGE: Record<string, string[]> = {
  alimentation: ["BE-VLG:souverainete-alimentaire", "EU:farm-to-fork"],
  climat: ["BE-VLG:plan-air-climat-energie", "BE:pnec", "EU:fit-for-55"],
  transmission: ["BE-VLG:cohesion-sociale", "EU:socle-droits-sociaux"],
};

async function main() {
  // Sous Windows, un chemin absolu doit passer par une URL file:// pour l'ESM.
  const d = await import(pathToFileURL(join(SOURCE, "src", "data.ts")).href);

  /* ---- Le cap : orientations → Objectif, avec leurs rattachements ---- */
  const objectifs: Objectif[] = d.orientations.map((o: any) => ({
    id: `demo:cap:${o.id}`,
    niveau: "commune" as const,
    territoire: KRAAINEM,
    intitule: o.cible,
    cible: { valeur: 0, unite: "voir l'intitulé", echeance: o.horizon },
    rattachements: ANCRAGE[o.id] ?? [],
    provenance: demo("decider/cap", "le rattachement d'un objectif communal aux niveaux supérieurs"),
  }));

  /* ---- Engagements : Objectif porteur d'une mesure ---- */
  const horizons: Record<string, string> = Object.fromEntries(
    d.orientations.map((o: any) => [o.id, o.horizon]),
  );
  for (const e of d.engagements) {
    objectifs.push({
      id: `demo:engagement:${e.id}`,
      niveau: "commune", territoire: KRAAINEM,
      intitule: e.titre,
      // L'horizon vient de l'orientation à laquelle l'engagement se rattache :
      // un engagement sans échéance n'est pas un engagement.
      cible: { valeur: 0, unite: e.etat, echeance: horizons[e.o] ?? "2030" },
      mesure: { valeur: e.suiveurs, dateMesure: "2026-08-08",
                provenance: demo("decider/engagements", "le suivi d'un engagement") },
      rattachements: ANCRAGE[e.o] ?? [],
      provenance: demo("decider/engagements", "le registre des engagements, suivi sans note ni score"),
    });
  }

  /* ---- Projets & fonds : rendement OBSERVÉ, jamais le plafond légal ---- */
  const projets: Projet[] = d.projets.map((p: any) => ({
    id: `demo:projet:${p.id}`,
    titre: p.titre,
    niveau: "commune" as const, territoire: KRAAINEM,
    objectif: p.objectif, collecte: p.collecte, contributeurs: p.contrib,
    economique: p.eco, social: p.soc, environnemental: p.env,
    rendementObserve: "0 % à 4 % observés sur les trois dernières années dans les coopératives flamandes d'énergie",
    avertissement:
      "La plateforme n'encaisse rien et ne conseille pas. Une part de coopérative comporte un risque de perte en capital et n'est pas liquide : vous pouvez ne pas récupérer votre mise.",
    provenance: demo("vivre/projets", "la triple comptabilité d'un projet, présentée sans score agrégé"),
  }));

  /* ---- Entraide : les demandes d'abord, les offres ensuite ---- */
  const demandes: Demande[] = d.entraide.map((a: any, i: number) => ({
    id: `demo:entraide:${i}`,
    mode: a.mode, categorie: a.cat, titre: a.titre, detail: a.k,
    quartier: a.quartier, territoire: KRAAINEM, auteur: a.nom,
    provenance: demo("vivre/entraide", "l'entraide de proximité, la demande affichée avant l'offre"),
  }));

  /* ---- Familles, jeunes, culture & sport : des Items de type séance ---- */
  const seances: Item[] = [];
  const pousser = (titre: string, texte: string, themes: string[], publics: string[], quand: string, lieu: string, ecran: string) => {
    seances.push({
      id: `demo:seance:${seances.length}`,
      niveau: "commune", territoire: KRAAINEM, type: "seance",
      officiel: { titre, texte: null, langue: "fr" },
      redige: { titre: titre.slice(0, 90), impact: texte, redigeLe: "2026-08-08", par: "Maquette communale", brouillon: false },
      action: { kind: "seance", libelle: titre, date: "2026-09-01", lieu },
      themes, publics,
      provenance: demo(ecran, "une activité ouverte aux habitants"),
      objectifsLies: [],
    });
    void quand;
  };
  for (const j of d.jeunes) pousser(j.titre, `${j.k} — ${j.age}, ${j.quand}.`, ["jeunesse"], ["jeunes", "parents"], j.quand, j.lieu, "vivre/familles-jeunes");
  for (const a of d.agenda) pousser(a.titre, `${a.k} — ${a.quand}. ${a.prix}.`, [a.type === "sport" ? "sport" : "culture"], ["tous"], a.quand, a.lieu, "vivre/familles-jeunes");

  // Les conseils aux parents ne sont ni des séances ni des actes : ils n'ont ni
  // lieu ni date. Les forcer dans le moule « séance » aurait obligé à inventer
  // les deux — le schéma l'a refusé, et il avait raison.
  for (const c of d.familleConseils) {
    seances.push({
      id: `demo:conseil:${seances.length}`,
      niveau: "commune", territoire: KRAAINEM, type: "regle",
      officiel: { titre: c.titre, texte: null, langue: "fr" },
      redige: { titre: c.titre.slice(0, 90), impact: `${c.k} Source : ${c.source}.`,
                redigeLe: "2026-08-08", par: "Maquette communale", brouillon: false },
      action: { kind: "aucune_action",
                explication: "Ceci est un repère, pas une démarche : rien ne vous est demandé." },
      themes: ["enfance"], publics: ["parents"],
      provenance: demo("vivre/familles-jeunes", "un repère de parentalité, sourcé et sans démarche"),
      objectifsLies: [],
    });
  }

  /* ---- Budget : un Item de type budget, plus les lignes brutes ---- */
  const budget = {
    annee: d.budgetTotal.annee,
    total: d.budgetTotal.total,
    parHabitant: d.budgetTotal.parHabitant,
    habitants: d.commune.habitants,
    postes: d.budgetPostes,
    orientations: d.budget.lignes,
    voisines: d.budgetVoisines,
    provenance: demo("decider/budget", "la décomposition d'un budget communal et la comparaison entre communes"),
  };

  /* ---- validation : rien ne sort sans passer le même filtre que le réel ---- */
  const vO = trier<Objectif>(ObjectifSchema, objectifs);
  const vP = trier<Projet>(ProjetSchema, projets);
  const vD = trier<Demande>(DemandeSchema, demandes);
  const vS = trier<Item>(ItemSchema, seances);

  for (const [nom, t] of [["objectifs", vO], ["projets", vP], ["demandes", vD], ["séances", vS]] as const) {
    console.log(`  ${nom.padEnd(10)} ${t.valides.length} retenus, ${t.rejets.length} rejetés`);
    for (const r of t.rejets.slice(0, 3)) console.log(`     rejet ${r.id ?? r.index} — ${r.problemes[0]}`);
  }

  await writeFile(join(RACINE, "data", "demonstration.json"), JSON.stringify({
    genereLe: new Date().toISOString(),
    origine: "Maquette communale Kraainem (CFeyants/Appcommunale)",
    avertissement:
      "Toutes les données de ce fichier sont fictives. Elles portent une provenance « demonstration » et s'affichent avec un badge.",
    objectifs: vO.valides, projets: vP.valides, demandes: vD.valides, seances: vS.valides, budget,
  }, null, 2), "utf8");

  console.log(`\n═══ ${vO.valides.length + vP.valides.length + vD.valides.length + vS.valides.length} objets de démonstration, tous badgés ═══`);
}

main().catch((e) => { console.error(e); process.exit(1); });

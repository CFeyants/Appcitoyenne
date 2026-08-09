/**
 * Ingestion planifiée — brief § 10 : « une tâche périodique remplit une base ;
 * l'interface lit la base. Aucun appel à une API tierce pendant le rendu. »
 *
 * Écrit un instantané par commune dans /data/snapshots, plus un état de source
 * dans /data/etat-sources.json qui alimente le mode dégradé de l'interface.
 *
 *   node scripts/ingest.ts               # 40 séances par commune
 *   node scripts/ingest.ts --seances=80
 *   node scripts/ingest.ts --commune=23099
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Seules les communes ont un connecteur : Lokaal Beslist ne publie rien au
// niveau province, région, pays ou Union. Les écrans le diront ; l'ingestion
// n'a pas à interroger l'API pour des territoires qu'elle ne couvre pas.
import { COMMUNES, ItemSchema, trier, type Item } from "../packages/core/src/index.ts";
import { collecter, CONNECTEUR } from "../packages/connectors/src/be/lokaalbeslist/index.ts";
import type { EtatSource } from "../packages/core/src/types.ts";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..");
const DOSSIER = join(RACINE, "data", "snapshots");

const arg = (nom: string, defaut: string) =>
  process.argv.find((a) => a.startsWith(`--${nom}=`))?.split("=")[1] ?? defaut;

const seances = Number(arg("seances", "40"));
const filtreCommune = arg("commune", "");

const journal = (m: string) => console.log(m);

async function main() {
  await mkdir(DOSSIER, { recursive: true });

  const cibles = filtreCommune ? COMMUNES.filter((t) => t.code === filtreCommune) : COMMUNES;
  if (cibles.length === 0) throw new Error(`Aucun territoire pour le code « ${filtreCommune} »`);

  const etats: EtatSource[] = [];
  let totalValides = 0;
  let totalRejets = 0;

  for (const t of cibles) {
    const debut = Date.now();
    const tentative = new Date().toISOString();
    process.stdout.write(`\n▸ ${t.nom.fr} (NIS ${t.code}) — ${seances} séances\n`);

    try {
      const { items: bruts, ecarte, seancesLues } = await collecter(t, { seances, journal });
      // La validation vit ICI, jamais dans le connecteur : aucun producteur de
      // données ne peut se déclarer conforme lui-même.
      const { valides, rejets } = trier<Item>(ItemSchema, bruts);

      const chemin = join(DOSSIER, `${t.code}.json`);
      await writeFile(chemin, JSON.stringify({
        territoire: t,
        connecteur: CONNECTEUR.id,
        organisme: CONNECTEUR.organisme,
        licence: CONNECTEUR.licence,
        genereLe: tentative,
        seancesDemandees: seances,
        seancesLues,
        total: valides.length,
        // Répartition par registre — le chiffre que l'étape A doit rendre visible.
        parRegistre: {
          digest: valides.filter((i) => i.admission.registre === "digest").length,
          permis: valides.filter((i) => i.admission.registre === "permis").length,
          ecarte: valides.filter((i) => i.admission.registre === "ecarte").length,
        },
        parStatut: {
          adoptee: valides.filter((i) => i.statut === "adoptee").length,
          a_venir: valides.filter((i) => i.statut === "a_venir").length,
        },
        datesIncoherentes: valides.filter((i) => i.datation.etat === "incoherente").length,
        rejetes: rejets.length,
        // Publié tel quel : un écran qui annonce 75 décisions doit pouvoir dire
        // combien de points il n'a pas pu retenir, et pour quelle raison.
        ecarte,
        items: valides,
      }, null, 2), "utf8");

      totalValides += valides.length;
      totalRejets += rejets.length;
      const r = (n: string) => valides.filter((i) => i.admission.registre === n).length;
      journal(`  ${valides.length} actes lus — ${r("digest")} publiés · ${r("permis")} permis · ${r("ecarte")} écartés` +
        ` · ${valides.filter((i) => i.statut === "a_venir").length} à venir` +
        ` · ${valides.filter((i) => i.datation.etat === "incoherente").length} dates incohérentes` +
        ` (${((Date.now() - debut) / 1000).toFixed(1)} s)`);
      const perdu = ecarte.sansDeliberation + ecarte.sansIntitule + ecarte.sansLien;
      if (perdu > 0) {
        journal(`  écartés : ${ecarte.sansDeliberation} sans délibération, ${ecarte.sansIntitule} sans intitulé, ${ecarte.sansLien} sans lien`);
      }
      if (rejets.length) {
        // Ne jamais taire un rejet : c'est ce qui distingue une couverture
        // partielle assumée d'une couverture complète imaginaire.
        for (const r of rejets.slice(0, 3)) journal(`    rejet ${r.id ?? r.index} — ${r.problemes[0]}`);
      }

      etats.push({
        connecteurId: CONNECTEUR.id, organisme: CONNECTEUR.organisme,
        dernierSucces: tentative, derniereTentative: tentative,
        ok: true, rejetes: rejets.length,
      });
    } catch (e) {
      journal(`  ÉCHEC — ${String(e)}`);
      etats.push({
        connecteurId: CONNECTEUR.id, organisme: CONNECTEUR.organisme,
        dernierSucces: null, derniereTentative: tentative,
        ok: false, message: String(e), rejetes: 0,
      });
    }
  }

  await writeFile(join(RACINE, "data", "etat-sources.json"),
    JSON.stringify({ genereLe: new Date().toISOString(), etats }, null, 2), "utf8");

  console.log(`\n═══ ${totalValides} décisions réelles, ${totalRejets} rejetées, ${cibles.length} commune(s) ═══`);
  if (totalValides < 500) {
    console.error(`\n⚠ Critère d'acceptation du Lot 1 non atteint : ${totalValides} < 500 décisions.`);
    process.exitCode = 1;
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

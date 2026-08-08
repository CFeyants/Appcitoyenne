/**
 * Registre de conformité — § 7.5.
 *
 * Il part presque entièrement en « non vérifié », et c'est l'état honnête :
 * affirmer « conforme » ou « manquant » suppose d'avoir ouvert le règlement
 * communal, ce qu'aucune API ne permet et que le robots.txt de kraainem.be
 * interdit de faire par moissonnage.
 *
 * La seule ligne renseignée est l'art. 287, en « non mesurable », avec la
 * preuve : la source ne publie pas de date de publication exploitable.
 */

import { writeFile, mkdir, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  COMMUNES, SOURCE_DECRET, FicheConformiteSchema, trier,
  type FicheConformite,
} from "../packages/core/src/index.ts";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..");
const AUJ = "2026-08-08";

const nonVerifie = (article: string, precision: string) => ({
  article, etat: "non_verifie" as const, provenance: null, verifieLe: null, precision,
});

async function main() {
  await mkdir(join(RACINE, "data", "conformite"), { recursive: true });
  const fiches: FicheConformite[] = [];

  for (const c of COMMUNES) {
    // Ce que l'ingestion a effectivement observé, commune par commune.
    let seancesLues = 0;
    try {
      const snap = JSON.parse(await readFile(join(RACINE, "data", "snapshots", `${c.code}.json`), "utf8"));
      seancesLues = snap.seancesLues ?? 0;
    } catch { /* pas d'instantané : la ligne reste non mesurable */ }

    fiches.push({
      territoire: c.code,
      etabliLe: AUJ,
      lignes: [
        {
          article: "art. 287",
          etat: "non_mesurable",
          provenance: { kind: "source", source: {
            organisme: "Lokaal Beslist — Vlaamse overheid",
            url: "https://lokaalbeslist.vlaanderen.be",
            dateDonnee: AUJ,
            licence: "Modellicentie Gratis Hergebruik",
            consulteLe: AUJ,
          } },
          verifieLe: AUJ,
          precision:
            `Le délai entre adoption et publication n'est pas calculable : le champ « publication-date » de la source ` +
            `place fréquemment la publication AVANT la séance, ce qui est impossible. ` +
            `${seancesLues} séances lues pour cette commune. Voir l'écran « Délai de publication » pour le détail.`,
        },
        nonVerifie("art. 304 §5",
          "Le règlement de participation existe-t-il ? Il faut ouvrir le registre des règlements de la commune ; aucune API ne l'expose."),
        nonVerifie("art. 302",
          "Le règlement de traitement des plaintes existe-t-il ? Même constat : vérification documentaire nécessaire."),
        nonVerifie("art. 303 §3",
          "Le rapport annuel du directeur général au conseil est-il publié ? À rechercher dans les délibérations du conseil."),
        nonVerifie("art. 304 §3",
          "La règle des deux tiers dans les organes consultatifs est-elle respectée ? La composition des conseils consultatifs n'est publiée par aucune source ouverte."),
        nonVerifie("art. 285-286",
          "La commune publie-t-elle bien la liste des décisions et le texte intégral des règlements via sa propre application web ? Constaté indirectement — les décisions nous parviennent — mais non vérifié pour les règlements."),
      ],
    });
  }

  const { valides, rejets } = trier<FicheConformite>(FicheConformiteSchema, fiches);
  for (const r of rejets) console.log(`  rejet ${r.id ?? r.index} — ${r.problemes.join(" ; ")}`);

  for (const f of valides) {
    await writeFile(join(RACINE, "data", "conformite", `${f.territoire}.json`),
      JSON.stringify(f, null, 2), "utf8");
  }

  const parEtat: Record<string, number> = {};
  for (const f of valides) for (const l of f.lignes) parEtat[l.etat] = (parEtat[l.etat] ?? 0) + 1;
  console.log(`  ${valides.length} fiches écrites · ${JSON.stringify(parEtat)}`);
  console.log(`  source du décret : ${SOURCE_DECRET.url}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

/**
 * Export brut de chaque écran — atteint via `/{langue}/{chemin}.json`
 * (réécriture par le middleware). Réversibilité : aucun compte, aucune clé,
 * les mêmes filtres que l'écran, et les poids du classement publiés avec.
 */

import { POIDS, VERSION_PERTINENCE, VERSION_THEMES, estReel } from "@pc/core";
import { ECRANS } from "../../../../lib/nav.ts";
import {
  charger, dansTerritoire, filtrer, parDate, parts, territoireValide, type Filtres,
} from "../../../../lib/donnees.ts";

export async function GET(
  requete: Request,
  { params }: { params: Promise<{ langue: string; chemin: string[] }> },
) {
  const { langue, chemin } = await params;
  const route = chemin.join("/");
  const ecran = ECRANS.find((e) => e.chemin === route);
  if (!ecran) return new Response("écran inconnu", { status: 404 });

  const u = new URL(requete.url);
  const territoire = territoireValide(u.searchParams.get("t") ?? undefined);
  const f: Filtres = {
    theme: u.searchParams.get("theme") ?? undefined,
    organe: u.searchParams.get("organe") ?? undefined,
    q: u.searchParams.get("q") ?? undefined,
    aFaire: u.searchParams.get("aFaire") === "1" || undefined,
  };

  const base = await charger();
  const items = parDate(filtrer(dansTerritoire(base.items, territoire), f));
  const p = parts(items);

  return Response.json({
    ecran: `/${langue}/${route}`,
    territoire,
    genereLe: new Date().toISOString(),
    licence: "Modellicentie Gratis Hergebruik pour les décisions — mention de la source obligatoire",
    avertissement:
      "Cette plateforme n'est pas le support de publication officielle. Les objets de provenance « demonstration » sont fictifs.",
    classement: { version: VERSION_PERTINENCE, poids: POIDS },
    vocabulaires: { themes: VERSION_THEMES },
    verite: { total: p.total, reels: p.reels, demonstration: p.demo, reformules: p.reformules },
    couverture: base.couverture,
    etatSources: base.etats,
    objectifs: ecran.cle === "cap" || ecran.cle === "engagements" ? base.objectifs : undefined,
    projets: ecran.cle === "projets" ? base.projets : undefined,
    demandes: ecran.cle === "entraide" ? base.demandes : undefined,
    conformite: ecran.cle === "conformite" ? base.conformite : undefined,
    items: items.map((i) => ({ ...i, reel: estReel(i.provenance) })),
  }, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

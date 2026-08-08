/**
 * Export brut — brief § 10 : « chaque écran expose son JSON à la même URL
 * suffixée .json ». Réversibilité (règle n° 6) : aucun compte, aucune clé,
 * les mêmes filtres que l'écran.
 */

import { charger, filtrer, trierParDate, type Filtres } from "../../../lib/donnees.ts";
import { POIDS, VERSION_PERTINENCE, VERSION_THEMES } from "@pc/core";

export async function GET(requete: Request, { params }: { params: Promise<{ langue: string }> }) {
  const { langue } = await params;
  const u = new URL(requete.url);
  const f: Filtres = {
    commune: u.searchParams.get("commune") ?? undefined,
    theme: u.searchParams.get("theme") ?? undefined,
    organe: u.searchParams.get("organe") ?? undefined,
    q: u.searchParams.get("q") ?? undefined,
  };

  const { corpus, instantanes, etats } = await charger();
  const items = trierParDate(filtrer(corpus, f));

  return Response.json(
    {
      ecran: `/${langue}/decisions`,
      genereLe: new Date().toISOString(),
      licence: "Modellicentie Gratis Hergebruik — mention de la source obligatoire",
      source: "https://lokaalbeslist.vlaanderen.be",
      filtres: f,
      // Les poids du classement sont publics, ici comme à l'écran (§ 5).
      classement: { version: VERSION_PERTINENCE, poids: POIDS },
      vocabulaires: { themes: VERSION_THEMES },
      couverture: instantanes.map((s) => ({
        territoire: s.territoire.code,
        nom: s.territoire.nom,
        retenues: s.total,
        seancesLues: s.seancesLues,
        ecarte: s.ecarte,
      })),
      etatSources: etats,
      total: items.length,
      items,
    },
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `inline; filename="decisions-${langue}.json"`,
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}

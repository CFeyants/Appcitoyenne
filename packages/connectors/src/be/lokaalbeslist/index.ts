/**
 * Connecteur Lokaal Beslist — décisions des organes communaux flamands.
 *
 * Source : https://lokaalbeslist.vlaanderen.be (JSON:API public, sans clé).
 * Licence : Modellicentie Gratis Hergebruik — mention de la source obligatoire.
 * Fiche complète : /docs/sources/be-lokaalbeslist.md
 *
 * Graphe réel de l'API, établi par appel le 8 août 2026 :
 *
 *   session ──agenda-items──▶ agenda-item ──handled-by──▶ handling ──resolutions──▶ besluit
 *
 * Deux constats qui ont dicté la conception :
 *
 *  1. Les filtres imbriqués ne fonctionnent QUE depuis /sessions. Appeler
 *     /agenda-items ou /resolutions avec un filtre par commune renvoie 406.
 *     On part donc toujours des séances, et on descend par `include`.
 *  2. `resolution.title` vaut presque toujours « Besluit ». Le titre porteur de
 *     sens est celui de l'AGENDA-ITEM. La résolution apporte l'acte, sa date de
 *     publication et son URI ; l'agenda-item apporte l'objet.
 */

import { getJson, type OptionsHttp } from "../../http.ts";
import { themesDe, publicsDe } from "./classement.ts";
import type { Item, Langue, Source } from "@pc/core";
import { TERRITOIRES, type Territoire } from "@pc/core";

const BASE = "https://lokaalbeslist.vlaanderen.be";
const ACCEPT = "application/vnd.api+json";
export const LICENCE = "Modellicentie Gratis Hergebruik";
export const ORGANISME_PORTAIL = "Lokaal Beslist — Vlaamse overheid";

/* ---------- forme brute de l'API ---------- */

interface Ressource {
  id: string;
  type: string;
  attributes?: Record<string, unknown>;
  relationships?: Record<string, { data?: { id: string; type: string } | { id: string; type: string }[] }>;
}
interface Reponse {
  data?: Ressource[];
  included?: Ressource[];
  meta?: { count?: number };
  links?: { next?: string };
}

const filtreCommune = (nom: string) =>
  `filter[governing-body][is-time-specialization-of][administrative-unit][name]=${encodeURIComponent(nom)}`;

/* ---------- nettoyage ---------- */

/** Les champs de l'API arrivent noyés dans l'indentation du HTML d'origine. */
const propre = (v: unknown): string =>
  typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "";

/** Coupe sur une frontière de mot, jamais au milieu. */
function tronquer(s: string, max: number): string {
  if (s.length <= max) return s;
  const coupe = s.slice(0, max - 1);
  const espace = coupe.lastIndexOf(" ");
  return (espace > max * 0.6 ? coupe.slice(0, espace) : coupe).trimEnd() + "…";
}

const LANGUES: Record<string, Langue> = { NLD: "nl", FRA: "fr", DEU: "de", ENG: "en" };
const langueDe = (uri: unknown): Langue => {
  const code = typeof uri === "string" ? uri.split("/").pop() ?? "" : "";
  return LANGUES[code] ?? "nl";
};

/** Une URL exploitable, ou rien — jamais une chaîne bricolée. */
function premiereUrl(...candidats: unknown[]): string | null {
  for (const c of candidats) {
    const v = Array.isArray(c) ? c[0] : c;
    if (typeof v === "string" && /^https?:\/\//i.test(v)) return v;
  }
  return null;
}

/**
 * Lien vers L'ACTE, pas vers la page qui le contient (règle n° 1).
 *
 * Trois cas rencontrés dans le corpus :
 *  · `resolution.value` est parfois l'URL du PDF de la liste des décisions —
 *    c'est le lien le plus direct, on le prend en priorité ;
 *  · `resolution.uri` porte l'ancre de la décision (#puntbesluit<guid>), mais
 *    son chemin est malformé (l'hôte y figure deux fois) — inexploitable tel
 *    quel ; on n'en garde que l'ancre, greffée sur la page d'agenda valide ;
 *  · à défaut, la page d'agenda de la séance, qui s'ouvre toujours.
 */
function lienActe(aRes: Record<string, unknown>, aPoint: Record<string, unknown>, aSeance: Record<string, unknown>): string | null {
  const pdf = premiereUrl(aRes["value"]);
  if (pdf) return pdf;

  const page = premiereUrl(aPoint["alternate-link"], aSeance["uri"]);
  if (!page) return premiereUrl(aRes["uri"], aPoint["uri"]);

  const base = page.split("#")[0]!;
  const ancre = String(aRes["uri"] ?? aPoint["uri"] ?? "").split("#")[1];
  return ancre ? `${base}#${ancre}` : base;
}

/* ---------- lecture ---------- */

interface Options extends OptionsHttp {
  /** Nombre de séances à descendre par commune, les plus récentes d'abord. */
  seances?: number;
  /** Taille de page ; l'API accepte 100 au maximum. */
  taillePage?: number;
}

async function pageSeances(commune: string, taille: number, offset: number, opts: OptionsHttp): Promise<Reponse> {
  const url =
    `${BASE}/sessions?${filtreCommune(commune)}` +
    `&page[size]=${taille}&page[number]=${offset}&sort=-started-at` +
    `&include=agenda-items.handled-by.resolutions,governing-body.is-time-specialization-of`;
  return getJson<Reponse>(url, ACCEPT, opts);
}

/**
 * Ce qui n'a PAS été retenu, et pourquoi. Sans ce décompte, une couverture
 * partielle serait indiscernable d'une couverture complète : c'est précisément
 * le mensonge par omission que le brief interdit.
 */
export interface Ecarte {
  /** Point d'ordre du jour sans besluit rattaché : aucun acte, donc aucun item. */
  sansDeliberation: number;
  /** Ni le point ni le besluit ne portent d'intitulé exploitable. */
  sansIntitule: number;
  /** Aucune URL utilisable : on refuse d'afficher une source qu'on ne peut pas citer. */
  sansLien: number;
}

export interface Recolte {
  items: Item[];
  ecarte: Ecarte;
  seancesLues: number;
}

/**
 * Rend des `Item` NON ENCORE VALIDÉS. La validation Zod est faite par
 * l'appelant (`exigerValide`), pour que le connecteur n'ait aucun moyen de
 * s'auto-absoudre de la règle n° 1.
 */
export async function collecter(territoire: Territoire, options: Options = {}): Promise<Recolte> {
  const { seances = 40, taillePage = 20, ...http } = options;
  const consulteLe = new Date().toISOString();
  const items: Item[] = [];
  const vus = new Set<string>();
  const ecarte: Ecarte = { sansDeliberation: 0, sansIntitule: 0, sansLien: 0 };
  let seancesLues = 0;

  const pages = Math.ceil(seances / taillePage);
  for (let p = 0; p < pages; p++) {
    const rep = await pageSeances(territoire.nomLokaalBeslist, taillePage, p, http);
    const index = new Map<string, Ressource>();
    for (const r of [...(rep.data ?? []), ...(rep.included ?? [])]) index.set(`${r.type}:${r.id}`, r);

    for (const seance of rep.data ?? []) {
      const aSeance = seance.attributes ?? {};
      const dateSeance = propre(aSeance["started-at"] ?? aSeance["planned-start"] ?? aSeance["ended-at"]);
      if (!dateSeance) continue;
      seancesLues++;

      // Nom de l'organe : porté par le bestuursorgaan « parent », pas par sa
      // spécialisation temporelle (qui n'a qu'une date de début).
      const gbRef = seance.relationships?.["governing-body"]?.data;
      const gb = !Array.isArray(gbRef) && gbRef ? index.get(`${gbRef.type}:${gbRef.id}`) : undefined;
      const gbParentRef = gb?.relationships?.["is-time-specialization-of"]?.data;
      const gbParent = !Array.isArray(gbParentRef) && gbParentRef
        ? index.get(`${gbParentRef.type}:${gbParentRef.id}`) : undefined;
      const organe = propre(gbParent?.attributes?.["name"] ?? gb?.attributes?.["name"]) ||
        `Bestuursorgaan ${territoire.nom.nl}`;

      const pointsRef = seance.relationships?.["agenda-items"]?.data;
      const points = Array.isArray(pointsRef) ? pointsRef : pointsRef ? [pointsRef] : [];

      for (const ref of points) {
        const point = index.get(`${ref.type}:${ref.id}`);
        if (!point) { ecarte.sansDeliberation++; continue; }
        const aPoint = point.attributes ?? {};

        // Le besluit, via le traitement du point.
        const hRef = point.relationships?.["handled-by"]?.data;
        const handling = !Array.isArray(hRef) && hRef ? index.get(`${hRef.type}:${hRef.id}`) : undefined;
        const rRefs = handling?.relationships?.["resolutions"]?.data;
        const resolution = Array.isArray(rRefs)
          ? index.get(`${rRefs[0]?.type}:${rRefs[0]?.id}`)
          : rRefs ? index.get(`${rRefs.type}:${rRefs.id}`) : undefined;
        const aRes = resolution?.attributes ?? {};

        // Question 1 du test d'admission : pas de besluit, pas d'acte, pas d'item.
        if (!resolution) { ecarte.sansDeliberation++; continue; }

        // Les six communes n'ont pas le même éditeur. Meetingburger porte
        // l'intitulé sur le POINT ; Gelinkt Notuleren le porte sur le BESLUIT et
        // laisse le point nu. Chercher aux deux endroits n'est pas une
        // précaution : sans cela, Linkebeek perdait 310 décisions sur 340.
        const titreBrut =
          propre(aPoint["title"]) || propre(aRes["title"]) || propre(aPoint["description"]);
        if (!titreBrut || titreBrut.length < 6) { ecarte.sansIntitule++; continue; }

        const url = lienActe(aRes, aPoint, aSeance);
        if (!url) { ecarte.sansLien++; continue; }

        const id = `be-lb-${point.id}`;
        if (vus.has(id)) continue;
        vus.add(id);

        const datePublication = propre(aRes["publication-date"]) || dateSeance.slice(0, 10);

        // Question 2 : la portée. Le corps du besluit quand il est publié ;
        // sinon un énoncé bâti sur les seuls champs de la source, et signalé
        // comme tel par `impactEtabli`.
        const corps = propre(aRes["description"]);
        const corpsUtile = corps.length > 40 && corps.toLowerCase() !== titreBrut.toLowerCase();
        const impact = corpsUtile
          ? tronquer(corps, 600)
          : `Décision de « ${organe} », adoptée en séance du ${dateSeance.slice(0, 10)} et publiée le ${datePublication}. ` +
            `Objet inscrit à l'ordre du jour : « ${tronquer(titreBrut, 200)} ». ` +
            `Le corps de la délibération n'est pas publié sous forme exploitable par cette source : le texte intégral est dans le document d'origine.`;

        const pourClasser = `${titreBrut} ${corps}`;

        const source: Source = {
          organisme: organe,
          url,
          dateDonnee: datePublication,
          licence: LICENCE,
          consulteLe,
        };

        items.push({
          id,
          niveau: "commune",
          territoire: territoire.code,
          type: "decision",
          titre: tronquer(titreBrut, 90),
          langue: langueDe(aRes["language"]),
          impact,
          impactEtabli: corpsUtile ? "texte_publie" : "construit",
          // Question 3 : une délibération déjà adoptée n'appelle rien du citoyen.
          // Le dire est un service ; le taire laisserait croire à une démarche.
          action: {
            kind: "aucune_action",
            explication:
              "Cette décision est déjà adoptée : aucune démarche n'est attendue de votre part. " +
              "Le texte intégral est consultable auprès de la source.",
          },
          themes: themesDe(pourClasser),
          publics: publicsDe(pourClasser),
          entreeEnVigueur: undefined,
          echeance: undefined,
          source,
          objectifsLies: [],
        });
      }
    }

    if ((rep.data ?? []).length < taillePage) break; // plus rien à paginer
  }
  return { items, ecarte, seancesLues };
}

/** Nombre total de séances indexées pour une commune — sert au test de contrat. */
export async function compterSeances(commune: string, opts: OptionsHttp = {}): Promise<number> {
  const rep = await getJson<Reponse>(
    `${BASE}/sessions?${filtreCommune(commune)}&page[size]=1&sort=-started-at`, ACCEPT, opts);
  return rep.meta?.count ?? 0;
}

export const CONNECTEUR = {
  id: "be-lokaalbeslist",
  organisme: ORGANISME_PORTAIL,
  licence: LICENCE,
  territoires: TERRITOIRES,
  collecter,
};

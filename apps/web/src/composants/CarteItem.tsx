/**
 * La carte de liste — B3 du Lot 9 : QUATRE blocs, pas davantage.
 *
 *   1. le titre en français ordinaire
 *   2. l'impact en deux lignes
 *   3. la puce d'action
 *   4. une ligne de source discrète, avec le lien vers l'acte
 *
 * Tout le reste — licence, date de publication, délai, thèmes secondaires,
 * texte publié par l'autorité, objectifs rattachés — descend sur la fiche de
 * détail. Rien n'est perdu : c'est ce que « montrer l'important, garder le
 * détail accessible » veut dire concrètement.
 *
 * La puce « À qualifier » a disparu de la vue publique : c'était un état de
 * production interne. Un item non reformulé porte « texte original seulement ».
 */

import { PuceStatut, BadgeProvenance } from "@pc/ui";
import { estReel, titreAffiche, nomOrganeCourt, type Item } from "@pc/core";
import { dico, type LangueUI } from "../i18n/index.ts";
import { organeDe } from "../lib/donnees.ts";

export const jourCourt = (iso: string | null, langue: LangueUI) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(`${langue}-BE`, { day: "numeric", month: "short", year: "numeric" });
  } catch { return iso; }
};

export function CarteItem({ item, langue, href, avecOrgane = false }: {
  item: Item; langue: LangueUI; href: string;
  /** Vrai hors regroupement par séance, où l'organe est porté par l'intertitre. */
  avecOrgane?: boolean;
}) {
  const t = dico(langue);
  const reel = estReel(item.provenance);
  const source = item.provenance.kind === "source" ? item.provenance.source : null;

  // 3 — l'action. Un point à venir n'appelle rien : il s'annonce.
  const action = item.statut === "a_venir"
    ? <PuceStatut ton="qualifier" icone="◷">{t.carte.aLOrdreDuJour}</PuceStatut>
    : item.action.kind === "demarche"
      ? <PuceStatut ton="faire" icone="●">{t.carte.demarche}</PuceStatut>
      : item.action.kind === "consultation"
        ? <PuceStatut ton="echeance" icone="▲">{t.carte.echeance}</PuceStatut>
        : item.action.kind === "seance"
          ? <PuceStatut ton="faire" icone="●">{t.carte.seance}</PuceStatut>
          : <PuceStatut ton="rien" icone="■">{t.carte.rienAFaire}</PuceStatut>;

  return (
    <article className="carte carte-legere">
      {(avecOrgane || !reel || !item.redige) && (
        <div className="meta">
          {avecOrgane && reel && <span className="meta-organe">{nomOrganeCourt(organeDe(item), langue)}</span>}
          {avecOrgane && reel && item.datation.adoption && (
            <><span className="meta-sep" aria-hidden="true">·</span>
            <span>{jourCourt(item.datation.adoption, langue)}</span></>
          )}
          {!reel && <BadgeProvenance variante="demo">{t.carte.demo}</BadgeProvenance>}
          {reel && !item.redige && <BadgeProvenance variante="brut">{t.carte.texteOriginal}</BadgeProvenance>}
        </div>
      )}

      {/* 1 — le titre */}
      <h3 className="carte-titre">
        <a href={href}>{titreAffiche(item)}</a>
      </h3>

      {/* 2 — l'impact */}
      <p className={item.redige ? "impact" : "impact impact-absent"}>
        {item.redige ? item.redige.impact : t.carte.pasReformuleTexte}
      </p>

      {/* 3 — l'action */}
      <div className="rangee">{action}</div>

      {/* 4 — la source, brève */}
      <p className="carte-source-breve">
        {source
          ? <><a href={source.url} target="_blank" rel="noreferrer">{t.carte.voirActe} ↗</a>
              {" · "}{nomOrganeCourt(source.organisme, langue)}</>
          : t.carte.demoSource}
        {" · "}<a href={href}>{t.carte.detail} →</a>
      </p>
    </article>
  );
}

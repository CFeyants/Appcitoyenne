/**
 * La carte de décision — anatomie imposée par le Lot 8, dans cet ordre :
 * métadonnées · titre en français ordinaire · impact · action et thèmes ·
 * repli du texte officiel · pied de source.
 *
 * Le point central : le texte administratif néerlandais n'est JAMAIS le contenu
 * principal. Il est replié. Quand personne n'a encore écrit ce que la décision
 * change, on l'écrit — on ne comble pas avec un extrait de l'acte.
 */

import { Carte, LigneMeta, BadgeProvenance, PuceStatut, Etiquettes, TexteOfficielReplie, PiedSource } from "@pc/ui";
import { themeParId, nomTerritoire, estReel, titreAffiche, type Item } from "@pc/core";
import { dico, type LangueUI } from "../i18n/index.ts";
import { organeDe, dateDe } from "../lib/donnees.ts";

const jour = (iso: string, langue: LangueUI) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(`${langue}-BE`, { day: "numeric", month: "long", year: "numeric" });
  } catch { return iso; }
};

export function CarteItem({ item, langue }: { item: Item; langue: LangueUI }) {
  const t = dico(langue);
  const reel = estReel(item.provenance);
  const source = item.provenance.kind === "source" ? item.provenance.source : null;
  const reformule = item.redige !== null;

  const badges = (
    <>
      {!reel && <BadgeProvenance variante="demo">{t.carte.demo}</BadgeProvenance>}
      {reel && !reformule && <BadgeProvenance variante="brut">{t.carte.pasReformule}</BadgeProvenance>}
      {item.redige?.brouillon && <BadgeProvenance variante="brut">{t.carte.brouillon}</BadgeProvenance>}
    </>
  );

  const action = (() => {
    switch (item.action.kind) {
      case "demarche":
        return <PuceStatut ton="faire" icone="●">{t.carte.demarche}</PuceStatut>;
      case "consultation":
        return <PuceStatut ton="echeance" icone="▲">{t.carte.echeance} {jour(item.action.clotureLe, langue)}</PuceStatut>;
      case "seance":
        return <PuceStatut ton="faire" icone="●">{t.carte.seance}</PuceStatut>;
      case "a_qualifier":
        return <PuceStatut ton="qualifier" icone="○">{t.carte.aQualifier}</PuceStatut>;
      default:
        return <PuceStatut ton="rien" icone="■">{t.carte.rienAFaire}</PuceStatut>;
    }
  })();

  return (
    <Carte
      meta={
        <LigneMeta
          organe={organeDe(item)}
          territoire={nomTerritoire(item.territoire, langue)}
          date={jour(dateDe(item), langue)}
          badges={badges}
        />
      }
      titre={titreAffiche(item)}
      impact={item.redige ? item.redige.impact : t.carte.pasReformuleTexte}
      impactAbsent={!item.redige}
      action={action}
      etiquettes={<Etiquettes items={item.themes.map((x) => themeParId(x)?.label[langue] ?? x)} />}
      officiel={
        item.officiel.texte
          ? <TexteOfficielReplie
              resume={`${t.carte.voirTexte} — ${item.officiel.langue.toUpperCase()}`}
              texte={item.officiel.texte}
              langue={item.officiel.langue}
            />
          : undefined
      }
      source={
        <PiedSource>
          {source ? (
            <>
              <a href={source.url} target="_blank" rel="noreferrer">{t.carte.voirActe} ↗</a>
              {item.dateAdoption && <span>{t.carte.adopteeLe} {jour(item.dateAdoption, langue)}</span>}
              <span>{t.carte.publieLe} {jour(source.dateDonnee, langue)}</span>
              <span>{source.licence}</span>
            </>
          ) : (
            <span>{t.carte.demoSource}</span>
          )}
        </PiedSource>
      }
    />
  );
}

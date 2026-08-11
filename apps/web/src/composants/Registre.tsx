/**
 * Les trois niveaux de profondeur — étape B du Lot 9.
 *
 *   digest → registre → fiche
 *
 * Chaque niveau contient tout ce que contient le précédent, en plus détaillé.
 * Rien ne disparaît : ce qui n'est pas essentiel descend d'un cran.
 */

import {
  BarreFiltres, ChampRecherche, PuceMenu, Puce, EtatVide, Pagination,
  LigneContexte, Detail, MessageCle, Encart,
} from "@pc/ui";
import {
  themeParId, nomOrgane, nomOrganeCourt, estReel, titreAffiche, motifParId,
  delaiPublication, nomTerritoire, type Item,
} from "@pc/core";
import { dico, type LangueUI } from "../i18n/index.ts";
import { organeDe } from "../lib/donnees.ts";
import { CarteItem, jourCourt } from "./CarteItem.tsx";
import { Apparition } from "./Apparition.tsx";

/* ------------------------------------------------------------------ */
/* B1 — le digest                                                      */
/* ------------------------------------------------------------------ */

export function Digest({ items, examines, retenus, periode, langue, hrefRegistre, hrefThemes, hrefCeQuiEntre }: {
  items: Item[]; examines: number; retenus: number; periode: string;
  langue: LangueUI; hrefRegistre: string; hrefThemes: string; hrefCeQuiEntre: string;
}) {
  const t = dico(langue);
  // Aucun item non reformulé n'entre dans le digest : un citoyen n'a pas à
  // déchiffrer du néerlandais administratif sur sa page d'accueil.
  const reformules = items.filter((i) => i.redige && !i.redige.brouillon);

  // Le RÉEL passe devant. Sans cette clause, les objets de démonstration — tous
  // reformulés par construction et datés du jour de la migration — évincent les
  // vraies décisions de l'écran le plus important du produit.
  const sept = [...reformules]
    .sort((a, b) => Number(estReel(b.provenance)) - Number(estReel(a.provenance)))
    .slice(0, 7);
  const reelsAffiches = sept.filter((i) => estReel(i.provenance)).length;

  return (
    <>
      <LigneContexte
        texte={`${examines} ${t.carte.actesExamines}, ${retenus} ${t.carte.retenus}, ${reformules.length} ${t.carte.reformules} — ${periode}.`}
        lienLibelle={t.carte.ceQuiEntre}
        lienHref={hrefCeQuiEntre}
      />

      {/* Tant que rien n'est déclaré, on ne prétend pas trier selon des
          critères déclarés. On le dit, et on propose — sans insister. */}
      <Encart>
        {t.carte.riennEstDeduit} <a href={hrefThemes}>{t.carte.choisirThemes} →</a>
      </Encart>

      {sept.length === 0 ? (
        <EtatVide titre={t.carte.digestVide} texte={t.vide.texte} />
      ) : (
        <>
          <p className="ligne-contexte">
            {reelsAffiches === 1
              ? (langue === "nl" ? "Eén besluit betreft u." : langue === "en" ? "One decision concerns you." : "Une décision vous concerne.")
              : (langue === "nl" ? `${reelsAffiches} besluiten betreffen u.` : langue === "en" ? `${reelsAffiches} decisions concern you.` : `${reelsAffiches} décisions vous concernent.`)}
            {sept.length > reelsAffiches && (
              langue === "nl" ? ` ${sept.length - reelsAffiches} demonstratieobjecten vullen aan.`
                : langue === "en" ? ` ${sept.length - reelsAffiches} demonstration objects complete the list.`
                : ` ${sept.length - reelsAffiches} objets de démonstration complètent la liste.`)}
          </p>
          {sept.map((i, n) => (
            <Apparition key={i.id} index={n}>
              <CarteItem item={i} langue={langue} href={`#${i.id}`} avecOrgane />
            </Apparition>
          ))}
        </>
      )}

      <p style={{ marginTop: 20 }}>
        <a className="bouton bouton-secondaire" href={hrefRegistre}>{t.carte.registreComplet} →</a>
      </p>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* B2 — le registre complet                                            */
/* ------------------------------------------------------------------ */

/** Regroupe par séance : l'organe et la date sont portés par l'intertitre. */
function grouper(items: Item[], langue: LangueUI) {
  const groupes = new Map<string, { titre: string; items: Item[] }>();
  for (const i of items) {
    const d = i.datation.adoption ?? "";
    const org = estReel(i.provenance) ? nomOrganeCourt(organeDe(i), langue) : "—";
    const cle = `${d}|${org}`;
    if (!groupes.has(cle)) {
      groupes.set(cle, { titre: `${dico(langue).carte.seanceDu} ${jourCourt(d, langue)} · ${org}`, items: [] });
    }
    groupes.get(cle)!.items.push(i);
  }
  return [...groupes.values()];
}

export function RegistreComplet({
  items, tousItems, filtres, langue, lien, page, pages, hrefItem, hrefEcartes,
}: {
  items: Item[]; tousItems: Item[];
  filtres: { theme?: string; organe?: string; q?: string; demo?: boolean };
  langue: LangueUI;
  lien: (extra: Record<string, string | number | undefined>) => string;
  page: number; pages: number;
  hrefItem: (i: Item) => string;
  hrefEcartes: string;
}) {
  const t = dico(langue);
  const reels = items.filter((i) => estReel(i.provenance)).length;

  // Les organes de la maquette ne sont pas des organes : ils sortent du filtre.
  const organes = [...new Set(tousItems.filter((i) => estReel(i.provenance)).map(organeDe))]
    .sort((a, b) => a.localeCompare(b, "nl"));
  const themes = [...new Set(tousItems.flatMap((i) => i.themes))].sort();

  return (
    <>
      <div className="ligne-resultats">
        <span className="compte">
          <b>{items.length.toLocaleString(`${langue}-BE`)}</b> {t.compteurs.decisions}
          {items.length - reels > 0 && `, ${t.carte.dont} ${items.length - reels} ${t.carte.deDemonstration}`}
        </span>
        <a style={{ marginLeft: "auto", fontSize: 12.5 }} href={hrefEcartes}>{t.carte.ecartes} →</a>
      </div>

      {/* Les filtres sont REPLIÉS : vingt-six thèmes en liste permanente sont un mur. */}
      <details className="filtres-replies">
        <summary className="puce">{t.carte.filtrer} <span className="puce-caret" aria-hidden="true">▾</span></summary>

        <BarreFiltres>
          <ChampRecherche nom="q" valeur={filtres.q} etiquette={t.filtres.rechercheEtiquette}
            placeholder={t.filtres.recherche} />
          <button className="puce" type="submit">{t.filtres.filtrer}</button>
        </BarreFiltres>

        <div className="filtres" style={{ marginTop: 8 }}>
          <PuceMenu libelle={t.filtres.theme} valeurActive={filtres.theme}
            options={[{ valeur: "", libelle: t.filtres.tous, href: lien({ theme: undefined, page: undefined }) },
              ...themes.map((x) => ({ valeur: x, libelle: themeParId(x)?.label[langue] ?? x,
                href: lien({ theme: x, page: undefined }) }))]} />
          <PuceMenu libelle={t.filtres.organe} valeurActive={filtres.organe}
            options={[{ valeur: "", libelle: t.filtres.tous, href: lien({ organe: undefined, page: undefined }) },
              // Nom français en premier, dénomination d'origine ensuite.
              ...organes.map((o) => ({ valeur: o, libelle: `${nomOrgane(o, langue)} — ${o}`,
                href: lien({ organe: o, page: undefined }) }))]} />
          {/* La démonstration a son propre interrupteur : ce n'est pas un organe. */}
          <Puce href={lien({ demo: filtres.demo ? undefined : "1", page: undefined })} actif={filtres.demo}>
            {t.carte.demo}
          </Puce>
        </div>
      </details>

      {items.length === 0 ? (
        <EtatVide titre={t.vide.titre} texte={t.vide.filtre} />
      ) : (
        grouper(items, langue).map((g) => (
          <section key={g.titre}>
            <h2 className="groupe-titre">{g.titre} <span>· {g.items.length}</span></h2>
            {g.items.map((i, n) => (
              <Apparition key={i.id} index={n}>
                <CarteItem item={i} langue={langue} href={hrefItem(i)} />
              </Apparition>
            ))}
          </section>
        ))
      )}

      <Pagination page={page} pages={pages}
        hrefPrecedent={page > 1 ? lien({ page: page - 1 }) : undefined}
        hrefSuivant={page < pages ? lien({ page: page + 1 }) : undefined}
        libelles={{ page: t.pagination.page, precedent: t.pagination.precedent, suivant: t.pagination.suivant }} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* B4 — la fiche de détail : rien n'est caché                           */
/* ------------------------------------------------------------------ */

export function FicheItem({ item, langue }: { item: Item; langue: LangueUI }) {
  const t = dico(langue);
  const source = item.provenance.kind === "source" ? item.provenance.source : null;
  const d = item.datation;
  const delai = delaiPublication(d);

  return (
    <>
      <div className="meta">
        {source && <span className="meta-organe">{nomOrgane(source.organisme, langue)}</span>}
        <span className="meta-sep" aria-hidden="true">·</span>
        <span>{nomTerritoire(item.territoire, langue)}</span>
      </div>

      <h1>{titreAffiche(item)}</h1>

      {item.statut === "a_venir" ? (
        <Encart variante="alerte">
          <strong>{t.carte.aLOrdreDuJour}.</strong>{" "}
          {t.carte.inscritOdj} {jourCourt(d.adoption, langue)}. {t.carte.pasReformuleTexte}
        </Encart>
      ) : (
        <p className="lede">{item.redige ? item.redige.impact : t.carte.pasReformuleTexte}</p>
      )}

      {source && (
        <MessageCle
          fait={item.redige ? item.redige.titre : titreAffiche(item)}
          source={{
            organisme: nomOrgane(source.organisme, langue),
            date: jourCourt(d.adoption ?? source.dateDonnee, langue),
            url: source.url,
            licence: source.licence,
          }}
        />
      )}

      {/* Toutes les dates, avec leur signification — et le refus de calculer. */}
      <h2 style={{ marginTop: 24 }}>{t.juridique.article} 287</h2>
      <div className="defilable">
        <table>
          <tbody>
            <tr><td>{t.carte.adopteeLe}</td><td className="num">{jourCourt(d.adoption, langue) || "—"}</td></tr>
            <tr><td>{t.carte.publieLe}</td><td className="num">{jourCourt(d.publication, langue) || "—"}</td></tr>
            <tr>
              <td>{t.juridique.jours}</td>
              <td className="num">
                {delai !== null
                  ? `${delai} ${t.juridique.jours}`
                  : <em style={{ color: "var(--warning)" }}>{t.carte.datesIncoherentes}</em>}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {d.etat === "incoherente" && (
        <Encart variante="alerte">
          {langue === "nl"
            ? "De bron plaatst de bekendmaking vóór de zitting, wat onmogelijk is. Er wordt hier geen termijn berekend."
            : langue === "en"
            ? "The source places publication before the session, which is impossible. No delay is computed here."
            : "La source place la publication avant la séance, ce qui est impossible. Aucun délai n’est calculé ici."}
        </Encart>
      )}

      {item.officiel.texte && (
        <Detail resume={`${t.carte.voirTexte} — ${item.officiel.langue.toUpperCase()}`}>
          <p className="repli-texte" lang={item.officiel.langue}>{item.officiel.texte}</p>
        </Detail>
      )}

      <Detail resume={`${t.carte.motif} · ${t.filtres.theme} · JSON`}>
        <p style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
          <strong>{t.carte.motif} :</strong> {motifParId(item.admission.motif)?.libelle[langue] ?? item.admission.motif}
          {" — "}{item.admission.registre}
        </p>
        <p style={{ fontSize: 12.5, marginTop: 8 }}>
          <strong>{t.filtres.theme} :</strong>{" "}
          {item.themes.map((x) => themeParId(x)?.label[langue] ?? x).join(", ")}
        </p>
        {source && (
          <p style={{ fontSize: 12.5, marginTop: 8 }}>
            <strong>{t.carte.licence} :</strong> {source.licence} · {source.consulteLe.slice(0, 10)}
          </p>
        )}
        <pre className="repli-texte" style={{ marginTop: 10, fontSize: 11.5 }}>
          {JSON.stringify(item, null, 2)}
        </pre>
      </Detail>
    </>
  );
}

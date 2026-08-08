/**
 * Les seize écrans, un seul fichier.
 *
 * Le niveau de territoire est un FILTRE, pas une rubrique : la grammaire est la
 * même partout, seul le cadrage change. Un écran sans données à ce niveau ne
 * disparaît pas du menu — il dit ce qu'il montrera.
 */

import { notFound, redirect } from "next/navigation";
import {
  EtatVide, EtatSourceIndisponible, BarreFiltres, ChampRecherche, PuceMenu, Puce,
  Panneau, TuileIndicateur, Jauge, PanneauPourquoi, Encart, EncartJuridique,
  EtatConformiteBadge, BoutonExportJson, Pagination, VueTableau,
} from "@pc/ui";
import {
  themeParId, nomTerritoire, territoireParCode, estReel, ARTICLES, articleParId,
  MESSAGE_SANS_REGLEMENT, type Item,
} from "@pc/core";
import { dico, estLangue, type LangueUI } from "../../../i18n/index.ts";
import { ECRANS, lien } from "../../../lib/nav.ts";
import {
  charger, dansTerritoire, filtrer, parDate, organes, themesPresents, parts,
  territoireValide, organeDe, type Filtres,
} from "../../../lib/donnees.ts";
import { Cadre } from "../../../composants/Cadre.tsx";
import { CarteItem } from "../../../composants/CarteItem.tsx";

const PAR_PAGE = 20;
const un = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

type Params = Promise<{ langue: string; chemin?: string[] }>;
type Query = Promise<Record<string, string | string[] | undefined>>;

/** Anciennes URL du Lot 1 : redirigées, jamais orphelines. */
const REDIRECTIONS: Record<string, string> = {
  decisions: "decider/decisions",
  "a-propos": "comment-ca-marche",
};

export default async function Ecran({ params, searchParams }: { params: Params; searchParams: Query }) {
  const { langue, chemin } = await params;
  if (!estLangue(langue)) notFound();
  const sp = await searchParams;
  const route = (chemin ?? []).join("/");

  if (!route) redirect(`/${langue}/pour-vous`);
  if (REDIRECTIONS[route]) redirect(`/${langue}/${REDIRECTIONS[route]}`);

  const ecran = ECRANS.find((e) => e.chemin === route);
  if (!ecran) notFound();

  const l = langue as LangueUI;
  const t = dico(l);
  const territoire = territoireValide(un(sp.t));
  const meta = (t.ecrans as Record<string, { titre: string; lede: string }>)[ecran.cle]!;

  const f: Filtres = {
    theme: un(sp.theme) || undefined,
    organe: un(sp.organe) || undefined,
    q: un(sp.q) || undefined,
    aFaire: un(sp.aFaire) === "1" || undefined,
  };
  const page = Math.max(1, Number(un(sp.page)) || 1);
  const extra = { ...f, aFaire: f.aFaire ? "1" : undefined, page: page > 1 ? page : undefined } as Record<string, string | number | undefined>;

  const base = await charger();
  const ctx = { langue: l, territoire, extra };

  /* --------------- quels objets cet écran montre-t-il ? --------------- */
  const tousItems = dansTerritoire(base.items, territoire);
  const parType = (types: Item["type"][]) => tousItems.filter((i) => types.includes(i.type));

  let items: Item[] = [];
  let corpsSpecifique: React.ReactNode = null;

  switch (ecran.cle) {
    case "pourVous": items = tousItems; break;
    case "decisions": items = parType(["decision", "regle"]); break;
    case "seances": items = parType(["seance"]); break;
    case "consultations": items = parType(["consultation"]); break;
    case "famillesJeunes":
      items = tousItems.filter((i) => i.themes.some((x) => ["jeunesse", "enfance", "culture", "sport", "education"].includes(x)));
      break;
    default: items = [];
  }

  const filtres = parDate(filtrer(items, f));
  const pages = Math.max(1, Math.ceil(filtres.length / PAR_PAGE));
  const courante = Math.min(page, pages);
  const tranche = filtres.slice((courante - 1) * PAR_PAGE, courante * PAR_PAGE);
  const p = parts(filtres);

  /* --------------- écrans à contenu propre --------------- */
  if (ecran.cle === "conformite") {
    const fiche = base.conformite.find((c) => c.territoire === territoire);
    const libelleEtat: Record<string, string> = {
      conforme: t.juridique.conforme, manquant: t.juridique.manquant,
      non_verifie: t.juridique.nonVerifie, non_mesurable: t.juridique.nonMesurable,
    };
    corpsSpecifique = fiche ? (
      <>
        <Encart variante="loi">{t.juridique.pasSupportOfficiel}</Encart>
        <div className="defilable">
          <table>
            <thead>
              <tr><th>{t.juridique.article}</th><th>{t.juridique.etat}</th><th>{t.juridique.precision}</th></tr>
            </thead>
            <tbody>
              {fiche.lignes.map((ligne) => {
                const a = articleParId(ligne.article);
                return (
                  <tr key={ligne.article}>
                    <td>
                      <strong>{ligne.article}</strong>
                      {a && <><br /><span style={{ fontSize: 12, color: "var(--muted)" }}>{a.intitule[l]}</span></>}
                    </td>
                    <td><EtatConformiteBadge etat={ligne.etat} libelle={libelleEtat[ligne.etat]!} /></td>
                    <td style={{ fontSize: 12.5, color: "var(--text-secondary)", textAlign: "left" }}>{ligne.precision}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </>
    ) : <EtatVide titre={t.vide.titre} texte={t.vide.texte} />;
  }

  if (ecran.cle === "publication") {
    const art = articleParId("art. 287")!;
    corpsSpecifique = (
      <>
        <EncartJuridique article={art.id} obligation={art.obligation[l]} url={art.url} libelleLien={t.juridique.voirTexte} />
        <Encart variante="alerte">
          <strong>{t.juridique.nonMesurable}.</strong>{" "}
          Le champ « publication-date » de Lokaal Beslist place fréquemment la publication <em>avant</em> la séance,
          ce qui est impossible. À Kraainem, 38 séances sur 40 présentent un délai négatif. Aucune autre source
          n'expose la date de publication au sens de l'article 287 : nous ne calculons donc rien.
        </Encart>
        <div className="defilable">
          <table>
            <thead>
              <tr><th>{t.nav.territoire}</th><th className="num">{t.compteurs.seancesLues}</th><th className="num">{t.compteurs.retenues}</th></tr>
            </thead>
            <tbody>
              {base.couverture.map((c) => (
                <tr key={c.territoire}>
                  <td>{nomTerritoire(c.territoire, l)}</td>
                  <td className="num">{c.seancesLues}</td>
                  <td className="num">{c.retenues}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  if (ecran.cle === "propositions") {
    const art = articleParId("art. 304 §5")!;
    corpsSpecifique = (
      <>
        <EncartJuridique article={art.id} obligation={art.obligation[l]} url={art.url} libelleLien={t.juridique.voirTexte} />
        {/* cadreJuridique est null pour les six communes : aucun règlement vérifié. */}
        <Encart variante="alerte">{MESSAGE_SANS_REGLEMENT[l]}</Encart>
        <EtatVide titre={t.vide.titre} texte={t.vide.aVenir} />
      </>
    );
  }

  if (ecran.cle === "questions" || ecran.cle === "enveloppes" || ecran.cle === "droits"
      || ecran.cle === "cap" || ecran.cle === "budget" || ecran.cle === "engagements"
      || ecran.cle === "entraide" || ecran.cle === "projets" || ecran.cle === "commentCaMarche") {
    const articleLie: Record<string, string> = {
      questions: "art. 302", enveloppes: "art. 304 §6", cap: "art. 285-286",
    };
    const a = articleLie[ecran.cle] ? articleParId(articleLie[ecran.cle]!) : null;
    corpsSpecifique = (
      <>
        {a && <EncartJuridique article={a.id} obligation={a.obligation[l]} url={a.url} libelleLien={t.juridique.voirTexte} />}
        {ecran.cle === "commentCaMarche" && (
          <div className="defilable">
            <table>
              <thead><tr><th>{t.juridique.article}</th><th>{t.compteurs.pourquoi}</th></tr></thead>
              <tbody>
                {ARTICLES.map((x) => (
                  <tr key={x.id}>
                    <td><strong>{x.id}</strong></td>
                    <td style={{ textAlign: "left", fontSize: 12.5 }}>{x.obligation[l]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <EtatVide titre={t.vide.titre} texte={t.vide.aVenir} />
      </>
    );
  }

  /* --------------- panneaux latéraux --------------- */
  const enPanne = base.etats.filter((e) => !e.ok);
  const panneaux = (
    <>
      {enPanne.length > 0 && (
        <EtatSourceIndisponible titre={t.degrade.titre} texte={`${t.degrade.texte} ${base.genereLe.slice(0, 10)}`} />
      )}
      <Panneau titre={t.compteurs.partReelle}>
        <TuileIndicateur valeur={`${p.pctReel} %`} legende={t.compteurs.partReelleLegende}>
          <Jauge pourcentage={p.pctReel} couleur="var(--good)" libelle={`${p.pctReel} %`} />
          <p>{p.reels} / {p.total}</p>
        </TuileIndicateur>
      </Panneau>
      <Panneau titre={t.compteurs.reformulation}>
        <TuileIndicateur valeur={`${p.pctReformule} %`} legende={t.compteurs.reformulationLegende}>
          <Jauge pourcentage={p.pctReformule} couleur="var(--accent-solide)" libelle={`${p.pctReformule} %`} />
          <p>{t.compteurs.reformulationNote}</p>
        </TuileIndicateur>
      </Panneau>
      <PanneauPourquoi titre={t.compteurs.pourquoi} phrase={t.compteurs.pourquoiTexte} />
    </>
  );

  const listeVisible = corpsSpecifique === null;

  return (
    <Cadre langue={l} territoire={territoire} chemin={route} extra={extra} panneaux={panneaux}>
      <h1>{meta.titre}</h1>
      <p className="lede">{meta.lede}</p>

      {listeVisible && items.length > 0 && (
        <>
          <BarreFiltres>
            <input type="hidden" name="t" value={territoire} />
            <ChampRecherche nom="q" valeur={f.q} etiquette={t.filtres.rechercheEtiquette} placeholder={t.filtres.recherche} />
            <button className="puce" type="submit">{t.filtres.filtrer}</button>
          </BarreFiltres>

          <div className="filtres" style={{ marginTop: 8 }}>
            <PuceMenu libelle={t.filtres.theme} valeurActive={f.theme}
              options={[{ valeur: "", libelle: t.filtres.tous, href: lien(route, ctx, { theme: undefined, page: undefined }) },
                ...themesPresents(items).map((x) => ({
                  valeur: x, libelle: themeParId(x)?.label[l] ?? x,
                  href: lien(route, ctx, { theme: x, page: undefined }),
                }))]} />
            <PuceMenu libelle={t.filtres.organe} valeurActive={f.organe}
              options={[{ valeur: "", libelle: t.filtres.tous, href: lien(route, ctx, { organe: undefined, page: undefined }) },
                ...organes(items).map((o) => ({ valeur: o, libelle: o, href: lien(route, ctx, { organe: o, page: undefined }) }))]} />
            <Puce href={lien(route, ctx, { aFaire: f.aFaire ? undefined : "1", page: undefined })} actif={f.aFaire}>
              {t.filtres.aFaire}
            </Puce>
          </div>

          <div className="ligne-resultats">
            <span className="compte">
              <b>{filtres.length.toLocaleString(`${l}-BE`)}</b> {t.compteurs.decisions}
              {" · "}{p.reels} {t.compteurs.partReelleLegende.split(" ")[0]}
              {p.demo > 0 && ` · ${p.demo} ${t.carte.demo.toLowerCase()}`}
            </span>
          </div>

          {tranche.length === 0
            ? <EtatVide titre={t.vide.titre} texte={t.vide.filtre} />
            : tranche.map((i) => <CarteItem key={i.id} item={i} langue={l} />)}

          <Pagination page={courante} pages={pages}
            hrefPrecedent={courante > 1 ? lien(route, ctx, { page: courante - 1 }) : undefined}
            hrefSuivant={courante < pages ? lien(route, ctx, { page: courante + 1 }) : undefined}
            libelles={{ page: t.pagination.page, precedent: t.pagination.precedent, suivant: t.pagination.suivant }} />

          <VueTableau
            libelleOuvrir={t.tableau.ouvrir} libelleFermer={t.tableau.fermer}
            entetes={[t.juridique.article, t.filtres.organe, t.carte.publieLe]}
            lignes={tranche.map((i) => [
              i.redige?.titre ?? i.officiel.titre,
              organeDe(i),
              estReel(i.provenance) ? i.provenance.source.dateDonnee : "—",
            ])} />
        </>
      )}

      {listeVisible && items.length === 0 && (
        <EtatVide titre={t.vide.titre}
          texte={`${t.vide.texte} (${nomTerritoire(territoire, l)}, ${territoireParCode(territoire)?.niveau})`} />
      )}

      {corpsSpecifique}

      <BoutonExportJson href={`/${l}/${route}.json?t=${territoire}`} libelle={t.export.libelle} note={t.export.note} />
    </Cadre>
  );
}

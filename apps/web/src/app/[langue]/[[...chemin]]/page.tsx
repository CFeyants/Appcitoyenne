/**
 * Les écrans, un seul fichier — étapes B et C du Lot 9.
 *
 * Cinq parties : Pour vous · Les objectifs · Les statuts · Participer ·
 * Soutenir. L'ordre va de ce qui touche l'utilisateur aujourd'hui à ce qu'il
 * peut engager demain.
 *
 * Trois niveaux de profondeur partout : digest → registre → fiche.
 */

import { notFound, redirect } from "next/navigation";
import {
  EtatVide, EtatSourceIndisponible, Panneau, TuileIndicateur, Jauge,
  PanneauPourquoi, Encart, EncartJuridique, EtatConformiteBadge,
  BoutonExportJson, Graphique, MessageCle, LigneContexte,
} from "@pc/ui";
import {
  themeParId, nomTerritoire, territoireParCode, estReel, articleParId, ARTICLES,
  motifParId, MOTIFS_EXCLUSION, MOTIFS_INCLUSION, MOTIF_PERMIS, nomOrgane,
  type Item,
} from "@pc/core";
import { dico, estLangue, type LangueUI } from "../../../i18n/index.ts";
import { ECRANS, REDIRECTIONS, lien as lienNav } from "../../../lib/nav.ts";
import {
  charger, dansTerritoire, filtrer, parDate, parts, territoireValide, organeDe,
  type Filtres,
} from "../../../lib/donnees.ts";
import { Cadre } from "../../../composants/Cadre.tsx";
import { Digest, RegistreComplet, FicheItem } from "../../../composants/Registre.tsx";
import {
  EcranCap, EcranEngagements, EcranBudget, EcranEntraide, EcranProjets,
} from "../../../composants/Ecrans.tsx";
import { EcranPropositions } from "../../../composants/Propositions.tsx";

const PAR_PAGE = 20;
const un = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

type Params = Promise<{ langue: string; chemin?: string[] }>;
type Query = Promise<Record<string, string | string[] | undefined>>;

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
  };
  const demo = un(sp.demo) === "1";
  const page = Math.max(1, Number(un(sp.page)) || 1);
  const fiche = un(sp.item) || undefined;
  const extra = { ...f, demo: demo ? "1" : undefined, page: page > 1 ? page : undefined, item: fiche };

  const base = await charger();
  const ctx = { langue: l, territoire, extra };
  const url = (chemin2: string, e: Record<string, string | number | undefined> = {}) => lienNav(chemin2, ctx, e);
  const ici = (e: Record<string, string | number | undefined> = {}) => lienNav(route, ctx, e);

  const tous = dansTerritoire(base.items, territoire);
  const publies = tous.filter((i) => i.admission.registre === "digest");
  const permis = tous.filter((i) => i.admission.registre === "permis");
  const ecartes = tous.filter((i) => i.admission.registre === "ecarte");
  const objectifsT = dansTerritoire(base.objectifs, territoire);
  const projetsT = dansTerritoire(base.projets, territoire);
  const demandesT = dansTerritoire(base.demandes, territoire);

  const periode = base.couverture.map((c) => c.genereLe.slice(0, 10)).filter(Boolean)[0] ?? "";
  const hrefCeQuiEntre = url("ce-qui-entre");
  const hrefItem = (i: Item) => ici({ item: i.id });

  /* ---------------- fiche de détail : le niveau où rien n'est caché ---------------- */
  if (fiche) {
    const item = tous.find((i) => i.id === fiche);
    if (item) {
      return (
        <Cadre langue={l} territoire={territoire} chemin={route} extra={{}}>
          <p style={{ marginBottom: 12 }}><a href={ici({ item: undefined })}>← {meta.titre}</a></p>
          <FicheItem item={item} langue={l} />
        </Cadre>
      );
    }
  }

  let corps: React.ReactNode = null;
  let panneaux: React.ReactNode = null;

  switch (ecran.cle) {
    /* ---------------- 1. Pour vous — le digest ---------------- */
    case "pourVous": {
      corps = (
        <Digest
          items={parDate(publies)}
          examines={tous.length}
          retenus={publies.length}
          periode={periode}
          langue={l}
          hrefRegistre={url("statuts/decisions")}
          hrefThemes={url("comment-ca-marche")}
          hrefCeQuiEntre={hrefCeQuiEntre}
        />
      );
      break;
    }

    /* ---------------- 2. Les objectifs ---------------- */
    case "objectifs": {
      const caps = objectifsT.filter((o) => o.id.startsWith("demo:cap:"));
      corps = (
        <>
          <LigneContexte texte={`${objectifsT.length} ${t.carte.retenus} — ${nomTerritoire(territoire, l)}.`} />
          {caps.slice(0, 7).map((o) => (
            <MessageCle key={o.id} fait={o.intitule}
              source={{ organisme: "Maquette communale", date: o.cible.echeance, url: "#", licence: t.carte.demo }} />
          ))}
          <p style={{ marginTop: 16 }}>
            <a className="bouton bouton-secondaire" href={url("objectifs/cap")}>{t.ecrans.cap.titre} →</a>{" "}
            <a className="bouton bouton-secondaire" href={url("objectifs/engagements")}>{t.ecrans.engagements.titre} →</a>{" "}
            <a className="bouton bouton-secondaire" href={url("objectifs/propositions")}>{t.ecrans.propositions.titre} →</a>
          </p>
        </>
      );
      break;
    }
    case "cap": corps = <EcranCap objectifs={objectifsT} langue={l} />; break;
    case "engagements": corps = <EcranEngagements objectifs={objectifsT} langue={l} />; break;
    case "propositions":
      corps = <EcranPropositions reglements={base.reglements} territoire={territoire} langue={l} />; break;

    /* ---------------- 3. Les statuts ---------------- */
    case "statuts": {
      const p = parts(publies);
      corps = (
        <>
          <LigneContexte texte={`${tous.length} ${t.carte.actesExamines}, ${publies.length} ${t.carte.retenus}, ${p.reformules} ${t.carte.reformules}.`}
            lienLibelle={t.carte.ceQuiEntre} lienHref={hrefCeQuiEntre} />

          <Graphique
            titre={t.compteurs.reformulation}
            explication={
              l === "nl"
                ? "Deze balk toont het aandeel besluiten met een uitleg in gewone taal. Hij toont NIET de kwaliteit van die uitleg. Het cijfer stijgt alleen wanneer een mens een akte leest en herschrijft: er is geen automatische vertaling. Het is laag bij aanvang, en dat is normaal."
                : l === "en"
                ? "This bar shows the share of decisions with a plain-language explanation. It does NOT show the quality of that explanation. The figure rises only when a human reads an act and rewrites it: there is no automatic translation. It is low at the start, and that is normal."
                : "Cette barre montre la part de décisions dotées d’une explication en français ordinaire. Elle ne montre PAS la qualité de cette explication. Le chiffre ne monte que lorsqu’un humain lit un acte et le réécrit : il n’y a aucune traduction automatique. Il est bas au début, et c’est normal."
            }>
            <Jauge pourcentage={p.pctReformule} couleur="var(--accent-solide)" libelle={`${p.pctReformule} %`} />
            <p className="stat">{p.pctReformule} %</p>
          </Graphique>

          <p style={{ marginTop: 16 }}>
            <a className="bouton bouton-secondaire" href={url("statuts/decisions")}>{t.ecrans.decisions.titre} →</a>{" "}
            <a className="bouton bouton-secondaire" href={url("statuts/budget")}>{t.ecrans.budget.titre} →</a>{" "}
            <a className="bouton bouton-secondaire" href={url("statuts/conformite")}>{t.ecrans.conformite.titre} →</a>{" "}
            <a className="bouton bouton-secondaire" href={url("statuts/publication")}>{t.ecrans.publication.titre} →</a>
          </p>
        </>
      );
      break;
    }

    case "decisions":
    case "permis": {
      const source = ecran.cle === "permis" ? permis : publies;
      const avecDemo = demo ? source : source.filter((i) => estReel(i.provenance));
      const liste = parDate(filtrer(avecDemo, f));
      const pages = Math.max(1, Math.ceil(liste.length / PAR_PAGE));
      const courante = Math.min(page, pages);
      corps = (
        <>
          {ecran.cle === "permis" && (
            <Encart variante="alerte">
              {MOTIF_PERMIS.libelle[l]}. {l === "fr"
                ? "Les intitulés sont des codes ; rien ne distingue une lucarne d’un lotissement. Nous les publions à part plutôt que de trancher arbitrairement."
                : l === "nl"
                ? "De titels zijn codes; niets onderscheidt een dakkapel van een verkaveling. Wij publiceren ze apart in plaats van willekeurig te beslissen."
                : "The titles are codes; nothing distinguishes a dormer from a housing development. We publish them separately rather than deciding arbitrarily."}
            </Encart>
          )}
          <RegistreComplet
            items={liste.slice((courante - 1) * PAR_PAGE, courante * PAR_PAGE)}
            tousItems={source} filtres={{ ...f, demo }} langue={l}
            lien={(e) => ici(e)} page={courante} pages={pages}
            hrefItem={hrefItem} hrefEcartes={url("statuts/ecartes")}
          />
        </>
      );
      break;
    }

    case "ecartes": {
      const parMotif = new Map<string, Item[]>();
      for (const i of ecartes) {
        if (!parMotif.has(i.admission.motif)) parMotif.set(i.admission.motif, []);
        parMotif.get(i.admission.motif)!.push(i);
      }
      corps = (
        <>
          <LigneContexte texte={`${ecartes.length} ${t.carte.actesExamines} ${t.carte.ecartes.toLowerCase()}.`}
            lienLibelle={t.carte.ceQuiEntre} lienHref={hrefCeQuiEntre} />
          {[...parMotif.entries()].sort((a, b) => b[1].length - a[1].length).map(([m, xs]) => (
            <section key={m}>
              <h2 className="groupe-titre">
                {motifParId(m)?.libelle[l] ?? m} <span>· {xs.length}</span>
              </h2>
              <ul style={{ fontSize: 13, color: "var(--text-secondary)", paddingLeft: 18, margin: 0 }}>
                {xs.slice(0, 8).map((i) => (
                  <li key={i.id} lang={i.officiel.langue} style={{ marginBottom: 3 }}>
                    <a href={hrefItem(i)}>{i.officiel.titre}</a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      );
      break;
    }

    case "budget":
      corps = territoireParCode(territoire)?.niveau === "commune"
        ? <EcranBudget budget={base.budget} territoire={territoire} langue={l} />
        : <EtatVide titre={t.vide.titre} texte={t.vide.texte} />;
      break;

    case "publication": {
      const art = articleParId("art. 287")!;
      const incoherents = tous.filter((i) => i.datation.etat === "incoherente").length;
      corps = (
        <>
          <EncartJuridique article={art.id} obligation={art.obligation[l]} url={art.url} libelleLien={t.juridique.voirTexte} />
          <Encart variante="alerte">
            <strong>{t.juridique.nonMesurable}.</strong>{" "}
            {l === "fr"
              ? `Sur ${tous.length} actes de ce territoire, ${incoherents} portent une publication ANTÉRIEURE à la séance — ce qui est impossible. Le champ « publication-date » de la source est vraisemblablement la date de convocation. Nous ne calculons donc aucun délai.`
              : l === "nl"
              ? `Van ${tous.length} akten dragen er ${incoherents} een bekendmaking VÓÓR de zitting — onmogelijk. Wij berekenen dus geen enkele termijn.`
              : `Of ${tous.length} acts, ${incoherents} carry a publication BEFORE the session — impossible. We therefore compute no delay.`}
          </Encart>
          <div className="defilable">
            <table>
              <thead><tr><th>{t.nav.territoire}</th><th className="num">{t.compteurs.seancesLues}</th><th className="num">{t.compteurs.retenues}</th></tr></thead>
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
      break;
    }

    case "conformite": {
      const ficheC = base.conformite.find((c) => c.territoire === territoire);
      const libelleEtat: Record<string, string> = {
        conforme: t.juridique.conforme, manquant: t.juridique.manquant,
        non_verifie: t.juridique.nonVerifie, non_mesurable: t.juridique.nonMesurable,
      };
      corps = ficheC ? (
        <>
          <Encart variante="loi">{t.juridique.pasSupportOfficiel}</Encart>
          <div className="defilable">
            <table>
              <thead><tr><th>{t.juridique.article}</th><th>{t.juridique.etat}</th><th>{t.juridique.precision}</th></tr></thead>
              <tbody>
                {ficheC.lignes.map((ligne) => {
                  const a = articleParId(ligne.article);
                  return (
                    <tr key={ligne.article}>
                      <td><strong>{ligne.article}</strong>{a && <><br /><span style={{ fontSize: 12, color: "var(--muted)" }}>{a.intitule[l]}</span></>}</td>
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
      break;
    }

    /* ---------------- 4. Participer ---------------- */
    case "participer": {
      const seances = tous.filter((i) => i.type === "seance");
      corps = (
        <>
          <LigneContexte texte={`${seances.length} ${t.ecrans.seances.titre.toLowerCase()} · ${demandesT.length} ${t.ecrans.entraide.titre.toLowerCase()}.`} />
          <p style={{ marginTop: 16 }}>
            <a className="bouton bouton-secondaire" href={url("participer/seances")}>{t.ecrans.seances.titre} →</a>{" "}
            <a className="bouton bouton-secondaire" href={url("participer/entraide")}>{t.ecrans.entraide.titre} →</a>{" "}
            <a className="bouton bouton-secondaire" href={url("participer/familles-jeunes")}>{t.ecrans.famillesJeunes.titre} →</a>{" "}
            <a className="bouton bouton-secondaire" href={url("participer/questions")}>{t.ecrans.questions.titre} →</a>
          </p>
        </>
      );
      break;
    }
    case "entraide": corps = <EcranEntraide demandes={demandesT} langue={l} />; break;
    case "seances":
    case "consultations":
    case "famillesJeunes": {
      const types: Item["type"][] = ecran.cle === "consultations" ? ["consultation"] : ["seance", "regle"];
      const liste = parDate(tous.filter((i) => types.includes(i.type)));
      corps = liste.length === 0
        ? <EtatVide titre={t.vide.titre} texte={t.vide.aVenir} />
        : <>{liste.slice(0, 20).map((i) => <CarteSimple key={i.id} item={i} langue={l} href={hrefItem(i)} />)}</>;
      break;
    }
    case "questions": {
      const a = articleParId("art. 302")!;
      corps = (
        <>
          <EncartJuridique article={a.id} obligation={a.obligation[l]} url={a.url} libelleLien={t.juridique.voirTexte} />
          <Encart variante="alerte">{t.juridique.aucunDelai} — {t.vide.aVenir}</Encart>
        </>
      );
      break;
    }

    /* ---------------- 5. Soutenir ---------------- */
    case "soutenir": {
      corps = (
        <>
          <LigneContexte texte={`${projetsT.length} ${t.ecrans.projets.titre.toLowerCase()}.`} />
          <Encart variante="alerte">{t.ecrans.soutenir.lede}</Encart>
          <p style={{ marginTop: 16 }}>
            <a className="bouton bouton-secondaire" href={url("soutenir/projets")}>{t.ecrans.projets.titre} →</a>{" "}
            <a className="bouton bouton-secondaire" href={url("soutenir/enveloppes")}>{t.ecrans.enveloppes.titre} →</a>
          </p>
        </>
      );
      break;
    }
    case "projets": corps = <EcranProjets projets={projetsT} langue={l} />; break;

    /* ---------------- pages d'explication ---------------- */
    case "ceQuiEntre": {
      const parMotif = new Map<string, number>();
      for (const i of tous) parMotif.set(i.admission.motif, (parMotif.get(i.admission.motif) ?? 0) + 1);
      corps = (
        <>
          <LigneContexte texte={`${tous.length} ${t.carte.actesExamines} · ${publies.length} ${t.carte.retenus} · ${ecartes.length} ${t.carte.ecartes.toLowerCase()}.`} />
          <h2 style={{ marginTop: 20 }}>{l === "nl" ? "Wat wordt opgenomen" : l === "en" ? "What gets in" : "Ce qui entre"}</h2>
          <ul style={{ fontSize: 13.5, color: "var(--text-secondary)", paddingLeft: 18 }}>
            {MOTIFS_INCLUSION.map((m) => (
              <li key={m.id}>{m.libelle[l]} <span style={{ color: "var(--muted)" }}>· {parMotif.get(m.id) ?? 0}</span></li>
            ))}
          </ul>
          <h2 style={{ marginTop: 20 }}>{l === "nl" ? "Wat niet wordt opgenomen" : l === "en" ? "What does not" : "Ce qui n’entre pas"}</h2>
          <ul style={{ fontSize: 13.5, color: "var(--text-secondary)", paddingLeft: 18 }}>
            {MOTIFS_EXCLUSION.map((m) => (
              <li key={m.id}>{m.libelle[l]} <span style={{ color: "var(--muted)" }}>· {parMotif.get(m.id) ?? 0}</span></li>
            ))}
          </ul>
          <Encart>
            {l === "fr"
              ? "Aucun acte n’est supprimé de la base. Un acte écarté sort des vues principales, jamais de l’export ni du registre complet."
              : l === "nl"
              ? "Geen enkele akte wordt uit de databank verwijderd. Een weggelaten akte verdwijnt uit de hoofdweergaven, nooit uit de export of het volledige register."
              : "No act is deleted from the database. A set-aside act leaves the main views, never the export or the full register."}
            {" "}<a href={url("statuts/ecartes")}>{t.carte.ecartes} →</a>
          </Encart>
        </>
      );
      break;
    }

    case "commentCaMarche": {
      corps = (
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
      );
      break;
    }

    default:
      corps = <EtatVide titre={t.vide.titre} texte={t.vide.aVenir} />;
  }

  /* ---------------- panneaux : seulement hors écrans d'entrée ---------------- */
  if (!ecran.entree) {
    const p = parts(publies);
    const enPanne = base.etats.filter((e) => !e.ok);
    panneaux = (
      <>
        {enPanne.length > 0 && <EtatSourceIndisponible titre={t.degrade.titre} texte={`${t.degrade.texte} ${periode}`} />}
        <Panneau titre={t.compteurs.partReelle}>
          <TuileIndicateur valeur={`${p.pctReel} %`} legende={t.compteurs.partReelleLegende}>
            <Jauge pourcentage={p.pctReel} couleur="var(--good)" libelle={`${p.pctReel} %`} />
            <p>{p.reels} / {p.total}</p>
          </TuileIndicateur>
        </Panneau>
        <PanneauPourquoi titre={t.compteurs.pourquoi} phrase={t.carte.riennEstDeduit} />
      </>
    );
  }

  return (
    <Cadre langue={l} territoire={territoire} chemin={route} extra={extra} panneaux={panneaux}>
      <h1>{meta.titre}</h1>
      <p className="lede">{meta.lede}</p>
      {corps}
      <BoutonExportJson href={`/${l}/${route}.json?t=${territoire}`} libelle={t.export.libelle} note={t.export.note} />
    </Cadre>
  );
}

/** Carte minimale pour les listes qui ne sont pas des actes. */
function CarteSimple({ item, langue, href }: { item: Item; langue: LangueUI; href: string }) {
  const t = dico(langue);
  return (
    <article className="carte carte-legere">
      <div className="meta">
        {!estReel(item.provenance) && <span className="drapeau drapeau-demo">{t.carte.demo}</span>}
        {estReel(item.provenance) && <span className="meta-organe">{nomOrgane(organeDe(item), langue)}</span>}
      </div>
      <h3 className="carte-titre"><a href={href}>{item.redige?.titre ?? item.officiel.titre}</a></h3>
      <p className="impact">{item.redige?.impact ?? t.carte.pasReformuleTexte}</p>
      <p className="carte-source-breve">
        {item.themes.map((x) => themeParId(x)?.label[langue] ?? x).join(" · ")}
      </p>
    </article>
  );
}

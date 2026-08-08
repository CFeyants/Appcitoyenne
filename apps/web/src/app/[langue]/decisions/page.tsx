import Link from "next/link";
import { notFound } from "next/navigation";
import { dico, estLangue, type LangueUI } from "../../../i18n/index.ts";
import { charger, filtrer, trierParDate, organes, themesPresents, type Filtres } from "../../../lib/donnees.ts";
import { TERRITOIRES, themeParId, type Item } from "@pc/core";

const PAR_PAGE = 25;

/** Le filtre vit dans l'URL : partageable, sans état caché, sans cookie. */
type Params = Promise<{ langue: string }>;
type Query = Promise<Record<string, string | string[] | undefined>>;

const un = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

function Decision({ item, langue }: { item: Item; langue: LangueUI }) {
  const t = dico(langue);
  const terr = TERRITOIRES.find((x) => x.code === item.territoire);
  const construit = item.impactEtabli === "construit";

  return (
    <article className="carte">
      <div className="carte-entete">
        <span className="puce">{terr ? terr.nom[langue === "nl" ? "nl" : "fr"] : item.territoire}</span>
        <span className="puce puce-organe">{item.source.organisme}</span>
        {item.themes.map((th) => (
          <span key={th} className="puce">{themeParId(th)?.label[langue] ?? th}</span>
        ))}
      </div>

      <h3 lang={item.langue}>{item.titre}</h3>

      <p className="impact" lang={construit ? langue : item.langue}>{item.impact}</p>

      {/* Le statut porte une icône ET un mot : jamais la couleur seule. */}
      <div className="mention">
        <span className={`statut ${construit ? "statut-construit" : "statut-publie"}`}>
          <span aria-hidden="true">{construit ? "▲" : "●"}</span>
          {construit ? t.item.impactConstruit : t.item.impactPublie}
        </span>
      </div>

      <div className="mention" style={{ marginTop: 6 }}>
        <span className="statut statut-action">
          <span aria-hidden="true">■</span>
          {t.item.action} — {t.action.aucune}
        </span>
      </div>

      <div className="piedcarte">
        <a className="bouton-lien" href={item.source.url} target="_blank" rel="noreferrer">
          {t.decisions.voirSource} ↗
        </a>
        <span className="mention">
          <span>{t.item.publieLe} {item.source.dateDonnee}</span>
          <span>{t.item.licence} : {item.source.licence}</span>
          <span>{t.item.consulteLe} {item.source.consulteLe.slice(0, 10)}</span>
          <span lang={langue}>{t.item.langueSource}</span>
        </span>
      </div>
    </article>
  );
}

export default async function PageDecisions(
  { params, searchParams }: { params: Params; searchParams: Query },
) {
  const { langue } = await params;
  if (!estLangue(langue)) notFound();
  const t = dico(langue);
  const sp = await searchParams;

  const f: Filtres = {
    commune: un(sp.commune) || undefined,
    theme: un(sp.theme) || undefined,
    organe: un(sp.organe) || undefined,
    q: un(sp.q) || undefined,
  };
  const page = Math.max(1, Number(un(sp.page)) || 1);

  const { corpus, instantanes, etats } = await charger();
  const filtres = trierParDate(filtrer(corpus, f));
  const pages = Math.max(1, Math.ceil(filtres.length / PAR_PAGE));
  const courante = Math.min(page, pages);
  const tranche = filtres.slice((courante - 1) * PAR_PAGE, courante * PAR_PAGE);

  const qs = (modif: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    const fusion = { ...f, page: courante, ...modif };
    for (const [k, v] of Object.entries(fusion)) if (v) p.set(k, String(v));
    return `?${p.toString()}`;
  };

  const enPanne = etats.filter((e) => !e.ok);

  return (
    <>
      <h1>{t.decisions.titre}</h1>
      <p className="chapeau">{t.decisions.intro}</p>

      {/* Un seul nombre héroïque par écran. */}
      <p className="heros">{filtres.length.toLocaleString(langue === "en" ? "en-GB" : `${langue}-BE`)}</p>
      <p className="heros-legende">
        {t.decisions.unite} · {instantanes.length} {t.decisions.communesUnite} ·{" "}
        {t.decisions.releveLe} {instantanes[0]?.genereLe.slice(0, 10)}
      </p>

      {enPanne.length > 0 && (
        <div className="encart encart-alerte">
          <strong>{t.degrade.titre}.</strong>{" "}
          {t.degrade.texte(instantanes[0]?.genereLe.slice(0, 10) ?? "—")}
        </div>
      )}

      {/* Une seule rangée de filtres, au-dessus de tout ce qu'elle cadre. */}
      <form className="filtres" method="get" role="search">
        <div className="champ">
          <label htmlFor="q">{t.decisions.recherche}</label>
          <input id="q" name="q" type="search" defaultValue={f.q ?? ""} placeholder="…" />
        </div>
        <div className="champ">
          <label htmlFor="commune">{t.decisions.filtreCommune}</label>
          <select id="commune" name="commune" defaultValue={f.commune ?? ""}>
            <option value="">{t.decisions.toutes}</option>
            {TERRITOIRES.map((x) => (
              <option key={x.code} value={x.code}>{x.nom[langue === "nl" ? "nl" : "fr"]}</option>
            ))}
          </select>
        </div>
        <div className="champ">
          <label htmlFor="theme">{t.decisions.filtreTheme}</label>
          <select id="theme" name="theme" defaultValue={f.theme ?? ""}>
            <option value="">{t.decisions.tous}</option>
            {themesPresents(corpus).map((th) => (
              <option key={th} value={th}>{themeParId(th)?.label[langue] ?? th}</option>
            ))}
          </select>
        </div>
        <div className="champ">
          <label htmlFor="organe">{t.decisions.filtreOrgane}</label>
          <select id="organe" name="organe" defaultValue={f.organe ?? ""}>
            <option value="">{t.decisions.tous}</option>
            {organes(corpus).map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <button className="bouton" type="submit">{t.decisions.filtrer}</button>
      </form>
      <p className="mention">{t.decisions.rechercheAide}</p>

      {tranche.length === 0 ? (
        <p className="encart">{t.decisions.aucune}</p>
      ) : (
        <div className="liste">
          {tranche.map((i) => <Decision key={i.id} item={i} langue={langue} />)}
        </div>
      )}

      {/* Pagination explicite : pas de défilement infini (règle n° 3). */}
      {pages > 1 && (
        <nav className="pagination" aria-label={t.decisions.page}>
          {courante > 1 && <Link className="bouton-lien" href={qs({ page: courante - 1 })}>← {t.decisions.precedent}</Link>}
          <span>{t.decisions.page} {courante} / {pages}</span>
          {courante < pages && <Link className="bouton-lien" href={qs({ page: courante + 1 })}>{t.decisions.suivant} →</Link>}
        </nav>
      )}

      <div className="encart">
        <strong>{t.decisions.exportNote}</strong>{" "}
        <a href={`/${langue}/decisions.json${qs({ page: undefined })}`}>{t.decisions.exporter}</a>
      </div>

      {/* Aucun plafond silencieux : ce qui manque est publié avec ce qui est là. */}
      <h2>{t.couverture.titre}</h2>
      <p className="chapeau">{t.couverture.intro}</p>
      <div className="defilable">
        <table>
          <thead>
            <tr>
              <th>{t.decisions.filtreCommune}</th>
              <th className="num">{t.couverture.retenues}</th>
              <th className="num">{t.couverture.seancesLues}</th>
              <th className="num">{t.couverture.sansDeliberation}</th>
              <th className="num">{t.couverture.sansIntitule}</th>
              <th className="num">{t.couverture.sansLien}</th>
            </tr>
          </thead>
          <tbody>
            {instantanes.map((s) => (
              <tr key={s.territoire.code}>
                <td>{s.territoire.nom[langue === "nl" ? "nl" : "fr"]}</td>
                <td className="num">{s.total}</td>
                <td className="num">{s.seancesLues ?? "—"}</td>
                <td className="num">{s.ecarte?.sansDeliberation ?? 0}</td>
                <td className="num">{s.ecarte?.sansIntitule ?? 0}</td>
                <td className="num">{s.ecarte?.sansLien ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

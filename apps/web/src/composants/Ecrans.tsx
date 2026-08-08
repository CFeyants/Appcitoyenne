/**
 * Corps des écrans qui ne sont pas des listes d'items : Le cap, Budget,
 * Engagements, Entraide, Projets, Droits.
 *
 * Tous les objets rendus ici viennent de la maquette communale et portent une
 * provenance « demonstration » : le badge est donc systématique, et il découle
 * du type — on ne peut pas l'oublier.
 */

import { BarreParts, Comparaison, ChiffreHeros, Jauge, Encart, BadgeProvenance, EtatVide, VueTableau } from "@pc/ui";
import { nomTerritoire, estReel, type Objectif, type Projet, type Demande } from "@pc/core";
import { dico, type LangueUI } from "../i18n/index.ts";

const eur = (l: LangueUI) => (n: number) =>
  new Intl.NumberFormat(`${l}-BE`, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
const pct1 = (l: LangueUI) => (n: number) =>
  new Intl.NumberFormat(`${l}-BE`, { maximumFractionDigits: 1 }).format(n) + " %";

function Badge({ objet, langue }: { objet: { provenance: unknown }; langue: LangueUI }) {
  const t = dico(langue);
  if (estReel(objet.provenance as never)) return null;
  return <BadgeProvenance variante="demo">{t.carte.demo}</BadgeProvenance>;
}

/* ---------------------------------------------------------------- Le cap */

export function EcranCap({ objectifs, langue }: { objectifs: Objectif[]; langue: LangueUI }) {
  const t = dico(langue);
  const caps = objectifs.filter((o) => o.id.startsWith("demo:cap:"));
  if (caps.length === 0) return <EtatVide titre={t.vide.titre} texte={t.vide.texte} />;

  return (
    <>
      {caps.map((o) => (
        <article key={o.id} className="carte">
          <div className="meta">
            <span className="meta-organe">{nomTerritoire(o.territoire, langue)}</span>
            <span className="meta-sep" aria-hidden="true">·</span>
            <span>{t.ecrans.cap.titre}</span>
            <Badge objet={o} langue={langue} />
          </div>
          <h3 className="carte-titre">{o.intitule}</h3>
          <p className="impact">{t.carte.echeance} {o.cible.echeance}</p>
          {/* Le rattachement aux niveaux supérieurs : c'est là tout l'intérêt
              de l'objet — un objectif communal qui ne se rattache à rien est
              une déclaration, pas une trajectoire. */}
          <div className="rangee">
            <div className="etiquettes" style={{ marginLeft: 0 }}>
              {o.rattachements.length === 0
                ? <span className="etiquette">{t.vide.filtre}</span>
                : o.rattachements.map((r) => {
                    const [niveau, cle] = r.split(":");
                    return <span key={r} className="etiquette">{niveau} · {cle?.replace(/-/g, " ")}</span>;
                  })}
            </div>
          </div>
        </article>
      ))}
    </>
  );
}

/* ---------------------------------------------------------- Engagements */

export function EcranEngagements({ objectifs, langue }: { objectifs: Objectif[]; langue: LangueUI }) {
  const t = dico(langue);
  const eng = objectifs.filter((o) => o.id.startsWith("demo:engagement:"));
  if (eng.length === 0) return <EtatVide titre={t.vide.titre} texte={t.vide.texte} />;

  return (
    <>
      <Encart>{t.compteurs.pourquoiTexte}</Encart>
      {eng.map((o) => (
        <article key={o.id} className="carte">
          <div className="meta">
            <span className="meta-organe">{nomTerritoire(o.territoire, langue)}</span>
            <span className="meta-sep" aria-hidden="true">·</span>
            {/* L'état est un fait publié, jamais une note attribuée. */}
            <span>{o.cible.unite}</span>
            <span className="meta-sep" aria-hidden="true">·</span>
            <span>{o.cible.echeance}</span>
            <Badge objet={o} langue={langue} />
          </div>
          <h3 className="carte-titre">{o.intitule}</h3>
          {o.mesure && (
            <p className="impact">
              {o.mesure.valeur} {t.compteurs.pourquoi.toLowerCase()} — {o.mesure.dateMesure}
            </p>
          )}
        </article>
      ))}
    </>
  );
}

/* -------------------------------------------------------------- Budget */

export function EcranBudget({ budget, territoire, langue }: { budget: any; territoire: string; langue: LangueUI }) {
  const t = dico(langue);
  if (!budget) return <EtatVide titre={t.vide.titre} texte={t.vide.texte} />;
  const e = eur(langue), p1 = pct1(langue);

  const total: number = budget.total;
  const parts = budget.postes.map((x: any) => ({ nom: x.nom, valeur: x.v }));
  const rattache = budget.postes.find((x: any) => x.slot === 4)?.v ?? 0;
  const maxVote = Math.max(...budget.orientations.map((l: any) => l.vote), 1);

  return (
    <>
      <div className="rangee" style={{ marginBottom: 4 }}>
        <BadgeProvenance variante="demo">{t.carte.demo}</BadgeProvenance>
      </div>

      {/* Un seul chiffre héros par écran. */}
      <ChiffreHeros
        valeur={e(total)}
        legende={`${budget.annee} · ${e(budget.parHabitant)} ${t.compteurs.pourquoi.toLowerCase().includes("waarom") ? "per inwoner" : "par habitant"} · ${budget.habitants.toLocaleString(`${langue}-BE`)}`}
      />

      <BarreParts parts={parts} total={total} formatPart={p1} formatValeur={e} />

      <Encart>
        <strong>{p1((rattache / total) * 100)}</strong>{" "}
        {langue === "nl"
          ? "van het budget is gekoppeld aan een doelstelling. De rest financiert de gewone werking, de schuld en de verplichte overdrachten — noodzakelijke uitgaven, maar door geen enkele doelstelling gestuurd."
          : langue === "en"
          ? "of the budget is attached to an objective. The rest funds day-to-day operations, debt and mandatory transfers — necessary spending, but steered by no objective."
          : "du budget est rattaché à une orientation. Le reste finance le fonctionnement courant, la dette et les transferts obligatoires — des dépenses nécessaires, mais qu'aucune orientation ne pilote."}
      </Encart>

      <h2 style={{ marginTop: 26 }}>{langue === "nl" ? "Van gestemd tot vastgelegd" : langue === "en" ? "From voted to committed" : "Du voté à l'exécuté"}</h2>
      <div style={{ display: "grid", gap: 20, marginTop: 12 }}>
        {budget.orientations.map((l: any) => (
          <div key={l.intitule}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "baseline", marginBottom: 6 }}>
              <span style={{ fontWeight: 640, fontSize: 14 }}>{l.intitule}</span>
              <span style={{ marginLeft: "auto", fontSize: 13, color: "var(--text-secondary)" }}>
                <b style={{ color: "var(--text-primary)" }}>{e(l.exec)}</b> / {e(l.vote)}
              </span>
            </div>
            {/* Le repère marque le montant voté ; l'échelle est commune aux
                trois lignes, sans quoi la comparaison serait trompeuse. */}
            <Jauge
              pourcentage={(l.exec / maxVote) * 100}
              seuilPourcentage={(l.vote / maxVote) * 100}
              couleur="var(--accent-solide)"
              libelle={`${l.intitule} — ${e(l.exec)} / ${e(l.vote)}`}
            />
            <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{p1((l.exec / l.vote) * 100)}</div>
          </div>
        ))}
      </div>

      <h2 style={{ marginTop: 26 }}>{langue === "nl" ? "Vergeleken met de buurgemeenten" : langue === "en" ? "Compared with neighbouring municipalities" : "Comparé aux communes voisines"}</h2>
      <div style={{ marginTop: 12 }}>
        <Comparaison
          lignes={budget.voisines.map((v: any) => ({
            nom: v.nom, valeur: v.v,
            moi: v.moi === true || v.nom === nomTerritoire(territoire, langue),
          }))}
          format={(v) => e(v)}
        />
      </div>

      <Encart variante="alerte">
        {langue === "nl"
          ? "Deze vijf waarden zijn illustratief. De bron die ze echt zou maken — de BBC-gegevens — is nog niet geautomatiseerd toegankelijk."
          : langue === "en"
          ? "These five values are illustrative. The source that would make them real — the BBC data — has no established automated access yet."
          : "Ces cinq valeurs sont illustratives. La source qui les rendrait réelles — les données BBC — n'a pas encore d'accès automatisable établi."}
      </Encart>

      <VueTableau
        libelleOuvrir={t.tableau.ouvrir} libelleFermer={t.tableau.fermer}
        entetes={[t.juridique.article, t.compteurs.retenues, t.compteurs.partReelle]}
        lignes={budget.postes.map((x: any) => [x.nom, e(x.v), p1((x.v / total) * 100)])}
      />
    </>
  );
}

/* ------------------------------------------------------------ Entraide */

export function EcranEntraide({ demandes, langue }: { demandes: Demande[]; langue: LangueUI }) {
  const t = dico(langue);
  if (demandes.length === 0) return <EtatVide titre={t.vide.titre} texte={t.vide.texte} />;

  // Les DEMANDES d'abord, les offres ensuite : demander doit être gratuit en
  // effort et en honte, donc jamais relégué sous une vitrine d'offres.
  const dem = demandes.filter((d) => d.mode === "demande");
  const off = demandes.filter((d) => d.mode === "offre");

  const bloc = (liste: Demande[], titre: string) => (
    <>
      <h2 style={{ marginTop: 22 }}>{titre}</h2>
      {liste.map((d) => (
        <article key={d.id} className="carte">
          <div className="meta">
            <span className="meta-organe">{d.categorie}</span>
            <span className="meta-sep" aria-hidden="true">·</span>
            <span>{d.quartier}</span>
            <Badge objet={d} langue={langue} />
          </div>
          <h3 className="carte-titre">{d.titre}</h3>
          <p className="impact">{d.detail}</p>
          <div className="rangee">
            <span className="statut statut-rien"><span aria-hidden="true">■</span>{d.auteur}</span>
          </div>
        </article>
      ))}
    </>
  );

  return (
    <>
      {bloc(dem, langue === "nl" ? "Vragen" : langue === "en" ? "Requests" : "Demandes")}
      {bloc(off, langue === "nl" ? "Aanbod" : langue === "en" ? "Offers" : "Offres")}
    </>
  );
}

/* ------------------------------------------------------------- Projets */

export function EcranProjets({ projets, langue }: { projets: Projet[]; langue: LangueUI }) {
  const t = dico(langue);
  if (projets.length === 0) return <EtatVide titre={t.vide.titre} texte={t.vide.texte} />;
  const e = eur(langue), p1 = pct1(langue);

  const colonnes = [
    { cle: "economique" as const, label: langue === "nl" ? "Economisch" : langue === "en" ? "Economic" : "Économique" },
    { cle: "social" as const, label: langue === "nl" ? "Sociaal" : langue === "en" ? "Social" : "Social" },
    { cle: "environnemental" as const, label: langue === "nl" ? "Ecologisch" : langue === "en" ? "Environmental" : "Environnemental" },
  ];

  return (
    <>
      {projets.map((p) => (
        <article key={p.id} className="carte">
          <div className="meta">
            <span className="meta-organe">{nomTerritoire(p.territoire, langue)}</span>
            <span className="meta-sep" aria-hidden="true">·</span>
            <span>{p.contributeurs} {langue === "nl" ? "bijdragers" : langue === "en" ? "contributors" : "contributeurs"}</span>
            <Badge objet={p} langue={langue} />
          </div>
          <h3 className="carte-titre">{p.titre}</h3>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
            <span style={{ color: "var(--text-secondary)" }}>{p.contributeurs > 0 ? p1((p.collecte / p.objectif) * 100) : "—"}</span>
            <span><b>{e(p.collecte)}</b> <span style={{ color: "var(--muted)" }}>/ {e(p.objectif)}</span></span>
          </div>
          <Jauge pourcentage={(p.collecte / p.objectif) * 100} couleur="var(--accent-solide)"
            libelle={`${p.titre} — ${e(p.collecte)} / ${e(p.objectif)}`} />

          {/* Triple comptabilité : trois colonnes SÉPARÉES, jamais fondues en
              un score unique — c'est la condition posée au § 8. */}
          <div className="grille grille-3" style={{ marginTop: 14 }}>
            {colonnes.map((c) => (
              <div key={c.cle} style={{ border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: 12 }}>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)", fontWeight: 700 }}>{c.label}</div>
                <div style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 4 }}>{p[c.cle]}</div>
              </div>
            ))}
          </div>

          <div className="repli" style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
              <strong style={{ color: "var(--text-primary)" }}>
                {langue === "nl" ? "Waargenomen rendement" : langue === "en" ? "Observed return" : "Rendement observé"} :
              </strong>{" "}
              {p.rendementObserve}
            </div>
            <div className="delai delai-aucun" style={{ marginTop: 8, fontStyle: "normal", color: "var(--serious)" }}>
              <span aria-hidden="true">▲</span> {p.avertissement}
            </div>
          </div>
        </article>
      ))}
      <Encart variante="alerte">{t.ecrans.projets.lede}</Encart>
    </>
  );
}

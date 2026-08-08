/**
 * Écran « Propositions citoyennes ».
 *
 * Trois interdits du lot tenus ici :
 *  · aucune collecte de signatures n'est présentée comme valide — sans
 *    règlement communal, une proposition est un brouillon, pas une pétition ;
 *  · aucun délai n'est affiché sans son fondement ;
 *  · la plateforme n'est pas le support de dépôt : elle prépare un document,
 *    l'habitant le dépose par le canal officiel.
 */

import { Encart, EncartJuridique, EtatConformiteBadge, VueTableau, BoutonExportJson } from "@pc/ui";
import {
  articleParId, MESSAGE_SANS_REGLEMENT, documentDemandeReglement, lienTelechargement,
  nomTerritoire,
} from "@pc/core";
import { dico, type LangueUI } from "../i18n/index.ts";

type Etat = "verifie" | "partiel" | "non_verifie";
interface Champ { valeur: number | string | null; etat: Etat; citation?: string | null; precision?: string }
interface Reglement {
  commune: string; etat: Etat; adopteLe: string | null;
  source: { organisme: string; url: string; consulteLe: string };
  seuilSignatures: Champ; seuilPourcentage: Champ; ageMinimum: Champ;
  delaiDepotJours: Champ; delaiTraitementMois?: Champ; canalDepot: Champ;
}

const BADGE: Record<Etat, "conforme" | "non_verifie" | "non_mesurable"> = {
  verifie: "conforme", partiel: "non_mesurable", non_verifie: "non_verifie",
};

/** Une valeur non vérifiée ne s'affiche jamais comme un chiffre nu. */
function Valeur({ champ, unite, langue }: { champ: Champ; unite?: string; langue: LangueUI }) {
  const t = dico(langue);
  if (champ.etat !== "verifie" || champ.valeur === null) {
    return <span style={{ color: "var(--muted)", fontStyle: "italic" }}>{t.juridique.nonVerifie}</span>;
  }
  return <strong>{champ.valeur}{unite ? ` ${unite}` : ""}</strong>;
}

export function EcranPropositions({
  reglements, territoire, langue,
}: {
  reglements: { reglements: Reglement[]; pilote: { note: string } } | null;
  territoire: string;
  langue: LangueUI;
}) {
  const t = dico(langue);
  const a1 = articleParId("art. 304 §1")!;
  const a5 = articleParId("art. 304 §5")!;
  const commune = nomTerritoire(territoire, langue);

  // Aucune des six communes du pilote n'a de règlement vérifié : le cadre
  // juridique est donc null, et c'est le message imposé qui s'affiche.
  const doc = documentDemandeReglement(commune);

  return (
    <>
      <EncartJuridique article={a1.id} obligation={a1.obligation[langue]} url={a1.url} libelleLien={t.juridique.voirTexte} />

      <Encart variante="alerte">
        <strong>{MESSAGE_SANS_REGLEMENT[langue]}</strong>
      </Encart>

      <Encart variante="loi">{t.juridique.pasSupportOfficiel}</Encart>

      <h2 style={{ marginTop: 26 }}>
        {langue === "nl" ? "Vraag de gemeente het reglement vast te stellen"
          : langue === "en" ? "Ask the municipality to adopt the regulation"
          : "Demander l'adoption du règlement"}
      </h2>
      <p className="lede">{a5.obligation[langue]}</p>

      <article className="carte">
        <div className="meta">
          <span className="meta-organe">{doc.destinataire}</span>
          <span className="meta-sep" aria-hidden="true">·</span>
          <span>{doc.fondement.article}</span>
        </div>
        <h3 className="carte-titre">{doc.objet}</h3>
        <pre className="repli-texte" style={{ fontFamily: "inherit", marginTop: 10 }}>{doc.corps}</pre>
        <div className="piedcarte">
          <a className="bouton" href={lienTelechargement(doc, "demande-reglement.txt")} download="demande-reglement.txt">
            ↓ {langue === "nl" ? "Brief downloaden" : langue === "en" ? "Download the letter" : "Télécharger le courrier"}
          </a>
          <span className="mention">
            {langue === "nl" ? "Het platform verstuurt niets. U dient zelf in, via het officiële kanaal."
              : langue === "en" ? "The platform sends nothing. You submit it yourself, through the official channel."
              : "La plateforme n'envoie rien. C'est vous qui déposez, par le canal officiel."}
          </span>
        </div>
      </article>

      <h2 style={{ marginTop: 26 }}>
        {langue === "nl" ? "Wat andere gemeenten hebben vastgesteld"
          : langue === "en" ? "What other municipalities have adopted"
          : "Ce que d'autres communes ont adopté"}
      </h2>
      <p className="lede">
        {langue === "nl" ? "Het decreet legt geen drempel, leeftijd of termijn op: alles komt uit het gemeentelijk reglement. Vandaar de verschillen."
          : langue === "en" ? "The decree sets no threshold, age or deadline: everything comes from the local regulation. Hence the differences."
          : "Le décret ne fixe ni seuil, ni âge, ni délai : tout vient du règlement communal. D'où les écarts."}
      </p>

      {reglements && (
        <>
          <div className="defilable">
            <table>
              <thead>
                <tr>
                  <th>{langue === "nl" ? "Gemeente" : langue === "en" ? "Municipality" : "Commune"}</th>
                  <th className="num">{langue === "nl" ? "Handtekeningen" : langue === "en" ? "Signatures" : "Signatures"}</th>
                  <th className="num">{langue === "nl" ? "Leeftijd" : langue === "en" ? "Age" : "Âge"}</th>
                  <th className="num">{langue === "nl" ? "Indienen" : langue === "en" ? "Filing" : "Dépôt"}</th>
                  <th className="num">{langue === "nl" ? "Behandeling" : langue === "en" ? "Handling" : "Traitement"}</th>
                  <th className="num">{t.juridique.etat}</th>
                </tr>
              </thead>
              <tbody>
                {reglements.reglements.map((r) => (
                  <tr key={r.commune}>
                    <td>
                      <strong>{r.commune}</strong><br />
                      <a style={{ fontSize: 11.5 }} href={r.source.url} target="_blank" rel="noreferrer">
                        {langue === "nl" ? "bron" : langue === "en" ? "source" : "source"} ↗
                      </a>
                    </td>
                    <td className="num"><Valeur champ={r.seuilSignatures} langue={langue} /></td>
                    <td className="num"><Valeur champ={r.ageMinimum} unite={langue === "nl" ? "j." : langue === "en" ? "yrs" : "ans"} langue={langue} /></td>
                    <td className="num"><Valeur champ={r.delaiDepotJours} unite={t.juridique.jours} langue={langue} /></td>
                    <td className="num"><Valeur champ={r.delaiTraitementMois ?? { valeur: null, etat: "non_verifie" }} unite={langue === "nl" ? "mnd" : langue === "en" ? "mo." : "mois"} langue={langue} /></td>
                    <td className="num">
                      <EtatConformiteBadge etat={BADGE[r.etat]}
                        libelle={r.etat === "verifie" ? (langue === "nl" ? "Nagelezen" : langue === "en" ? "Read at source" : "Lu à la source")
                          : r.etat === "partiel" ? (langue === "nl" ? "Gedeeltelijk" : langue === "en" ? "Partial" : "Partiel")
                          : t.juridique.nonVerifie} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Encart variante="alerte">
            <strong>
              {langue === "nl" ? "Twee waarden die circuleren, konden wij niet nalezen."
                : langue === "en" ? "Two circulating values could not be read at source."
                : "Deux valeurs qui circulent n'ont pas pu être lues à la source."}
            </strong>{" "}
            {langue === "nl"
              ? "Voor Menen verschijnt de drempel van 1 % op geen van beide officiële pagina's. Voor Laakdal bestaat het reglement, maar de PDF is ingescand en niet leesbaar. Beide blijven « niet nagegaan » in plaats van als feit te worden getoond."
              : langue === "en"
              ? "For Menen, the 1 % threshold appears on neither official page. For Laakdal, the regulation exists but its PDF is scanned and unreadable. Both stay “not verified” rather than being shown as fact."
              : "Pour Menen, le seuil de 1 % n'apparaît sur aucune des deux pages officielles. Pour Laakdal, le règlement existe mais son PDF est scanné et illisible. Les deux restent « non vérifié » plutôt que d'être affichés comme un fait."}
          </Encart>

          <VueTableau
            libelleOuvrir={t.tableau.ouvrir} libelleFermer={t.tableau.fermer}
            entetes={[langue === "nl" ? "Gemeente" : "Commune", t.juridique.precision]}
            lignes={reglements.reglements.map((r) => [
              r.commune,
              [r.seuilSignatures, r.ageMinimum, r.delaiDepotJours, r.canalDepot]
                .map((c) => c.citation ?? c.precision).filter(Boolean).join(" — ") || "—",
            ])}
          />
        </>
      )}

      <BoutonExportJson href="#" libelle={t.export.libelle} note={reglements?.pilote.note ?? ""} />
    </>
  );
}

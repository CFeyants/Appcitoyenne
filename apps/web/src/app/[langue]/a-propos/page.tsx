import { notFound } from "next/navigation";
import { dico, estLangue } from "../../../i18n/index.ts";
import { POIDS, VERSION_PERTINENCE, VERSION_THEMES, VERSION_PUBLICS } from "@pc/core";

/**
 * « Une page explique en français ordinaire comment le classement fonctionne »
 * (règle non négociable n° 2). Elle existe AVANT le classement lui-même : la
 * formule et ses poids sont publiés dès maintenant, pour qu'aucune autre
 * logique ne s'installe en silence d'ici le lot 3.
 */
export default async function APropos({ params }: { params: Promise<{ langue: string }> }) {
  const { langue } = await params;
  if (!estLangue(langue)) notFound();
  const t = dico(langue);

  const sections = [
    { titre: t.apropos.admissionTitre, texte: t.apropos.admissionTexte },
    { titre: t.apropos.sourceTitre, texte: t.apropos.sourceTexte },
    { titre: t.apropos.profilTitre, texte: t.apropos.profilTexte },
    { titre: t.apropos.tempsTitre, texte: t.apropos.tempsTexte },
    { titre: t.apropos.langueTitre, texte: t.apropos.langueTexte },
  ];

  return (
    <>
      <h1>{t.apropos.titre}</h1>
      {sections.map((s) => (
        <section key={s.titre}>
          <h2>{s.titre}</h2>
          <p className="chapeau">{s.texte}</p>
        </section>
      ))}

      <h2>{t.apropos.poidsTitre}</h2>
      <div className="defilable">
        <table>
          <thead>
            <tr><th>Facteur</th><th className="num">Poids</th></tr>
          </thead>
          <tbody>
            {Object.entries(POIDS).map(([k, v]) => (
              <tr key={k}><td>{k}</td><td className="num">{v}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mention" style={{ marginTop: 10 }}>
        pertinence {VERSION_PERTINENCE} · thèmes {VERSION_THEMES} · publics {VERSION_PUBLICS}
      </p>

      <h2>{t.apropos.licencesTitre}</h2>
      <ul className="chapeau">
        <li>
          Décisions locales : Modellicentie Gratis Hergebruik (Vlaanderen) — mention de la source obligatoire,
          via <a href="https://lokaalbeslist.vlaanderen.be" target="_blank" rel="noreferrer">Lokaal Beslist</a>.
        </li>
        <li>Codes NIS et dénominations : Basisregisters Vlaanderen.</li>
        <li>Code de cette plateforme : EUPL-1.2.</li>
      </ul>
    </>
  );
}

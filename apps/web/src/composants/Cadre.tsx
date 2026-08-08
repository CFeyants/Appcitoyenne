/**
 * Cadre partagé — en-tête, échelle de territoire, coquille, pied.
 *
 * Un layout Next ne reçoit pas les paramètres d'URL ; or le territoire vit
 * dans `?t=`. Chaque écran rend donc ce cadre, en une ligne, plutôt que de
 * déplacer l'état du territoire dans le chemin ou dans un composant client.
 * Conséquence heureuse : aucun JavaScript n'est envoyé au navigateur.
 */

import type { ReactNode } from "react";
import { EnteteApp, SelecteurTerritoire, Coquille, PiedPage } from "@pc/ui";
import { echelle, nomTerritoire, type Niveau } from "@pc/core";
import { dico, LANGUES, NOM_LANGUE, type LangueUI } from "../i18n/index.ts";
import { SECTIONS, ACCUEIL_SECTION, lien, sectionDe, type Contexte } from "../lib/nav.ts";

export function Cadre({
  langue, territoire, chemin, extra, panneaux, children,
}: {
  langue: LangueUI;
  territoire: string;
  chemin: string;
  extra?: Record<string, string | number | undefined>;
  panneaux?: ReactNode;
  children: ReactNode;
}) {
  const t = dico(langue);
  const ctx: Contexte = { langue, territoire, extra };
  const sectionCourante = sectionDe(chemin);

  // L'échelle part de CHEZ SOI et s'élargit : commune › province › région ›
  // pays › Union. L'ordre compte — il dit que le point de départ est le lieu
  // où l'on vit, pas l'institution la plus vaste.
  const crans = echelle(territoire);

  return (
    <>
      <a className="u-saut" href="#contenu">{t.nav.passerAuContenu}</a>

      <EnteteApp
        marque={t.site}
        complement={nomTerritoire(territoire, langue)}
        entrees={SECTIONS.map((s) => ({
          id: s,
          libelle: t.nav[s],
          href: lien(ACCUEIL_SECTION[s], { langue, territoire }),
          actif: s === sectionCourante,
        }))}
        langues={LANGUES.map((l) => ({
          code: l,
          libelle: NOM_LANGUE[l],
          href: lien(chemin, { langue: l, territoire, extra }),
          actif: l === langue,
        }))}
        echelle={
          <SelecteurTerritoire
            libelle={t.nav.territoire}
            crans={crans.map((c) => ({
              code: c.code,
              nom: c.nom[langue],
              href: lien(chemin, { langue, territoire: c.code, extra }),
              actif: c.code === territoire,
            }))}
          />
        }
      />

      <Coquille panneaux={panneaux}>{children}</Coquille>

      <PiedPage>
        <span>{t.pied.licence}</span>
        <span>
          {t.pied.source} :{" "}
          <a href="https://lokaalbeslist.vlaanderen.be" target="_blank" rel="noreferrer">Lokaal Beslist</a>
          {" "}— Modellicentie Gratis Hergebruik
        </span>
        <span>{t.pied.verite}</span>
      </PiedPage>
    </>
  );
}

/** Le niveau du territoire courant, pour dire quels écrans ont une source. */
export const niveauDe = (crans: { niveau: Niveau }[]): Niveau => crans[0]?.niveau ?? "commune";

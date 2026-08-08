/**
 * i18n — règle non négociable n° 7 : multilingue dès le premier jour, chaîne
 * par chaîne, jamais codée en dur.
 *
 * Le néerlandais n'est pas une traduction ajoutée à la fin. Dans la périphérie
 * bruxelloise, c'est une condition d'existence : les six communes du pilote
 * sont flamandes, et leurs actes sont publiés en néerlandais.
 *
 * `Dictionnaire` est un type EXACT : ajouter une clé au français casse la
 * compilation tant que le néerlandais et l'anglais ne l'ont pas. C'est ce qui
 * empêche une langue de dériver en seconde zone.
 */

import { fr } from "./fr.ts";
import { nl } from "./nl.ts";
import { en } from "./en.ts";

export const LANGUES = ["fr", "nl", "en"] as const;
export type LangueUI = (typeof LANGUES)[number];
export const LANGUE_DEFAUT: LangueUI = "fr";

export type Dictionnaire = typeof fr;

const DICOS: Record<LangueUI, Dictionnaire> = { fr, nl, en };

export const estLangue = (x: string): x is LangueUI =>
  (LANGUES as readonly string[]).includes(x);

export const dico = (langue: string): Dictionnaire =>
  DICOS[estLangue(langue) ? langue : LANGUE_DEFAUT];

export const NOM_LANGUE: Record<LangueUI, string> = {
  fr: "Français",
  nl: "Nederlands",
  en: "English",
};

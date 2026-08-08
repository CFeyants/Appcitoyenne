# Plateforme citoyenne

Ce que la décision publique change pour vous — commune, région, pays, Europe,
dans une seule lecture.

Le brief normatif du projet est dans [`CLAUDE.md`](CLAUDE.md). Ce fichier ne
décrit que **ce qui existe aujourd'hui**.

## État : Lot 1 livré

> **Lot 1 — le squelette et une vérité.** Monorepo, types, schémas Zod, i18n,
> design system, et le connecteur Lokaal Beslist. Écran unique : les décisions
> réelles d'une commune, filtrables, chacune avec sa source.

### Critères d'acceptation

| Critère | État |
|---|---|
| ≥ 500 décisions réelles rendues | **3 010** sur six communes |
| Aucune donnée fictive à l'écran | aucune — tout vient de Lokaal Beslist |
| Export JSON fonctionnel | `/{langue}/decisions.json`, filtres inclus |
| Interface complète en FR et NL | FR, NL **et** EN, clés vérifiées à la compilation |

## Le pilote

Les **six communes à facilités** de la périphérie bruxelloise. Codes NIS et
dénominations officielles vérifiés contre Basisregisters Vlaanderen :

| NIS | Néerlandais | Français |
|---|---|---|
| 23098 | Drogenbos | Drogenbos |
| 23099 | Kraainem | Kraainem |
| 23100 | Linkebeek | Linkebeek |
| 23101 | Sint-Genesius-Rode | Rhode-Saint-Genèse |
| 23102 | Wemmel | Wemmel |
| 23103 | Wezembeek-Oppem | Wezembeek-Oppem |

## Démarrer

```bash
npm install
node scripts/ingest.ts --seances=40   # remplit /data depuis Lokaal Beslist
npm run dev                            # http://localhost:3100
```

L'interface **ne fait aucun appel réseau au rendu** : elle lit les instantanés
de `/data`, remplis par l'ingestion. C'est la règle du § 10.

## Comment les règles non négociables sont tenues

Chacune est vérifiable dans le code, pas seulement affirmée.

| Règle | Où c'est tenu |
|---|---|
| **1. Aucune information sans source** | `SourceSchema` — organisme, URL absolue, date, licence, date de relevé. Sans elle, l'item ne se rend pas : `trier()` l'écarte à l'ingestion **et** à la lecture. |
| **2. Intérêts déclarés, jamais déduits** | Aucun traceur, aucune police distante, aucun cookie. Les filtres vivent dans l'URL. `scorer()` ne reçoit qu'un profil déclaré et un instant explicite — jamais `Date.now()`, pour rester reproductible. |
| **3. Rendre du temps** | Pagination explicite, jamais de défilement infini. Aucune notification, aucun badge, aucun score. |
| **4. Aucun classement de personnes** | Le modèle ne porte que des actes, des organes et des dates. |
| **6. Réversibilité** | Code EUPL-1.2, export JSON sur l'écran, schémas dans `packages/core`. |
| **7. Multilingue dès le premier jour** | `Dictionnaire = typeof fr` : ajouter une clé au français **casse la compilation** tant que NL et EN ne l'ont pas. |
| **8. Accessibilité** | Palette validée pour la vision des couleurs, clair et sombre. Statut = icône **+** mot, jamais la couleur seule. Lien d'évitement, focus visible, cibles ≥ 40 px, mobile d'abord. |

Le **test d'admission du § 3** est une validation Zod (`schemas.ts`), pas une
consigne éditoriale : pas de source complète, pas d'impact énonçable ou pas
d'action déclarée → l'item n'est pas publié.

## Ce que le Lot 1 ne prétend pas faire

- **La portée des décisions n'est pas toujours établie.** Quand la commune
  publie le corps du besluit, il tient lieu d'impact. Sinon, l'item porte
  `impactEtabli: "construit"` et l'écran le dit en toutes lettres.
- **Rhode-Saint-Genèse ne rend que 25 décisions** : la commune publie ses
  ordres du jour mais très peu de délibérations en données liées. Le chiffre est
  affiché, pas masqué.
- **Le classement par pertinence n'est pas branché** (Lot 3). Sa formule et ses
  poids sont déjà publics dans `pertinence.ts` et sur la page « Comment ceci
  fonctionne », pour qu'aucune autre logique ne s'installe en silence.

## Architecture

```
apps/web              Next.js (App Router), rendu serveur, i18n FR/NL/EN
packages/core         types, schémas Zod, pertinence, vocabulaires versionnés
packages/connectors   un dossier par source, couche HTTP polie, tests de contrat
packages/ui           jetons de design (palette validée)
data/                 instantanés versionnés + état des sources
docs/sources/         une fiche par source : endpoint, licence, limites connues
scripts/ingest.ts     ingestion planifiée
```

## Tests de contrat

Les portails publics changent sans prévenir — première cause de mort de ce genre
d'outil. Le test appelle la vraie API et échoue bruyamment si sa forme change :

```bash
node --test packages/connectors/src/be/lokaalbeslist/contrat.test.ts
```

## Licence

Code sous **EUPL-1.2**. Données : voir la licence portée par chaque item —
Modellicentie Gratis Hergebruik pour les décisions locales flamandes, mention de
la source obligatoire.

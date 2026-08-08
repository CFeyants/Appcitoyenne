# Source — Lokaal Beslist (décisions locales flamandes)

**Fiche établie le 8 août 2026.** Une fiche par source, comme prévu au § 10 du
brief : endpoint, licence, cadence, limites connues.

| | |
|---|---|
| **Organisme** | Vlaamse overheid — portail Lokaal Beslist |
| **Racine** | `https://lokaalbeslist.vlaanderen.be` |
| **Protocole** | JSON:API — en-tête `Accept: application/vnd.api+json` obligatoire |
| **Authentification** | aucune, aucune clé |
| **Licence** | Modellicentie Gratis Hergebruik — **mention de la source obligatoire** |
| **Cadence retenue** | 250 ms entre requêtes, 4 tentatives, temporisation exponentielle |
| **Connecteur** | `packages/connectors/src/be/lokaalbeslist/` |
| **Test de contrat** | `contrat.test.ts` — à exécuter chaque nuit |

## Le graphe réel

Établi par appel, pas par lecture de documentation :

```
session ──agenda-items──▶ agenda-item ──handled-by──▶ agenda-item-handling ──resolutions──▶ besluit
```

Une seule requête suffit à le parcourir :

```
GET /sessions
  ?filter[governing-body][is-time-specialization-of][administrative-unit][name]=Kraainem
  &page[size]=20&page[number]=0&sort=-started-at
  &include=agenda-items.handled-by.resolutions,governing-body.is-time-specialization-of
```

## Limites connues — à ne pas redécouvrir

1. **Les filtres imbriqués ne fonctionnent que depuis `/sessions`.** Appeler
   `/agenda-items` ou `/resolutions` avec un filtre par commune renvoie **406
   Not Acceptable**. Il faut toujours partir des séances et descendre par
   `include`.
2. **`/search` n'existe pas** (404), contrairement à ce qu'annonce le dossier
   d'origine.
3. **`resolution.title` vaut presque toujours « Besluit »** chez les communes
   servies par Meetingburger. Le titre porteur de sens est sur l'**agenda-item**.
4. **Deux conventions d'éditeur coexistent**, et c'est le piège principal :
   - *Meetingburger* (Kraainem, Wemmel, Wezembeek-Oppem, Drogenbos) : intitulé
     sur le **point**, besluit souvent réduit à l'objet.
   - *Gelinkt Notuleren* (Linkebeek) : point **sans aucun attribut de titre**,
     intitulé **et** corps substantiel sur le **besluit**.

   Un connecteur qui ne lit que le point perd **310 décisions sur 340** chez
   Linkebeek, sans la moindre erreur. C'est pourquoi le test de contrat n° 5
   surveille spécifiquement cette commune.
5. **`resolution.uri` est malformé** chez Meetingburger : l'hôte y figure deux
   fois. Seul son fragment (`#puntbesluit<guid>`) est exploitable ; on le greffe
   sur la page d'agenda valide pour obtenir un lien vers l'acte plutôt que vers
   la page.
6. **`resolution.value`** est tantôt l'URL d'un PDF, tantôt du texte libre. Ne
   jamais le supposer.
7. **Les séances n'ont pas de lien `self`** : `links` est vide.
8. **Le nom de l'organe** est porté par le bestuursorgaan *parent*, pas par sa
   spécialisation temporelle — qui n'a qu'une `start-date`. D'où le double
   `include` sur `governing-body.is-time-specialization-of`.

## Couverture observée — 40 séances par commune, 8 août 2026

| Commune | NIS | Séances indexées | Décisions retenues | Écartées |
|---|---|---:|---:|---|
| Drogenbos | 23098 | 774 | 488 | 1 sans intitulé |
| Kraainem | 23099 | 1 065 | 426 | — |
| Linkebeek | 23100 | 298 | 577 | 21 sans intitulé |
| Rhode-Saint-Genèse | 23101 | 539 | 25 | **18 sans délibération** |
| Wemmel | 23102 | 635 | 695 | 4 sans intitulé |
| Wezembeek-Oppem | 23103 | 441 | 799 | — |

**Rhode-Saint-Genèse est une vraie lacune de la source, pas un défaut du
connecteur** : la commune publie ses ordres du jour mais très peu de
délibérations en données liées. Ce chiffre est affiché tel quel dans
l'interface plutôt que masqué.

## Ce que la source ne donne pas

- **La portée des décisions n'est pas structurée.** Aucun champ ne dit « ce qui
  change, pour qui, à partir de quand ». Quand le corps du besluit est publié,
  il en tient lieu ; sinon, l'item porte `impactEtabli: "construit"` et
  l'interface le signale explicitement. Ne jamais faire passer l'un pour l'autre.
- **Tout est en néerlandais.** Aucune traduction officielle n'est publiée, y
  compris pour les six communes à facilités. Traduire un acte lui ferait perdre
  sa valeur juridique : le texte est rendu dans sa langue d'origine, et la
  langue est affichée.
- **Le rattachement thématique n'existe pas** dans la source. Il est dérivé de
  mots-clés néerlandais (`classement.ts`) : c'est une aide à la navigation, pas
  une affirmation sur le contenu de l'acte. En cas de doute, « autre ».

## Rafraîchir

```bash
node scripts/ingest.ts --seances=40          # les six communes
node scripts/ingest.ts --commune=23099       # une seule
```

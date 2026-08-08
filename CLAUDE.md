# Plateforme citoyenne — brief de construction

**Comment utiliser ce fichier.** Place-le à la racine du dépôt sous le nom `CLAUDE.md`,
ouvre le dossier dans VS Code, lance Claude Code et demande-lui de lire ce fichier puis
d'exécuter le **Lot 1**. Ne lui demande jamais plusieurs lots à la fois. Ce brief est
normatif : ce qui est écrit sous « Règles non négociables » ne se discute pas et doit
être vérifiable dans le code.

---

## 1. Ce qu'on construit

Une plateforme qui donne à un citoyen, en un seul endroit, ce qui le concerne réellement
dans la décision publique : les règles et décisions qui changent quelque chose pour lui,
les aides auxquelles il est probablement éligible, les objectifs poursuivis par sa
commune, sa région, son pays et l'Union, la performance des institutions qui le servent,
et le moyen d'adresser une demande à la bonne administration.

**Quatre niveaux, une seule lecture : commune → région → pays → Europe.**

Un état antérieur existe et sert de point de départ :
<https://appcommunale.vercel.app/> (maquette communale Kraainem). Ce qu'il faut en garder
et ce qu'il faut en changer est listé au § 9.

### Ce que la plateforme n'est pas

Ce point est structurant, pas décoratif. **Ce n'est pas un fil d'actualité.** Pas de
sport, pas de faits divers, pas de personnalités, pas de « une start-up a levé des fonds ».

Un contenu n'entre que s'il passe le **test d'admission** (§ 3). Tout le reste est hors
périmètre, y compris quand c'est intéressant.

---

## 2. Règles non négociables

Elles viennent de la doctrine du projet. Chacune doit être vérifiable dans le code ou
dans un test.

1. **Aucune information sans source.** Chaque élément affiché porte l'organisme émetteur,
   la date de la donnée, l'URL d'origine et la licence. Un objet sans source ne se rend
   pas : il lève une erreur en développement et il est filtré en production.
2. **Les intérêts sont déclarés, jamais déduits.** Pas de profilage comportemental, pas
   de traçage, pas de « vous avez aimé ». L'utilisateur voit et modifie ses critères à
   tout moment, et une page explique en français ordinaire comment le classement
   fonctionne.
3. **Conçu pour rendre du temps, pas pour le capter.** Pas de défilement infini, pas de
   notifications par défaut, pas de badge, pas de série, pas de score citoyen, pas de
   compteur de temps passé. Le succès se mesure à ce qui se passe hors de la plateforme.
4. **Aucun classement de personnes.** On mesure des dispositifs, des budgets, des
   délais — jamais un agent, jamais un élu par une note. Un fait établi, jamais une
   appréciation.
5. **La plateforme n'est pas un intermédiaire financier.** Elle décrit et renvoie ; elle
   n'encaisse pas, ne conseille pas, ne classe pas par rendement. Voir § 8.
6. **Réversibilité.** Code sous licence libre, données brutes exportables en JSON/CSV sur
   chaque écran, schémas documentés. Tuer l'organisation ne doit pas tuer l'outil.
7. **Multilingue dès le premier jour.** FR / NL / EN au minimum, chaîne par chaîne,
   jamais codée en dur. Le néerlandais n'est pas une traduction ajoutée à la fin : c'est
   une condition d'existence en Belgique, et une condition de financement dans la
   périphérie bruxelloise.
8. **Accessibilité.** WCAG 2.2 AA. Aucun statut porté par la couleur seule : toujours
   icône + mot. Palette validée pour la vision des couleurs, en clair et en sombre.

---

## 3. Le test d'admission d'un contenu

Un item n'entre dans la base que s'il répond **oui aux trois questions** :

1. **Y a-t-il un acte derrière ?** Une décision, un règlement, une loi, un budget voté,
   un arrêté, une consultation ouverte, un droit ouvert, une alerte officielle. Un
   article de presse n'est pas un acte ; il peut être une source secondaire, jamais
   l'objet.
2. **Est-ce que cela change quelque chose pour quelqu'un ?** L'item doit pouvoir remplir
   le champ `impact` : ce qui change, pour qui, à partir de quand.
3. **Y a-t-il quelque chose à faire, ou rien ?** Le champ `action` est obligatoire, y
   compris avec la valeur `aucune_action` — auquel cas on l'écrit noir sur blanc, ce qui
   est déjà un service.

Un item qui échoue à l'un des trois n'est pas publié. **Ce filtre est le cœur du
produit ; il doit être implémenté comme une validation de schéma, pas comme une consigne
éditoriale.**

---

## 4. Modèle de données

Types principaux, en TypeScript (à placer dans `packages/core/src/types.ts`) :

```ts
type Niveau = 'commune' | 'region' | 'pays' | 'europe';

interface Source {
  organisme: string;        // "Agentschap Binnenlands Bestuur"
  url: string;              // lien direct vers l'acte
  dateDonnee: string;       // ISO 8601
  licence: string;          // "Modellicentie Gratis Hergebruik" | "CC BY 4.0" | ...
  consulteLe: string;       // ISO 8601
}

interface Item {
  id: string;
  niveau: Niveau;
  territoire: string;       // code INS/NIS, code région, ISO pays, "EU"
  type: 'decision' | 'regle' | 'budget' | 'consultation' | 'droit' | 'alerte' | 'seance';
  titre: string;            // ≤ 90 caractères, en français ordinaire
  impact: string;           // ce qui change, pour qui, à partir de quand
  action: Action;           // jamais vide — voir ci-dessous
  themes: string[];         // vocabulaire fermé, voir § 5
  publics: string[];        // "parents", "locataires", "indépendants", "aînés"...
  entreeEnVigueur?: string;
  echeance?: string;        // pour une consultation ou une demande d'aide
  source: Source;           // obligatoire
  objectifsLies: string[];  // ids d'objectifs — voir Objectif
}

type Action =
  | { kind: 'aucune_action'; explication: string }
  | { kind: 'demarche'; libelle: string; url: string; delai?: string }
  | { kind: 'consultation'; libelle: string; url: string; clotureLe: string }
  | { kind: 'seance'; libelle: string; date: string; lieu: string; inscription?: string }
  | { kind: 'demande'; destinataireId: string };   // routage interne, § 7

interface Objectif {
  id: string;
  niveau: Niveau;
  territoire: string;
  intitule: string;         // "50 % des cantines en circuits courts d'ici 2035"
  cible: { valeur: number; unite: string; echeance: string };
  mesure?: { valeur: number; dateMesure: string; source: Source };
  rattachements: string[];  // ids d'objectifs de niveau supérieur
  source: Source;
}

interface Droit {                 // une aide, une allocation, une réduction
  id: string;
  intitule: string;
  niveau: Niveau;
  territoire: string;
  conditions: Condition[];        // évaluables, chacune avec sa source
  montantIndicatif?: string;      // toujours "indicatif", jamais un calcul ferme
  automatique: boolean;           // le droit est-il octroyé sans démarche ?
  demarche?: { libelle: string; url: string; delai?: string };
  source: Source;
}
```

**Règle d'or sur `Droit`** : la plateforme n'écrit **jamais** « vous y avez droit ». Elle
écrit « vous êtes probablement éligible », affiche les conditions une par une avec leur
source, et renvoie vers le formulaire officiel. Le calcul est une orientation, jamais une
décision. Toute autre formulation crée une responsabilité que le projet ne peut pas
porter.

---

## 5. L'algorithme de pertinence

Transparent, déterministe, explicable en une phrase à l'écran. **Pas de modèle appris.**

```
score(item, profil) =
    w_theme      * recouvrement(item.themes, profil.themes)
  + w_public     * recouvrement(item.publics, profil.publics)
  + w_territoire * proximite(item.territoire, profil.territoires)   // commune > région > pays > Europe
  + w_action     * (item.action.kind !== 'aucune_action' ? 1 : 0)
  + w_echeance   * urgence(item.echeance)                            // décroissance sur 30 jours
```

Contraintes d'implémentation :

- Les poids sont **visibles dans l'interface** et exportés dans le JSON de chaque écran.
- Chaque item affiché porte **la raison de sa présence** : « parce que vous avez déclaré
  *familles* et que la décision concerne votre commune ».
- Un interrupteur **« tout voir »** désactive le filtre entièrement, avec le décompte de
  ce qui était masqué. L'utilisateur doit toujours pouvoir sortir de sa bulle en un clic.
- **Aucune personnalisation implicite** : deux utilisateurs avec le même profil déclaré
  voient exactement la même chose, dans le même ordre.
- Vocabulaire de thèmes **fermé et versionné** (`packages/core/src/themes.ts`), pour que
  le filtre reste comparable entre territoires et dans le temps.

---

## 6. Sources de données — Belgique en premier

Ces points d'accès ont été testés le **7 août 2026**. Ils constituent le socle du
connecteur belge. Chaque connecteur vit dans `packages/connectors/<pays>/<source>/` et
expose la même interface `fetch(): Promise<Item[] | Objectif[] | Droit[]>`.

> ⚠️ **Deux entrées de cette section sont périmées.** Voir l'**annexe A** en fin de
> fichier : re-vérification du 8 août 2026, avec les identifiants réellement valides.

### Niveau communal (Flandre)

- **Décisions locales**, JSON:API public, sans clé :
  `GET https://lokaalbeslist.vlaanderen.be/sessions?filter[governing-body][is-time-specialization-of][administrative-unit][name]=<commune>`
  avec l'en-tête `Accept: application/vnd.api+json`. Ressources : `/sessions`,
  `/agenda-items`, `/resolutions`, `/articles`, `/mandataries`, `/votes`, `/search`.
  *(Vérifié : 1 063 séances pour Kraainem depuis mai 2021.)* **C'est le connecteur à
  écrire en premier.**
- **Finances communales comparables** : dataset « Digitale Rapporteringen BBC —
  wekelijks » sur data.gov.be (uuid `74607c08-e7de-48e5-8c53-5ab878542680`) — format à
  vérifier au premier appel.
- **Registre du bâti** : `https://api.basisregisters.vlaanderen.be/v2/…`

### Environnement et énergie

- **Qualité de l'air**, CC BY 4.0 : `https://geo.irceline.be/sos/api/v1/stations`,
  WFS `https://geo.irceline.be/realtime/ows`, grilles modélisées sur
  `ftp.irceline.be/rio4x4/`.
- **Points de mesure des eaux de surface** (OGC API Features) :
  `https://geo.api.vlaanderen.be/MeetplOppervlwaterkwal/ogc/features/v1/collections/Mtploppw/items`
- **Assainissement**, WFS : `https://geoserver.vmm.be/geoserver/HDGIS/wfs`
- **Énergie par commune** (Opendatasoft) : `https://opendata.fluvius.be/` — jeux
  `totaal-gealloceerd-volume`, `lokale-productie-installaties-per-gemeente`.
  **→ identifiants périmés, voir annexe A.**

### Niveau fédéral et européen

À instruire au **Lot 4** : Moniteur belge / Justel, la Chambre, l'eBox citoyen ; côté
européen EUR-Lex, le portail de données ouvertes du Parlement, et « Have your say » pour
les consultations. **Ne code rien avant d'avoir appelé l'endpoint et lu la réponse.**

### Ce qui n'existe pas

À afficher comme tel plutôt qu'à combler : les résultats d'analyse de la qualité de
l'eau, le potentiel solaire par toiture, la répartition des labels énergétiques, les
résultats électoraux communaux 2024, et le non-recours aux droits à l'échelle communale.

**Interdiction** : ne jamais moissonner `kraainem.be`, dont le `robots.txt` l'interdit.
La donnée équivalente est dans les canaux ci-dessus.

---

## 7. Les demandes citoyennes

Un citoyen rédige une demande ; la plateforme la route vers l'institution compétente.

- Une **table de compétences versionnée** (`packages/core/src/competences.ts`) fait
  correspondre `{ thème, territoire } → institution`, avec le fondement juridique et le
  canal de dépôt.
- Le routage est **suggéré, jamais automatique** : l'utilisateur voit le destinataire
  proposé et la raison, et peut le changer.
- **Ne promets aucune intégration qui n'existe pas.** En v1, une demande produit un
  document prêt à envoyer, avec le canal officiel et le délai légal de réponse quand il
  existe. L'envoi automatisé et l'accusé de réception sont un lot ultérieur, conditionné
  à une convention avec l'institution.
- Chaque demande affiche le **délai de réponse prévu par les textes** et, une fois de la
  matière accumulée, le **délai réellement observé**. C'est le cœur de la valeur.

---

## 8. Financement de projets

La plateforme **fait le lien** avec les plateformes existantes. Elle n'en devient jamais
une.

- Elle ne collecte pas d'argent, ne conseille pas, ne classe pas par rendement. Un lien
  sortant, une fiche descriptive, l'avertissement sur le risque de perte en capital et
  l'illiquidité des parts.
- Ne référencer que des acteurs **agréés** (liste FSMA des prestataires au titre du
  règlement européen 2020/1503) ou des coopératives citoyennes clairement identifiées.
- **Vérité sur les API** : à ce jour, ni les plateformes agréées belges ni les
  coopératives d'énergie n'exposent d'API publique documentée. En v1, la couche
  d'intégration est un schéma de fiche projet (`Projet`) alimenté manuellement ou par
  flux fourni par le partenaire, avec un adaptateur par partenaire. Écris l'interface
  comme si l'API existait ; branche des adaptateurs statiques en attendant.
- Le rendement affiché est le **rendement observé**, pas le plafond légal. Pour les
  coopératives flamandes d'énergie, la fourchette réelle des trois dernières années va de
  0 % à 4 % pour un plafond légal de 6 % ; afficher 6 % serait une promesse.

---

## 9. Ce qu'on garde de la maquette existante, et ce qu'on change

**À garder — c'est déjà juste** : l'étiquette de rattachement d'un objectif aux niveaux
supérieurs ; la clause d'arrêt avec seuils, échéances et état ; le registre des échecs ;
les indicateurs personnels privés et non comparatifs ; la page « comment l'algorithme
décide » ; la triple comptabilité sur les projets ; l'absence de notifications et de
défilement infini.

**À changer :**

1. **Données réelles avant tout le reste.** Remplacer les décisions fictives par le flux
   Lokaal Beslist. Tant qu'un écran est fictif, il porte le bandeau « maquette » ; dès
   qu'il est réel, le bandeau disparaît **sur cet écran**.
2. **Retirer tout indicateur mesurant l'usage de la plateforme** des KPI publics. Les
   remplacer par : délai entre une décision et sa publication lisible, nombre de
   réutilisations des données par des tiers, taux de réponse aux demandes et délai de
   première réponse.
3. **Retourner l'entraide** : afficher les demandes avant les offres, rendre demander
   gratuit en effort et en honte, et commencer par les demandes dont l'échec ne coûte
   rien.
4. **Budget** : un nombre héroïque, une décomposition en une seule barre, puis des jauges
   voté/exécuté, puis la comparaison avec les communes voisines par habitant. La maquette
   de référence est fournie (`kraainem-budget-kpi.html`) — reprends sa structure et sa
   palette.
5. **Ajouter l'inscription unique** pour les activités d'un enfant : un seul formulaire,
   les échéances tenues à la place du parent. C'est la fonction qui rend réellement du
   temps.
6. **« Interpeller » doit avoir une destination réelle** ou changer de nom.

---

## 10. Architecture

Monorepo, TypeScript de bout en bout.

```
/apps/web            Next.js (App Router), rendu serveur, i18n FR/NL/EN
/packages/core       types, schémas Zod, algorithme de pertinence, table de compétences
/packages/connectors un dossier par source, interface commune, tests de contrat
/packages/ui         composants et jetons de design (voir § 11)
/data                instantanés versionnés pour les tests et le mode hors-ligne
/docs                une fiche par source : endpoint, licence, cadence, limites connues
```

Principes :

- **Un connecteur ne parle jamais à l'interface.** Il produit des objets
  `Item | Objectif | Droit` validés par Zod. Toute donnée non conforme est rejetée avec
  un journal explicite.
- **Ingestion planifiée, pas à la demande** : une tâche périodique remplit une base ;
  l'interface lit la base. Aucun appel à une API tierce pendant le rendu d'une page.
- **Cache et politesse** : ETag/If-Modified-Since, limitation de débit, User-Agent
  identifiant le projet et un contact.
- Chaque écran expose son JSON à la même URL suffixée `.json`.
- **Aucun compte n'est requis pour lire.** L'identification (itsme en Belgique) n'est
  demandée que pour ce qui l'exige réellement : une demande nominative, un droit
  personnel. Le profil de thèmes vit côté client tant qu'aucun compte n'existe.
- **Données personnelles** : minimisation stricte, aucune donnée de navigation, registre
  des traitements, base légale documentée par usage.

---

## 11. Design

Reprendre la palette et les composants de `kraainem-budget-kpi.html` (fourni) :

- Palette catégorielle **validée pour la vision des couleurs**, mode clair et sombre.
- **Un seul nombre héroïque par écran** ; tout le reste en retrait.
- Marques fines, extrémités arrondies de 4 px, séparateurs de 2 px dans la couleur du
  fond, grilles en filet, étiquettes directes plutôt qu'une valeur sur chaque point.
- **Statut : quatre états seulement** — conforme, en retard, sérieux, hors seuil —
  toujours avec icône **et** mot.
- Chaque graphique a une **vue tableau** accessible en un clic, et un export.
- **Mobile d'abord** : tout doit tenir à 390 px de large.

---

## 12. Plan de construction

**Un lot à la fois.** Chaque lot se termine par ses critères d'acceptation, vérifiables.

**Lot 1 — le squelette et une vérité.** Monorepo, types, schémas Zod, i18n, design
system, et le connecteur Lokaal Beslist. Écran unique : les décisions réelles d'une
commune, filtrables, chacune avec sa source.
*Acceptation :* au moins 500 décisions réelles rendues, aucune donnée fictive à l'écran,
export JSON fonctionnel, interface complète en FR et NL.

**Lot 2 — objectifs et budget.** Le modèle `Objectif` avec ses rattachements aux quatre
niveaux, l'écran budget selon la maquette fournie, et la comparaison entre communes.
*Acceptation :* chaque objectif affiché porte sa source et son rattachement ; le budget se
recharge depuis une source réelle ou déclare explicitement qu'il est illustratif.

**Lot 3 — pertinence et profil.** Thèmes déclarés, algorithme, page d'explication,
interrupteur « tout voir ».
*Acceptation :* deux profils identiques produisent un ordre identique ; chaque item
affiche la raison de sa présence ; aucun traceur n'est chargé.

**Lot 4 — droits et demandes.** Le modèle `Droit`, un premier jeu d'aides réelles avec
leurs conditions sourcées, la table de compétences et la génération d'une demande prête à
envoyer.
*Acceptation :* aucune formulation affirmative sur l'éligibilité ; chaque condition porte
sa source ; chaque demande affiche le délai légal de réponse.

**Lot 5 — montée en niveaux.** Fédéral et européen : EUR-Lex, consultations ouvertes,
objectifs européens rattachés.
*Acceptation :* un même écran affiche les quatre niveaux sans changer de grammaire.

**Lot 6 — projets et financement.** Fiches projet, triple comptabilité, adaptateurs
partenaires, avertissements réglementaires.
*Acceptation :* aucun encaissement, aucun classement par rendement, avertissement visible
sur chaque fiche.

---

## 13. Ce dont je doute, et qu'il faut décider tôt

À traiter comme des questions ouvertes, pas comme des détails d'implémentation.

- **L'éligibilité aux aides est la promesse la plus difficile du produit.** Les moteurs
  d'éligibilité sont un cimetière : les règles changent, les exceptions dominent, et une
  réponse fausse a un coût réel pour quelqu'un de précaire. Commencer par **cinq droits**
  très documentés, et n'en ajouter un qu'après avoir tenu le précédent à jour six mois.
- **La performance des entreprises participantes.** Une plateforme d'intérêt général qui
  note des sociétés s'expose. La seule forme tenable : l'entreprise publie elle-même sa
  triple comptabilité selon un schéma ouvert, la plateforme l'affiche avec la source et
  la date, et **ne calcule aucun score**. L'adhésion est volontaire et révocable.
- **Le passage à l'échelle affaiblit la gouvernance.** Le principe retenu — celui qui
  gouverne est celui qui utilise — s'applique mal à une plateforme nationale. La
  coopérative est la bonne réponse à condition que les usagers y aient une voix réelle,
  pas un siège d'observateur.
- **Le risque de dérive vers l'actualité.** À chaque revue, prendre dix items au hasard
  et vérifier qu'ils passent le test d'admission. Le jour où l'on publie un item sans
  acte derrière, le produit a changé de nature.
- **Le périmètre du pilote reste à trancher.** L'architecture peut être mondiale ; la
  preuve doit rester locale et vérifiable. Garder **une commune réelle branchée de bout
  en bout** est ce qui distingue ce projet d'une maquette de rêve.

---

## 14. Liste d'améliorations — au-delà du périmètre décrit

Classées par rapport entre l'effort et ce que ça change. À piocher, pas à faire en entier.

### Ce qui rendrait la plateforme utile plus vite

- **L'inscription unique pour un enfant.** Un formulaire, une fois, pour l'école, la
  garderie, la cantine, le sport et l'académie — et les échéances tenues à la place du
  parent. C'est la seule fonction de tout le produit qui **rende du temps** au lieu d'en
  informer. Probablement la deuxième chose la plus utile après la lisibilité des
  décisions.
- **Le suivi d'un dossier plutôt que sa création.** « Où en est ma demande de prime ? »
  est une question plus fréquente que « quelle prime existe ? ». Même sans intégration,
  un rappel daté et le délai légal affiché valent déjà beaucoup.
- **L'alerte de fin de droit.** Prévenir avant qu'une aide expire ou qu'une démarche
  annuelle arrive — c'est le seul cas où une notification est légitime, parce qu'elle
  évite une perte.
- **Le mode « expliquez-moi ce texte ».** Coller un extrait de règlement et obtenir sa
  portée en français ordinaire, avec le lien vers l'original. À condition d'afficher que
  la reformulation n'a pas valeur juridique.
- **Une page « ce qui a changé ce mois-ci pour vous »**, envoyée une fois par mois si —
  et seulement si — l'utilisateur le demande. Un courriel mensuel qu'on choisit vaut
  mieux qu'un fil qu'on subit.

### Ce qui rendrait la plateforme crédible

- **Le journal des corrections.** Quand une donnée était fausse, l'écrire, dater,
  expliquer. Aucune plateforme publique ne le fait, et c'est ce qui distingue un outil
  sérieux.
- **Le délai réel de réponse des institutions**, mesuré par les demandes passées par la
  plateforme et comparé au délai légal. C'est la donnée la plus inconfortable et la plus
  utile que le produit puisse produire — et personne d'autre ne peut la produire.
- **Le taux de non-recours estimé** par droit et par territoire : nombre d'ayants droit
  estimés contre nombre de bénéficiaires effectifs. La donnée n'existe pas aujourd'hui ;
  la construire serait une contribution en soi.
- **Le registre des observations**, tenu publiquement : ce qui a été tenté, ce qui a
  échoué, ce qu'on en a appris. Prolongement direct du registre des échecs.
- **La vérification citoyenne d'un chiffre** : un bouton « ce chiffre me semble faux »
  qui ouvre un fil public rattaché à la donnée, avec la réponse de l'émetteur. La
  contestation devient une fonctionnalité au lieu d'être un incident.

### Ce qui rendrait la plateforme durable

- **Un connecteur générique** plutôt que des connecteurs sur mesure. Dès le troisième
  pays, écrire un adaptateur déclaratif (fichier de configuration décrivant l'endpoint et
  le mapping) plutôt qu'un module par source. C'est ce qui décide si la plateforme peut
  dépasser trois territoires.
- **Un test de contrat par source**, exécuté chaque nuit, qui alerte quand une API change
  de forme. Les portails publics changent sans prévenir ; c'est la première cause de mort
  de ce genre d'outil.
- **Un mode dégradé explicite.** Quand une source est indisponible, l'afficher — « donnée
  non rafraîchie depuis le 3 mars » — plutôt que de montrer une valeur périmée sans le
  dire.
- **L'export d'un territoire complet** en une archive, pour qu'un chercheur, un
  journaliste ou une autre commune puisse tout reprendre. C'est la réversibilité rendue
  concrète.
- **Un budget d'attention affiché** : le temps de lecture estimé de chaque écran, et
  l'engagement de ne jamais le faire croître d'une version à l'autre. Une promesse qu'on
  peut vérifier.

### Ce qu'il faut se retenir de faire

- **Pas de commentaires libres, pas de votes sur les décisions, pas de fil social.** Cela
  transformerait le produit en réseau et importerait tous les problèmes qu'il prétend
  éviter — modération, brigades, polarisation.
- **Pas de score par institution ni par entreprise.** Des indicateurs sourcés, oui ; un
  classement, non.
- **Pas d'application mobile native avant longtemps.** Un site rapide et installable
  suffit, et coûte trois fois moins cher à maintenir.
- **Pas de personnalisation apprise.** Le jour où l'ordre dépend du comportement, la
  règle 2 tombe et avec elle la raison d'exister du produit.

---

## Annexe A — re-vérification des sources, 8 août 2026

Le § 6 date du 7 août 2026. Chaque point d'accès automatisable a été **rappelé le 8 août
2026** depuis le poste de développement. Ce qui suit fait foi sur les identifiants ; le
§ 6 reste la référence pour l'intention.

### Confirmé

| Source | Résultat de l'appel |
|---|---|
| Lokaal Beslist | **1 063 séances** pour Kraainem, la plus récente du 4 août 2026 |
| VMM — points de mesure des eaux | **22 points** dans la fenêtre, dont **7 sur le territoire communal** |
| IRCELINE — stations | **137 stations** en Belgique, **aucune à Kraainem** (la plus proche : Arts-Loi, ~6 km, station trafic) |
| Basisregisters Vlaanderen | répond en anonyme, **NIS 23099** confirmé |

### Corrigé — les identifiants du § 6 sont périmés

Les deux jeux Fluvius cités (`totaal-gealloceerd-volume`,
`lokale-productie-installaties-per-gemeente`) **n'existent plus** dans le catalogue
Opendatasoft. Les identifiants valides au 8 août 2026 :

| Usage | Identifiant réel |
|---|---|
| Consommation élec/gaz par commune | `1-19-totaal-gealloceerd-volume` (champ `leveringsadresgemeente`, en **majuscules**) |
| Production décentralisée | `1_20-lijst-van-decentrale-productie-installaties-gekoppeld-aan-het-distributiene` (champ `postcode`) |
| Consommation par rue | `1_03-verbruiksgegevens-op-straatniveau` |
| Gestionnaire de réseau par commune | `1_23-dnb-per-gemeente-en-per-sector` |

Valeurs obtenues pour Kraainem (12 mois, juin 2025 → mai 2026) : **31,8 GWh**
d'électricité prélevée, **92,0 GWh** de gaz, **2,3 GWh** réinjectés ; **986 installations**
de production décentralisée, **5 188 kVA**, relevé de juillet 2026. La question du
rattachement historique à Sibelgas est réglée : la commune est bien dans les données
Fluvius.

### À localiser

L'API CKAN de data.gov.be **n'a pas répondu** au chemin standard
(`/api/3/action/package_search`). Le dataset BBC hebdomadaire — et donc la comparaison
budgétaire entre communes du Lot 2 — reste **à localiser** avant d'être annoncé comme
acquis.

### Ajouté — les commerces de la commune

Aucune source publique n'existe pour la liste des commerçants : ni registre communal
ouvert, ni filtre « commerce ouvert au public » par commune dans la Banque-Carrefour des
Entreprises. La meilleure source ouverte disponible est **OpenStreetMap** via l'API
Overpass (licence **ODbL**, attribution obligatoire) : **108 établissements** relevés pour
Kraainem. Contributive, donc incomplète — 30 fiches sur 108 portent une adresse complète.
À afficher comme tel, conformément au § 6 « ce qui n'existe pas ».

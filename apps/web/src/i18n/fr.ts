/**
 * Le français est le dictionnaire de RÉFÉRENCE : son type définit la surface
 * que le néerlandais et l'anglais doivent couvrir. Pas de `as const` ici — il
 * figerait chaque chaîne en type littéral et rendrait les autres langues
 * inassignables. Ce sont les CLÉS qui doivent coïncider, pas les valeurs.
 */
export const fr = {
  langue: "fr",
  site: "Plateforme citoyenne",
  baseline: "Ce que la décision publique change pour vous",

  nav: {
    decisions: "Décisions",
    aPropos: "Comment ceci fonctionne",
    passerAuContenu: "Aller au contenu",
    changerLangue: "Langue",
  },

  decisions: {
    titre: "Décisions des six communes à facilités",
    intro:
      "Les délibérations réellement adoptées par les conseils communaux, collèges et CPAS. Chaque décision porte sa source, sa date et sa licence. Rien n'est ajouté, rien n'est résumé automatiquement.",
    unite: "décisions",
    communesUnite: "communes",
    releveLe: "relevé le",
    aucune: "Aucune décision ne correspond à ce filtre.",
    filtrer: "Filtrer",
    filtreCommune: "Commune",
    filtreTheme: "Thème",
    filtreOrgane: "Organe",
    toutes: "Toutes",
    tous: "Tous",
    recherche: "Rechercher dans les intitulés",
    rechercheAide: "La recherche porte sur le texte publié par la commune, en néerlandais.",
    voirSource: "Voir l'acte",
    exporter: "Télécharger ces données (JSON)",
    exportNote:
      "Données brutes réutilisables. Vous n'avez besoin d'aucun compte pour les obtenir.",
    page: "Page",
    precedent: "Précédent",
    suivant: "Suivant",
  },

  item: {
    impact: "Ce que dit la décision",
    action: "Ce qu'il y a à faire",
    source: "Source",
    consulteLe: "Relevé le",
    licence: "Licence",
    publieLe: "Publié le",
    langueSource: "Texte publié en néerlandais par la commune",
    impactConstruit:
      "Le corps de la délibération n'est pas publié sous forme exploitable. Cet énoncé est construit à partir des seuls champs de la source ; le texte fait foi.",
    impactPublie: "Texte publié par l'autorité.",
  },

  action: {
    aucune: "Rien à faire",
    demarche: "Démarche",
    consultation: "Consultation ouverte",
    seance: "Séance publique",
    demande: "Demande",
  },

  couverture: {
    titre: "Ce que cette page ne montre pas",
    intro:
      "Toutes les communes ne publient pas au même niveau de détail. Voici, commune par commune, ce que la source n'a pas permis de retenir.",
    retenues: "Retenues",
    sansDeliberation: "Sans délibération publiée",
    sansIntitule: "Sans intitulé exploitable",
    sansLien: "Sans lien vers l'acte",
    seancesLues: "Séances lues",
    rien: "Aucun point écarté.",
  },

  apropos: {
    titre: "Comment ceci fonctionne",
    admissionTitre: "Ce qui entre, et ce qui n'entre pas",
    admissionTexte:
      "Un contenu n'est publié que s'il répond oui à trois questions : y a-t-il un acte derrière ? cela change-t-il quelque chose pour quelqu'un ? y a-t-il quelque chose à faire, ou rien ? Ce filtre est une validation de schéma, pas une consigne éditoriale : ce qui échoue n'est pas affiché.",
    sourceTitre: "Aucune information sans source",
    sourceTexte:
      "Chaque décision porte l'organisme émetteur, la date, le lien vers l'acte et la licence. Un objet sans source ne se rend pas.",
    profilTitre: "Vos intérêts sont déclarés, jamais déduits",
    profilTexte:
      "Cette plateforme ne vous observe pas. Aucun traceur n'est chargé, aucun comportement n'est enregistré, et deux personnes ayant déclaré les mêmes critères voient exactement la même chose dans le même ordre. Le classement par pertinence arrive au lot suivant ; sa formule et ses poids sont déjà publics ci-dessous.",
    tempsTitre: "Conçue pour rendre du temps",
    tempsTexte:
      "Pas de défilement infini, pas de notification, pas de badge, pas de score. Le succès se mesure à ce qui se passe hors de cette page.",
    langueTitre: "Sur la langue",
    langueTexte:
      "Les six communes du pilote sont flamandes et publient leurs actes en néerlandais. L'interface est en français, néerlandais et anglais, mais le texte des décisions est rendu dans sa langue d'origine : traduire un acte administratif lui ferait perdre sa valeur juridique. Pour une population majoritairement francophone, cet écart n'est pas un détail technique — c'est le problème que cette plateforme rend visible.",
    poidsTitre: "Les poids du classement",
    licencesTitre: "Licences",
  },

  degrade: {
    titre: "Donnée non rafraîchie",
    texte: (date: string) => `La source n'a pas répondu au dernier passage. Données inchangées depuis le ${date}.`,
  },

  pied: {
    licence: "Code sous licence EUPL-1.2 · données brutes exportables sur chaque écran",
    source: "Source des décisions",
    maquette: "Aucune donnée fictive sur cet écran.",
  },
};

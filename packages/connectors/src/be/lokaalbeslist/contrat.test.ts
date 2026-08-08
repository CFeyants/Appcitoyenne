/**
 * Test de CONTRAT — brief § 14 : « un test par source, exécuté chaque nuit, qui
 * alerte quand une API change de forme. Les portails publics changent sans
 * prévenir ; c'est la première cause de mort de ce genre d'outil. »
 *
 * Ce test appelle le vrai portail. Il n'a pas vocation à tourner à chaque
 * commit, mais chaque nuit :
 *     node --test packages/connectors/src/be/lokaalbeslist/contrat.test.ts
 *
 * Il vérifie les cinq hypothèses dont dépend le connecteur. Si l'une tombe, le
 * connecteur produit du vide en silence — c'est exactement ce qu'on veut voir
 * échouer bruyamment.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import { collecter, compterSeances } from "./index.ts";
import { ItemSchema, trier, TERRITOIRES, type Item } from "@pc/core";

const KRAAINEM = TERRITOIRES.find((t) => t.code === "23099")!;
const OPTS = { cadenceMs: 400 };

test("1. le filtre par unité administrative répond et indexe des séances", async () => {
  const n = await compterSeances(KRAAINEM.nomLokaalBeslist, OPTS);
  assert.ok(n > 500, `attendu > 500 séances pour Kraainem, obtenu ${n}`);
});

test("2. les six communes du pilote sont toutes indexées", async () => {
  for (const t of TERRITOIRES) {
    const n = await compterSeances(t.nomLokaalBeslist, OPTS);
    assert.ok(n > 0, `${t.nom.fr} : aucune séance indexée — le nom « ${t.nomLokaalBeslist} » ne correspond plus`);
  }
});

test("3. la chaîne séance → point → traitement → besluit est toujours parcourable", async () => {
  const { items } = await collecter(KRAAINEM, { seances: 20, ...OPTS });
  assert.ok(items.length > 50,
    `attendu > 50 décisions sur 20 séances, obtenu ${items.length} — l'include profond a probablement changé de forme`);
});

test("4. chaque décision produite passe le test d'admission du § 3", async () => {
  const { items } = await collecter(KRAAINEM, { seances: 10, ...OPTS });
  const { valides, rejets } = trier<Item>(ItemSchema, items);
  assert.equal(rejets.length, 0,
    `${rejets.length} item(s) invalide(s) : ${rejets[0]?.problemes.join(" ; ")}`);
  assert.ok(valides.length > 0, "aucun item produit");

  for (const i of valides.slice(0, 40)) {
    // Règle non négociable n° 1, vérifiée sur la donnée réelle.
    assert.match(i.source.url, /^https?:\/\//, `URL non absolue : ${i.source.url}`);
    assert.ok(i.source.organisme.length > 3, "organisme émetteur manquant");
    assert.ok(i.source.licence.length > 3, "licence manquante");
    assert.ok(!Number.isNaN(Date.parse(i.source.dateDonnee)), "date de donnée illisible");
    // Le champ action n'est jamais vide, même quand il n'y a rien à faire.
    assert.ok(i.action.kind.length > 0, "action vide");
  }
});

test("5. les deux conventions d'éditeur restent couvertes", async () => {
  // Meetingburger porte l'intitulé sur le point ; Gelinkt Notuleren sur le
  // besluit. Linkebeek utilise la seconde : si sa récolte s'effondre, c'est que
  // le repli sur `resolution.title` a cessé de fonctionner.
  const linkebeek = TERRITOIRES.find((t) => t.code === "23100")!;
  const { items, ecarte } = await collecter(linkebeek, { seances: 20, ...OPTS });
  assert.ok(items.length > 100,
    `Linkebeek : ${items.length} décisions seulement — le repli sur resolution.title est cassé`);
  assert.ok(ecarte.sansIntitule < items.length / 2,
    `Linkebeek : ${ecarte.sansIntitule} points sans intitulé, part anormale`);
});

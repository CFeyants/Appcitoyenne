/**
 * Un test par règle — critère d'acceptation de l'étape A.
 *
 *   node --test packages/core/src/admission.test.ts
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  evaluer, dater, delaiPublication, statutDe,
  MOTIFS_EXCLUSION, MOTIFS_INCLUSION, MOTIF_PERMIS,
} from "./admission.ts";

/* ---------------- A3 : un test par motif d'exclusion ---------------- */

const EXEMPLES_EXCLUS: [string, string][] = [
  ["proces-verbal", "Goedkeuring notulen van de zitting van 4 augustus 2026"],
  ["ordre-du-jour", "Vastlegging dagorde gemeenteraad 2026.08.25"],
  ["personnel", "Cel beleid. Tijdelijke aanstelling van een zorgcoördinator. Goedkeuring."],
  ["fournitures-internes", "Betalingsbevelen — bestelling van kantoorbenodigdheden"],
  ["autorisation-individuelle", "Begraafplaatsen - Begraving"],
  ["procedure-interne", "CBS bevoegdheidsverdeling — kennisname"],
];

for (const [motifAttendu, titre] of EXEMPLES_EXCLUS) {
  test(`exclusion « ${motifAttendu} »`, () => {
    const a = evaluer(titre, null);
    assert.equal(a.publie, false, `« ${titre} » devrait être écarté`);
    assert.equal(a.registre, "ecarte");
    assert.equal(a.motif, motifAttendu);
  });
}

test("chaque motif d'exclusion a un identifiant et trois libellés", () => {
  for (const m of MOTIFS_EXCLUSION) {
    assert.ok(m.id.length > 2, `motif sans identifiant : ${JSON.stringify(m)}`);
    for (const l of ["fr", "nl", "en"] as const) {
      assert.ok(m.libelle[l].length > 5, `motif ${m.id} sans libellé ${l}`);
    }
  }
});

/* ---------------- A3 : les inclusions prioritaires ---------------- */

const EXEMPLES_INCLUS: [string, string][] = [
  ["reglement-taxe", "Belastingreglement op de tweede verblijven — aanslagjaar 2027"],
  ["budget-comptes", "Jaarrekening 2025 — vaststelling"],
  ["travaux-voirie", "Openbare Werken - Grondwerken Alfons Lenaertsstraat"],
  ["mobilite", "Mobiliteit - Aanvullend reglement zone 30"],
  ["tarifs-aides", "Premie voor de plaatsing van zonnepanelen"],
  ["consultation", "Openbaar onderzoek over het gemeentelijk ruimtelijk uitvoeringsplan"],
  ["securite", "Politieverordening naar aanleiding van de kermis"],
  ["ecole-accueil", "Schoolreglement gemeentelijke basisschool 2026-2027"],
];

for (const [motifAttendu, titre] of EXEMPLES_INCLUS) {
  test(`inclusion « ${motifAttendu} »`, () => {
    const a = evaluer(titre, null);
    assert.equal(a.publie, true, `« ${titre} » devrait être publié`);
    assert.equal(a.registre, "digest");
    assert.equal(a.motif, motifAttendu);
  });
}

test("chaque motif d'inclusion a un identifiant et trois libellés", () => {
  for (const m of MOTIFS_INCLUSION) {
    assert.ok(m.id.length > 2);
    for (const l of ["fr", "nl", "en"] as const) assert.ok(m.libelle[l].length > 3);
  }
});

/* ---------------- les deux pièges déjà payés ---------------- */

test("les formes suffixées sont bien attrapées — pas de \\b final", () => {
  // « concessie » → « grafconcessies » ; l'ancien motif à \b final échouait.
  assert.equal(evaluer("Grafconcessies — hernieuwing", null).registre, "ecarte");
  assert.equal(evaluer("IBP-vergunningen samenvoegen", null).registre, "ecarte");
});

test("une autorisation de chantier N'EST PAS une autorisation individuelle", () => {
  // Un chantier de trois mois devant chez soi a un effet sur des tiers : c'est
  // même l'information la plus utile au riverain.
  const a = evaluer("Mobiliteit - Signalisatievergunning Karel Verhaegenlaan", null);
  assert.equal(a.publie, true);
  assert.equal(a.registre, "digest");
  assert.equal(a.motif, "mobilite");
});

test("les permis vont dans leur propre registre, publiés mais hors digest", () => {
  const a = evaluer("OMV 37/26 - OMV_2026079510", null);
  assert.equal(a.publie, true);
  assert.equal(a.registre, "permis");
  assert.equal(a.motif, MOTIF_PERMIS.id);
});

test("un procès-verbal reste écarté même s'il mentionne le budget", () => {
  // L'exclusion passe avant l'inclusion : l'ordre des règles compte.
  const a = evaluer("Goedkeuring notulen — bespreking van het budget 2027", null);
  assert.equal(a.registre, "ecarte");
  assert.equal(a.motif, "proces-verbal");
});

test("ce qui ne correspond à aucun motif d'inclusion est hors périmètre", () => {
  const a = evaluer("Solidariteitsactie voor Chernihiv", null);
  assert.equal(a.publie, false);
  assert.equal(a.motif, "hors-perimetre");
});

/* ---------------- A2 : aucun délai sur des dates incohérentes ---------------- */

test("délai calculé quand les dates sont cohérentes", () => {
  const d = dater("2026-07-02", "2026-07-08");
  assert.equal(d.etat, "coherente");
  assert.equal(delaiPublication(d), 6);
});

test("AUCUN délai quand la publication précède l'adoption", () => {
  const d = dater("2026-08-04", "2026-07-31");
  assert.equal(d.etat, "incoherente");
  assert.equal(delaiPublication(d), null, "un délai négatif ne doit jamais être rendu");
});

test("AUCUN délai quand une date manque", () => {
  assert.equal(delaiPublication(dater("2026-08-04", null)), null);
  assert.equal(delaiPublication(dater(null, "2026-08-04")), null);
  assert.equal(delaiPublication(dater("pas une date", "2026-08-04")), null);
});

/* ---------------- A1 : pas d'acte adopté dans le futur ---------------- */

const LE_JOUR = new Date("2026-08-09T12:00:00Z");

test("une séance à venir donne le statut « a_venir »", () => {
  assert.equal(statutDe("2026-08-11T08:30:00+02:00", LE_JOUR), "a_venir");
});

test("une séance passée donne le statut « adoptee »", () => {
  assert.equal(statutDe("2026-08-04T08:30:00+02:00", LE_JOUR), "adoptee");
});

test("le jour même compte comme adopté, pas comme à venir", () => {
  assert.equal(statutDe("2026-08-09T08:30:00+02:00", LE_JOUR), "adoptee");
});

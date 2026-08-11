/**
 * Apparition à l'entrée — en CSS pur, et rendu côté serveur.
 *
 * POURQUOI PAS MOTION ICI, alors qu'il était prévu.
 *
 * Motion écrit son état initial dans le HTML rendu par le serveur : avec
 * `initial={{ opacity: 0 }}`, les cartes partent invisibles et ne réapparaissent
 * qu'une fois le JavaScript chargé, hydraté, et l'observateur d'intersection
 * déclenché. Mesuré : sur la capture pleine page, cinq cartes sur sept
 * restaient à opacité zéro.
 *
 * Autrement dit : sans JavaScript — connexion coupée en cours de chargement,
 * script bloqué, navigateur ancien — les décisions du conseil communal
 * n'existent pas. Sur une plateforme dont l'objet est de rendre lisible ce qui
 * est déjà public, c'est le contraire du but.
 *
 * La version CSS ci-dessous n'a aucun de ces défauts : le contenu est présent
 * et visible dans le HTML, l'animation n'est qu'un supplément, et elle
 * disparaît sous `prefers-reduced-motion`. Elle coûte zéro kilo-octet.
 */

import type { ReactNode } from "react";

export function Apparition({ children, index = 0 }: { children: ReactNode; index?: number }) {
  // Au-delà du sixième élément, l'escalier se lit comme une lenteur.
  const retard = Math.min(index, 5) * 45;
  return (
    <div className="apparition" style={{ animationDelay: `${retard}ms` }}>
      {children}
    </div>
  );
}

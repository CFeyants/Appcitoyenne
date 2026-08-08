import { fileURLToPath } from "node:url";

/**
 * Racine du monorepo. `fileURLToPath` et non `URL.pathname` : sous Windows,
 * `pathname` rend « /C:/Users/… », un chemin que Node refuse.
 */
const RACINE_MONOREPO = fileURLToPath(new URL("../..", import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Les paquets du monorepo sont en TypeScript source : Next les transpile.
  transpilePackages: ["@pc/core", "@pc/connectors"],

  // Le code lit /data et /packages, hors du dossier de l'app : le traçage doit
  // partir de la racine du dépôt, pas de apps/web.
  outputFileTracingRoot: RACINE_MONOREPO,

  /*
   * Les instantanés sont lus par un chemin CONSTRUIT à l'exécution. Le traceur
   * de Next ne suit que les imports statiques : sans cette déclaration, le
   * build réussit, le déploiement démarre, et l'écran est vide — la panne la
   * plus coûteuse qui soit, parce qu'elle ne ressemble pas à une panne.
   */
  outputFileTracingIncludes: {
    "/[langue]/decisions": ["../../data/**/*.json"],
    "/[langue]/decisions.json": ["../../data/**/*.json"],
    "/[langue]/a-propos": ["../../data/**/*.json"],
  },

  experimental: {
    // Aucune télémétrie, aucun traceur : règle non négociable n° 2.
  },
};

export default nextConfig;

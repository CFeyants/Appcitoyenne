/** @type {import('next').NextConfig} */
const nextConfig = {
  // Les paquets du monorepo sont en TypeScript source : Next les transpile.
  transpilePackages: ["@pc/core", "@pc/connectors"],
  // Les instantanés de /data sont lus au rendu serveur ; ils vivent hors du
  // dossier de l'app, d'où la racine de traçage remontée d'un cran.
  outputFileTracingRoot: new URL("../..", import.meta.url).pathname,
  experimental: {
    // Aucune télémétrie, aucun traceur : règle non négociable n° 2.
  },
};

export default nextConfig;

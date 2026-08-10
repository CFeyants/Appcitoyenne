/**
 * Capture d'écran avec un VRAI viewport, via CDP.
 *
 * `--window-size` ne fixe pas le viewport de mise en page sous Windows : Chrome
 * impose un minimum et l'on finit par recadrer une page large. Seul
 * Emulation.setDeviceMetricsOverride donne la largeur demandée.
 *
 *   node capture.mjs <url> <sortie.png> <largeur> [sombre]
 */
import { writeFileSync } from "node:fs";

const [url, sortie, largeurArg, theme] = process.argv.slice(2);
const largeur = Number(largeurArg) || 390;
const PORT = 9333;

const cible = (await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" })).json());
const ws = new WebSocket(cible.webSocketDebuggerUrl);
let id = 0;
const attente = new Map();
const cmd = (method, params = {}) =>
  new Promise((res) => { const n = ++id; attente.set(n, res); ws.send(JSON.stringify({ id: n, method, params })); });
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && attente.has(m.id)) { attente.get(m.id)(m.result); attente.delete(m.id); }
});
await new Promise((r) => ws.addEventListener("open", r));

await cmd("Emulation.setDeviceMetricsOverride", {
  width: largeur, height: 900, deviceScaleFactor: 2, mobile: largeur < 700,
});
if (theme === "sombre") {
  await cmd("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "dark" }] });
}
await cmd("Page.enable");
await cmd("Page.navigate", { url });
await new Promise((r) => setTimeout(r, 2500));

// Contrôle : la page déborde-t-elle réellement à cette largeur ?
const m = await cmd("Runtime.evaluate", {
  expression: `JSON.stringify({vw:document.documentElement.clientWidth,sw:document.documentElement.scrollWidth})`,
  returnByValue: true,
});
const { vw, sw } = JSON.parse(m.result.value);
console.log(`  viewport ${vw} px · scrollWidth ${sw} px · ${sw > vw + 1 ? "DÉBORDE" : "pas de débordement"}`);

const shot = await cmd("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
writeFileSync(sortie, Buffer.from(shot.data, "base64"));
console.log(`  écrit : ${sortie}`);
ws.close();

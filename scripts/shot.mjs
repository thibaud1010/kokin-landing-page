// Capturas de la landing con Chrome headless por CDP (sin dependencias).
//   node scripts/shot.mjs <url> <carpeta-destino> [ancho] [alto]
// Hace una captura por pantalla completa bajando de `alto` en `alto` hasta el
// final de la página, esperando en cada paso a que los reveals entren. Sirve
// para revisar el diseño; no forma parte del sitio publicado.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [, , url = 'http://127.0.0.1:8811/es/', outDir = 'shots', W = '1440', H = '1000'] = process.argv;
const w = Number(W), h = Number(H);

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
].find(p => fs.existsSync(p));
if (!CHROME) { console.error('No encuentro chrome.exe'); process.exit(1); }

fs.mkdirSync(outDir, { recursive: true });

const port = 9333 + (Date.now() % 500);
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio',
  '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${path.join(process.env.TEMP || '.', 'kokin-shot-' + port)}`,
  `--window-size=${w},${h}`,
  'about:blank',
], { stdio: 'ignore' });

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function targetUrl() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/list`);
      const list = await r.json();
      const page = list.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(250);
  }
  throw new Error('Chrome no levantó el puerto de depuración');
}

const ws = new WebSocket(await targetUrl());
await new Promise(r => ws.addEventListener('open', r, { once: true }));

let id = 0;
const pending = new Map();
ws.addEventListener('message', ev => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
});
const send = (method, params = {}) => new Promise(res => {
  const n = ++id;
  pending.set(n, res);
  ws.send(JSON.stringify({ id: n, method, params }));
});

const evaluate = async expr =>
  (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.value;

await send('Page.enable');
await send('Runtime.enable');
// OJO: con `mobile: true` Chrome recalcula el viewport a partir del meta
// viewport y NO respeta el ancho pedido (390 -> 716 px reales, que es ancho de
// tablet y esconde los fallos de móvil). Con `mobile: false` el viewport son
// exactamente w x h píxeles CSS, que es lo que hace falta para probar layout.
await send('Emulation.setDeviceMetricsOverride', {
  width: w, height: h, deviceScaleFactor: 1, mobile: false,
});

await send('Page.navigate', { url });
await sleep(3500);                       // carga + fuentes + primer póster

const total = await evaluate('document.documentElement.scrollHeight');
const pasos = Math.ceil(total / h);
console.log(`altura ${total}px · ${pasos} capturas de ${w}x${h}`);

for (let i = 0; i < pasos; i++) {
  // `behavior:"instant"` salta el scroll suave del CSS: si no, el scroll aún
  // está animando cuando dispara el IntersectionObserver y la captura pilla
  // los reveals a medias (secciones en blanco que en el navegador sí se ven).
  await evaluate(`window.scrollTo({ top: ${i * h}, behavior: "instant" }); 1`);
  await sleep(2400);                     // reveal .7s + escalonado .35s + margen
  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  const f = path.join(outDir, `${String(i).padStart(2, '0')}.png`);
  fs.writeFileSync(f, Buffer.from(data, 'base64'));
  console.log('  →', f);
}

ws.close();
chrome.kill();
process.exit(0);

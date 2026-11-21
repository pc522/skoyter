// Henter tider for Stabæk, Øhil og Høvik fra EasyPlay og skriver data/easyplay-tider.json.
// Linjene har samme format som appen bruker i BANER[].def («d.m HH:MM-HH:MM type»).
// Skriver ingenting hvis en bane gir null hendelser totalt (feil i kilden), slik at forrige fil blir stående.
import fs from 'node:fs';
import { BANER, bygg, linjer } from './easyplay-lib.mjs';

const dato = (d) => new Date(d).toLocaleDateString('sv-SE', { timeZone: 'Europe/Oslo' }); // ÅÅÅÅ-MM-DD
const i = new Date();
const fra = dato(i), til = dato(i.getTime() + 13 * 864e5);

const tok = await (await fetch('https://www.easyplay.no/api/easyplay/token/public')).json();
if (!tok.token) { console.error('Fikk ikke token fra EasyPlay.'); process.exit(1); }
const H = { headers: { Authorization: 'Bearer ' + tok.token } };

const ut = { hentet: i.toISOString(), fra, til, kilde: 'easyplay.no', baner: {} };
for (const [navn, b] of Object.entries(BANER)) {
  const r = await fetch(`https://api.easyplay.no/live_events/club/${b.klubb}/public`, H);
  if (!r.ok) { console.error(`${navn}: HTTP ${r.status}`); process.exit(1); }
  const ev = await r.json();
  if (!Array.isArray(ev) || ev.length === 0) { console.error(`${navn}: tomt svar`); process.exit(1); }
  const per = bygg(ev, b, fra, til);
  ut.baner[navn] = { dager: Object.keys(per).length, linjer: linjer(per) };
  console.log(`${navn}: ${ev.length} hendelser, ${ut.baner[navn].dager} dager med tider`);
}
fs.mkdirSync('data', { recursive: true });
fs.writeFileSync('data/easyplay-tider.json', JSON.stringify(ut, null, 1) + '\n');
console.log('Skrev data/easyplay-tider.json', fra, '–', til);

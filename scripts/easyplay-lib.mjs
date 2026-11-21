// Gjør EasyPlay-hendelser om til linjer i appens format: «d.m HH:MM-HH:MM type».
export const BANER = {
  stabaek: { klubb: 'cMYV4B3i9SqspUaDjf0q', baner: ['Plassen', 'Bandy Plassen'] },
  ohil:    { klubb: 'sy2gvRJcexEm3OaZw6xW', baner: ['Hosle idrettsanlegg', 'Hoslebanen kunstis'] },
  hovik:   { klubb: '66dc2a82-9fa4-41f7-80b9-5a2922f7b298', baner: ['Høvik kunstis'] },
};
const PRI = { publikum: 1, skole: 2, stengt: 3, prep: 4, org: 5 };

export function type(e) {
  const t = (e.title || '').trim().toLowerCase();
  if (/^hosle skole/.test(t)) return null;                 // halv bane, hoppes over
  if (/publikum|åpen skøyting/.test(t)) return 'publikum';
  if (/skøyteskole/.test(t)) return 'skole';
  if (/vanning|isprep|^prep\b/.test(t)) return 'prep';
  if (/^stengt/.test(t)) return 'stengt';
  return 'org';
}
const min = (s) => +s.slice(0, 2) * 60 + +s.slice(3, 5);
const hhmm = (m) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');

/** events: liste fra live_events/club/<id>/public. Returnerer { 'YYYY-MM-DD': [[fra,til,type],...] } uten overlapp. */
export function bygg(events, bane, fra, til) {
  const per = {};
  for (const e of events) {
    if (e.status && e.status !== 'ACTIVE') continue;
    if (!bane.baner.includes(e.mainStadiumName)) continue;
    if (e.date < fra || e.date > til || !e.startTime || !e.endTime) continue;
    const ty = type(e); if (!ty) continue;
    (per[e.date] ||= []).push([min(e.startTime), min(e.endTime), ty]);
  }
  const ut = {};
  for (const [d, liste] of Object.entries(per)) {
    // Høyest prioritet vinner ved overlapp: publikum > skole > stengt > prep > org.
    const pts = [...new Set(liste.flatMap(([a, b]) => [a, b]))].sort((x, y) => x - y);
    const biter = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [a, b] = [pts[i], pts[i + 1]];
      const hit = liste.filter(([x, y]) => x <= a && y >= b);
      if (!hit.length) continue;
      const ty = hit.map((h) => h[2]).sort((p, q) => PRI[p] - PRI[q])[0];
      const s = biter[biter.length - 1];
      if (s && s[1] === a && s[2] === ty) s[1] = b; else biter.push([a, b, ty]);
    }
    ut[d] = biter.map(([a, b, ty]) => [hhmm(a), hhmm(b), ty]);
  }
  return ut;
}
export const linjer = (ut) => Object.keys(ut).sort().flatMap((d) => {
  const [, m, dd] = d.split('-');
  return ut[d].map(([a, b, ty]) => `${+dd}.${+m} ${a}-${b} ${ty}`);
});

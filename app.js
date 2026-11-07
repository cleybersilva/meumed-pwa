/* MeuMed · protótipo PWA do MVP (Onda 1)
 * Tudo roda no navegador: dados fictícios em localStorage e arquivos de exames em IndexedDB.
 * Integrações reais (gateway Pix/cartão, WebRTC, IA generativa, push server) estão simuladas e marcadas.
 */
'use strict';

/* ============ utilidades ============ */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const pad = (n) => String(n).padStart(2, '0');
const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const uid = () => Math.random().toString(36).slice(2, 10);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const brl = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dateOf = (a) => new Date(`${a.date}T${a.time}:00`);
const fmtDay = (iso, o = { weekday: 'short', day: 'numeric', month: 'short' }) => new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', o);
const fmtLong = (iso) => fmtDay(iso, { weekday: 'long', day: 'numeric', month: 'long' });
const fmtDT = (ts) => new Date(ts).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
function hashRand(str) { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return ((h >>> 0) % 10000) / 10000; }
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const store = {
  get(k, d) { try { const v = localStorage.getItem('meumed:' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('meumed:' + k, JSON.stringify(v)); } catch { /* armazenamento indisponível */ } },
};

/* ============ ícones (traço, 24px) ============ */
const P = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3H9zM9 11h6M9 15h4"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 0 0 4 0"/>',
  a11y: '<circle cx="12" cy="4.5" r="1.8"/><path d="M5 8.5l7 1.5 7-1.5M12 10v4.5M12 14.5 9 21M12 14.5 15 21"/>',
  video: '<rect x="2" y="6" width="14" height="12" rx="2"/><path d="m16 10 6-3v10l-6-3z"/>',
  'video-off': '<rect x="2" y="6" width="14" height="12" rx="2"/><path d="m16 10 6-3v10l-6-3zM2 2l20 20"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>',
  pix: '<path d="M12 2.5 21.5 12 12 21.5 2.5 12z"/><path d="M8.5 12 12 8.5 15.5 12 12 15.5z"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  pin: '<path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 15.5-6.3L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.3L3 16M3 21v-5h5"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  bot: '<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 4v4M9 13h.01M15 13h.01M9.5 17h5"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  'mic-off': '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M3 3l18 18"/>',
  phone: '<path d="M3.5 14.5c5-4.5 12-4.5 17 0l-2 3.2-4-1.2v-2.3a9 9 0 0 0-5 0v2.3l-4 1.2z"/>',
  send: '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>',
  volume: '<path d="M11 5 6 9H3v6h3l5 4zM15.5 9a4 4 0 0 1 0 6M18.5 6a8 8 0 0 1 0 12"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
  camera: '<path d="M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="4"/>',
  file: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  download: '<path d="M12 4v12M7 11l5 5 5-5M4 20h16"/>',
  print: '<path d="M6 9V3h12v6M6 18H4v-7h16v7h-2M6 14h12v7H6z"/>',
  copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  rocket: '<path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2M9 15l-3-3c1-4 4-8 10-9 0 6-4 9-8 11z"/><circle cx="15" cy="9" r="1.5"/>',
  back: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  chev: '<path d="m9 6 6 6-6 6"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  alert: '<path d="M12 3 2 21h20zM12 10v5M12 18h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
  contrast: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18" /><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>',
  text: '<path d="M4 7V5h16v2M9 19h6M12 5v14"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  ruler: '<rect x="2" y="8" width="20" height="8" rx="1.5"/><path d="M6 8v3M10 8v4M14 8v3M18 8v4"/>',
  cursor: '<path d="M5 3l14 8-6 2-3 6z"/>',
  pause: '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  hand: '<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12M11 11V4.5a1.5 1.5 0 0 1 3 0V12M14 11.5V6a1.5 1.5 0 0 1 3 0v7c0 4.5-2.5 8-7 8-3 0-4.5-1.5-6-4l-1.8-3a1.5 1.5 0 0 1 2.5-1.6L8 15"/>',
  wallet: '<path d="M3 7a2 2 0 0 1 2-2h12v4M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2zM16 14h.01"/>',
  whatsapp: '<path d="M20 12a8 8 0 0 1-11.8 7L4 20l1.1-4A8 8 0 1 1 20 12z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 0 1-1.8-1.8l.8-1-1-2z"/>',
  headset: '<path d="M4 15v-3a8 8 0 0 1 16 0v3M4 15a2 2 0 0 0 2 2h1v-5H6a2 2 0 0 0-2 2zM20 15a2 2 0 0 1-2 2h-1v-5h1a2 2 0 0 1 2 2zM18 17c0 2-2 3-5 3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  ics: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M12 13v5M9.5 15.5h5"/>',
};
const icon = (n, s = 20) => `<svg class="i" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${P[n] || ''}</svg>`;
function hydrateIcons(root = document) { $$('[data-icon]', root).forEach((el) => { el.outerHTML = icon(el.dataset.icon, Number(el.dataset.size) || 20); }); }

/* ============ dados ============ */
const CLINIC = {
  name: 'Clínica Cabeça & Pescoço',
  address: 'Rua das Acácias, 120, sala 304, João Pessoa/PB (endereço fictício)',
  phone: '(83) 3000-0000',
  whatsapp: '5583900000000', // número fictício
};
const DOCTORS = [
  { id: 'd1', name: 'Dra. Helena Ramos', spec: 'Cirurgia de Cabeça e Pescoço', reg: 'CRM-PB 10234', price: 350, days: [1, 3, 5], tele: true, color: '#0B7A75', bio: 'Tireoide, nódulos cervicais e glândulas salivares.' },
  { id: 'd2', name: 'Dr. Marcos Vilar', spec: 'Cirurgia de Cabeça e Pescoço', reg: 'CRM-PB 8871', price: 380, days: [2, 4, 6], tele: true, color: '#0A5F7A', bio: 'Oncologia de cabeça e pescoço e reconstrução.' },
  { id: 'd3', name: 'Dra. Bianca Nóbrega', spec: 'Otorrinolaringologia', reg: 'CRM-PB 11502', price: 300, days: [1, 2, 4, 5], tele: true, color: '#1F6FD1', bio: 'Rouquidão, sinusite, distúrbios da deglutição.' },
  { id: 'd4', name: 'Dr. Rafael Toscano', spec: 'Endocrinologia', reg: 'CRM-PB 9930', price: 320, days: [1, 3, 4], tele: true, color: '#6D4BC2', bio: 'Doenças da tireoide e paratireoide.' },
  { id: 'd5', name: 'Ana Lúcia Brito', spec: 'Fonoaudiologia', reg: 'CRFa-4 11230', price: 180, days: [2, 3, 5, 6], tele: true, color: '#B8540B', bio: 'Reabilitação de voz e deglutição pós-cirurgia.' },
];
const doc = (id) => DOCTORS.find((d) => d.id === id) || DOCTORS[0];
const initials = (name) => name.replace(/^(Dra?\.)\s*/, '').split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('');
const avatar = (d, cls = '') => `<span class="avatar ${cls}" style="background:${d.color}" aria-hidden="true">${initials(d.name)}</span>`;

function nextWorkday(d, minDays, h, m) {
  const x = new Date(); x.setDate(x.getDate() + minDays); x.setHours(h, m, 0, 0);
  while (!d.days.includes(x.getDay())) x.setDate(x.getDate() + 1);
  return x;
}
const at = (dt) => ({ date: isoDate(dt), time: `${pad(dt.getHours())}:${pad(dt.getMinutes())}` });
const pastDate = (days, h, m) => { const x = new Date(); x.setDate(x.getDate() - days); x.setHours(h, m, 0, 0); return x; };
const newAppt = (o) => ({ id: uid(), status: 'agendada', payment: { status: 'pendente' }, checkin: null, exams: { sentAt: null, count: 0 }, reminded: [], createdAt: Date.now(), ...o });

function seed() {
  const appts = [
    newAppt({ doctorId: 'd1', ...at(nextWorkday(doc('d1'), 1, 9, 30)), mode: 'presencial' }),
    newAppt({ doctorId: 'd3', ...at(nextWorkday(doc('d3'), 3, 15, 0)), mode: 'tele', payment: { status: 'pago', method: 'pix', paidAt: Date.now() - 864e5, amount: doc('d3').price, txid: 'E2E' + uid().toUpperCase() } }),
    newAppt({ doctorId: 'd1', ...at(pastDate(32, 10, 0)), mode: 'presencial', status: 'realizada', payment: { status: 'pago', method: 'cartao', installments: 2, brand: 'Visa', last4: '1111', paidAt: pastDate(33, 18, 0).getTime(), amount: doc('d1').price, txid: 'TX' + uid().toUpperCase() } }),
    newAppt({ doctorId: 'd5', ...at(pastDate(12, 14, 30)), mode: 'presencial', status: 'realizada', payment: { status: 'pago', method: 'pix', paidAt: pastDate(13, 9, 0).getTime(), amount: doc('d5').price, txid: 'E2E' + uid().toUpperCase() } }),
  ];
  const rnd = mulberry32(2026); const ledger = [];
  for (let i = 0; i < 160; i++) {
    const d = DOCTORS[Math.floor(rnd() * DOCTORS.length)];
    const dt = pastDate(Math.floor(rnd() * 95), 8 + Math.floor(rnd() * 9), rnd() < 0.5 ? 0 : 30);
    const method = rnd() < 0.58 ? 'pix' : 'cartao';
    ledger.push({ id: 'L' + i, at: dt.getTime(), patient: `Paciente #${1200 + i}`, doctorId: d.id, method, installments: method === 'cartao' ? 1 + Math.floor(rnd() * 3) : 1, amount: d.price, status: rnd() < 0.93 ? 'pago' : 'pendente' });
  }
  return {
    v: 1,
    profile: { name: 'Maria Clara Souza', phone: '(83) 99999-0000', email: 'maria.clara@exemplo.com', plan: 'Particular' },
    prefs: { reminders: { 1440: true, 120: true, 30: false } },
    appts, ledger,
    chat: { ia: [], clinica: [] },
    notices: [],
  };
}
let state = store.get('state', null);
if (!state || state.v !== 1) { state = seed(); }
const save = () => store.set('state', state);
save();
const getAppt = (id) => state.appts.find((a) => a.id === id);
const upcoming = () => state.appts.filter((a) => a.status === 'agendada' && dateOf(a) > Date.now() - 60 * 60e3).sort((a, b) => dateOf(a) - dateOf(b));
const history = () => state.appts.filter((a) => !upcoming().includes(a)).sort((a, b) => dateOf(b) - dateOf(a));

/* agenda em tempo real (simulada): ocupação determinística + reservas de "outros pacientes" ao vivo */
const liveTaken = new Set();
function slotsFor(docId, iso, ignoreApptId) {
  const d = doc(docId); const day = new Date(`${iso}T12:00:00`).getDay();
  if (!d.days.includes(day)) return [];
  const hours = day === 6 ? [8, 9, 10, 11] : [8, 9, 10, 11, 14, 15, 16, 17];
  const now = Date.now(); const out = [];
  for (const h of hours) for (const m of ['00', '30']) {
    const t = `${pad(h)}:${m}`; const key = docId + iso + t;
    const mine = state.appts.some((a) => a.id !== ignoreApptId && a.status === 'agendada' && a.doctorId === docId && a.date === iso && a.time === t);
    const taken = hashRand(key) < 0.42 || liveTaken.has(key) || mine;
    const past = new Date(`${iso}T${t}:00`).getTime() <= now + 30 * 60e3;
    out.push({ time: t, free: !taken && !past });
  }
  return out;
}
function nextFreeSlots(docId, n, ignoreApptId) {
  const res = []; const base = new Date();
  for (let i = 0; i < 30 && res.length < n; i++) {
    const d = new Date(base); d.setDate(d.getDate() + i); const iso = isoDate(d);
    for (const s of slotsFor(docId, iso, ignoreApptId)) { if (s.free) { res.push({ date: iso, time: s.time }); if (res.length >= n) break; } }
  }
  return res;
}

/* ============ IndexedDB (arquivos de exames) ============ */
const idb = (() => {
  let dbp;
  const open = () => (dbp ??= new Promise((res, rej) => {
    const r = indexedDB.open('meumed', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('files', { keyPath: 'id' });
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  }));
  const tx = async (mode, fn) => { const db = await open(); return new Promise((res, rej) => { const t = db.transaction('files', mode); const req = fn(t.objectStore('files')); t.oncomplete = () => res(req && req.result); t.onerror = () => rej(t.error); }); };
  return { put: (f) => tx('readwrite', (s) => s.put(f)), del: (id) => tx('readwrite', (s) => s.delete(id)), all: () => tx('readonly', (s) => s.getAll()), clear: () => tx('readwrite', (s) => s.clear()) };
})();

/* ============ toasts, anúncios e voz ============ */
function toast(msg, { action, timeout = 4500, ico = 'check' } = {}) {
  const box = $('#toasts'); const el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status');
  el.innerHTML = `${icon(ico)}<p>${esc(msg)}</p>${action ? `<button type="button">${esc(action.label)}</button>` : ''}<button type="button" aria-label="Fechar aviso">${icon('x', 18)}</button>`;
  const close = () => { el.remove(); };
  const btns = $$('button', el);
  if (action) btns[0].onclick = () => { action.fn(); close(); };
  btns[btns.length - 1].onclick = close;
  box.appendChild(el); setTimeout(close, timeout);
  if (a11y.clickread) speak(msg);
}
const announce = (msg) => { const a = $('#announcer'); a.textContent = ''; setTimeout(() => { a.textContent = msg; }, 50); };
function speak(text) {
  if (!('speechSynthesis' in window)) { toast('Leitor de voz não disponível neste navegador.', { ico: 'info' }); return; }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(String(text).replace(/\s+/g, ' ').slice(0, 4000));
  u.lang = 'pt-BR'; u.rate = 1;
  const v = speechSynthesis.getVoices().find((x) => x.lang && x.lang.toLowerCase().startsWith('pt'));
  if (v) u.voice = v;
  speechSynthesis.speak(u);
}

/* ============ acessibilidade (painel) ============ */
const A11Y_DEFAULT = { scale: 1, theme: 'system', contrast: false, spacing: false, links: false, guide: false, cursor: false, motion: false, grayscale: false, libras: false, clickread: false };
let a11y = { ...A11Y_DEFAULT, ...store.get('a11y', {}) };
function applyA11y() {
  const html = document.documentElement;
  html.style.setProperty('--scale', a11y.scale);
  if (a11y.theme === 'system') html.removeAttribute('data-theme'); else html.dataset.theme = a11y.theme;
  if (a11y.contrast) html.dataset.contrast = 'high'; else html.removeAttribute('data-contrast');
  ['spacing', 'links', 'guide', 'cursor', 'motion', 'grayscale', 'clickread'].forEach((k) => html.classList.toggle('a11y-' + k, !!a11y[k]));
  $('#a11y-scale').textContent = Math.round(a11y.scale * 100) + '%';
  $$('[data-theme-opt]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.themeOpt === a11y.theme)));
  $$('[data-toggle]').forEach((b) => b.setAttribute('aria-pressed', String(!!a11y[b.dataset.toggle])));
  if (a11y.libras) loadVLibras();
  $$('[vw]').forEach((el) => { el.style.display = a11y.libras ? '' : 'none'; });
  store.set('a11y', a11y);
}
let vlibrasLoaded = false;
function loadVLibras() {
  if (vlibrasLoaded) return; vlibrasLoaded = true;
  const wrap = document.createElement('div');
  wrap.setAttribute('vw', ''); wrap.className = 'enabled';
  wrap.innerHTML = '<div vw-access-button class="active"></div><div vw-plugin-wrapper><div class="vw-plugin-top-wrapper"></div></div>';
  document.body.appendChild(wrap);
  const s = document.createElement('script'); s.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
  s.onload = () => { try { new window.VLibras.Widget('https://vlibras.gov.br/app'); window.dispatchEvent(new Event('load')); toast('VLibras ativado: toque no ícone azul de mãos para traduzir em Libras.', { ico: 'hand', timeout: 6000 }); } catch { toast('Não foi possível iniciar o VLibras.', { ico: 'alert' }); } };
  s.onerror = () => { vlibrasLoaded = false; wrap.remove(); toast('VLibras precisa de internet. Tente novamente quando estiver online.', { ico: 'alert' }); };
  document.body.appendChild(s);
}
function setupA11yPanel() {
  const panel = $('#a11y-panel'); const back = $('#a11y-backdrop'); let lastFocus = null;
  const open = () => { lastFocus = document.activeElement; panel.hidden = false; back.hidden = false; $('#a11y-close').focus(); };
  const close = () => { panel.hidden = true; back.hidden = true; lastFocus?.focus?.(); };
  $('#a11y-open').onclick = open; $('#a11y-close').onclick = close; back.onclick = close;
  document.addEventListener('keydown', (e) => {
    if (e.altKey && (e.key === 'a' || e.key === 'A')) { e.preventDefault(); panel.hidden ? open() : close(); }
    if (e.key === 'Escape' && !panel.hidden) close();
    if (e.key === 'Tab' && !panel.hidden) { // trap de foco
      const f = $$('button, [href], input, select, textarea', panel).filter((x) => !x.disabled && x.offsetParent);
      if (!f.length) return; const first = f[0]; const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  panel.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.a11y === 'bigger') a11y.scale = Math.min(1.6, +(a11y.scale + 0.1).toFixed(2));
    if (b.dataset.a11y === 'smaller') a11y.scale = Math.max(0.9, +(a11y.scale - 0.1).toFixed(2));
    if (b.dataset.themeOpt) a11y.theme = b.dataset.themeOpt;
    if (b.dataset.toggle) a11y[b.dataset.toggle] = !a11y[b.dataset.toggle];
    if (b.id === 'a11y-reset') { a11y = { ...A11Y_DEFAULT }; speechSynthesis?.cancel?.(); }
    if (b.id === 'tts-read') speak($('#main').innerText);
    if (b.id === 'tts-stop') speechSynthesis?.cancel?.();
    applyA11y();
  });
  // guia de leitura
  const guide = $('#reading-guide');
  window.addEventListener('pointermove', (e) => { if (a11y.guide) guide.style.top = e.clientY - guide.offsetHeight / 2 + 'px'; }, { passive: true });
  // ouvir ao tocar
  $('#main').addEventListener('click', (e) => {
    if (!a11y.clickread) return;
    if (e.target.closest('a, button, input, select, textarea, label')) return;
    const t = e.target.closest('p, h1, h2, h3, li, td, span, strong, dd, dt');
    if (t && t.innerText.trim()) speak(t.innerText);
  });
}

/* ============ roteador ============ */
let teardown = [];
let routeSeq = 0;
const onLeave = (fn) => teardown.push(fn);
const routes = [
  [/^\/inicio$/, viewHome, 'inicio'],
  [/^\/agendar$/, viewBook, 'agendar'],
  [/^\/consultas$/, viewList, 'consultas'],
  [/^\/consulta\/(\w+)$/, viewDetail, 'consultas'],
  [/^\/pagamento\/(\w+)$/, viewPay, 'consultas'],
  [/^\/exames\/(\w+)$/, viewExams, 'consultas'],
  [/^\/checkin\/(\w+)$/, viewCheckin, 'consultas'],
  [/^\/tele\/(\w+)$/, viewTele, 'consultas'],
  [/^\/chat$/, viewChat, 'chat'],
  [/^\/relatorio$/, viewReport, 'relatorio'],
  [/^\/mais$/, viewMore, 'mais'],
  [/^\/proximas-ondas$/, viewRoadmap, 'proximas-ondas'],
];
function render() {
  teardown.forEach((fn) => { try { fn(); } catch { /* noop */ } }); teardown = []; routeSeq++;
  const raw = (location.hash || '#/inicio').slice(1);
  const [pathPart, anchor] = raw.split('#');
  const [path, qs] = pathPart.split('?');
  const q = new URLSearchParams(qs || '');
  const main = $('#main');
  let hit = routes.find(([re]) => re.test(path));
  if (!hit) { location.replace('#/inicio'); return; }
  const m = path.match(hit[0]);
  // contêiner novo a cada rota: os listeners da tela anterior morrem junto
  main.innerHTML = '';
  const view = document.createElement('div'); view.className = 'view';
  main.appendChild(view);
  hit[1](view, ...m.slice(1), q);
  $$('[data-nav]').forEach((a) => (a.dataset.nav === hit[2] ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
  const h1 = $('h1', main);
  document.title = (h1 ? h1.textContent.trim() + ' · ' : '') + 'MeuMed';
  if (anchor) { const t = document.getElementById(anchor); if (t) { t.scrollIntoView(); t.focus?.(); return; } }
  window.scrollTo(0, 0);
  if (h1 && render.count++ > 0) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
  updateBadge();
}
render.count = 0;
const go = (h) => { if (location.hash === h) render(); else location.hash = h; };

const pageHead = (title, sub, backHref) => `
  <div class="page-head">
    ${backHref ? `<a class="back" href="${backHref}">${icon('back', 18)} Voltar</a>` : ''}
    <h1 tabindex="-1">${title}</h1>
    ${sub ? `<p class="sub">${sub}</p>` : ''}
  </div>`;

const modeLbl = (m) => (m === 'tele' ? 'Teleconsulta' : 'Presencial');
function payChip(a) {
  const p = a.payment || {};
  if (a.status === 'cancelada') return p.status === 'pago' ? '<span class="chip chip-info">Estorno em processamento</span>' : '';
  if (p.status === 'pago') return `<span class="chip chip-ok">${icon('check', 14)} Pago · ${p.method === 'pix' ? 'Pix' : 'Cartão'}</span>`;
  return `<span class="chip chip-warn">${icon('wallet', 14)} Pagamento pendente</span>`;
}
function statusChip(a) {
  if (a.status === 'cancelada') return '<span class="chip chip-danger">Cancelada</span>';
  if (a.status === 'realizada') return '<span class="chip">Realizada</span>';
  return `<span class="chip chip-primary">${icon(a.mode === 'tele' ? 'video' : 'pin', 14)} ${modeLbl(a.mode)}</span>`;
}
function relTime(a) {
  const ms = dateOf(a) - Date.now(); const h = ms / 36e5;
  if (ms < 0) return 'agora';
  if (h < 1) return `em ${Math.max(1, Math.round(ms / 6e4))} min`;
  if (h < 24) return `em ${Math.round(h)} h`;
  const d = Math.round(h / 24); return `em ${d} dia${d > 1 ? 's' : ''}`;
}
const checkinWindow = (a) => { const h = (dateOf(a) - Date.now()) / 36e5; return { open: h <= 72 && h > -1, hours: h }; };

/* ============ INÍCIO ============ */
function viewHome(el) {
  const next = upcoming()[0];
  const hour = new Date().getHours();
  const hi = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const first = state.profile.name.split(' ')[0];
  const d = next && doc(next.doctorId);
  const pending = upcoming().filter((a) => a.payment.status !== 'pago').length;
  el.innerHTML = `
    <div class="greet">
      <div><h1 tabindex="-1">${hi}, ${esc(first)}</h1><p>Como podemos cuidar de você hoje?</p></div>
    </div>
    ${next ? `
    <section class="hero" aria-labelledby="next-title">
      <p class="eyebrow">Sua próxima consulta · ${relTime(next)}</p>
      <h2 id="next-title">${esc(d.name)}</h2>
      <p style="opacity:.9">${esc(d.spec)}</p>
      <div class="when">
        <span>${icon('calendar', 18)} ${cap(fmtLong(next.date))}</span>
        <span>${icon('clock', 18)} ${next.time}</span>
        <span>${icon(next.mode === 'tele' ? 'video' : 'pin', 18)} ${modeLbl(next.mode)}</span>
      </div>
      <div class="chips">
        <span class="chip">${next.payment.status === 'pago' ? icon('check', 14) + ' Pagamento confirmado' : icon('wallet', 14) + ' Pagamento pendente'}</span>
        ${next.mode === 'presencial' ? `<span class="chip">${next.checkin ? icon('check', 14) + ' Check-in feito' : icon('pin', 14) + (checkinWindow(next).open ? ' Check-in disponível' : ' Check-in abre 72h antes')}</span>` : ''}
        <span class="chip">${icon('file', 14)} ${next.exams.count ? next.exams.count + ' exame(s) enviado(s)' : 'Nenhum exame enviado'}</span>
      </div>
      <div class="hero-actions">
        ${next.mode === 'tele'
          ? `<a class="btn btn-white" href="#/tele/${next.id}">${icon('video')} Entrar na teleconsulta</a>`
          : `<a class="btn btn-white" href="#/checkin/${next.id}">${icon('pin')} ${next.checkin ? 'Ver check-in' : 'Fazer check-in'}</a>`}
        ${next.payment.status !== 'pago' ? `<a class="btn btn-glass" href="#/pagamento/${next.id}">${icon('wallet')} Pagar agora</a>` : ''}
        <a class="btn btn-glass" href="#/exames/${next.id}">${icon('upload')} Enviar exames</a>
        <a class="btn btn-glass" href="#/consulta/${next.id}">${icon('refresh')} Remarcar ou cancelar</a>
      </div>
    </section>` : `
    <section class="card empty">
      <span class="q-ico">${icon('calendar', 30)}</span>
      <h2>Você não tem consultas agendadas</h2>
      <p>Veja a agenda dos médicos em tempo real e marque em poucos toques.</p>
      <a class="btn btn-primary" href="#/agendar">${icon('plus')} Agendar consulta</a>
    </section>`}

    <div class="section-title"><h2>Acesso rápido</h2></div>
    <nav class="quick" aria-label="Acesso rápido">
      <a href="#/agendar"><span class="q-ico">${icon('calendar', 24)}</span>Agendar<small>Agenda em tempo real</small></a>
      <a href="#/consultas"><span class="q-ico blue">${icon('clipboard', 24)}</span>Minhas consultas<small>Remarcar com 1 toque</small></a>
      <a href="${next ? '#/exames/' + next.id : '#/consultas'}"><span class="q-ico green">${icon('upload', 24)}</span>Enviar exames<small>Fotos e PDFs</small></a>
      <a href="${pending ? '#/pagamento/' + upcoming().find((a) => a.payment.status !== 'pago').id : '#/consultas'}"><span class="q-ico amber">${icon('wallet', 24)}</span>Pagamentos<small>${pending ? pending + ' pendente(s)' : 'Pix e cartão'}</small></a>
      <a href="#/chat"><span class="q-ico blue">${icon('sparkle', 24)}</span>Assistente IA<small>Tire dúvidas 24h</small></a>
      <a href="#/mais#lembretes"><span class="q-ico">${icon('bell', 24)}</span>Lembretes<small>Automáticos</small></a>
    </nav>

    ${upcoming().length > 1 ? `
      <div class="section-title"><h2>Próximas consultas</h2><a href="#/consultas">Ver todas</a></div>
      <div class="grid-2">${upcoming().slice(1, 3).map(apptCard).join('')}</div>` : ''}

    <div class="banner">
      <span class="q-ico">${icon('rocket', 22)}</span>
      <p><strong>Protótipo MVP · Onda 1.</strong> <span class="muted">Novas funcionalidades chegam nas próximas ondas.</span></p>
      <span class="spacer"></span>
      <a class="btn btn-ghost btn-sm" href="#/proximas-ondas">Ver roadmap</a>
    </div>`;
}

function apptCard(a) {
  const d = doc(a.doctorId);
  return `<a class="card appt" href="#/consulta/${a.id}" aria-label="Consulta com ${esc(d.name)}, ${fmtLong(a.date)} às ${a.time}">
    <div class="appt-top">
      <div class="doc-line">${avatar(d)}<div><strong>${esc(d.name)}</strong><span>${esc(d.spec)}</span></div></div>
      ${icon('chev')}
    </div>
    <div class="appt-meta"><span>${icon('calendar', 18)} ${cap(fmtDay(a.date))}</span><span>${icon('clock', 18)} ${a.time}</span></div>
    <div class="chips">${statusChip(a)} ${a.status !== 'realizada' ? payChip(a) : ''} ${a.checkin ? `<span class="chip chip-ok">${icon('check', 14)} Check-in</span>` : ''}</div>
  </a>`;
}

/* ============ AGENDAR (agenda em tempo real) ============ */
function viewBook(el, q) {
  const re = q.get('remarcar') ? getAppt(q.get('remarcar')) : null;
  const s = { spec: re ? doc(re.doctorId).spec : 'Todas', doctorId: re?.doctorId || q.get('medico') || null, date: null, time: null, mode: re?.mode || 'presencial' };
  const specs = ['Todas', ...new Set(DOCTORS.map((d) => d.spec))];
  el.innerHTML = `
    ${pageHead(re ? 'Remarcar consulta' : 'Agendar consulta', re ? `Escolha um novo horário com ${esc(doc(re.doctorId).name)}. O pagamento já feito continua válido.` : 'Veja a agenda dos médicos atualizada em tempo real.', re ? `#/consulta/${re.id}` : '')}
    <div class="cols">
      <div class="stack">
        <section class="card" aria-labelledby="st1">
          <h2 id="st1" class="step-title"><span class="step-n">1</span> Escolha o profissional</h2>
          <div class="filter-row" role="group" aria-label="Filtrar por especialidade" id="specs"></div>
          <div class="doctor-grid" id="docs"></div>
        </section>
        <section class="card" aria-labelledby="st2" id="step2">
          <h2 id="st2" class="step-title"><span class="step-n">2</span> Data e horário <span class="live" title="Os horários se atualizam sozinhos"><span class="dot"></span> Agenda ao vivo</span></h2>
          <div id="dates" class="date-strip" role="group" aria-label="Datas disponíveis"></div>
          <div id="slots" class="slots" role="group" aria-label="Horários"></div>
          <p class="hint" id="live-info" aria-live="polite" style="margin-top:10px"></p>
        </section>
        <section class="card" aria-labelledby="st3">
          <h2 id="st3" class="step-title"><span class="step-n">3</span> Como prefere ser atendido?</h2>
          <div class="mode-opts" id="modes"></div>
        </section>
      </div>
      <aside class="card summary sticky" aria-labelledby="sum-t">
        <h2 id="sum-t">Resumo</h2>
        <div id="sum"></div>
      </aside>
    </div>`;

  const drawSpecs = () => {
    $('#specs').innerHTML = specs.map((x) => `<button class="pill" aria-pressed="${s.spec === x}" data-spec="${esc(x)}">${esc(x)}</button>`).join('');
  };
  const drawDocs = () => {
    const list = DOCTORS.filter((d) => s.spec === 'Todas' || d.spec === s.spec);
    $('#docs').innerHTML = list.map((d) => `
      <button class="doc-opt" data-doc="${d.id}" aria-pressed="${s.doctorId === d.id}" ${re && re.doctorId !== d.id ? 'disabled' : ''}>
        <span class="doc-line">${avatar(d)}<span><strong>${esc(d.name)}</strong><span>${esc(d.spec)} · ${esc(d.reg)}</span></span></span>
        <span class="small muted">${esc(d.bio)}</span>
        <span class="row"><span class="price">${brl(d.price)}</span><span class="spacer"></span>${d.tele ? `<span class="chip chip-info">${icon('video', 14)} Teleconsulta</span>` : ''}</span>
      </button>`).join('');
  };
  const days = [...Array(21)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return isoDate(d); });
  const drawDates = () => {
    if (!s.doctorId) { $('#dates').innerHTML = ''; $('#slots').innerHTML = `<p class="muted">Escolha um profissional para ver a agenda.</p>`; return; }
    $('#dates').innerHTML = days.map((iso) => {
      const free = slotsFor(s.doctorId, iso, re?.id).filter((x) => x.free).length;
      const wd = fmtDay(iso, { weekday: 'short' }).replace('.', '');
      return `<button class="date-btn" data-date="${iso}" aria-pressed="${s.date === iso}" ${free ? '' : 'disabled'} aria-label="${fmtLong(iso)}, ${free ? free + ' horários livres' : 'sem horários'}">
        <span class="wd">${wd}</span><span class="dn">${Number(iso.slice(8))}</span><span class="fr">${free ? free + ' livres' : 'sem vaga'}</span></button>`;
    }).join('');
    if (!s.date) { const firstFree = days.find((iso) => slotsFor(s.doctorId, iso, re?.id).some((x) => x.free)); s.date = firstFree || null; $$('.date-btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.date === s.date))); }
    drawSlots();
  };
  const drawSlots = (flash) => {
    if (!s.date) { $('#slots').innerHTML = '<p class="muted">Sem horários nas próximas 3 semanas.</p>'; return; }
    const list = slotsFor(s.doctorId, s.date, re?.id);
    $('#slots').innerHTML = list.map((x) => `<button class="slot ${flash === x.time ? 'just-taken' : ''}" data-time="${x.time}" aria-pressed="${s.time === x.time}" ${x.free ? '' : 'disabled'} aria-label="${x.time}${x.free ? '' : ', ocupado'}">${x.time}</button>`).join('');
  };
  const drawModes = () => {
    const d = s.doctorId && doc(s.doctorId);
    $('#modes').innerHTML = `
      <button class="mode-opt" data-mode="presencial" aria-pressed="${s.mode === 'presencial'}">${icon('pin', 24)}<strong>Presencial</strong><span class="small muted">Na clínica, com check-in online</span></button>
      <button class="mode-opt" data-mode="tele" aria-pressed="${s.mode === 'tele'}" ${d && !d.tele ? 'disabled' : ''}>${icon('video', 24)}<strong>Teleconsulta</strong><span class="small muted">Vídeo dentro do app</span></button>`;
  };
  const drawSum = () => {
    const d = s.doctorId && doc(s.doctorId);
    const ok = d && s.date && s.time;
    $('#sum').innerHTML = `
      <dl>
        <dt>Profissional</dt><dd>${d ? esc(d.name) : '—'}</dd>
        <dt>Data</dt><dd>${s.date ? cap(fmtDay(s.date)) : '—'}</dd>
        <dt>Horário</dt><dd>${s.time || '—'}</dd>
        <dt>Modalidade</dt><dd>${modeLbl(s.mode)}</dd>
      </dl>
      <div class="total"><span>Valor</span><strong>${d ? brl(d.price) : '—'}</strong></div>
      <button class="btn btn-primary btn-block" id="confirm" ${ok ? '' : 'disabled'}>${icon('check')} ${re ? 'Confirmar novo horário' : 'Confirmar agendamento'}</button>
      <p class="hint" style="margin-top:10px">${re ? 'Remarcação sem custo até 24h antes.' : 'Você poderá pagar com Pix ou cartão no próximo passo.'}</p>`;
  };
  const all = () => { drawSpecs(); drawDocs(); drawDates(); drawModes(); drawSum(); };
  all();

  el.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.dataset.spec) { s.spec = b.dataset.spec; drawSpecs(); drawDocs(); }
    else if (b.dataset.doc) { s.doctorId = b.dataset.doc; s.date = null; s.time = null; if (!doc(s.doctorId).tele) s.mode = 'presencial'; drawDocs(); drawDates(); drawModes(); drawSum(); $('#step2').scrollIntoView({ block: 'nearest' }); }
    else if (b.dataset.date) { s.date = b.dataset.date; s.time = null; $$('.date-btn').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); drawSlots(); drawSum(); }
    else if (b.dataset.time) { s.time = b.dataset.time; $$('.slot').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); drawSum(); }
    else if (b.dataset.mode) { s.mode = b.dataset.mode; drawModes(); drawSum(); }
    else if (b.id === 'confirm') {
      const d = doc(s.doctorId);
      if (!slotsFor(s.doctorId, s.date, re?.id).find((x) => x.time === s.time)?.free) { toast('Esse horário acabou de ser reservado. Escolha outro.', { ico: 'alert' }); s.time = null; drawSlots(); drawSum(); return; }
      if (re) {
        const prev = { date: re.date, time: re.time, mode: re.mode };
        Object.assign(re, { date: s.date, time: s.time, mode: s.mode, reminded: [], checkin: null }); save();
        toast(`Remarcada para ${fmtDay(s.date)} às ${s.time}.`, { action: { label: 'Desfazer', fn: () => { Object.assign(re, prev); save(); render(); } } });
        go(`#/consulta/${re.id}`);
      } else {
        const a = newAppt({ doctorId: d.id, date: s.date, time: s.time, mode: s.mode }); state.appts.push(a); save();
        toast(`Consulta agendada com ${d.name}!`);
        go(`#/pagamento/${a.id}?novo=1`);
      }
    }
  });

  // tempo real: outros pacientes reservando horários
  const tick = setInterval(() => {
    if (!s.doctorId || !s.date || document.hidden) return;
    const free = slotsFor(s.doctorId, s.date, re?.id).filter((x) => x.free && x.time !== s.time);
    if (free.length < 3 || Math.random() > 0.55) { $('#live-info').textContent = `Agenda sincronizada às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}.`; return; }
    const pick = free[Math.floor(Math.random() * free.length)];
    liveTaken.add(s.doctorId + s.date + pick.time);
    drawSlots(pick.time);
    const dateBtn = $(`.date-btn[data-date="${s.date}"] .fr`); const n = free.length - 1; if (dateBtn) dateBtn.textContent = n + ' livres';
    $('#live-info').textContent = `O horário das ${pick.time} acabou de ser reservado por outro paciente.`;
  }, 6000);
  onLeave(() => clearInterval(tick));
}

/* ============ MINHAS CONSULTAS ============ */
function viewList(el, q) {
  let tab = q.get('aba') || 'proximas';
  el.innerHTML = `${pageHead('Minhas consultas', 'Remarque, cancele, pague e acompanhe tudo em um só lugar.')}
    <div class="tabs" role="tablist" aria-label="Consultas">
      <button role="tab" id="t-prox" aria-controls="lst" data-tab="proximas">${icon('calendar', 18)} Próximas</button>
      <button role="tab" id="t-hist" aria-controls="lst" data-tab="historico">${icon('clock', 18)} Histórico</button>
    </div>
    <div id="lst" role="tabpanel"></div>
    <a class="btn btn-primary" href="#/agendar" style="margin-top:16px">${icon('plus')} Nova consulta</a>`;
  const draw = () => {
    $$('[data-tab]').forEach((b) => { b.setAttribute('aria-selected', String(b.dataset.tab === tab)); b.tabIndex = b.dataset.tab === tab ? 0 : -1; });
    $('#lst').setAttribute('aria-labelledby', tab === 'proximas' ? 't-prox' : 't-hist');
    const list = tab === 'proximas' ? upcoming() : history();
    $('#lst').innerHTML = list.length ? `<div class="grid-2">${list.map(apptCard).join('')}</div>`
      : `<div class="card empty"><span class="q-ico">${icon('calendar', 30)}</span><p>${tab === 'proximas' ? 'Nenhuma consulta agendada.' : 'Seu histórico aparecerá aqui.'}</p></div>`;
  };
  el.querySelector('[role=tablist]').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) { tab = b.dataset.tab; draw(); } });
  el.querySelector('[role=tablist]').addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { tab = tab === 'proximas' ? 'historico' : 'proximas'; draw(); $(`[data-tab="${tab}"]`).focus(); }
  });
  draw();
}

/* ============ DETALHE DA CONSULTA (remarcar/cancelar com 1 clique) ============ */
function viewDetail(el, id) {
  const a = getAppt(id);
  if (!a) { el.innerHTML = `${pageHead('Consulta não encontrada', '', '#/consultas')}`; return; }
  const d = doc(a.doctorId);
  const active = a.status === 'agendada';
  const paid = a.payment.status === 'pago';
  const quick = active ? nextFreeSlots(a.doctorId, 4, a.id) : [];
  const cw = checkinWindow(a);
  const hoursLeft = (dateOf(a) - Date.now()) / 36e5;
  el.innerHTML = `
    ${pageHead('Detalhes da consulta', '', '#/consultas')}
    <div class="cols">
      <div class="stack">
        <section class="card">
          <div class="doc-line">${avatar(d, 'lg')}<div><strong style="font-size:1.2rem">${esc(d.name)}</strong><span>${esc(d.spec)} · ${esc(d.reg)}</span></div></div>
          <div class="appt-meta" style="margin:16px 0 12px">
            <span>${icon('calendar', 18)} ${cap(fmtLong(a.date))}</span><span>${icon('clock', 18)} ${a.time}</span>
            <span>${icon(a.mode === 'tele' ? 'video' : 'pin', 18)} ${modeLbl(a.mode)}</span>
          </div>
          <div class="chips">${statusChip(a)} ${payChip(a)}</div>
          ${a.mode === 'presencial' && active ? `<p class="hint" style="margin-top:12px">${icon('pin', 16)} ${esc(CLINIC.address)}</p>` : ''}
        </section>

        ${active ? `
        <section class="card" aria-labelledby="ac-t">
          <h2 id="ac-t" style="margin-bottom:12px">O que você precisa?</h2>
          <div class="actions-grid">
            ${paid
              ? `<a class="action-tile done" href="#/pagamento/${a.id}">${icon('check', 24)}Pagamento confirmado<small>Ver comprovante</small></a>`
              : `<a class="action-tile" href="#/pagamento/${a.id}">${icon('wallet', 24)}Pagar consulta<small>Pix ou cartão · ${brl(d.price)}</small></a>`}
            ${a.mode === 'tele'
              ? `<a class="action-tile" href="#/tele/${a.id}">${icon('video', 24)}Entrar na teleconsulta<small>Teste câmera e microfone</small></a>`
              : `<a class="action-tile ${a.checkin ? 'done' : ''}" href="#/checkin/${a.id}">${icon(a.checkin ? 'check' : 'pin', 24)}${a.checkin ? 'Check-in feito' : 'Check-in online'}<small>${a.checkin ? 'Código ' + a.checkin.code : cw.open ? 'Disponível agora' : 'Abre 72h antes'}</small></a>`}
            <a class="action-tile ${a.exams.count ? 'done' : ''}" href="#/exames/${a.id}">${icon('upload', 24)}Enviar exames e fotos<small>${a.exams.count ? a.exams.count + ' enviado(s)' : 'Antes da consulta'}</small></a>
            <button class="action-tile" id="ics">${icon('ics', 24)}Salvar na agenda<small>Arquivo .ics</small></button>
          </div>
        </section>

        <section class="card" aria-labelledby="rm-t">
          <h2 id="rm-t">Remarcar com 1 toque</h2>
          <p class="hint">Próximos horários livres com ${esc(d.name)}:</p>
          <div class="quick-slots">
            ${quick.map((x) => `<button class="btn btn-ghost" data-move="${x.date}|${x.time}">${icon('refresh', 18)} ${cap(fmtDay(x.date))} · ${x.time}</button>`).join('') || '<p class="muted">Sem horários próximos.</p>'}
          </div>
          <div class="row" style="margin-top:12px">
            <a class="btn btn-ghost btn-sm" href="#/agendar?remarcar=${a.id}">${icon('calendar', 18)} Ver agenda completa</a>
            <span class="spacer"></span>
            <button class="btn btn-danger btn-sm" id="cancel">${icon('x', 18)} Cancelar consulta</button>
          </div>
          <p class="hint" style="margin-top:10px">${hoursLeft >= 24 ? 'Cancelamento e remarcação gratuitos até 24h antes.' : 'Faltam menos de 24h: a clínica pode cobrar taxa conforme a política (simulado).'} ${paid ? 'Se cancelar, o estorno é automático.' : ''}</p>
        </section>` : `
        <section class="card">
          <p>${a.status === 'cancelada' ? 'Esta consulta foi cancelada.' : 'Consulta realizada. Esperamos que tenha sido bem atendido(a)!'}</p>
          <div class="row" style="margin-top:12px">
            <a class="btn btn-primary" href="#/agendar?medico=${d.id}">${icon('calendar')} Agendar com ${esc(d.name.split(' ')[0])} ${esc(d.name.split(' ')[1] || '')}</a>
            ${paid ? `<a class="btn btn-ghost" href="#/pagamento/${a.id}">${icon('file')} Comprovante</a>` : ''}
          </div>
        </section>`}
      </div>

      <aside class="card sticky" aria-labelledby="tl-t">
        <h2 id="tl-t" style="margin-bottom:14px">Andamento</h2>
        <ol class="timeline">
          <li class="ok"><span class="tl-dot">${icon('check', 16)}</span><div><strong>Consulta agendada</strong><p class="hint">${fmtDT(a.createdAt)}</p></div></li>
          <li class="${paid ? 'ok' : ''}"><span class="tl-dot">${icon(paid ? 'check' : 'wallet', 16)}</span><div><strong>Pagamento</strong><p class="hint">${paid ? 'Confirmado em ' + fmtDT(a.payment.paidAt) : 'Pendente'}</p></div></li>
          <li class="${a.exams.count ? 'ok' : ''}"><span class="tl-dot">${icon(a.exams.count ? 'check' : 'file', 16)}</span><div><strong>Exames enviados</strong><p class="hint">${a.exams.count ? a.exams.count + ' arquivo(s)' : 'Opcional'}</p></div></li>
          ${a.mode === 'presencial' ? `<li class="${a.checkin ? 'ok' : ''}"><span class="tl-dot">${icon(a.checkin ? 'check' : 'pin', 16)}</span><div><strong>Check-in online</strong><p class="hint">${a.checkin ? 'Feito em ' + fmtDT(a.checkin.at) : 'Abre 72h antes'}</p></div></li>` : ''}
          <li class="${a.status === 'realizada' ? 'ok' : ''}"><span class="tl-dot">${icon(a.mode === 'tele' ? 'video' : 'user', 16)}</span><div><strong>Atendimento</strong><p class="hint">${cap(fmtDay(a.date))}, ${a.time}</p></div></li>
        </ol>
        <div class="notice" style="margin-top:6px">${icon('bell')}<p>Lembretes automáticos ativos: ${Object.entries(state.prefs.reminders).filter(([, v]) => v).map(([k]) => (k >= 1440 ? '24h' : k >= 120 ? '2h' : '30 min')).join(', ') || 'nenhum'} antes.</p></div>
      </aside>
    </div>`;

  el.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.move) {
      const [date, time] = b.dataset.move.split('|'); const prev = { date: a.date, time: a.time, checkin: a.checkin, reminded: a.reminded };
      Object.assign(a, { date, time, checkin: null, reminded: [] }); save(); render();
      toast(`Remarcada para ${fmtDay(date)} às ${time}.`, { action: { label: 'Desfazer', fn: () => { Object.assign(a, prev); save(); render(); } }, timeout: 7000 });
      announce(`Consulta remarcada para ${fmtLong(date)} às ${time}`);
    }
    if (b.id === 'cancel') {
      a.status = 'cancelada'; a.canceledAt = Date.now(); save(); render();
      toast('Consulta cancelada.', { ico: 'x', action: { label: 'Desfazer', fn: () => { a.status = 'agendada'; delete a.canceledAt; save(); render(); } }, timeout: 8000 });
    }
    if (b.id === 'ics') downloadICS(a);
  });
}
function downloadICS(a) {
  const d = doc(a.doctorId); const st = dateOf(a); const en = new Date(st.getTime() + 30 * 60e3);
  const f = (x) => x.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MeuMed//PT-BR', 'BEGIN:VEVENT', `UID:${a.id}@meumed`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(st)}`, `DTEND:${f(en)}`,
    `SUMMARY:Consulta ${modeLbl(a.mode)} - ${d.name}`, `LOCATION:${a.mode === 'tele' ? 'Teleconsulta no app MeuMed' : CLINIC.address}`,
    'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY', 'DESCRIPTION:Lembrete da consulta', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  const l = document.createElement('a'); l.href = url; l.download = `consulta-${a.date}.ics`; l.click(); setTimeout(() => URL.revokeObjectURL(url), 2000);
  toast('Evento gerado. Abra o arquivo para salvar na sua agenda.');
}

/* ============ PAGAMENTO (Pix e cartão) ============ */
function fakeQR(seedStr, size = 25) {
  const r = mulberry32(Math.floor(hashRand(seedStr) * 1e9)); let cells = '';
  const finder = (x, y) => `<rect x="${x}" y="${y}" width="7" height="7" fill="#0F2A2C"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3" fill="#0F2A2C"/>`;
  const inF = (x, y) => (x < 8 && y < 8) || (x > size - 9 && y < 8) || (x < 8 && y > size - 9);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!inF(x, y) && r() < 0.48) cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
  return `<svg class="qr" viewBox="-1 -1 ${size + 2} ${size + 2}" role="img" aria-label="QR Code Pix (simulado)" shape-rendering="crispEdges"><rect x="-1" y="-1" width="${size + 2}" height="${size + 2}" fill="#fff"/><g fill="#0F2A2C">${cells}</g>${finder(0, 0)}${finder(size - 7, 0)}${finder(0, size - 7)}</svg>`;
}
const luhn = (n) => { let s = 0; let alt = false; for (let i = n.length - 1; i >= 0; i--) { let d = +n[i]; if (alt) { d *= 2; if (d > 9) d -= 9; } s += d; alt = !alt; } return n.length >= 13 && s % 10 === 0; };
const brandOf = (n) => (/^4/.test(n) ? 'Visa' : /^(5[1-5]|2[2-7])/.test(n) ? 'Mastercard' : /^3[47]/.test(n) ? 'Amex' : /^(636368|438935|504175|451416|636297|5067|4576|4011|506699)/.test(n) ? 'Elo' : /^(606282|3841)/.test(n) ? 'Hipercard' : '');

function viewPay(el, id, q) {
  const a = getAppt(id); if (!a) { go('#/consultas'); return; }
  const d = doc(a.doctorId);
  if (a.payment.status === 'pago') { receipt(el, a); return; }
  let tab = 'pix';
  el.innerHTML = `
    ${pageHead('Pagamento', q.get('novo') ? 'Consulta agendada! Pague agora para garantir o horário, ou pague depois pelo app.' : 'Pague com segurança, sem filas na recepção.', `#/consulta/${a.id}`)}
    <div class="cols">
      <div class="stack">
        <div class="tabs" role="tablist" aria-label="Forma de pagamento">
          <button role="tab" data-tab="pix" id="tab-pix" aria-controls="paypanel">${icon('pix', 18)} Pix</button>
          <button role="tab" data-tab="cartao" id="tab-card" aria-controls="paypanel">${icon('card', 18)} Cartão de crédito</button>
        </div>
        <section class="card" id="paypanel" role="tabpanel"></section>
        <div class="notice">${icon('shield')}<p><strong>Ambiente de demonstração.</strong> Nenhuma cobrança real é feita. Em produção, o pagamento passa por um gateway certificado PCI-DSS e o app guarda apenas o token do cartão.</p></div>
      </div>
      <aside class="card summary sticky">
        <h2>Resumo</h2>
        <div class="doc-line" style="margin-top:12px">${avatar(d)}<div><strong>${esc(d.name)}</strong><span>${esc(d.spec)}</span></div></div>
        <dl><dt>Data</dt><dd>${cap(fmtDay(a.date))}</dd><dt>Horário</dt><dd>${a.time}</dd><dt>Modalidade</dt><dd>${modeLbl(a.mode)}</dd></dl>
        <div class="total"><span>Total</span><strong>${brl(d.price)}</strong></div>
        <a class="btn btn-ghost btn-block" href="#/consulta/${a.id}">Pagar depois</a>
      </aside>
    </div>`;

  const draw = () => {
    onLeave.timers?.forEach(clearInterval);
    $$('[data-tab]', el).forEach((b) => { b.setAttribute('aria-selected', String(b.dataset.tab === tab)); b.tabIndex = b.dataset.tab === tab ? 0 : -1; });
    $('#paypanel').setAttribute('aria-labelledby', tab === 'pix' ? 'tab-pix' : 'tab-card');
    tab === 'pix' ? drawPix() : drawCard();
  };
  const drawPix = () => {
    const code = `00020126580014BR.GOV.BCB.PIX0136${a.id}-meumed-demo520400005303986540${String(d.price.toFixed(2)).length}${d.price.toFixed(2)}5802BR5913MEUMED CLINICA6011JOAO PESSOA62070503***6304${hashRand(a.id).toString(16).slice(2, 6).toUpperCase()}`;
    $('#paypanel').innerHTML = `
      <div class="pix-box">
        <h2>Pague com Pix</h2>
        <p class="muted">Abra o app do seu banco, escolha <strong>Pix › Ler QR Code</strong> ou use o copia e cola.</p>
        ${fakeQR(a.id)}
        <p>Expira em <span class="timer" id="timer">10:00</span></p>
        <label class="sr-only" for="pixcode">Código Pix copia e cola</label>
        <div class="code-box"><input class="input" id="pixcode" readonly value="${esc(code)}"><button class="btn btn-ghost" id="copy">${icon('copy', 18)} Copiar</button></div>
        <button class="btn btn-primary btn-block" id="pix-done">${icon('check')} Já paguei: confirmar (simulação)</button>
        <p class="hint">A confirmação chega automaticamente em segundos pelo webhook do banco (aqui, simulada).</p>
      </div>`;
    let left = 600;
    const t = setInterval(() => { left--; const el2 = $('#timer'); if (!el2) return clearInterval(t); el2.textContent = `${pad(Math.floor(left / 60))}:${pad(left % 60)}`; if (left <= 0) { clearInterval(t); el2.textContent = 'expirado'; } }, 1000);
    onLeave(() => clearInterval(t)); (onLeave.timers ||= []).push(t);
  };
  const drawCard = () => {
    $('#paypanel').innerHTML = `
      <form id="cardform" class="stack" novalidate>
        <div class="card-preview" aria-hidden="true"><span class="brand-lbl" id="cp-brand">CARTÃO</span><span class="num" id="cp-num">•••• •••• •••• ••••</span><span class="row"><span id="cp-name">NOME NO CARTÃO</span><span class="spacer"></span><span id="cp-exp">MM/AA</span></span></div>
        <div class="form-grid two">
          <div class="field span-2"><label for="cc-num">Número do cartão</label><input class="input" id="cc-num" inputmode="numeric" autocomplete="off" placeholder="0000 0000 0000 0000" maxlength="23" aria-describedby="cc-num-err"><span class="err" id="cc-num-err"></span></div>
          <div class="field span-2"><label for="cc-name">Nome impresso no cartão</label><input class="input" id="cc-name" autocomplete="off" placeholder="Como está no cartão"><span class="err" id="cc-name-err"></span></div>
          <div class="field"><label for="cc-exp">Validade</label><input class="input" id="cc-exp" inputmode="numeric" autocomplete="off" placeholder="MM/AA" maxlength="5"><span class="err" id="cc-exp-err"></span></div>
          <div class="field"><label for="cc-cvv">Código de segurança (CVV)</label><input class="input" id="cc-cvv" inputmode="numeric" autocomplete="off" placeholder="123" maxlength="4"><span class="err" id="cc-cvv-err"></span></div>
          <div class="field span-2"><label for="cc-inst">Parcelas</label>
            <select class="input" id="cc-inst">${[1, 2, 3].map((n) => `<option value="${n}">${n}x de ${brl(d.price / n)} sem juros</option>`).join('')}</select></div>
        </div>
        <p class="hint">Teste: use <strong>4111 1111 1111 1111</strong>, validade futura e qualquer CVV.</p>
        <button class="btn btn-primary btn-block" type="submit" id="pay-card">${icon('shield')} Pagar ${brl(d.price)}</button>
      </form>`;
    const num = $('#cc-num'); const exp = $('#cc-exp');
    num.addEventListener('input', () => { const v = num.value.replace(/\D/g, '').slice(0, 19); num.value = v.replace(/(\d{4})(?=\d)/g, '$1 '); $('#cp-num').textContent = (num.value || '•••• •••• •••• ••••'); $('#cp-brand').textContent = brandOf(v) || 'CARTÃO'; });
    exp.addEventListener('input', () => { let v = exp.value.replace(/\D/g, '').slice(0, 4); if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2); exp.value = v; $('#cp-exp').textContent = v || 'MM/AA'; });
    $('#cc-name').addEventListener('input', (e) => { $('#cp-name').textContent = e.target.value.toUpperCase() || 'NOME NO CARTÃO'; });
    $('#cardform').addEventListener('submit', async (e) => {
      e.preventDefault();
      const n = num.value.replace(/\D/g, ''); const [mm, yy] = exp.value.split('/').map(Number);
      const errs = {
        'cc-num': luhn(n) ? '' : 'Número de cartão inválido.',
        'cc-name': $('#cc-name').value.trim().length >= 3 ? '' : 'Informe o nome como está no cartão.',
        'cc-exp': mm >= 1 && mm <= 12 && new Date(2000 + yy, mm) > new Date() ? '' : 'Validade inválida ou vencida.',
        'cc-cvv': /^\d{3,4}$/.test($('#cc-cvv').value) ? '' : 'CVV deve ter 3 ou 4 dígitos.',
      };
      let firstBad = null;
      for (const [k, msg] of Object.entries(errs)) { $('#' + k + '-err').textContent = msg; $('#' + k).setAttribute('aria-invalid', String(!!msg)); if (msg && !firstBad) firstBad = k; }
      if (firstBad) { $('#' + firstBad).focus(); announce('Corrija os campos destacados.'); return; }
      const btn = $('#pay-card'); btn.disabled = true; btn.innerHTML = '<span class="spin"></span> Processando pagamento...';
      await sleep(1600);
      markPaid(a, 'cartao', { installments: +$('#cc-inst').value, brand: brandOf(n) || 'Cartão', last4: n.slice(-4) });
    });
  };
  el.addEventListener('click', async (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.tab) { tab = b.dataset.tab; draw(); }
    if (b.id === 'copy') { try { await navigator.clipboard.writeText($('#pixcode').value); toast('Código Pix copiado.'); } catch { $('#pixcode').select(); toast('Selecione e copie o código.', { ico: 'info' }); } }
    if (b.id === 'pix-done') { b.disabled = true; b.innerHTML = '<span class="spin"></span> Confirmando com o banco...'; await sleep(1800); markPaid(a, 'pix', {}); }
  });
  draw();
}
function markPaid(a, method, extra) {
  a.payment = { status: 'pago', method, paidAt: Date.now(), amount: doc(a.doctorId).price, txid: (method === 'pix' ? 'E2E' : 'TX') + uid().toUpperCase() + uid().toUpperCase(), ...extra };
  save(); toast('Pagamento confirmado!'); announce('Pagamento confirmado'); render();
}
function receipt(el, a) {
  const d = doc(a.doctorId); const p = a.payment;
  el.innerHTML = `
    ${pageHead('Comprovante de pagamento', '', `#/consulta/${a.id}`)}
    <section class="card receipt" style="max-width:560px">
      <div class="success-burst">${icon('check', 44)}</div>
      <h2 style="text-align:center">Pagamento confirmado</h2>
      <p class="muted" style="text-align:center;margin:6px 0 18px">${fmtDT(p.paidAt)}</p>
      <dl>
        <dt>Valor</dt><dd>${brl(p.amount)}</dd>
        <dt>Forma</dt><dd>${p.method === 'pix' ? 'Pix' : `${esc(p.brand)} final ${esc(p.last4)} · ${p.installments}x`}</dd>
        <dt>Profissional</dt><dd>${esc(d.name)}</dd>
        <dt>Consulta</dt><dd>${cap(fmtDay(a.date))}, ${a.time} · ${modeLbl(a.mode)}</dd>
        <dt>Pagador</dt><dd>${esc(state.profile.name)}</dd>
        <dt>Identificador</dt><dd style="font-family:ui-monospace,monospace;font-size:.85rem">${esc(p.txid)}</dd>
      </dl>
      <div class="row no-print" style="margin-top:18px">
        <button class="btn btn-ghost" onclick="window.print()">${icon('print')} Imprimir</button>
        <span class="spacer"></span>
        <a class="btn btn-primary" href="#/consulta/${a.id}">Ver consulta</a>
      </div>
      <p class="hint" style="margin-top:12px">Recibo para reembolso do convênio chega na próxima onda do MVP.</p>
    </section>`;
}

/* ============ EXAMES E FOTOS ============ */
const EXAM_TYPES = ['Exame de imagem (ultrassom, tomografia...)', 'Exame laboratorial', 'Foto da região', 'Receita ou laudo anterior', 'Outro'];
async function viewExams(el, id) {
  const a = getAppt(id); if (!a) { go('#/consultas'); return; }
  const d = doc(a.doctorId); const seq = routeSeq; const urls = [];
  onLeave(() => urls.forEach((u) => URL.revokeObjectURL(u)));
  el.innerHTML = `
    ${pageHead('Enviar exames e fotos', `Para ${esc(d.name)} · ${cap(fmtDay(a.date))}, ${a.time}. O médico recebe antes da consulta.`, `#/consulta/${a.id}`)}
    <div class="stack">
      <label class="dropzone" id="dz" for="file-in">
        <span class="dz-ico">${icon('upload', 32)}</span>
        <strong>Toque para escolher arquivos ou arraste aqui</strong>
        <span class="hint">Fotos (JPG, PNG, HEIC) ou PDF · até 10 MB cada</span>
        <input id="file-in" type="file" accept="image/*,application/pdf" multiple class="sr-only">
      </label>
      <div class="row">
        <label class="btn btn-ghost" for="cam-in">${icon('camera')} Tirar foto do exame</label>
        <input id="cam-in" type="file" accept="image/*" capture="environment" class="sr-only">
        <span class="hint">Dica: fotografe o exame em local bem iluminado, sem reflexo.</span>
      </div>
      <div id="files" class="files" aria-live="polite"></div>
      <div class="card row" id="send-bar">
        <p id="send-status" class="spacer"></p>
        <button class="btn btn-primary" id="send">${icon('send')} Enviar ao médico</button>
      </div>
      <div class="notice">${icon('shield')}<p>Seus exames são dados sensíveis (LGPD). Neste protótipo eles ficam apenas neste aparelho. Em produção, são criptografados e só a equipe que vai te atender tem acesso.</p></div>
    </div>`;

  const draw = async () => {
    const files = (await idb.all()).filter((f) => f.apptId === a.id).sort((x, y) => x.at - y.at);
    if (seq !== routeSeq) return;
    $('#files').innerHTML = files.map((f) => {
      let thumb = `<span class="thumb">${icon('file', 30)}</span>`;
      if (f.type.startsWith('image/')) { const u = URL.createObjectURL(f.blob); urls.push(u); thumb = `<img class="thumb" src="${u}" alt="Miniatura de ${esc(f.name)}">`; }
      return `<div class="file-item">${thumb}<div class="stack" style="gap:6px">
        <span class="name">${esc(f.name)}</span>
        <span class="hint">${(f.size / 1024 / 1024).toFixed(2)} MB · ${f.sent ? `<span class="chip chip-ok">${icon('check', 12)} Enviado</span>` : '<span class="chip chip-warn">Não enviado</span>'}</span>
        <label class="sr-only" for="ty-${f.id}">Tipo do arquivo ${esc(f.name)}</label>
        <select class="input" id="ty-${f.id}" data-type="${f.id}" style="min-height:40px">${EXAM_TYPES.map((t) => `<option ${t === f.kind ? 'selected' : ''}>${t}</option>`).join('')}</select>
        <button class="btn btn-ghost btn-sm" data-del="${f.id}" aria-label="Remover ${esc(f.name)}">${icon('trash', 16)} Remover</button>
      </div></div>`;
    }).join('');
    const pending = files.filter((f) => !f.sent).length;
    $('#send-status').innerHTML = files.length ? `<strong>${files.length}</strong> arquivo(s) · ${pending ? `<span class="muted">${pending} aguardando envio</span>` : '<span style="color:var(--success);font-weight:700">todos enviados</span>'}` : '<span class="muted">Nenhum arquivo adicionado.</span>';
    $('#send').disabled = !pending;
  };
  const add = async (list) => {
    for (const f of list) {
      if (!/^image\/|application\/pdf/.test(f.type)) { toast(`${f.name}: formato não aceito.`, { ico: 'alert' }); continue; }
      if (f.size > 10 * 1024 * 1024) { toast(`${f.name}: maior que 10 MB.`, { ico: 'alert' }); continue; }
      await idb.put({ id: uid(), apptId: a.id, name: f.name, type: f.type, size: f.size, blob: f, at: Date.now(), sent: false, kind: f.type.startsWith('image/') ? 'Foto da região' : 'Exame laboratorial' });
    }
    draw();
  };
  $('#file-in').onchange = (e) => { add([...e.target.files]); e.target.value = ''; };
  $('#cam-in').onchange = (e) => { add([...e.target.files]); e.target.value = ''; };
  const dz = $('#dz');
  ['dragenter', 'dragover'].forEach((t) => dz.addEventListener(t, (e) => { e.preventDefault(); dz.classList.add('drag'); }));
  ['dragleave', 'drop'].forEach((t) => dz.addEventListener(t, (e) => { e.preventDefault(); dz.classList.remove('drag'); }));
  dz.addEventListener('drop', (e) => add([...e.dataTransfer.files]));
  el.addEventListener('change', async (e) => {
    const s = e.target.closest('[data-type]'); if (!s) return;
    const f = (await idb.all()).find((x) => x.id === s.dataset.type); if (f) { f.kind = s.value; await idb.put(f); }
  });
  el.addEventListener('click', async (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.del) { await idb.del(b.dataset.del); toast('Arquivo removido.', { ico: 'trash' }); draw(); }
    if (b.id === 'send') {
      b.disabled = true; b.innerHTML = '<span class="spin"></span> Enviando...';
      const files = (await idb.all()).filter((f) => f.apptId === a.id);
      for (const f of files) { f.sent = true; await idb.put(f); }
      await sleep(1200);
      a.exams = { sentAt: Date.now(), count: files.length }; save();
      b.innerHTML = `${icon('send')} Enviar ao médico`;
      toast(`${files.length} arquivo(s) enviados para ${d.name}.`); draw();
    }
  });
  draw();
}

/* ============ CHECK-IN ONLINE ============ */
function viewCheckin(el, id) {
  const a = getAppt(id); if (!a) { go('#/consultas'); return; }
  const d = doc(a.doctorId); const cw = checkinWindow(a);
  const head = pageHead('Check-in online', `${esc(d.name)} · ${cap(fmtLong(a.date))}, ${a.time}`, `#/consulta/${a.id}`);
  if (a.mode === 'tele') {
    el.innerHTML = `${head}<section class="card empty"><span class="q-ico">${icon('video', 30)}</span><h2>Teleconsulta não precisa de check-in</h2><p>Entre na sala virtual até 10 minutos antes.</p><a class="btn btn-primary" href="#/tele/${a.id}">${icon('video')} Ir para a sala</a></section>`; return;
  }
  if (a.checkin) {
    el.innerHTML = `${head}
      <section class="card checkin-pass" style="max-width:520px">
        <div class="success-burst">${icon('check', 44)}</div>
        <h2>Check-in confirmado</h2>
        <p class="muted">Ao chegar, mostre este código na recepção. Não precisa preencher ficha.</p>
        <div class="pass-code" aria-label="Código ${a.checkin.code.split('').join(' ')}">${a.checkin.code}</div>
        ${fakeQR(a.checkin.code, 21)}
        <p><strong>Chegue às ${(() => { const t = new Date(dateOf(a).getTime() - 15 * 60e3); return pad(t.getHours()) + ':' + pad(t.getMinutes()); })()}</strong> (15 min antes)</p>
        <p class="hint">${icon('pin', 16)} ${esc(CLINIC.address)}</p>
        <p class="hint">Feito em ${fmtDT(a.checkin.at)}</p>
      </section>`; return;
  }
  if (!cw.open) {
    el.innerHTML = `${head}<section class="card empty"><span class="q-ico amber">${icon('clock', 30)}</span>
      <h2>${cw.hours > 0 ? 'O check-in abre 72h antes da consulta' : 'O prazo de check-in terminou'}</h2>
      <p>${cw.hours > 0 ? `Vamos te avisar com um lembrete quando estiver disponível (em cerca de ${Math.ceil((cw.hours - 72) / 24)} dia(s)).` : 'Procure a recepção ao chegar.'}</p>
      <a class="btn btn-ghost" href="#/consulta/${a.id}">Voltar à consulta</a></section>`; return;
  }
  const p = state.profile;
  el.innerHTML = `${head}
    <form class="card stack" id="ckform" style="max-width:760px" novalidate>
      <div class="notice">${icon('info')}<p>Leva 1 minuto. Assim você evita filas e a equipe já te recebe com a ficha pronta.</p></div>
      <h2>1. Confirme seus dados</h2>
      <div class="form-grid two">
        <div class="field"><label for="ck-name">Nome completo</label><input class="input" id="ck-name" value="${esc(p.name)}" autocomplete="name" required></div>
        <div class="field"><label for="ck-phone">Celular</label><input class="input" id="ck-phone" value="${esc(p.phone)}" autocomplete="tel" inputmode="tel" required></div>
        <div class="field span-2"><label for="ck-plan">Forma de atendimento</label>
          <select class="input" id="ck-plan">${['Particular', 'Convênio (validação da carteirinha na próxima onda)'].map((x) => `<option ${x.startsWith(p.plan) ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
      </div>
      <h2>2. Como você está?</h2>
      <div class="field"><label for="ck-reason">Motivo da consulta ou sintomas</label><textarea class="input" id="ck-reason" placeholder="Ex.: caroço no pescoço há 2 meses, rouquidão..."></textarea></div>
      <div class="form-grid two">
        <div class="field"><label for="ck-meds">Remédios em uso</label><input class="input" id="ck-meds" placeholder="Ex.: levotiroxina 50 mcg"></div>
        <div class="field"><label for="ck-allergy">Alergias</label><input class="input" id="ck-allergy" placeholder="Ex.: dipirona, nenhuma"></div>
      </div>
      <fieldset class="a11y-group"><legend>Precisa de algum apoio na clínica?</legend>
        ${['Cadeira de rodas', 'Intérprete de Libras', 'Acompanhante', 'Atendimento prioritário'].map((x, i) => `<label class="check"><input type="checkbox" name="support" value="${x}" id="sp${i}"> ${x}</label>`).join('')}
      </fieldset>
      <label class="check"><input type="checkbox" id="ck-consent"> <span>Confirmo que as informações estão corretas e autorizo o uso pela equipe da clínica para o meu atendimento, conforme a LGPD.</span></label>
      <span class="err" id="ck-err" role="alert"></span>
      <button class="btn btn-primary" type="submit">${icon('check')} Confirmar check-in</button>
    </form>`;
  $('#ckform').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!$('#ck-name').value.trim() || !$('#ck-phone').value.trim()) { $('#ck-err').textContent = 'Preencha nome e celular.'; return; }
    if (!$('#ck-consent').checked) { $('#ck-err').textContent = 'Marque a autorização para concluir o check-in.'; $('#ck-consent').focus(); return; }
    a.checkin = { at: Date.now(), code: 'CK-' + String(Math.floor(1000 + Math.random() * 9000)), support: $$('[name=support]:checked').map((x) => x.value), reason: $('#ck-reason').value };
    state.profile.name = $('#ck-name').value.trim(); state.profile.phone = $('#ck-phone').value.trim();
    save(); toast('Check-in confirmado!'); render();
  });
}

/* ============ TELECONSULTA ============ */
async function viewTele(el, id) {
  const a = getAppt(id); if (!a) { go('#/consultas'); return; }
  const d = doc(a.doctorId); const seq = routeSeq;
  let stream = null; let audioCtx = null; let raf = 0;
  const stopAll = () => { cancelAnimationFrame(raf); stream?.getTracks().forEach((t) => t.stop()); audioCtx?.close?.(); $('.call')?.remove(); document.body.style.overflow = ''; };
  onLeave(stopAll);
  el.innerHTML = `
    ${pageHead('Teleconsulta', `${esc(d.name)} · ${cap(fmtLong(a.date))}, ${a.time}`, `#/consulta/${a.id}`)}
    <div class="tele-pre">
      <section class="card stack">
        <div class="video-box" id="pre-video"><div class="cam-off"><span class="spin"></span><p>Pedindo acesso à câmera e ao microfone...</p></div></div>
        <div><span class="label">Nível do microfone</span><div class="meter" aria-hidden="true"><span id="mic-level"></span></div></div>
        <div class="row">
          <button class="btn btn-ghost" id="t-cam" aria-pressed="true">${icon('video')} Câmera ligada</button>
          <button class="btn btn-ghost" id="t-mic" aria-pressed="true">${icon('mic')} Microfone ligado</button>
        </div>
      </section>
      <section class="card stack">
        <div class="doc-line">${avatar(d, 'lg')}<div><strong>${esc(d.name)}</strong><span>${esc(d.spec)}</span></div></div>
        <ul class="feat-list" style="grid-template-columns:1fr">
          <li>${icon('check')} Fique em um lugar silencioso e bem iluminado</li>
          <li>${icon('check')} Tenha seus exames por perto (ou envie antes)</li>
          <li>${icon('check')} Use fones para mais privacidade</li>
        </ul>
        <div class="chips">${payChip(a)}${a.exams.count ? `<span class="chip chip-ok">${icon('check', 14)} ${a.exams.count} exame(s) enviados</span>` : `<a class="chip chip-info" href="#/exames/${a.id}">${icon('upload', 14)} Enviar exames</a>`}</div>
        <button class="btn btn-primary btn-block" id="join">${icon('video')} Entrar na sala</button>
        <p class="hint">Protótipo: a conexão com o médico é simulada. Em produção usa WebRTC criptografado de ponta a ponta, conforme a Resolução CFM 2.314/2022.</p>
      </section>
    </div>`;

  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
    if (seq !== routeSeq) { stream.getTracks().forEach((t) => t.stop()); return; }
    $('#pre-video').innerHTML = '<video autoplay playsinline muted aria-label="Sua câmera"></video>';
    $('#pre-video video').srcObject = stream;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const an = audioCtx.createAnalyser(); an.fftSize = 256; audioCtx.createMediaStreamSource(stream).connect(an);
      const buf = new Uint8Array(an.frequencyBinCount);
      const loop = () => { an.getByteFrequencyData(buf); const v = buf.reduce((x, y) => x + y, 0) / buf.length; const m = $('#mic-level'); if (m) m.style.width = Math.min(100, v * 1.6) + '%'; raf = requestAnimationFrame(loop); };
      loop();
    } catch { /* sem medidor */ }
  } catch (err) {
    if (seq !== routeSeq) return;
    $('#pre-video').innerHTML = `<div class="cam-off">${icon('video-off', 40)}<p><strong>Não conseguimos acessar a câmera ou o microfone.</strong></p><p class="small">Libere a permissão no navegador. Você ainda pode entrar só com áudio ou pelo chat.</p></div>`;
  }
  const setTrack = (kind, on) => stream?.getTracks().filter((t) => t.kind === kind).forEach((t) => { t.enabled = on; });
  const toggleBtn = (b, kind, onLbl, offLbl, onIco, offIco) => {
    const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(on)); setTrack(kind, on);
    b.innerHTML = `${icon(on ? onIco : offIco)} ${on ? onLbl : offLbl}`;
  };
  $('#t-cam').onclick = (e) => toggleBtn(e.currentTarget, 'video', 'Câmera ligada', 'Câmera desligada', 'video', 'video-off');
  $('#t-mic').onclick = (e) => toggleBtn(e.currentTarget, 'audio', 'Microfone ligado', 'Microfone desligado', 'mic', 'mic-off');
  $('#join').onclick = () => startCall();

  function startCall() {
    const start = Date.now(); document.body.style.overflow = 'hidden';
    const call = document.createElement('section'); call.className = 'call'; call.setAttribute('role', 'dialog'); call.setAttribute('aria-modal', 'true'); call.setAttribute('aria-label', 'Teleconsulta em andamento');
    const camOn = $('#t-cam').getAttribute('aria-pressed') === 'true'; const micOn = $('#t-mic').getAttribute('aria-pressed') === 'true';
    call.innerHTML = `
      <div class="call-top"><strong>${esc(d.name)}</strong><span class="chip" style="background:rgba(255,255,255,.12);color:#fff;border:0">${icon('shield', 14)} Criptografada</span><span class="rec"><span class="dot" style="color:#ff6b6b"></span><span id="call-time">00:00</span></span></div>
      <div class="call-stage">
        <div class="remote" id="remote">${avatar(d, 'xl')}<p id="remote-st" aria-live="polite">Aguardando ${esc(d.name)} entrar na sala...</p></div>
        <div class="self-view">${stream ? '<video autoplay playsinline muted aria-label="Você"></video>' : icon('user', 48)}</div>
        <p class="call-caption" id="caption" hidden aria-live="polite"></p>
      </div>
      <div class="call-controls">
        <button class="cc" id="c-mic" aria-pressed="${!micOn}" aria-label="${micOn ? 'Desligar microfone' : 'Ligar microfone'}">${icon(micOn ? 'mic' : 'mic-off', 26)}</button>
        <button class="cc" id="c-cam" aria-pressed="${!camOn}" aria-label="${camOn ? 'Desligar câmera' : 'Ligar câmera'}">${icon(camOn ? 'video' : 'video-off', 26)}</button>
        <button class="cc" id="c-cc" aria-pressed="false" aria-label="Legendas automáticas">${icon('text', 26)}</button>
        <button class="cc" id="c-chat" aria-pressed="false" aria-label="Chat da consulta">${icon('chat', 26)}</button>
        <button class="cc end" id="c-end" aria-label="Encerrar teleconsulta">${icon('phone', 28)}</button>
      </div>`;
    document.body.appendChild(call);
    if (stream) $('.self-view video', call).srcObject = stream;
    $('#c-end', call).focus();
    const lines = ['Olá! Consegue me ouvir bem?', 'Vi os exames que você enviou, obrigada.', 'Me conte como você tem se sentido desde a última consulta.', 'Vou te passar algumas orientações, tudo bem?'];
    let li = 0; let captions = false;
    const timers = [];
    timers.push(setTimeout(() => {
      $('#remote-st', call).innerHTML = `<strong>${esc(d.name)}</strong> entrou na sala`;
      $('#remote', call).insertAdjacentHTML('beforeend', '<div class="wave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>');
      announce(`${d.name} entrou na sala`);
    }, 2500));
    timers.push(setInterval(() => { if (!captions || li >= lines.length * 3) return; const c = $('#caption', call); c.hidden = false; c.textContent = `${d.name.split(' ').slice(0, 2).join(' ')}: ${lines[li++ % lines.length]}`; }, 4000));
    timers.push(setInterval(() => { const s = Math.floor((Date.now() - start) / 1000); const t = $('#call-time', call); if (t) t.textContent = `${pad(Math.floor(s / 60))}:${pad(s % 60)}`; }, 1000));
    const endCall = () => {
      timers.forEach((t) => { clearTimeout(t); clearInterval(t); });
      const s = Math.floor((Date.now() - start) / 1000);
      call.remove(); document.body.style.overflow = '';
      stream?.getTracks().forEach((t) => t.stop()); stream = null;
      el.innerHTML = `${pageHead('Teleconsulta encerrada', '', `#/consulta/${a.id}`)}
        <section class="card empty"><div class="success-burst">${icon('check', 44)}</div><h2>Obrigado por usar a teleconsulta</h2>
        <p>Duração: ${pad(Math.floor(s / 60))}:${pad(s % 60)}. Receitas e pedidos de exame aparecerão aqui na próxima onda.</p>
        <div class="row"><a class="btn btn-primary" href="#/inicio">Voltar ao início</a><a class="btn btn-ghost" href="#/chat">Falar com a clínica</a></div></section>`;
      $('h1', el).focus();
    };
    onLeave(() => timers.forEach((t) => { clearTimeout(t); clearInterval(t); }));
    call.addEventListener('keydown', (e) => { if (e.key === 'Escape') endCall(); });
    call.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.id === 'c-end') endCall();
      if (b.id === 'c-mic') { const off = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(off)); setTrack('audio', !off); b.innerHTML = icon(off ? 'mic-off' : 'mic', 26); b.setAttribute('aria-label', off ? 'Ligar microfone' : 'Desligar microfone'); }
      if (b.id === 'c-cam') { const off = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(off)); setTrack('video', !off); b.innerHTML = icon(off ? 'video-off' : 'video', 26); b.setAttribute('aria-label', off ? 'Ligar câmera' : 'Desligar câmera'); }
      if (b.id === 'c-cc') { captions = !captions; b.setAttribute('aria-pressed', String(captions)); if (!captions) $('#caption', call).hidden = true; toast(captions ? 'Legendas ativadas (simuladas).' : 'Legendas desativadas.', { ico: 'text' }); }
      if (b.id === 'c-chat') {
        const open = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(open));
        const ex = $('.call-chat', call); if (ex) { ex.remove(); return; }
        $('.call-stage', call).insertAdjacentHTML('beforeend', `<div class="call-chat"><div class="chat-head"><strong>Chat da consulta</strong></div><div class="chat-log" id="cc-log"><div class="bubble them">Pode mandar links ou dúvidas por aqui durante a consulta.</div></div><form class="chat-input" id="cc-form"><label class="sr-only" for="cc-in">Mensagem</label><input class="input" id="cc-in" placeholder="Mensagem"><button class="btn btn-primary" aria-label="Enviar">${icon('send')}</button></form></div>`);
        $('#cc-form', call).onsubmit = (ev) => { ev.preventDefault(); const v = $('#cc-in', call).value.trim(); if (!v) return; $('#cc-log', call).insertAdjacentHTML('beforeend', `<div class="bubble me">${esc(v)}</div>`); $('#cc-in', call).value = ''; };
        $('#cc-in', call).focus();
      }
    });
  }
}

/* ============ CHAT (assistente IA + clínica) ============ */
const EMERGENCY = /(dor no peito|falta de ar|n[aã]o consigo respirar|sangr|desmai|engasg|convuls|inchaço na garganta|emerg[eê]ncia|infarto|avc)/i;
function aiReply(text) {
  const t = text.toLowerCase(); const next = upcoming()[0]; const nd = next && doc(next.doctorId);
  if (EMERGENCY.test(t)) return { urgent: true, text: 'Atenção: isso pode ser uma emergência. Ligue agora para o SAMU (192) ou vá ao pronto-socorro mais próximo. Não espere pela consulta.', acts: [['Ligar 192', 'tel:192']] };
  if (/(pr[oó]xima consulta|minha consulta|quando .*consulta)/.test(t)) return next ? { text: `Sua próxima consulta é com ${nd.name}, ${fmtLong(next.date)} às ${next.time} (${modeLbl(next.mode).toLowerCase()}).`, acts: [['Ver detalhes', `#/consulta/${next.id}`]] } : { text: 'Você não tem consultas agendadas. Quer marcar uma?', acts: [['Agendar', '#/agendar']] };
  if (/(remarc|mudar|trocar|adiar)/.test(t)) return { text: 'Você pode remarcar com 1 toque: abra a consulta e escolha um dos próximos horários livres. Sem custo até 24h antes.', acts: next ? [['Remarcar agora', `#/consulta/${next.id}`]] : [['Minhas consultas', '#/consultas']] };
  if (/cancel/.test(t)) return { text: 'Para cancelar, abra a consulta e toque em "Cancelar consulta". Se já pagou, o estorno é automático. Você ainda tem alguns segundos para desfazer.', acts: [['Minhas consultas', '#/consultas']] };
  if (/(agend|marcar|hor[aá]rio|vaga|disponib)/.test(t)) return { text: 'Na agenda ao vivo você vê os horários livres de cada médico atualizados em tempo real. Escolha o profissional, a data e o horário.', acts: [['Abrir agenda', '#/agendar']] };
  if (/(pix|cart[aã]o|pag|valor|pre[cç]o|quanto custa|parcel)/.test(t)) return { text: `Aceitamos Pix (confirmação na hora) e cartão de crédito em até 3x sem juros. Valores: ${DOCTORS.map((d) => `${d.spec.split(' ')[0]} ${brl(d.price)}`).filter((v, i, arr) => arr.indexOf(v) === i).join(', ')}.`, acts: next && next.payment.status !== 'pago' ? [['Pagar próxima consulta', `#/pagamento/${next.id}`]] : [] };
  if (/(exame|foto|laudo|resultado|ultrass|tomograf)/.test(t)) return { text: 'Você pode enviar fotos ou PDFs dos exames antes da consulta. O médico já chega sabendo do seu caso.', acts: next ? [['Enviar exames', `#/exames/${next.id}`]] : [] };
  if (/(check-?in|chegada|ficha|recep[cç])/.test(t)) return { text: 'O check-in online abre 72h antes da consulta presencial. Você confirma seus dados e recebe um código para apresentar na recepção, sem fila.', acts: next && next.mode === 'presencial' ? [['Fazer check-in', `#/checkin/${next.id}`]] : [] };
  if (/(tele|v[ií]deo|online|chamada|remot)/.test(t)) return { text: 'A teleconsulta acontece dentro do app, por vídeo. Antes de entrar você testa câmera e microfone. Basta abrir a consulta no horário.', acts: next && next.mode === 'tele' ? [['Ir para a sala', `#/tele/${next.id}`]] : [['Agendar teleconsulta', '#/agendar']] };
  if (/(endere[cç]o|onde fica|local|estacion|chegar)/.test(t)) return { text: `Estamos em: ${CLINIC.address}. Telefone ${CLINIC.phone}.` };
  if (/(jejum|preparo|levar|antes da consulta)/.test(t)) return { text: 'Para a primeira consulta, leve documento com foto, exames anteriores e a lista de remédios que você usa. Para exames específicos, a equipe envia o preparo pelo app.' };
  if (/(lembrete|avis|notifica)/.test(t)) return { text: 'Os lembretes são automáticos: 24h e 2h antes, por padrão. Você pode ajustar no seu perfil.', acts: [['Ajustar lembretes', '#/mais#lembretes']] };
  if (/(tireoide|n[oó]dulo|caro[cç]o|rouquid|garganta|pesco[cç]o)/.test(t)) return { text: 'Entendo a sua preocupação. Não consigo dar diagnóstico, mas esse sintoma merece avaliação. A Cirurgia de Cabeça e Pescoço ou a Otorrinolaringologia podem te atender.', acts: [['Ver médicos', '#/agendar']] };
  if (/(ol[aá]|oi\b|bom dia|boa tarde|boa noite)/.test(t)) return { text: `Olá, ${state.profile.name.split(' ')[0]}! Posso ajudar a agendar, remarcar, pagar, enviar exames ou tirar dúvidas sobre a clínica.` };
  if (/obrigad/.test(t)) return { text: 'Por nada! Estou aqui 24h se precisar.' };
  return { text: 'Não tenho certeza de que entendi. Posso te transferir para a recepção da clínica, que responde em horário comercial.', acts: [['Falar com a recepção', 'tab:clinica']] };
}
function viewChat(el, q) {
  let tab = q.get('aba') || 'ia';
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  el.innerHTML = `
    ${pageHead('Atendimento', 'Assistente com IA 24h, recepção da clínica e WhatsApp.')}
    <div class="row" style="margin-bottom:6px">
      <div class="tabs" role="tablist" aria-label="Canal de atendimento" style="margin:0">
        <button role="tab" data-tab="ia" id="tab-ia" aria-controls="chatpanel">${icon('sparkle', 18)} Assistente IA</button>
        <button role="tab" data-tab="clinica" id="tab-cl" aria-controls="chatpanel">${icon('headset', 18)} Recepção</button>
      </div>
      <span class="spacer"></span>
      <a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="https://wa.me/${CLINIC.whatsapp}?text=${encodeURIComponent('Olá! Vim pelo app MeuMed.')}">${icon('whatsapp', 18)} Continuar no WhatsApp</a>
    </div>
    <section class="card chat-wrap" id="chatpanel" role="tabpanel"></section>`;
  const SUG = { ia: ['Qual minha próxima consulta?', 'Quero remarcar', 'Como pagar com Pix?', 'Como enviar exames?', 'Onde fica a clínica?'], clinica: ['Preciso de um atestado', 'Vou me atrasar 10 minutos', 'Dúvida sobre valores'] };
  const draw = () => {
    $$('[data-tab]', el).forEach((b) => { b.setAttribute('aria-selected', String(b.dataset.tab === tab)); b.tabIndex = b.dataset.tab === tab ? 0 : -1; });
    $('#chatpanel').setAttribute('aria-labelledby', tab === 'ia' ? 'tab-ia' : 'tab-cl');
    const isIA = tab === 'ia';
    $('#chatpanel').innerHTML = `
      <div class="chat-head">
        <span class="q-ico ${isIA ? 'blue' : ''}">${icon(isIA ? 'bot' : 'headset', 22)}</span>
        <div><strong>${isIA ? 'Assistente MeuMed' : 'Recepção · Clínica'}</strong><p class="hint">${isIA ? 'IA · responde na hora · não substitui avaliação médica' : 'Seg a sex, 7h às 18h · sáb, 7h às 12h'}</p></div>
      </div>
      <div class="chat-log" id="log" role="log" aria-live="polite" aria-label="Conversa"></div>
      <div>
        <div class="suggest" aria-label="Sugestões">${SUG[tab].map((s) => `<button class="pill" data-sug="${esc(s)}">${esc(s)}</button>`).join('')}</div>
        <form class="chat-input" id="chatform">
          <label class="sr-only" for="msg">Escreva sua mensagem</label>
          <input class="input" id="msg" placeholder="Escreva sua mensagem..." autocomplete="off">
          ${SR ? `<button type="button" class="btn btn-ghost" id="voice" aria-label="Falar mensagem" aria-pressed="false">${icon('mic')}</button>` : ''}
          <button class="btn btn-primary" aria-label="Enviar mensagem">${icon('send')}</button>
        </form>
      </div>`;
    const log = state.chat[tab];
    if (!log.length) log.push({ me: false, text: isIA ? `Olá, ${state.profile.name.split(' ')[0]}! Sou o assistente virtual da clínica. Posso ajudar com agendamento, remarcação, pagamento, exames e check-in. Em caso de emergência, ligue 192.` : 'Olá! Aqui é a recepção da clínica. Como podemos ajudar?', at: Date.now() });
    log.forEach((m) => bubble(m, false));
  };
  const bubble = (m, scroll = true) => {
    const L = $('#log'); if (!L) return;
    const acts = (m.acts || []).map(([lbl, href]) => href.startsWith('tab:') ? `<button class="btn btn-ghost btn-sm" data-goto="${href.slice(4)}">${esc(lbl)}</button>` : `<a class="btn btn-ghost btn-sm" href="${href}">${esc(lbl)}</a>`).join('');
    L.insertAdjacentHTML('beforeend', `<div class="bubble ${m.me ? 'me' : 'them'} ${m.urgent ? 'urgent' : ''}">${m.urgent ? icon('alert', 18) + ' ' : ''}${esc(m.text)}${acts ? `<div class="acts">${acts}</div>` : ''}
      <div class="meta"><span>${new Date(m.at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>${!m.me ? `<button data-speak="${esc(m.text)}" aria-label="Ouvir mensagem">${icon('volume', 14)}</button>` : ''}</div></div>`);
    L.scrollTop = L.scrollHeight;
  };
  const send = async (text) => {
    text = text.trim(); if (!text) return;
    const ch = tab; const m = { me: true, text, at: Date.now() }; state.chat[ch].push(m); bubble(m); save();
    const L = $('#log'); L.insertAdjacentHTML('beforeend', '<div class="bubble them typing" id="typing" aria-label="Digitando"><i></i><i></i><i></i></div>'); L.scrollTop = L.scrollHeight;
    await sleep(ch === 'ia' ? 900 : 2200);
    $('#typing')?.remove();
    const r = ch === 'ia' ? aiReply(text) : { text: /atras/.test(text.toLowerCase()) ? 'Tudo bem, avisamos o médico. Obrigado por informar!' : 'Recebemos sua mensagem. Uma atendente responde em instantes (simulado).' };
    const rm = { me: false, ...r, at: Date.now() }; state.chat[ch].push(rm); save();
    if (ch === tab) bubble(rm);
    if (a11y.clickread) speak(r.text);
  };
  el.addEventListener('submit', (e) => { if (e.target.id === 'chatform') { e.preventDefault(); const i = $('#msg'); send(i.value); i.value = ''; i.focus(); } });
  el.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.tab) { tab = b.dataset.tab; draw(); }
    if (b.dataset.sug) send(b.dataset.sug);
    if (b.dataset.speak) speak(b.dataset.speak);
    if (b.dataset.goto) { tab = b.dataset.goto; draw(); }
    if (b.id === 'voice' && SR) {
      const rec = new SR(); rec.lang = 'pt-BR'; rec.interimResults = false;
      b.setAttribute('aria-pressed', 'true'); toast('Pode falar...', { ico: 'mic', timeout: 2500 });
      rec.onresult = (ev) => { $('#msg').value = ev.results[0][0].transcript; };
      rec.onend = () => { b.setAttribute('aria-pressed', 'false'); if ($('#msg').value) send($('#msg').value), ($('#msg').value = ''); };
      rec.onerror = () => toast('Não foi possível usar o microfone.', { ico: 'alert' });
      rec.start(); onLeave(() => { try { rec.abort(); } catch { /* noop */ } });
    }
  });
  draw();
}

/* ============ RELATÓRIO CONTÁBIL (gestão da clínica) ============ */
const FEE = (t) => (t.method === 'pix' ? 0.0099 : t.installments > 1 ? 0.0449 : 0.0319);
function allTx() {
  const mine = state.appts.filter((a) => a.payment.status === 'pago').map((a) => ({ id: a.id, at: a.payment.paidAt, patient: `${state.profile.name} (app)`, doctorId: a.doctorId, method: a.payment.method, installments: a.payment.installments || 1, amount: a.payment.amount, status: a.status === 'cancelada' ? 'estornado' : 'pago' }));
  const pend = upcoming().filter((a) => a.payment.status !== 'pago').map((a) => ({ id: a.id, at: a.createdAt, patient: `${state.profile.name} (app)`, doctorId: a.doctorId, method: '-', installments: 1, amount: doc(a.doctorId).price, status: 'pendente' }));
  return [...state.ledger, ...mine, ...pend];
}
function viewReport(el) {
  let period = 'mes'; let from = ''; let to = '';
  el.innerHTML = `
    ${pageHead('Relatório contábil', 'Visão da gestão da clínica: receitas, taxas e recebíveis por período. Dados fictícios.')}
    <section class="card no-print" style="margin-bottom:16px">
      <div class="row">
        <div class="field" style="min-width:200px"><label for="rp-period">Período</label>
          <select class="input" id="rp-period"><option value="mes">Mês atual</option><option value="anterior">Mês anterior</option><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option><option value="custom">Personalizado</option></select></div>
        <div class="field" id="rp-from-w" hidden><label for="rp-from">De</label><input class="input" type="date" id="rp-from"></div>
        <div class="field" id="rp-to-w" hidden><label for="rp-to">Até</label><input class="input" type="date" id="rp-to"></div>
        <span class="spacer"></span>
        <button class="btn btn-ghost" id="csv">${icon('download')} Exportar CSV</button>
        <button class="btn btn-ghost" id="print">${icon('print')} Imprimir / PDF</button>
      </div>
    </section>
    <div id="rp"></div>`;
  const range = () => {
    const now = new Date(); let a; let b;
    if (period === 'mes') { a = new Date(now.getFullYear(), now.getMonth(), 1); b = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59); }
    else if (period === 'anterior') { a = new Date(now.getFullYear(), now.getMonth() - 1, 1); b = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59); }
    else if (period === 'custom' && from && to) { a = new Date(from + 'T00:00:00'); b = new Date(to + 'T23:59:59'); }
    else { const days = period === '90' ? 90 : 30; a = new Date(now); a.setDate(a.getDate() - days); a.setHours(0, 0, 0, 0); b = new Date(now); b.setHours(23, 59, 59); }
    return [a, b];
  };
  let rows = [];
  const draw = () => {
    const [a, b] = range();
    rows = allTx().filter((t) => t.at >= a.getTime() && t.at <= b.getTime()).sort((x, y) => y.at - x.at);
    const paid = rows.filter((t) => t.status === 'pago');
    const gross = paid.reduce((s, t) => s + t.amount, 0);
    const fees = paid.reduce((s, t) => s + t.amount * FEE(t), 0);
    const pending = rows.filter((t) => t.status === 'pendente').reduce((s, t) => s + t.amount, 0);
    const refunds = rows.filter((t) => t.status === 'estornado').reduce((s, t) => s + t.amount, 0);
    const byMethod = { pix: paid.filter((t) => t.method === 'pix'), cartao: paid.filter((t) => t.method === 'cartao') };
    const sum = (l) => l.reduce((s, t) => s + t.amount, 0);
    const byDoc = DOCTORS.map((d) => { const l = paid.filter((t) => t.doctorId === d.id); const g = sum(l); return { d, n: l.length, g, net: g - l.reduce((s, t) => s + t.amount * FEE(t), 0) }; }).sort((x, y) => y.g - x.g);
    // receita por semana
    const weeks = []; const ws = new Date(a); ws.setDate(ws.getDate() - ((ws.getDay() + 6) % 7)); ws.setHours(0, 0, 0, 0);
    for (let w = new Date(ws); w <= b; w.setDate(w.getDate() + 7)) { const s0 = w.getTime(); const s1 = s0 + 7 * 864e5; weeks.push({ lbl: w.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), v: sum(paid.filter((t) => t.at >= s0 && t.at < s1)) }); }
    const maxW = Math.max(1, ...weeks.map((w) => w.v));
    $('#rp').innerHTML = `
      <p class="hint" style="margin-bottom:12px">Período: <strong>${a.toLocaleDateString('pt-BR')} a ${b.toLocaleDateString('pt-BR')}</strong> · ${paid.length} pagamentos confirmados</p>
      <div class="kpis">
        <div class="card kpi"><div class="k-lbl">Receita bruta</div><div class="k-val">${brl(gross)}</div><div class="k-sub">${paid.length} consultas pagas</div></div>
        <div class="card kpi"><div class="k-lbl">Taxas de pagamento</div><div class="k-val" style="color:var(--danger)">− ${brl(fees)}</div><div class="k-sub">Pix 0,99% · cartão 3,19% a 4,49%</div></div>
        <div class="card kpi"><div class="k-lbl">Receita líquida</div><div class="k-val" style="color:var(--success)">${brl(gross - fees)}</div><div class="k-sub">Ticket médio ${brl(paid.length ? gross / paid.length : 0)}</div></div>
        <div class="card kpi"><div class="k-lbl">A receber (pendente)</div><div class="k-val" style="color:var(--warn)">${brl(pending)}</div><div class="k-sub">${refunds ? 'Estornos: ' + brl(refunds) : 'Sem estornos'}</div></div>
      </div>
      <div class="grid-2" style="margin-top:14px">
        <section class="card"><h2>Receita por semana</h2>
          <div class="bars" role="img" aria-label="Gráfico de receita semanal: ${weeks.map((w) => `semana de ${w.lbl}, ${brl(w.v)}`).join('; ')}">
            ${weeks.map((w) => `<div class="b" title="${w.lbl}: ${brl(w.v)}"><span style="height:${Math.max(3, Math.round((w.v / maxW) * 140))}px"></span><small>${w.lbl}</small></div>`).join('')}
          </div></section>
        <section class="card"><h2 style="margin-bottom:14px">Por forma de pagamento</h2>
          ${[['Pix', byMethod.pix, ''], ['Cartão de crédito', byMethod.cartao, 'alt']].map(([lbl, l, cls]) => `<div class="hbar"><div class="top"><span>${lbl} · ${l.length}</span><span>${brl(sum(l))}</span></div><div class="track"><div class="fill ${cls}" style="width:${gross ? (sum(l) / gross) * 100 : 0}%"></div></div></div>`).join('')}
          <p class="hint">Cartão parcelado: ${byMethod.cartao.filter((t) => t.installments > 1).length} transações</p>
        </section>
      </div>
      <section class="card" style="margin-top:14px"><h2 style="margin-bottom:12px">Por profissional</h2>
        <div class="table-wrap"><table><thead><tr><th scope="col">Profissional</th><th scope="col">Especialidade</th><th scope="col" class="num">Consultas</th><th scope="col" class="num">Bruto</th><th scope="col" class="num">Líquido</th></tr></thead>
        <tbody>${byDoc.map((r) => `<tr><td>${esc(r.d.name)}</td><td>${esc(r.d.spec)}</td><td class="num">${r.n}</td><td class="num">${brl(r.g)}</td><td class="num">${brl(r.net)}</td></tr>`).join('')}</tbody></table></div>
      </section>
      <section class="card" style="margin-top:14px"><h2 style="margin-bottom:12px">Lançamentos <span class="muted small">(${rows.length})</span></h2>
        <div class="table-wrap" style="max-height:420px"><table><thead><tr><th scope="col">Data</th><th scope="col">Paciente</th><th scope="col">Profissional</th><th scope="col">Forma</th><th scope="col">Situação</th><th scope="col" class="num">Valor</th><th scope="col" class="num">Taxa</th><th scope="col" class="num">Líquido</th></tr></thead>
        <tbody>${rows.slice(0, 300).map((t) => { const f = t.status === 'pago' ? t.amount * FEE(t) : 0; return `<tr><td>${fmtDT(t.at)}</td><td>${esc(t.patient)}</td><td>${esc(doc(t.doctorId).name)}</td><td>${t.method === 'pix' ? 'Pix' : t.method === 'cartao' ? `Cartão ${t.installments}x` : '—'}</td><td>${t.status === 'pago' ? '<span class="chip chip-ok">Pago</span>' : t.status === 'estornado' ? '<span class="chip chip-info">Estornado</span>' : '<span class="chip chip-warn">Pendente</span>'}</td><td class="num">${brl(t.amount)}</td><td class="num">${brl(f)}</td><td class="num">${t.status === 'pago' ? brl(t.amount - f) : '—'}</td></tr>`; }).join('')}</tbody></table></div>
      </section>`;
  };
  $('#rp-period').onchange = (e) => { period = e.target.value; $('#rp-from-w').hidden = $('#rp-to-w').hidden = period !== 'custom'; if (period === 'custom' && !from) { const [x, y] = [new Date(Date.now() - 30 * 864e5), new Date()]; from = isoDate(x); to = isoDate(y); $('#rp-from').value = from; $('#rp-to').value = to; } draw(); };
  $('#rp-from').onchange = (e) => { from = e.target.value; draw(); };
  $('#rp-to').onchange = (e) => { to = e.target.value; draw(); };
  $('#print').onclick = () => window.print();
  $('#csv').onclick = () => {
    const n = (v) => v.toFixed(2).replace('.', ',');
    const lines = [['Data', 'Paciente', 'Profissional', 'Especialidade', 'Forma', 'Parcelas', 'Situação', 'Valor bruto', 'Taxa', 'Valor líquido'].join(';')];
    rows.forEach((t) => { const f = t.status === 'pago' ? t.amount * FEE(t) : 0; const d = doc(t.doctorId); lines.push([fmtDT(t.at), t.patient, d.name, d.spec, t.method, t.installments, t.status, n(t.amount), n(f), n(t.status === 'pago' ? t.amount - f : 0)].map((x) => `"${String(x).replace(/"/g, '""')}"`).join(';')); });
    const url = URL.createObjectURL(new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    const l = document.createElement('a'); l.href = url; l.download = `relatorio-contabil-${isoDate(new Date())}.csv`; l.click(); setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast('CSV gerado (abre no Excel ou no sistema contábil).');
  };
  draw();
}

/* ============ PERFIL / MAIS (lembretes, app, dados) ============ */
function viewMore(el) {
  const p = state.profile; const r = state.prefs.reminders;
  const perm = 'Notification' in window ? Notification.permission : 'unsupported';
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  el.innerHTML = `
    ${pageHead('Perfil e configurações')}
    <div class="grid-2">
      <form class="card stack" id="pf">
        <h2>Seus dados</h2>
        <div class="field"><label for="pf-name">Nome</label><input class="input" id="pf-name" value="${esc(p.name)}" autocomplete="name"></div>
        <div class="field"><label for="pf-phone">Celular</label><input class="input" id="pf-phone" value="${esc(p.phone)}" inputmode="tel" autocomplete="tel"></div>
        <div class="field"><label for="pf-email">E-mail</label><input class="input" id="pf-email" type="email" value="${esc(p.email)}" autocomplete="email"></div>
        <button class="btn btn-primary">${icon('check')} Salvar</button>
      </form>
      <section class="card stack" id="lembretes" tabindex="-1" aria-labelledby="lb-t">
        <h2 id="lb-t">${icon('bell')} Lembretes automáticos</h2>
        <p class="hint">Avisamos você antes de cada consulta, mesmo com o app fechado (com notificações ativas).</p>
        ${[[1440, '24 horas antes'], [120, '2 horas antes'], [30, '30 minutos antes']].map(([k, l]) => `<label class="check"><input type="checkbox" data-rem="${k}" ${r[k] ? 'checked' : ''}> ${l}</label>`).join('')}
        <div class="notice ${perm === 'granted' ? '' : 'warn'}">${icon(perm === 'granted' ? 'check' : 'alert')}<p>${perm === 'granted' ? 'Notificações do aparelho ativadas.' : perm === 'denied' ? 'Notificações bloqueadas no navegador. Você ainda verá os lembretes dentro do app.' : perm === 'unsupported' ? 'Este navegador não suporta notificações. Lembretes aparecem dentro do app.' : 'Ative as notificações para receber lembretes com o app fechado.'}</p></div>
        <div class="row">
          ${perm === 'default' ? `<button type="button" class="btn btn-primary" id="perm">${icon('bell')} Ativar notificações</button>` : ''}
          <button type="button" class="btn btn-ghost" id="test-rem">${icon('bell')} Testar lembrete</button>
        </div>
        <p class="hint">Lembretes por SMS e e-mail: próxima onda.</p>
      </section>
    </div>
    <section class="card" style="margin-top:14px">
      <h2 style="margin-bottom:6px">Mais</h2>
      <ul class="menu-list" role="list">
        <li><a href="#/relatorio"><span class="q-ico">${icon('chart')}</span><span>Relatório contábil<small>Visão da gestão da clínica</small></span><span class="chev">${icon('chev')}</span></a></li>
        <li><a href="#/proximas-ondas"><span class="q-ico blue">${icon('rocket')}</span><span>Próximas ondas do MVP<small>O que vem por aí</small></span><span class="chev">${icon('chev')}</span></a></li>
        <li><button type="button" id="open-a11y"><span class="q-ico green">${icon('a11y')}</span><span>Acessibilidade<small>Texto maior, contraste, Libras, leitor de voz</small></span><span class="chev">${icon('chev')}</span></button></li>
        <li><button type="button" id="install2" ${standalone ? 'disabled' : ''}><span class="q-ico amber">${icon('download')}</span><span>${standalone ? 'App instalado' : 'Instalar o app'}<small>${standalone ? 'Você está usando a versão instalada' : 'Funciona offline e abre como app'}</small></span><span class="chev">${icon('chev')}</span></button></li>
        <li><button type="button" id="reset"><span class="q-ico">${icon('refresh')}</span><span>Restaurar dados de demonstração<small>Volta o protótipo ao estado inicial</small></span><span class="chev">${icon('chev')}</span></button></li>
      </ul>
    </section>
    <p class="hint" style="margin-top:16px;text-align:center">MeuMed · protótipo de alta fidelidade · Onda 1 do MVP · ${esc(CLINIC.name)}</p>`;

  $('#pf').onsubmit = (e) => { e.preventDefault(); Object.assign(state.profile, { name: $('#pf-name').value.trim() || p.name, phone: $('#pf-phone').value.trim(), email: $('#pf-email').value.trim() }); save(); toast('Dados salvos.'); };
  el.addEventListener('change', (e) => { const c = e.target.closest('[data-rem]'); if (c) { state.prefs.reminders[c.dataset.rem] = c.checked; save(); toast('Preferência de lembrete salva.', { ico: 'bell' }); } });
  el.addEventListener('click', async (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.id === 'perm') { const res = await Notification.requestPermission(); toast(res === 'granted' ? 'Notificações ativadas!' : 'Notificações não permitidas.', { ico: 'bell' }); render(); }
    if (b.id === 'test-rem') { const n = upcoming()[0]; notify('Lembrete de consulta', n ? `${doc(n.doctorId).name}, ${fmtDay(n.date)} às ${n.time}. ${n.mode === 'tele' ? 'Entre na sala 10 min antes.' : 'Faça o check-in online.'}` : 'Exemplo de lembrete automático do MeuMed.', n ? `#/consulta/${n.id}` : '#/inicio'); }
    if (b.id === 'open-a11y') $('#a11y-open').click();
    if (b.id === 'install2') installApp();
    if (b.id === 'reset') { if (confirm('Restaurar os dados de demonstração? Suas alterações neste protótipo serão perdidas.')) { state = seed(); save(); await idb.clear().catch(() => {}); liveTaken.clear(); toast('Dados de demonstração restaurados.'); go('#/inicio'); } }
  });
}

/* ============ PRÓXIMAS ONDAS ============ */
function viewRoadmap(el) {
  const w1 = ['Lembrete automático de consulta', 'Agendar pela agenda do médico em tempo real', 'Remarcar ou cancelar com 1 clique', 'Teleconsulta por vídeo dentro do app', 'Pagamento com Pix e cartão no app', 'Enviar fotos e exames antes da consulta', 'Check-in online antes da consulta presencial', 'Chat interno e externo com IA', 'Geração de relatório contábil'];
  const backlog = ['Fila de espera: avisar quando abrir horário', 'Mostrar tempo estimado de espera no consultório', 'Gravar e transcrever a consulta', 'Emitir recibo para reembolso', 'Validar carteirinha do convênio antes da consulta', 'Entrega digital de exames, requisições e receitas', 'Orientações pré e pós-cirurgia por texto e vídeo', 'Notificação de atraso ou mudança de agenda', 'Solicitar autorização de cirurgias ao convênio', 'Lembretes por SMS e e-mail'];
  el.innerHTML = `
    ${pageHead('Evolução do MVP', 'Sequenciado na Lean Inception. A Onda 1 está neste protótipo; as próximas serão detalhadas com o time.')}
    <section class="card wave-card"><h2><span class="chip chip-ok">${icon('check', 14)} Entregue</span> Onda 1 · MVP</h2>
      <ul class="feat-list">${w1.map((f) => `<li>${icon('check')}<span>${f}</span></li>`).join('')}</ul></section>
    <section class="card wave-card"><h2><span class="chip">${icon('clock', 14)} A definir</span> Ondas 2 e 3</h2>
      <p class="hint" style="margin-bottom:12px">Itens candidatos do brainstorming. Prioridade, esforço e valor serão revisados na próxima fase.</p>
      <ul class="feat-list todo">${backlog.map((f) => `<li>${icon('clock')}<span>${f}</span></li>`).join('')}</ul></section>`;
}

/* ============ lembretes automáticos ============ */
let swReg = null;
function notify(title, body, url) {
  toast(`${title}: ${body}`, { ico: 'bell', timeout: 8000, action: url ? { label: 'Ver', fn: () => go(url) } : null });
  state.notices.unshift({ title, body, url, at: Date.now() }); state.notices = state.notices.slice(0, 20); save(); updateBadge();
  if ('Notification' in window && Notification.permission === 'granted') {
    const opts = { body, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: url || title, data: { url: './' + (url || '#/inicio') } };
    if (swReg) swReg.showNotification(title, opts).catch(() => {}); else try { new Notification(title, opts); } catch { /* noop */ }
  }
}
function checkReminders() {
  const now = Date.now(); let changed = false;
  for (const a of upcoming()) {
    const t = dateOf(a).getTime();
    for (const [w, on] of Object.entries(state.prefs.reminders)) {
      const win = Number(w);
      if (!on || a.reminded.includes(win)) continue;
      if (now >= t - win * 60e3 && now < t) {
        a.reminded.push(win); changed = true;
        const d = doc(a.doctorId); const lbl = win >= 1440 ? 'amanhã' : win >= 120 ? 'em 2 horas' : 'em 30 minutos';
        notify(`Sua consulta é ${lbl}`, `${d.name}, ${a.time}. ${a.mode === 'tele' ? 'Teleconsulta no app.' : a.checkin ? 'Check-in feito.' : 'Faça o check-in online.'}${a.payment.status !== 'pago' ? ' Pagamento pendente.' : ''}`, `#/consulta/${a.id}`);
      }
    }
  }
  if (changed) save();
}
function updateBadge() {
  const n = upcoming().filter((a) => a.payment.status !== 'pago' || (a.mode === 'presencial' && !a.checkin && checkinWindow(a).open)).length;
  const b = $('#bell-badge'); b.hidden = !n; b.textContent = n;
  $('#bell').setAttribute('aria-label', n ? `Lembretes, ${n} pendência(s)` : 'Lembretes');
}

/* ============ PWA: instalação, offline, service worker ============ */
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; $('#install-btn').hidden = false; });
window.addEventListener('appinstalled', () => { $('#install-btn').hidden = true; toast('App instalado! Procure o ícone MeuMed.'); });
async function installApp() {
  if (deferredPrompt) { deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; $('#install-btn').hidden = true; return; }
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  toast(ios ? 'No iPhone: toque em Compartilhar e depois em "Adicionar à Tela de Início".' : 'Use o menu do navegador e escolha "Instalar app" ou "Adicionar à tela inicial".', { ico: 'download', timeout: 8000 });
}
function netStatus() { const c = $('#net-chip'); const on = navigator.onLine; c.textContent = on ? 'Online' : 'Offline'; c.classList.toggle('off', !on); }

/* ============ inicialização ============ */
function init() {
  hydrateIcons();
  applyA11y(); setupA11yPanel();
  $('#install-btn').onclick = installApp;
  window.addEventListener('online', () => { netStatus(); toast('Conexão restabelecida.'); });
  window.addEventListener('offline', () => { netStatus(); toast('Você está offline. O app continua funcionando.', { ico: 'info' }); });
  netStatus();
  window.addEventListener('hashchange', render);
  if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => {};
  render();
  checkReminders(); setInterval(checkReminders, 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) checkReminders(); });
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').then((r) => { swReg = r; }).catch(() => {});
  }
}
init();

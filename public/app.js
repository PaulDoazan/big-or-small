import { CATEGORIES, OBJECTS, OBJECTS_BY_ID, RATIO_MIN, RATIO_MAX, scoreGuess, valueAt } from './objects.js';

/* global io */
const $ = (id) => document.getElementById(id);
const SVGNS = 'http://www.w3.org/2000/svg';
const TRUTH = '#18a957';
const REF_COLOR = '#1d1b2f';

/* ---------------- identity ---------------- */
function storage(kind) {
  try {
    const s = window[kind];
    s.setItem('__t', '1');
    s.removeItem('__t');
    return s;
  } catch {
    return null;
  }
}
const local = storage('localStorage');
const session = storage('sessionStorage');
function randomId() {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
}
// One id per tab, so two tabs on one machine are two players (handy to test).
const playerId = session?.getItem('bos:id') ?? randomId();
session?.setItem('bos:id', playerId);

/* ---------------- object measurements ---------------- */
// Each drawing is measured once; its bounding box becomes its viewBox, so the
// bottom of the box sits on the ground and its height maps to the real height.
const BOX = {};
function measureAll() {
  const host = $('measure');
  for (const o of OBJECTS) {
    if (o.src) {
      BOX[o.id] = { aspect: o.aspect };
      continue;
    }
    const g = document.createElementNS(SVGNS, 'g');
    g.innerHTML = o.svg;
    host.appendChild(g);
    const b = g.getBBox();
    BOX[o.id] = { x: b.x, y: b.y, w: b.width, h: b.height, aspect: b.width / b.height };
    host.removeChild(g);
  }
}

/** Loads images into the cache: the round's pair right away, the rest when the page is idle. */
const PRELOADED = new Set();
function preload(obj) {
  if (!obj?.src || PRELOADED.has(obj.id)) return;
  PRELOADED.add(obj.id);
  new Image().src = `/${obj.src}`;
}
function preloadAllWhenIdle() {
  const queue = OBJECTS.filter((o) => o.src);
  const idle = window.requestIdleCallback ?? ((cb) => setTimeout(cb, 200));
  const step = () => {
    for (let i = 0; i < 8 && queue.length; i++) preload(queue.shift());
    if (queue.length) idle(step);
  };
  setTimeout(() => idle(step), 2500);
}

/**
 * Image silhouettes come in any colours; this filter repaints every opaque pixel
 * in one colour, so they look like the inline drawings. One filter per colour,
 * kept in the hidden #measure svg and shared by every scene on the page.
 */
const TINTS = new Set();
function tint(color) {
  const id = `tint-${color.replace(/[^a-z0-9]/gi, '')}`;
  if (!TINTS.has(id)) {
    TINTS.add(id);
    const f = document.createElementNS(SVGNS, 'filter');
    f.id = id;
    f.setAttribute('color-interpolation-filters', 'sRGB');
    f.innerHTML = `<feFlood flood-color="${color}"/><feComposite in2="SourceAlpha" operator="in"/>`;
    $('measure').appendChild(f);
  }
  return id;
}

/* ---------------- formatting ---------------- */
const NUM = new Intl.NumberFormat('fr-FR');
const round3 = (v) => {
  if (v <= 0) return 0;
  const p = 10 ** (Math.floor(Math.log10(v)) - 2);
  return Math.round(v / p) * p;
};
function fmtLen(m) {
  if (m >= 10000) return `${NUM.format(Math.round(round3(m) / 1000))} km`;
  if (m >= 1000) return `${(m / 1000).toFixed(1).replace('.', ',')} km`;
  if (m >= 100) return `${Math.round(m)} m`;
  if (m >= 10) return `${m.toFixed(1).replace('.', ',')} m`;
  if (m >= 1) return `${m.toFixed(2).replace('.', ',')} m`;
  if (m >= 0.1) return `${Math.round(m * 100)} cm`;
  if (m >= 0.01) return `${(m * 100).toFixed(1).replace('.', ',')} cm`;
  return `${(m * 1000).toFixed(1).replace('.', ',')} mm`;
}
/** The quantity the player reasons about (height, length or area), formatted with its unit. */
function fmtValue(obj, hMeters) {
  const v = valueAt(obj, hMeters);
  const txt = obj.dim === 'a' ? `${NUM.format(round3(v))} km²` : fmtLen(v);
  return obj.label ? `${txt} ${obj.label}` : txt;
}
/** Error in the measured quantity (area for countries, so it matches the figures shown). */
function errOf(obj, hGuess, hTrue) {
  return fmtErr(valueAt(obj, hGuess), valueAt(obj, hTrue));
}
function fmtErr(guess, truth) {
  const pct = (guess / truth - 1) * 100;
  if (Math.abs(pct) < 0.5) return 'pile-poil';
  return `${pct > 0 ? '+' : '−'}${Math.abs(pct) >= 100 ? Math.round(Math.abs(pct)) : Math.abs(pct).toFixed(0)} %`;
}
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const initials = (name) => esc(name.trim().slice(0, 1).toUpperCase() || '?');
// French articles: lower-case them inside a sentence, keep proper names as they are.
const ARTICLE = /^(Un|Une|Le|La|Les|L’)\b|^L’/;
const lc = (name) => (ARTICLE.test(name) ? name.charAt(0).toLowerCase() + name.slice(1) : name);
/** "de" + name, with the French contractions: du, des, de la, de l’, d’un, d’… */
function deName(name) {
  if (name.startsWith('Le ')) return `du ${name.slice(3)}`;
  if (name.startsWith('Les ')) return `des ${name.slice(4)}`;
  if (name.startsWith('La ')) return `de la ${name.slice(3)}`;
  if (name.startsWith('L’')) return `de l’${name.slice(2)}`;
  if (/^Une? /.test(name)) return `d’${lc(name)}`;
  if (/^[AEIOUYÉÈÊÂÎÔaeiouyéèêâîô]/.test(name)) return `d’${name}`;
  return `de ${name}`;
}
const catName = (id) => CATEGORIES.find((c) => c.id === id)?.name ?? 'Toutes catégories';

/* ---------------- scene rendering ---------------- */
function niceStep(raw) {
  const p = 10 ** Math.floor(Math.log10(raw));
  for (const m of [1, 2, 5, 10]) if (m * p >= raw) return m * p;
  return 10 * p;
}

/**
 * Draws two slots on a ground line: slot 0 holds the reference, slot 1 holds one
 * or more layers of the target (guess, truth). Zooms so everything fits.
 * layers: [{ obj, h (metres), color, opacity, label? }]
 */
function drawScene(svg, { ref, layers, grid = true, truthLine = null, handle = false, compact = false }) {
  const W = svg.clientWidth || 600;
  const H = svg.clientHeight || 300;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const ground = H - (compact ? 14 : 34);
  const top = compact ? 12 : 46;
  const gap = compact ? 14 : Math.max(24, W * 0.06);

  const refW = ref.h * BOX[ref.obj.id].aspect;
  const tgtW = Math.max(...layers.map((l) => l.h * BOX[l.obj.id].aspect));
  const maxH = Math.max(ref.h, ...layers.map((l) => l.h), truthLine ?? 0);
  const scale = Math.min((ground - top) / maxH, (W - gap * 3) / (refW + tgtW));
  const refX = (W - (refW + tgtW) * scale - gap) / 2;
  const tgtX = refX + refW * scale + gap;

  let out = '';
  if (grid) {
    const step = niceStep((compact ? 34 : 56) / scale);
    for (let v = step, i = 0; ground - v * scale > 4 && i < 60; v += step, i++) {
      const y = ground - v * scale;
      out += `<line x1="0" x2="${W}" y1="${y}" y2="${y}" style="stroke:var(--grid)" stroke-width="1"/>`;
      if (!compact) out += `<text x="8" y="${y - 5}" style="fill:var(--grid-text);font-family:var(--mono)" font-size="11">${fmtLen(v)}</text>`;
    }
  }
  // Countries float on the map: no ground line, only the scale grid.
  if (ref.obj.cat !== 'pays') out += `<line x1="0" x2="${W}" y1="${ground}" y2="${ground}" style="stroke:var(--ink)" stroke-width="2"/>`;

  const place = (obj, h, x, color, opacity = 1) => {
    const b = BOX[obj.id];
    const ph = h * scale;
    const pw = ph * b.aspect;
    if (obj.src) {
      return `<image href="/${obj.src}" x="${x}" y="${ground - ph}" width="${pw}" height="${ph}" preserveAspectRatio="none" filter="url(#${tint(color)})" opacity="${opacity}"/>`;
    }
    return `<svg x="${x}" y="${ground - ph}" width="${pw}" height="${ph}" viewBox="${b.x} ${b.y} ${b.w} ${b.h}" overflow="visible" preserveAspectRatio="none"><g fill="${color}" color="${color}" opacity="${opacity}">${obj.svg}</g></svg>`;
  };

  out += place(ref.obj, ref.h, refX, ref.color ?? REF_COLOR);
  for (const l of layers) out += place(l.obj, l.h, tgtX, l.color, l.opacity ?? 1);

  if (truthLine != null) {
    const y = ground - truthLine * scale;
    const x1 = tgtX - 8;
    const x2 = tgtX + tgtW * scale + 8;
    out += `<line x1="${x1}" x2="${x2}" y1="${y}" y2="${y}" stroke="${TRUTH}" stroke-width="2" stroke-dasharray="5 4"/>`;
  }

  if (!compact) {
    const refLabelY = ground + 22;
    out += `<text x="${refX + (refW * scale) / 2}" y="${refLabelY}" text-anchor="middle" style="fill:var(--ink-2);font-family:var(--mono)" font-size="12">${esc(fmtValue(ref.obj, ref.h))}</text>`;
  }

  if (handle) {
    const h = layers[0].h * scale;
    const cx = tgtX + (layers[0].h * BOX[layers[0].obj.id].aspect * scale) / 2;
    const y = Math.max(top - 18, ground - h - 26);
    // Round badge with a diagonal double arrow: the resize scales both width and height.
    out += `<g transform="translate(${cx} ${y})"><circle r="16" style="fill:var(--accent)"/><path transform="rotate(45)" d="M0 -8 L0 8 M-4.5 -3.5 L0 -8 L4.5 -3.5 M-4.5 3.5 L0 8 L4.5 3.5" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  }
  svg.innerHTML = out;
}

/* ---------------- UI helpers ---------------- */
const SCREENS = ['home', 'lobby', 'game', 'reveal', 'final'];
function show(name) {
  for (const s of SCREENS) $(`screen-${s}`).hidden = s !== name;
  $('topbar-room').hidden = name === 'home';
}
let toastTimer;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}
const avatar = (p, extra = '') => `<span class="avatar ${extra}" style="background:${p.color}" title="${esc(p.name)}">${initials(p.name)}</span>`;
const inviteLink = (code) => `${location.origin}/?code=${code}`;
async function copy(text, msg) {
  try {
    await navigator.clipboard.writeText(text);
    toast(msg);
  } catch {
    prompt('Copie ce lien :', text);
  }
}

/* ---------------- state ---------------- */
const socket = io({ transports: ['websocket', 'polling'] });
let state = null;
let clockOffset = 0; // serverNow - clientNow
let myCode = null;

// Round-local
let ratio = 1;
let locked = false;
let currentRoundKey = null;
let lastSent = 0;
let sendTimer = null;

const me = () => state?.players.find((p) => p.id === playerId);
const isHost = () => state?.hostId === playerId;

function rejoin() {
  const code = myCode ?? session?.getItem('bos:code');
  const name = local?.getItem('bos:name');
  if (!code || !name) return;
  socket.emit('join', { playerId, name, code }, (res) => {
    if (res?.error) {
      session?.removeItem('bos:code');
      myCode = null;
      state = null;
      show('home');
    }
  });
}
socket.on('connect', rejoin);

socket.on('state', (s) => {
  clockOffset = s.serverNow - Date.now();
  state = s;
  myCode = s.code;
  session?.setItem('bos:code', s.code);
  history.replaceState(null, '', `/?code=${s.code}`);
  render();
});

function enterRoom(event, payload) {
  const name = $('input-name').value.trim();
  if (!name) {
    $('home-error').textContent = 'Choisis un pseudo.';
    $('input-name').focus();
    return;
  }
  local?.setItem('bos:name', name);
  $('home-error').textContent = '';
  socket.emit(event, { playerId, name, ...payload }, (res) => {
    if (res?.error) $('home-error').textContent = res.error;
  });
}

/* ---------------- render ---------------- */
function render() {
  if (!state) return show('home');
  $('topbar-code').textContent = state.code;
  if (state.phase === 'lobby') renderLobby();
  else if (state.phase === 'playing') renderGame();
  else if (state.phase === 'reveal') renderReveal();
  else if (state.phase === 'final') renderFinal();
}

function renderLobby() {
  show('lobby');
  $('btn-copy-code').textContent = state.code;
  const connected = state.players.filter((p) => p.connected);
  $('lobby-count').textContent = `${connected.length}`;
  $('lobby-players').innerHTML = state.players
    .map(
      (p) =>
        `<li class="${p.connected ? '' : 'off'}">${avatar(p)}${esc(p.name)}${p.id === state.hostId ? ' <span class="tag">hôte</span>' : ''}${p.id === playerId ? ' <span class="tag">toi</span>' : ''}</li>`,
    )
    .join('');
  const host = isHost();
  $('set-category').value = state.settings.category ?? 'all';
  $('set-category').disabled = !host;
  $('set-rounds').value = String(state.settings.rounds);
  $('set-timer').value = String(state.settings.timer);
  $('set-rounds').disabled = !host;
  $('set-timer').disabled = !host;
  $('btn-start').hidden = !host;
  $('lobby-wait').hidden = host;
  $('lobby-wait').textContent = connected.length < 2 && host ? '' : 'En attente de l’hôte…';
  if (host && connected.length < 2) {
    $('lobby-wait').hidden = false;
    $('lobby-wait').textContent = 'Tu peux jouer seul, ou attendre tes amis.';
  }
}

function sliderFromRatio(r) {
  return Math.round(((Math.log(r) - Math.log(RATIO_MIN)) / (Math.log(RATIO_MAX) - Math.log(RATIO_MIN))) * 1000);
}
function ratioFromSlider(v) {
  return Math.exp(Math.log(RATIO_MIN) + (v / 1000) * (Math.log(RATIO_MAX) - Math.log(RATIO_MIN)));
}

function renderGame() {
  show('game');
  const r = state.round;
  const key = `${state.code}:${r.index}:${r.deadline}`;
  if (key !== currentRoundKey) {
    currentRoundKey = key;
    ratio = 1;
    locked = r.locked.includes(playerId);
    $('stage-hint').style.opacity = '1';
  }
  locked = locked || r.locked.includes(playerId);
  const ref = OBJECTS_BY_ID[r.refId];
  const tgt = OBJECTS_BY_ID[r.tgtId];
  preload(ref);
  preload(tgt);
  $('round-label').textContent = `Manche ${r.index + 1}/${r.total} · ${catName(tgt.cat)}`;
  $('prompt').innerHTML = `Mets <b class="tgt">${esc(lc(tgt.name))}</b> à l’échelle <b>${esc(deName(ref.name))}</b>`;
  $('lockdots').innerHTML = state.players
    .filter((p) => p.connected)
    .map((p) => `<li class="avatar ${r.locked.includes(p.id) ? 'done' : ''}" style="background:${p.color}" title="${esc(p.name)}">${initials(p.name)}</li>`)
    .join('');
  updateGameView();
}

function updateGameView() {
  if (state?.phase !== 'playing') return;
  const r = state.round;
  const ref = OBJECTS_BY_ID[r.refId];
  const tgt = OBJECTS_BY_ID[r.tgtId];
  const color = me()?.color ?? '#ff5a36';
  drawScene($('stage'), {
    ref: { obj: ref, h: ref.h },
    layers: [{ obj: tgt, h: ratio * ref.h, color }],
    handle: !locked,
  });
  $('stage').classList.toggle('locked', locked);
  $('slider').value = String(sliderFromRatio(ratio));
  $('readout').textContent = fmtValue(tgt, ratio * ref.h);
  for (const id of ['slider', 'btn-minus', 'btn-plus', 'btn-lock']) $(id).disabled = locked;
  $('btn-lock').textContent = locked ? 'Validé ✓' : 'Valider';
}

function setRatio(next) {
  if (locked || state?.phase !== 'playing') return;
  ratio = Math.min(RATIO_MAX, Math.max(RATIO_MIN, next));
  $('stage-hint').style.opacity = '0';
  updateGameView();
  // Throttled live updates: if the timer runs out, the last position counts.
  const now = Date.now();
  clearTimeout(sendTimer);
  if (now - lastSent > 200) {
    lastSent = now;
    socket.emit('guess', { ratio });
  } else {
    sendTimer = setTimeout(() => {
      lastSent = Date.now();
      socket.emit('guess', { ratio });
    }, 200);
  }
}

function lock() {
  if (locked || state?.phase !== 'playing') return;
  locked = true;
  clearTimeout(sendTimer);
  socket.emit('lock', { ratio }, (verdict) => verdict && showVerdict(verdict));
  updateGameView();
}

/* ---------------- verdict: 4 s full screen after locking ---------------- */
const VERDICT_MS = 4000;
let verdictTimer = null;
let verdictRaf = null;

function verdictLabel(points) {
  if (points >= 95) return 'Pile-poil !';
  if (points >= 80) return 'Excellent';
  if (points >= 60) return 'Bien vu';
  if (points >= 35) return 'Pas loin';
  return 'Raté…';
}

function showVerdict({ refId, tgtId, ratio: r, trueRatio, points }) {
  const ref = OBJECTS_BY_ID[refId];
  const tgt = OBJECTS_BY_ID[tgtId];
  const color = me()?.color ?? '#ff5a36';
  const el = $('verdict');
  $('verdict-title').innerHTML = `${esc(tgt.name)}&nbsp;: <b>${esc(fmtValue(tgt, trueRatio * ref.h))}</b>`;
  $('verdict-guess').innerHTML = `Ta réponse : <b style="color:${color}">${esc(fmtValue(tgt, r * ref.h))}</b> <span class="mono">(${esc(errOf(tgt, r * ref.h, trueRatio * ref.h))})</span>`;
  $('verdict-label').textContent = verdictLabel(points);
  $('verdict-score').textContent = '0';
  el.style.setProperty('--player', color);
  el.hidden = false;
  el.classList.remove('run');
  void el.offsetWidth; // restart the CSS countdown bar
  el.classList.add('run');
  drawScene($('verdict-scene'), {
    ref: { obj: ref, h: ref.h },
    layers: [
      { obj: tgt, h: r * ref.h, color, opacity: 0.85 },
      { obj: tgt, h: trueRatio * ref.h, color: TRUTH, opacity: 0.55 },
    ],
    truthLine: trueRatio * ref.h,
  });

  // Count from 0 up to the score, easing out.
  cancelAnimationFrame(verdictRaf);
  const start = performance.now() + 350;
  const dur = 1600;
  const step = (now) => {
    const t = Math.min(1, Math.max(0, (now - start) / dur));
    const eased = 1 - (1 - t) ** 3;
    $('verdict-score').textContent = String(Math.round(points * eased));
    if (t < 1) verdictRaf = requestAnimationFrame(step);
    else $('verdict-label').classList.add('show');
  };
  $('verdict-label').classList.remove('show');
  verdictRaf = requestAnimationFrame(step);

  clearTimeout(verdictTimer);
  verdictTimer = setTimeout(() => {
    el.hidden = true;
    el.classList.remove('run');
  }, VERDICT_MS);
}

function tick() {
  if (state?.phase === 'playing') {
    const total = state.settings.timer * 1000;
    const left = Math.max(0, state.round.deadline - (Date.now() + clockOffset));
    $('timer-fill').style.transform = `scaleX(${left / total})`;
    $('timer-text').textContent = `${Math.ceil(left / 1000)} s`;
    $('timer').classList.toggle('hurry', left < 5000);
  }
  requestAnimationFrame(tick);
}

function renderReveal() {
  show('reveal');
  const last = state.history[state.history.length - 1];
  const ref = OBJECTS_BY_ID[last.refId];
  const tgt = OBJECTS_BY_ID[last.tgtId];
  const truthH = last.trueRatio * ref.h;
  $('reveal-round').textContent = `Manche ${state.round.index + 1}/${state.round.total} · ${catName(tgt.cat)}`;
  $('reveal-title').innerHTML = `${esc(tgt.name)}&nbsp;: <b>${esc(fmtValue(tgt, truthH))}</b>`;

  const ranked = [...state.players].sort((a, b) => (last.results[b.id]?.points ?? 0) - (last.results[a.id]?.points ?? 0));
  const best = last.results[ranked[0]?.id]?.points ?? 0;
  const minis = $('minis');
  minis.innerHTML = ranked
    .map((p, i) => {
      const res = last.results[p.id];
      const err = res?.ratio ? errOf(tgt, res.ratio * ref.h, truthH) : 'pas de réponse';
      return `<div class="mini ${res?.points === best && best > 0 ? 'best' : ''}" style="animation-delay:${i * 70}ms"><svg data-pid="${p.id}"></svg><div class="mini-foot">${avatar(p)}<span class="mini-name">${esc(p.name)}<br><span class="mini-err">${esc(err)}</span></span><span class="mini-pts">+${res?.points ?? 0}</span></div></div>`;
    })
    .join('');
  // Miniatures: the player's guess over the true size (green), next to the reference.
  for (const svg of minis.querySelectorAll('svg[data-pid]')) {
    const p = state.players.find((q) => q.id === svg.dataset.pid);
    const res = last.results[p.id];
    const layers = [];
    if (res?.ratio) layers.push({ obj: tgt, h: res.ratio * ref.h, color: p.color, opacity: 0.8 });
    layers.push({ obj: tgt, h: truthH, color: TRUTH, opacity: 0.55 });
    drawScene(svg, { ref: { obj: ref, h: ref.h }, layers, truthLine: truthH, compact: true });
  }

  renderLeaderboard($('leaderboard'), last);
  const host = isHost();
  const lastRound = state.round.index + 1 >= state.round.total;
  $('btn-next').hidden = !host;
  $('btn-next').textContent = lastRound ? 'Voir le classement final' : 'Manche suivante';
  $('reveal-wait').hidden = host;
}

function renderLeaderboard(el, last) {
  const players = [...state.players].sort((a, b) => b.score - a.score);
  el.innerHTML = players
    .map(
      (p, i) =>
        `<li><span class="rank">${i + 1}</span>${avatar(p)}<span class="nm">${esc(p.name)}</span>${last ? `<span class="delta">+${last.results[p.id]?.points ?? 0}</span>` : ''}<span class="sc">${p.score}</span></li>`,
    )
    .join('');
}

function renderFinal() {
  show('final');
  const players = [...state.players].sort((a, b) => b.score - a.score);
  const order = [1, 0, 2].filter((i) => players[i]);
  $('podium').innerHTML = order
    .map((i) => {
      const p = players[i];
      return `<div class="step p${i + 1}"><span class="who">${esc(p.name)}</span><span class="pts">${p.score} pts</span><div class="block" style="background:${p.color}">${i + 1}</div></div>`;
    })
    .join('');
  const head = `<tr><th>Joueur</th>${state.history.map((h, i) => `<th title="${esc(OBJECTS_BY_ID[h.tgtId].name)} vs ${esc(OBJECTS_BY_ID[h.refId].name)}">M${i + 1}</th>`).join('')}<th>Total</th></tr>`;
  const rows = players
    .map((p) => `<tr><td>${avatar(p)} ${esc(p.name)}</td>${state.history.map((h) => `<td class="num">${h.results[p.id]?.points ?? '–'}</td>`).join('')}<td class="total">${p.score}</td></tr>`)
    .join('');
  $('recap').innerHTML = head + rows;
  const host = isHost();
  $('btn-replay').hidden = !host;
  $('btn-lobby').hidden = !host;
  $('final-wait').hidden = host;
}

/* ---------------- home demo ---------------- */
let demoT = 0;
function drawDemo() {
  const svg = $('demo-scene');
  if ($('screen-home').hidden) return;
  demoT += 0.012;
  const ref = OBJECTS_BY_ID.person;
  const tgt = OBJECTS_BY_ID.giraffe;
  const r = 1.4 + 1.6 * (0.5 + 0.5 * Math.sin(demoT));
  // The demo svg uses a fixed viewBox; give drawScene its logical size.
  Object.defineProperty(svg, 'clientWidth', { value: 600, configurable: true });
  Object.defineProperty(svg, 'clientHeight', { value: 220, configurable: true });
  drawScene(svg, { ref: { obj: ref, h: ref.h }, layers: [{ obj: tgt, h: r * ref.h, color: '#ff5a36' }], handle: true });
}
function demoLoop() {
  drawDemo();
  requestAnimationFrame(demoLoop);
}

/* ---------------- events ---------------- */
function bind() {
  $('form-home').addEventListener('submit', (e) => {
    e.preventDefault();
    enterRoom('create', {});
  });
  $('btn-join').addEventListener('click', () => {
    const code = $('input-code').value.trim().toUpperCase();
    if (code.length !== 4) {
      $('home-error').textContent = 'Le code fait 4 lettres.';
      return;
    }
    enterRoom('join', { code });
  });
  $('input-code').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      $('btn-join').click();
    }
  });
  $('btn-leave').addEventListener('click', () => {
    socket.emit('leave');
    session?.removeItem('bos:code');
    state = null;
    myCode = null;
    history.replaceState(null, '', '/');
    show('home');
  });
  $('btn-copy-code').addEventListener('click', () => copy(inviteLink(state.code), 'Lien d’invitation copié'));
  $('btn-copy-link').addEventListener('click', () => copy(inviteLink(state.code), 'Lien d’invitation copié'));
  $('set-category').addEventListener('change', (e) => socket.emit('settings', { category: e.target.value }));
  $('set-rounds').addEventListener('change', (e) => socket.emit('settings', { rounds: Number(e.target.value) }));
  $('set-timer').addEventListener('change', (e) => socket.emit('settings', { timer: Number(e.target.value) }));
  $('btn-start').addEventListener('click', () => socket.emit('start'));
  $('btn-next').addEventListener('click', () => socket.emit('next'));
  $('btn-replay').addEventListener('click', () => socket.emit('start'));
  $('btn-lobby').addEventListener('click', () => socket.emit('lobby'));

  $('slider').addEventListener('input', (e) => setRatio(ratioFromSlider(Number(e.target.value))));
  $('btn-minus').addEventListener('click', () => setRatio(ratio / 1.05));
  $('btn-plus').addEventListener('click', () => setRatio(ratio * 1.05));
  $('btn-lock').addEventListener('click', lock);

  // Drag anywhere on the stage: up = bigger. Relative, so it feels the same at any zoom.
  const stage = $('stage');
  let drag = null;
  stage.addEventListener('pointerdown', (e) => {
    if (locked) return;
    drag = { y: e.clientY, ratio };
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove', (e) => {
    if (!drag) return;
    setRatio(drag.ratio * Math.exp((drag.y - e.clientY) * 0.006));
  });
  const end = () => {
    drag = null;
  };
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', end);
  stage.addEventListener(
    'wheel',
    (e) => {
      if (locked) return;
      e.preventDefault();
      setRatio(ratio * Math.exp(-e.deltaY * 0.0015));
    },
    { passive: false },
  );
  document.addEventListener('keydown', (e) => {
    if (state?.phase !== 'playing' || locked || e.target.tagName === 'INPUT') return;
    const f = e.shiftKey ? 1.1 : 1.01;
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') setRatio(ratio * f);
    else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') setRatio(ratio / f);
    else if (e.key === 'Enter') lock();
    else return;
    e.preventDefault();
  });

  let resizeRaf;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      if (state?.phase === 'playing') updateGameView();
      if (state?.phase === 'reveal') renderReveal();
    });
  });
}

/* ---------------- boot ---------------- */
async function boot() {
  try {
    await document.fonts?.ready;
  } catch {
    /* fonts are cosmetic */
  }
  measureAll();
  $('set-category').innerHTML =
    `<option value="all">Toutes catégories (${OBJECTS.length})</option>` +
    CATEGORIES.map((c) => `<option value="${c.id}">${esc(c.name)} (${OBJECTS.filter((o) => o.cat === c.id).length})</option>`).join('');
  preloadAllWhenIdle();
  bind();
  $('input-name').value = local?.getItem('bos:name') ?? '';
  const code = new URLSearchParams(location.search).get('code');
  if (code) {
    $('input-code').value = code.toUpperCase();
    session?.getItem('bos:code') !== code.toUpperCase() && session?.removeItem('bos:code');
  }
  show('home');
  demoLoop();
  tick();
}
boot();

// Exposed for quick debugging in the console.
window.__bos = { scoreGuess, get state() { return state; } };

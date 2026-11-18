import { OBJECTS, OBJECTS_BY_ID, RATIO_MIN, RATIO_MAX, scoreGuess } from './objects.js';

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
    const g = document.createElementNS(SVGNS, 'g');
    g.innerHTML = o.svg;
    host.appendChild(g);
    const b = g.getBBox();
    BOX[o.id] = { x: b.x, y: b.y, w: b.width, h: b.height, aspect: b.width / b.height };
    host.removeChild(g);
  }
}

/* ---------------- formatting ---------------- */
function fmtLen(m) {
  if (m >= 100) return `${Math.round(m)} m`;
  if (m >= 10) return `${m.toFixed(1).replace('.', ',')} m`;
  if (m >= 1) return `${m.toFixed(2).replace('.', ',')} m`;
  if (m >= 0.1) return `${Math.round(m * 100)} cm`;
  return `${(m * 100).toFixed(1).replace('.', ',')} cm`;
}
function fmtErr(guess, truth) {
  const pct = (guess / truth - 1) * 100;
  if (Math.abs(pct) < 0.5) return 'pile-poil';
  return `${pct > 0 ? '+' : '−'}${Math.abs(pct) >= 100 ? Math.round(Math.abs(pct)) : Math.abs(pct).toFixed(0)} %`;
}
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const initials = (name) => esc(name.trim().slice(0, 1).toUpperCase() || '?');
const lc = (name) => name.charAt(0).toLowerCase() + name.slice(1);

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
  out += `<line x1="0" x2="${W}" y1="${ground}" y2="${ground}" style="stroke:var(--ink)" stroke-width="2"/>`;

  const place = (obj, h, x, color, opacity = 1) => {
    const b = BOX[obj.id];
    const ph = h * scale;
    const pw = ph * b.aspect;
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
    out += `<text x="${refX + (refW * scale) / 2}" y="${refLabelY}" text-anchor="middle" style="fill:var(--ink-2);font-family:var(--mono)" font-size="12">${esc(fmtLen(ref.h))}</text>`;
  }

  if (handle) {
    const h = layers[0].h * scale;
    const cx = tgtX + (layers[0].h * BOX[layers[0].obj.id].aspect * scale) / 2;
    const y = Math.max(top - 20, ground - h - 26);
    out += `<g transform="translate(${cx} ${y})"><rect x="-22" y="-12" width="44" height="24" rx="12" style="fill:var(--accent)"/><path d="M-6 -2 L0 -8 L6 -2 M-6 2 L0 8 L6 2" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`;
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
  $('round-label').textContent = `Manche ${r.index + 1}/${r.total}`;
  $('prompt').innerHTML = `Quelle taille fait <b class="tgt">${esc(lc(tgt.name))}</b> à côté ${ref.name.startsWith('La ') || ref.name.startsWith('Le ') ? 'de ' : 'd’'}<b>${esc(lc(ref.name))}</b>&nbsp;?`;
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
  $('readout').textContent = fmtLen(ratio * ref.h);
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
  socket.emit('lock', { ratio });
  updateGameView();
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
  $('reveal-round').textContent = `Manche ${state.round.index + 1}/${state.round.total}`;
  $('reveal-title').innerHTML = `${esc(tgt.name)} mesure <b>${esc(fmtLen(truthH))}</b>`;

  const ranked = [...state.players].sort((a, b) => (last.results[b.id]?.points ?? 0) - (last.results[a.id]?.points ?? 0));
  const best = last.results[ranked[0]?.id]?.points ?? 0;
  const minis = $('minis');
  minis.innerHTML = ranked
    .map((p, i) => {
      const res = last.results[p.id];
      const err = res?.ratio ? fmtErr(res.ratio, last.trueRatio) : 'pas de réponse';
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

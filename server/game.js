import { CATEGORIES, OBJECTS, OBJECTS_BY_ID, scoreGuess, RATIO_MIN, RATIO_MAX } from '../public/objects.js';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const COLORS = ['#ff5a36', '#2d7ff9', '#18a957', '#a64dff', '#f2a900', '#e83e8c', '#00a6a6', '#7a5c3e', '#5b6cff', '#c0392b', '#2c3e50', '#8bc34a'];
export const MAX_PLAYERS = 12;
const MAX_NAME = 16;

export function makeCode(existing) {
  for (;;) {
    let code = '';
    for (let i = 0; i < 4; i++) code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    if (!existing.has(code)) return code;
  }
}

export function cleanName(name) {
  const s = String(name ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX_NAME);
  return s || 'Anonyme';
}

const BY_CATEGORY = Object.fromEntries(CATEGORIES.map((c) => [c.id, OBJECTS.filter((o) => o.cat === c.id)]));
export const CATEGORY_IDS = new Set(['all', ...CATEGORIES.map((c) => c.id)]);

/**
 * Picks `n` rounds. Both objects of a round always come from the same category
 * (a country is never compared with a giraffe); with 'all', the categories are
 * dealt in shuffled cycles so a game visits each of them. The drawn heights stay
 * within a factor 12 of each other, and an object is reused only when its
 * category runs out.
 */
export function pickRounds(n, category = 'all', rand = Math.random) {
  const ids = category === 'all' ? CATEGORIES.map((c) => c.id) : [category];
  const deck = [];
  while (deck.length < n) {
    const cycle = [...ids];
    for (let i = cycle.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [cycle[i], cycle[j]] = [cycle[j], cycle[i]];
    }
    deck.push(...cycle);
  }
  const used = new Set();
  const pairs = new Set();
  const rounds = [];
  for (let i = 0; i < n; i++) {
    const pool = BY_CATEGORY[deck[i]];
    let pick = null;
    for (let t = 0; t < 6000 && !pick; t++) {
      const ref = pool[Math.floor(rand() * pool.length)];
      const tgt = pool[Math.floor(rand() * pool.length)];
      if (ref === tgt || pairs.has(`${ref.id}|${tgt.id}`)) continue;
      if (t < 3000 && (used.has(ref.id) || used.has(tgt.id))) continue;
      const r = tgt.h / ref.h;
      if (r < 1 / 12 || r > 12 || Math.abs(Math.log(r)) < 0.08) continue;
      pick = { refId: ref.id, tgtId: tgt.id };
    }
    if (!pick) throw new Error(`Not enough objects in category ${deck[i]}`);
    used.add(pick.refId);
    used.add(pick.tgtId);
    pairs.add(`${pick.refId}|${pick.tgtId}`);
    rounds.push(pick);
  }
  return rounds;
}

const clampRatio = (r) => Math.min(RATIO_MAX, Math.max(RATIO_MIN, Number(r)));

export class Room {
  constructor(code, onChange) {
    this.code = code;
    this.onChange = onChange;
    this.players = new Map(); // id -> player
    this.hostId = null;
    this.settings = { rounds: 5, timer: 30, category: 'all' };
    this.phase = 'lobby'; // lobby | playing | reveal | final
    this.rounds = [];
    this.roundIndex = -1;
    this.deadline = 0;
    this.guesses = new Map(); // playerId -> { ratio, locked }
    this.history = []; // per round: { refId, tgtId, trueRatio, results: { [playerId]: { ratio, points } } }
    this.timer = null;
    this.emptySince = null;
  }

  join(id, name) {
    let p = this.players.get(id);
    if (p) {
      p.name = cleanName(name ?? p.name);
      p.connected = true;
    } else {
      if (this.players.size >= MAX_PLAYERS) throw new Error('La partie est complète.');
      const usedColors = new Set([...this.players.values()].map((q) => q.color));
      const color = COLORS.find((c) => !usedColors.has(c)) ?? COLORS[this.players.size % COLORS.length];
      p = { id, name: cleanName(name), color, score: 0, connected: true };
      this.players.set(id, p);
    }
    if (!this.hostId || !this.players.get(this.hostId)?.connected) this.hostId = id;
    this.emptySince = null;
    this.changed();
    return p;
  }

  leave(id) {
    const p = this.players.get(id);
    if (!p) return;
    if (this.phase === 'lobby') this.players.delete(id);
    else p.connected = false;
    if (this.hostId === id) {
      const next = [...this.players.values()].find((q) => q.connected);
      this.hostId = next?.id ?? null;
    }
    if (![...this.players.values()].some((q) => q.connected)) this.emptySince = Date.now();
    if (this.phase === 'playing') this.maybeEndRound();
    this.changed();
  }

  isHost(id) {
    return this.hostId === id;
  }

  updateSettings(id, { rounds, timer, category }) {
    if (!this.isHost(id) || this.phase !== 'lobby') return;
    if (rounds !== undefined) this.settings.rounds = Math.min(10, Math.max(1, Math.round(Number(rounds) || 5)));
    if (category !== undefined && CATEGORY_IDS.has(category)) this.settings.category = category;
    if (timer !== undefined) this.settings.timer = Math.min(120, Math.max(10, Math.round(Number(timer) || 30)));
    this.changed();
  }

  start(id) {
    if (!this.isHost(id) || (this.phase !== 'lobby' && this.phase !== 'final')) return;
    for (const p of this.players.values()) p.score = 0;
    // Players who left during the previous game do not come back as ghosts.
    for (const [pid, p] of this.players) if (!p.connected) this.players.delete(pid);
    this.rounds = pickRounds(this.settings.rounds, this.settings.category);
    this.history = [];
    this.roundIndex = -1;
    this.startRound();
  }

  startRound() {
    this.roundIndex += 1;
    this.phase = 'playing';
    this.guesses = new Map();
    this.deadline = Date.now() + this.settings.timer * 1000;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.endRound(), this.settings.timer * 1000 + 300);
    this.changed();
  }

  guess(id, ratio, lock = false) {
    if (this.phase !== 'playing' || !this.players.has(id)) return null;
    const current = this.guesses.get(id);
    if (current?.locked) return null;
    const r = clampRatio(ratio);
    if (!Number.isFinite(r)) return null;
    this.guesses.set(id, { ratio: r, locked: Boolean(lock) });
    if (!lock) return null;
    // Once locked the answer cannot change, so the player may learn the truth right away.
    const { refId, tgtId } = this.rounds[this.roundIndex];
    const trueRatio = OBJECTS_BY_ID[tgtId].h / OBJECTS_BY_ID[refId].h;
    const verdict = { refId, tgtId, ratio: r, trueRatio, points: scoreGuess(r, trueRatio) };
    this.changed();
    this.maybeEndRound();
    return verdict;
  }

  maybeEndRound() {
    const active = [...this.players.values()].filter((p) => p.connected);
    if (active.length > 0 && active.every((p) => this.guesses.get(p.id)?.locked)) this.endRound();
  }

  endRound() {
    if (this.phase !== 'playing') return;
    clearTimeout(this.timer);
    const { refId, tgtId } = this.rounds[this.roundIndex];
    const trueRatio = OBJECTS_BY_ID[tgtId].h / OBJECTS_BY_ID[refId].h;
    const results = {};
    for (const p of this.players.values()) {
      const g = this.guesses.get(p.id);
      const points = g ? scoreGuess(g.ratio, trueRatio) : 0;
      p.score += points;
      results[p.id] = { ratio: g?.ratio ?? null, points };
    }
    this.history.push({ refId, tgtId, trueRatio, results });
    this.phase = 'reveal';
    this.changed();
  }

  next(id) {
    if (!this.isHost(id) || this.phase !== 'reveal') return;
    if (this.roundIndex + 1 >= this.rounds.length) {
      this.phase = 'final';
      this.changed();
    } else {
      this.startRound();
    }
  }

  backToLobby(id) {
    if (!this.isHost(id) || this.phase !== 'final') return;
    for (const [pid, p] of this.players) if (!p.connected) this.players.delete(pid);
    for (const p of this.players.values()) p.score = 0;
    this.phase = 'lobby';
    this.history = [];
    this.roundIndex = -1;
    this.changed();
  }

  changed() {
    this.onChange?.(this);
  }

  dispose() {
    clearTimeout(this.timer);
  }

  /** What every client is allowed to see. The answer is only sent once a round is over. */
  publicState() {
    const round =
      this.phase === 'playing' || this.phase === 'reveal'
        ? {
            index: this.roundIndex,
            total: this.rounds.length,
            refId: this.rounds[this.roundIndex].refId,
            tgtId: this.rounds[this.roundIndex].tgtId,
            deadline: this.deadline,
            locked: [...this.guesses].filter(([, g]) => g.locked).map(([pid]) => pid),
          }
        : null;
    return {
      code: this.code,
      phase: this.phase,
      hostId: this.hostId,
      settings: this.settings,
      serverNow: Date.now(),
      players: [...this.players.values()].map(({ id, name, color, score, connected }) => ({ id, name, color, score, connected })),
      round,
      history: this.phase === 'reveal' || this.phase === 'final' ? this.history : [],
    };
  }
}

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { CATEGORIES, OBJECTS, OBJECTS_BY_ID, scoreGuess, valueAt } from '../public/objects.js';
import { Room, pickRounds, cleanName, makeCode } from '../server/game.js';

test('scoreGuess: 100 when exact, decreasing and symmetric in log space', () => {
  assert.equal(scoreGuess(2, 2), 100);
  assert.ok(scoreGuess(2.2, 2) > scoreGuess(2.6, 2));
  assert.equal(scoreGuess(4, 2), scoreGuess(1, 2));
  assert.equal(scoreGuess(0, 2), 0);
  assert.equal(scoreGuess(NaN, 2), 0);
  const tenPctOff = scoreGuess(1.1, 1);
  assert.ok(tenPctOff >= 75 && tenPctOff <= 85, `10 % off gave ${tenPctOff}`);
});

test('catalogue: unique ids, valid categories, sizes and files', () => {
  assert.equal(new Set(OBJECTS.map((o) => o.id)).size, OBJECTS.length);
  assert.ok(OBJECTS.length >= 200, `only ${OBJECTS.length} objects`);
  const cats = new Set(CATEGORIES.map((c) => c.id));
  for (const o of OBJECTS) {
    assert.ok(cats.has(o.cat), `${o.id}: unknown category ${o.cat}`);
    assert.ok(o.h > 0 && o.size > 0, o.id);
    assert.ok(['h', 'l', 'a'].includes(o.dim), o.id);
    if (o.src) {
      assert.ok(o.aspect > 0, o.id);
      assert.ok(existsSync(new URL(`../public/${o.src}`, import.meta.url)), `${o.id}: missing ${o.src}`);
    } else {
      assert.ok(o.svg && o.dim === 'h', o.id);
    }
  }
  for (const c of CATEGORIES) assert.ok(OBJECTS.filter((o) => o.cat === c.id).length >= 15, c.id);
});

test('valueAt: height, length and area', () => {
  const g = OBJECTS_BY_ID.giraffe;
  assert.equal(valueAt(g, g.h), g.size);
  const w = OBJECTS_BY_ID.bluewhale;
  assert.ok(Math.abs(valueAt(w, w.h) - w.size) < 1e-9);
  const fr = OBJECTS_BY_ID.c_fr;
  assert.equal(valueAt(fr, fr.h), fr.size);
  assert.ok(Math.abs(valueAt(fr, fr.h * 2) - fr.size * 4) < 1e-6);
});

test('pickRounds: one category per round, ratios in range, no repeated pair', () => {
  for (const category of ['all', ...CATEGORIES.map((c) => c.id)]) {
    for (let i = 0; i < 20; i++) {
      const rounds = pickRounds(10, category);
      assert.equal(rounds.length, 10);
      const pairs = new Set(rounds.map((r) => `${r.refId}|${r.tgtId}`));
      assert.equal(pairs.size, 10);
      for (const r of rounds) {
        const ref = OBJECTS_BY_ID[r.refId];
        const tgt = OBJECTS_BY_ID[r.tgtId];
        assert.equal(ref.cat, tgt.cat);
        if (category !== 'all') assert.equal(ref.cat, category);
        const ratio = tgt.h / ref.h;
        assert.ok(ratio >= 1 / 12 && ratio <= 12);
      }
    }
  }
  // 'all' deals every category before repeating one.
  const cats = pickRounds(CATEGORIES.length, 'all').map((r) => OBJECTS_BY_ID[r.refId].cat);
  assert.equal(new Set(cats).size, CATEGORIES.length);
});

test('category setting: host only, unknown values ignored', () => {
  const room = new Room('CATS', () => {});
  room.join('player-a1', 'Alice');
  room.join('player-b1', 'Bob');
  room.updateSettings('player-b1', { category: 'pays' });
  assert.equal(room.settings.category, 'all');
  room.updateSettings('player-a1', { category: 'nope' });
  assert.equal(room.settings.category, 'all');
  room.updateSettings('player-a1', { category: 'pays', rounds: 3 });
  room.start('player-a1');
  for (const r of room.rounds) assert.equal(OBJECTS_BY_ID[r.refId].cat, 'pays');
  room.dispose();
});

test('cleanName and makeCode', () => {
  assert.equal(cleanName('   '), 'Anonyme');
  assert.equal(cleanName('a'.repeat(40)).length, 16);
  const code = makeCode(new Map());
  assert.match(code, /^[A-Z]{4}$/);
});

function newRoom() {
  const room = new Room('TEST', () => {});
  room.settings.timer = 60;
  return room;
}

test('round flow: answer hidden while playing, scores on reveal, final after last round', () => {
  const room = newRoom();
  room.join('player-a1', 'Alice');
  room.join('player-b1', 'Bob');
  assert.equal(room.hostId, 'player-a1');

  room.updateSettings('player-b1', { rounds: 2 }); // not host: ignored
  assert.equal(room.settings.rounds, 5);
  room.updateSettings('player-a1', { rounds: 2 });
  room.start('player-a1');
  assert.equal(room.phase, 'playing');
  assert.equal(room.publicState().history.length, 0);
  assert.equal('trueRatio' in room.publicState().round, false);

  const { refId, tgtId } = room.rounds[0];
  const truth = OBJECTS_BY_ID[tgtId].h / OBJECTS_BY_ID[refId].h;
  room.guess('player-a1', truth, true);
  assert.equal(room.phase, 'playing'); // Bob has not locked yet
  room.guess('player-b1', truth * 2, true);
  assert.equal(room.phase, 'reveal');

  const scores = Object.fromEntries(room.players.entries());
  assert.equal(scores['player-a1'].score, 100);
  assert.equal(scores['player-b1'].score, scoreGuess(truth * 2, truth));

  room.next('player-a1');
  assert.equal(room.phase, 'playing');
  room.endRound(); // timer ran out, nobody answered
  assert.equal(room.history[1].results['player-a1'].points, 0);
  room.next('player-a1');
  assert.equal(room.phase, 'final');
  room.dispose();
});

test('locked guesses cannot change; unlocked ones count when time is up', () => {
  const room = newRoom();
  room.join('player-a1', 'Alice');
  room.join('player-b1', 'Bob');
  room.start('player-a1');
  room.guess('player-a1', 1, true);
  room.guess('player-a1', 3, true);
  room.guess('player-b1', 2, false);
  room.endRound();
  const res = room.history[0].results;
  assert.equal(res['player-a1'].ratio, 1);
  assert.equal(res['player-b1'].ratio, 2);
  room.dispose();
});

test('locking returns the verdict to that player only once', () => {
  const room = newRoom();
  room.join('player-a1', 'Alice');
  room.join('player-b1', 'Bob');
  room.start('player-a1');
  const { refId, tgtId } = room.rounds[0];
  const truth = OBJECTS_BY_ID[tgtId].h / OBJECTS_BY_ID[refId].h;
  assert.equal(room.guess('player-a1', truth * 1.1, false), null);
  const verdict = room.guess('player-a1', truth * 1.1, true);
  assert.deepEqual(verdict, { refId, tgtId, ratio: truth * 1.1, trueRatio: truth, points: scoreGuess(truth * 1.1, truth) });
  assert.equal(room.guess('player-a1', truth, true), null);
  assert.equal('trueRatio' in room.publicState().round, false);
  room.dispose();
});

test('host leaves mid-game: host passes on, round ends if everyone left has locked', () => {
  const room = newRoom();
  room.join('player-a1', 'Alice');
  room.join('player-b1', 'Bob');
  room.start('player-a1');
  room.guess('player-b1', 1, true);
  room.leave('player-a1');
  assert.equal(room.hostId, 'player-b1');
  assert.equal(room.phase, 'reveal');
  room.dispose();
});

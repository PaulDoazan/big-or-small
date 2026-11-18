import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OBJECTS, OBJECTS_BY_ID, scoreGuess } from '../public/objects.js';
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

test('catalogue: unique ids, positive heights', () => {
  assert.equal(new Set(OBJECTS.map((o) => o.id)).size, OBJECTS.length);
  for (const o of OBJECTS) assert.ok(o.h > 0, o.id);
});

test('pickRounds: distinct objects, ratios in range', () => {
  for (let i = 0; i < 50; i++) {
    const rounds = pickRounds(10);
    const ids = rounds.flatMap((r) => [r.refId, r.tgtId]);
    assert.equal(new Set(ids).size, ids.length);
    for (const r of rounds) {
      const ratio = OBJECTS_BY_ID[r.tgtId].h / OBJECTS_BY_ID[r.refId].h;
      assert.ok(ratio >= 1 / 12 && ratio <= 12);
    }
  }
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

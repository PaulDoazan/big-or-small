import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { io as connect } from 'socket.io-client';
import { createApp } from '../server/index.js';

let server;
let url;

before(async () => {
  server = createApp();
  await new Promise((r) => server.httpServer.listen(0, r));
  url = `http://localhost:${server.httpServer.address().port}`;
});

after(async () => {
  server.io.close();
  await new Promise((r) => server.httpServer.close(r));
});

const client = () => connect(url, { transports: ['websocket'], forceNew: true });
const emit = (s, ev, payload) => new Promise((r) => s.emit(ev, payload, r));
const nextState = (s, pred) =>
  new Promise((resolve) => {
    const h = (st) => {
      if (pred(st)) {
        s.off('state', h);
        resolve(st);
      }
    };
    s.on('state', h);
  });

test('two players: create, join by code, play a round, see each other’s scores', async () => {
  const a = client();
  const b = client();
  try {
    const created = await emit(a, 'create', { playerId: 'alice-0001', name: 'Alice' });
    assert.match(created.code, /^[A-Z]{4}$/);

    const bad = await emit(b, 'join', { playerId: 'bob-00001', name: 'Bob', code: 'ZZZZ' });
    assert.ok(bad.error);

    const joined = nextState(a, (s) => s.players.length === 2);
    await emit(b, 'join', { playerId: 'bob-00001', name: 'Bob', code: created.code.toLowerCase() });
    await joined;

    const playing = nextState(b, (s) => s.phase === 'playing');
    a.emit('settings', { rounds: 1 });
    a.emit('start');
    const st = await playing;
    assert.equal(st.round.total, 1);
    assert.deepEqual(st.history, []);

    const revealed = nextState(b, (s) => s.phase === 'reveal');
    a.emit('lock', { ratio: 1 });
    b.emit('lock', { ratio: 2 });
    const rv = await revealed;
    const results = rv.history[0].results;
    assert.ok('alice-0001' in results && 'bob-00001' in results);
    assert.equal(results['bob-00001'].ratio, 2);

    // Only the host can move on.
    const final = nextState(a, (s) => s.phase === 'final');
    b.emit('next');
    a.emit('next');
    const fin = await final;
    assert.equal(fin.players.length, 2);
  } finally {
    a.close();
    b.close();
  }
});

test('a player who reconnects with the same id keeps their seat', async () => {
  const a = client();
  const { code } = await emit(a, 'create', { playerId: 'carol-0001', name: 'Carol' });
  a.close();
  await new Promise((r) => setTimeout(r, 50));
  const a2 = client();
  try {
    const res = await emit(a2, 'join', { playerId: 'carol-0001', name: 'Carol', code });
    assert.equal(res.code, code);
    const room = server.rooms.get(code);
    assert.equal(room.players.size, 1);
    assert.equal(room.hostId, 'carol-0001');
  } finally {
    a2.close();
  }
});

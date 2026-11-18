import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Server } from 'socket.io';
import { Room, makeCode } from './game.js';

const PUBLIC_DIR = fileURLToPath(new URL('../public', import.meta.url));
const EMPTY_ROOM_TTL = 10 * 60 * 1000;

export function createApp() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer);
  const rooms = new Map();

  app.get('/healthz', (_req, res) => res.send('ok'));
  app.use(express.static(PUBLIC_DIR, { extensions: ['html'] }));

  const broadcast = (room) => io.to(room.code).emit('state', room.publicState());

  const sweep = setInterval(() => {
    for (const [code, room] of rooms) {
      if (room.emptySince && Date.now() - room.emptySince > EMPTY_ROOM_TTL) {
        room.dispose();
        rooms.delete(code);
      }
    }
  }, 60 * 1000);
  sweep.unref();

  io.on('connection', (socket) => {
    let room = null;
    let playerId = null;

    const enter = (target, id, name, ack) => {
      try {
        target.join(id, name);
      } catch (e) {
        return ack?.({ error: e.message });
      }
      if (room && room !== target) {
        socket.leave(room.code);
        room.leave(playerId);
      }
      room = target;
      playerId = id;
      socket.data.playerId = id;
      socket.join(target.code);
      ack?.({ code: target.code });
      socket.emit('state', target.publicState());
    };

    const validId = (id) => typeof id === 'string' && id.length >= 8 && id.length <= 64;

    socket.on('create', ({ playerId: id, name } = {}, ack) => {
      if (!validId(id)) return ack?.({ error: 'Identifiant invalide.' });
      const code = makeCode(rooms);
      const created = new Room(code, broadcast);
      rooms.set(code, created);
      enter(created, id, name, ack);
    });

    socket.on('join', ({ playerId: id, name, code } = {}, ack) => {
      if (!validId(id)) return ack?.({ error: 'Identifiant invalide.' });
      const target = rooms.get(String(code ?? '').trim().toUpperCase());
      if (!target) return ack?.({ error: 'Aucune partie avec ce code.' });
      enter(target, id, name, ack);
    });

    socket.on('settings', (s = {}) => room?.updateSettings(playerId, s));
    socket.on('start', () => room?.start(playerId));
    socket.on('guess', ({ ratio } = {}) => room?.guess(playerId, ratio, false));
    socket.on('lock', ({ ratio } = {}, ack) => {
      const verdict = room?.guess(playerId, ratio, true) ?? null;
      if (typeof ack === 'function') ack(verdict);
    });
    socket.on('next', () => room?.next(playerId));
    socket.on('lobby', () => room?.backToLobby(playerId));

    socket.on('leave', () => {
      if (!room) return;
      socket.leave(room.code);
      room.leave(playerId);
      room = null;
    });

    socket.on('disconnect', () => {
      if (!room) return;
      // Another tab of the same player may still be connected to the room.
      const stillThere = [...(io.sockets.adapter.rooms.get(room.code) ?? [])].some(
        (sid) => io.sockets.sockets.get(sid)?.data.playerId === playerId,
      );
      if (!stillThere) room.leave(playerId);
    });
  });

  return { app, httpServer, io, rooms };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT) || 3000;
  createApp().httpServer.listen(port, () => console.log(`Big or Small sur http://localhost:${port}`));
}

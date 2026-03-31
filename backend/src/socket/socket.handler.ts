import { Server, Socket } from 'socket.io';

interface RoomParticipant {
  userId: string;
  name: string;
  socketId: string;
}

const rooms = new Map<string, RoomParticipant[]>();

export const setupSocketHandlers = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('join-room', ({ roomId, userId, name }: { roomId: string; userId: string; name: string }) => {
      socket.join(roomId);

      const participant: RoomParticipant = { userId, name, socketId: socket.id };
      if (!rooms.has(roomId)) {
        rooms.set(roomId, []);
      }
      rooms.get(roomId)!.push(participant);

      socket.to(roomId).emit('user-joined', { userId, name, socketId: socket.id });

      const participants = rooms.get(roomId)!.filter(p => p.socketId !== socket.id);
      socket.emit('room-participants', participants);

      console.log(`${name} joined room ${roomId}`);
    });

    socket.on('leave-room', ({ roomId, userId }: { roomId: string; userId: string }) => {
      socket.leave(roomId);
      leaveRoom(roomId, socket.id, io);
    });

    socket.on('signal', ({ to, signal, from }: { to: string; signal: unknown; from: string }) => {
      io.to(to).emit('signal', { signal, from });
    });

    socket.on('meeting-state', ({ roomId, state }: { roomId: string; state: unknown }) => {
      socket.to(roomId).emit('meeting-state', state);
    });

    socket.on('recording-started', ({ roomId }: { roomId: string }) => {
      socket.to(roomId).emit('recording-started');
    });

    socket.on('recording-stopped', ({ roomId }: { roomId: string }) => {
      socket.to(roomId).emit('recording-stopped');
    });

    socket.on('disconnect', () => {
      rooms.forEach((participants, roomId) => {
        const participant = participants.find(p => p.socketId === socket.id);
        if (participant) {
          leaveRoom(roomId, socket.id, io);
        }
      });
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};

function leaveRoom(roomId: string, socketId: string, io: Server) {
  const participants = rooms.get(roomId);
  if (!participants) return;

  const leavingParticipant = participants.find(p => p.socketId === socketId);
  const updated = participants.filter(p => p.socketId !== socketId);

  if (updated.length === 0) {
    rooms.delete(roomId);
  } else {
    rooms.set(roomId, updated);
  }

  if (leavingParticipant) {
    io.to(roomId).emit('user-left', {
      userId: leavingParticipant.userId,
      socketId,
    });
  }
}

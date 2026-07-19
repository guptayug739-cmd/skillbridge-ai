import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../utils/logger';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export function setupSocketHandlers(io: SocketServer) {
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token as string, config.jwt.secret) as any;
      socket.userId = decoded.id;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`User connected: ${socket.userId}`);

    socket.join(`user:${socket.userId}`);

    socket.on('join_contract', (contractId: string) => {
      socket.join(`contract:${contractId}`);
    });

    socket.on('leave_contract', (contractId: string) => {
      socket.leave(`contract:${contractId}`);
    });

    socket.on('typing', (data: { contractId: string; userId: string }) => {
      socket.to(`contract:${data.contractId}`).emit('typing', data);
    });

    socket.on('stop_typing', (data: { contractId: string }) => {
      socket.to(`contract:${data.contractId}`).emit('stop_typing', data);
    });

    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.userId}`);
    });
  });

  return io;
}

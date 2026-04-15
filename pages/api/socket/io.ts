// pages/api/socket/io.ts
import { Server as NetServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as ServerIO } from 'socket.io';

export const config = {
  api: {
    bodyParser: false,
  },
};

const ioHandler = (req: NextApiRequest, res: NextApiResponse & { socket: any }) => {
  if (!res.socket.server.io) {
    const path = '/api/socket/io';
    const httpServer: NetServer = res.socket.server as any;
    const io = new ServerIO(httpServer, {
      path: path,
      addTrailingSlash: false,
    });

    // Listen for client connections
    io.on('connection', (socket) => {
      // Allow a user to join a specific "room" based on their Firebase UID
      socket.on('join_user_room', (userId) => {
        socket.join(userId);
      });
    });

    res.socket.server.io = io;
  }

  res.end();
};

export default ioHandler;
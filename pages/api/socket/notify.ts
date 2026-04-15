// pages/api/socket/notify.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse & { socket: any }) {
  if (req.method !== 'POST') return res.status(405).end();

  const io = res.socket.server.io;
  if (!io) {
    return res.status(500).json({ error: 'Socket server not initialized' });
  }

  const { userId, issueId, title, status } = req.body;

  // Emit an event directly to the user's private room
  io.to(userId).emit('issue_updated', {
    issueId,
    title,
    status,
    message: `Your report "${title}" is now marked as ${status}.`
  });

  return res.status(200).json({ success: true });
}
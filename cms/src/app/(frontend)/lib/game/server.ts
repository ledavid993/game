import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { initializeSocket } from './socket';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

let server: any = null;

export async function startServer() {
  if (server) {
    return server;
  }

  try {
    await app.prepare();

    // Create HTTP server
    server = createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url!, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error occurred handling', req.url, err);
        res.statusCode = 500;
        res.end('internal server error');
      }
    });

    // Initialize Socket.IO
    const io = initializeSocket(server);
    console.log('Socket.IO initialized');

    // Store the Socket.IO instance on the server for access in API routes
    (server as any).io = io;

    server.listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });

    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    throw error;
  }
}

export function getServer() {
  return server;
}
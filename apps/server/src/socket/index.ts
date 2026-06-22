import type { IncomingMessage } from "node:http";
import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { prisma } from "@xo/db";
import type { AuthUser, ClientToServerEvents, ServerToClientEvents } from "@xo/shared";
import { env } from "../config/env";
import { toAuthUser } from "../lib/auth";
import { hashToken } from "../lib/crypto";
import { getAccessibleGame, playOnlineMove } from "../services/games";

type SocketData = { user: AuthUser };

type IoServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

function parseCookies(req: IncomingMessage): Record<string, string> {
  const header = req.headers.cookie;
  if (!header) return {};

  return header.split(";").reduce<Record<string, string>>((acc, pair) => {
    const index = pair.indexOf("=");
    if (index === -1) return acc;
    const key = pair.slice(0, index).trim();
    const value = decodeURIComponent(pair.slice(index + 1).trim());
    acc[key] = value;
    return acc;
  }, {});
}

async function authenticateSocket(req: IncomingMessage) {
  const token = parseCookies(req)[env.SESSION_COOKIE_NAME];
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true }
  });

  if (!session || session.expiresAt <= new Date()) return null;
  return toAuthUser(session.user);
}

export function setupSocket(server: HttpServer) {
  const io: IoServer = new Server(server, {
    cors: {
      origin: env.APP_ORIGIN,
      credentials: true
    }
  });

  io.use(async (socket, next) => {
    try {
      const user = await authenticateSocket(socket.request);
      if (!user) {
        next(new Error("Unauthorized"));
        return;
      }
      socket.data.user = user;
      next();
    } catch (error) {
      next(error instanceof Error ? error : new Error("Socket authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("game:join", async ({ gameId }) => {
      try {
        const game = await getAccessibleGame(gameId, socket.data.user.id);
        socket.join(gameId);
        socket.emit("game:state", game);
      } catch (error) {
        socket.emit("game:error", { message: error instanceof Error ? error.message : "Could not join game." });
      }
    });

    socket.on("game:move", async ({ gameId, position }) => {
      try {
        const game = await playOnlineMove(gameId, socket.data.user.id, position);
        io.to(gameId).emit("game:state", game);
      } catch (error) {
        socket.emit("game:error", { message: error instanceof Error ? error.message : "Move failed." });
      }
    });
  });

  return io;
}

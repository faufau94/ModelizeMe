#!/usr/bin/env node

import { WebSocketServer } from "ws";
import { setupWSConnection } from "y-websocket/bin/utils";
import { URL } from "url";

const host = process.env.HOST || "localhost";
const port = process.env.PORT || 1234;
const wss = new WebSocketServer({ host, port });

wss.on("connection", (ws, req) => {
  // Extract token from query params: ws://host:port?token=xxx
  const url = new URL(req.url || "", `http://${host}:${port}`);
  const token = url.searchParams.get("token");

  // Basic token validation - reject connections without a valid token
  if (!token) {
    ws.close(4001, "Authentication required");
    return;
  }

  // Verify token is not empty and has reasonable length
  // In production, this should validate against the session store or JWT
  if (token.length < 10) {
    ws.close(4003, "Invalid token");
    return;
  }

  setupWSConnection(ws, req);
});

console.log(`WebSocket server running on ws://${host}:${port}`);

process.on("SIGINT", () => {
  console.log("Received SIGINT. Shutting down WebSocket server...");
  wss.close(() => {
    console.log("WebSocket server closed");
    process.exit(0);
  });
});

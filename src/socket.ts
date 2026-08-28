#!/usr/bin/env bun

import { Server, ServerWebSocket } from "bun";

// Store clients by channel
const channels = new Map<string, Set<ServerWebSocket<any>>>();

// Summarize a message for logging without dumping large payloads (e.g. base64 imageData)
function summarizeMessage(data: any, raw: string | Buffer): string {
  const size = typeof raw === "string" ? Buffer.byteLength(raw) : raw.byteLength;
  const parts = [`type=${data.type}`, `channel=${data.channel ?? "-"}`, `size=${size}B`];
  if (data.message?.command) {
    parts.push(`command=${data.message.command}`, `id=${data.id}`);
  } else if (data.message?.result !== undefined) {
    parts.push(`response id=${data.id}`);
  } else if (data.message && typeof data.message === "object") {
    parts.push(`keys=${Object.keys(data.message).join(",")}`);
  }
  return parts.join(" ");
}

function handleConnection(ws: ServerWebSocket<any>) {
  // Don't add to clients immediately - wait for channel join
  console.log("New client connected");

  // Send welcome message to the new client
  ws.send(JSON.stringify({
    type: "system",
    message: "Please join a channel to start chatting",
  }));

  ws.close = () => {
    console.log("Client disconnected");

    // Remove client from their channel
    channels.forEach((clients, channelName) => {
      if (clients.has(ws)) {
        clients.delete(ws);

        // Notify other clients in same channel
        clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: "system",
              message: "A user has left the channel",
              channel: channelName
            }));
          }
        });
      }
    });
  };
}

const server = Bun.serve({
  port: 3055,
  // uncomment this to allow connections in windows wsl
  // hostname: "0.0.0.0",
  fetch(req: Request, server: Server) {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // Handle WebSocket upgrade
    const success = server.upgrade(req, {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });

    if (success) {
      return; // Upgraded to WebSocket
    }

    // Return response for non-WebSocket requests
    return new Response("WebSocket server running", {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  },
  websocket: {
    open: handleConnection,
    message(ws: ServerWebSocket<any>, message: string | Buffer) {
      try {
        const data = JSON.parse(message as string);
        const isHeartbeat = data.message?.heartbeat !== undefined;
        if (!isHeartbeat) console.log(`recv ${summarizeMessage(data, message)}`);

        if (data.type === "join") {
          const channelName = data.channel;
          if (!channelName || typeof channelName !== "string") {
            ws.send(JSON.stringify({
              type: "error",
              message: "Channel name is required"
            }));
            return;
          }

          // Create channel if it doesn't exist
          if (!channels.has(channelName)) {
            channels.set(channelName, new Set());
          }

          // Add client to channel
          const channelClients = channels.get(channelName)!;
          channelClients.add(ws);

          console.log(`\n✓ Client joined channel "${channelName}" (${channelClients.size} total clients)`);

          // Notify client they joined successfully
          ws.send(JSON.stringify({
            type: "system",
            message: `Joined channel: ${channelName}`,
            channel: channelName
          }));

          ws.send(JSON.stringify({
            type: "system",
            message: {
              id: data.id,
              result: "Connected to channel: " + channelName,
            },
            channel: channelName
          }));

          // Notify other clients in channel
          channelClients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: "system",
                message: "A new user has joined the channel",
                channel: channelName
              }));
            }
          });
          return;
        }

        // Handle regular messages
        if (data.type === "message") {
          const channelName = data.channel;
          if (!channelName || typeof channelName !== "string") {
            ws.send(JSON.stringify({
              type: "error",
              message: "Channel name is required"
            }));
            return;
          }

          const channelClients = channels.get(channelName);
          if (!channelClients || !channelClients.has(ws)) {
            ws.send(JSON.stringify({
              type: "error",
              message: "You must join the channel first"
            }));
            return;
          }

          // Broadcast to all OTHER clients in the channel (not the sender)
          // This prevents echo and ensures proper request-response flow
          let broadcastCount = 0;
          channelClients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              broadcastCount++;
              const broadcastMessage = {
                type: "broadcast",
                message: data.message,
                sender: "peer",
                channel: channelName
              };
              client.send(JSON.stringify(broadcastMessage));
            }
          });
          
          if (!isHeartbeat) {
            if (broadcastCount === 0) {
              console.log(`⚠️  No other clients in channel "${channelName}" to receive message!`);
            } else {
              console.log(`✓ Broadcast to ${broadcastCount} peer(s) in channel "${channelName}"`);
            }
          }
        }

        // Forward progress_update messages to the MCP server so it can reset
        if (data.type === "progress_update") {
          const channelName = data.channel;
          if (!channelName) return;

          const channelClients = channels.get(channelName);
          if (!channelClients || !channelClients.has(ws)) return;

          channelClients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(data));
            }
          });
        }
      } catch (err) {
        console.error("Error handling message:", err);
      }
    },
    close(ws: ServerWebSocket<any>) {
      // Remove client from their channel
      channels.forEach((clients) => {
        clients.delete(ws);
      });
    }
  }
});

console.log(`WebSocket server running on port ${server.port}`);

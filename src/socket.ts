import { Server, ServerWebSocket } from "bun";

// Store all connected clients
const clients = new Set<ServerWebSocket<any>>();

function handleConnection(ws: ServerWebSocket<any>) {
  console.log("New client connected");

  // Add client to the set immediately
  clients.add(ws);

  // Send welcome message to the new client
  ws.send(
    JSON.stringify({
      type: "system",
      message: "Connected to chat server",
    })
  );

  // Notify other clients
  clients.forEach((client) => {
    if (client !== ws && client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({
          type: "system",
          message: "A new user has joined the chat",
        })
      );
    }
  });

  ws.close = () => {
    console.log("Client disconnected");

    // Remove client from the set
    clients.delete(ws);

    // Notify other clients
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: "system",
            message: "A user has left the chat",
          })
        );
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
        console.log("Received message from client:", message);
        const data = JSON.parse(message as string);

        // For backward compatibility, still accept join messages but simplify
        if (data.type === "join") {
          console.log("Sending message to client:", data.id);

          ws.send(
            JSON.stringify({
              type: "system",
              message: {
                id: data.id,
                result: "Connected to chat server",
              },
            })
          );
          return;
        }

        // Handle regular messages
        if (data.type === "message") {
          // Broadcast to all clients
          clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              console.log("Broadcasting message to client:", data.message);
              client.send(
                JSON.stringify({
                  type: "broadcast",
                  message: data.message,
                  sender: client === ws ? "You" : "User",
                })
              );
            }
          });
        }
      } catch (err) {
        console.error("Error handling message:", err);
      }
    },
    close(ws: ServerWebSocket<any>) {
      // Remove client from set
      clients.delete(ws);
    },
  },
});

console.log(`WebSocket server running on port ${server.port}`);

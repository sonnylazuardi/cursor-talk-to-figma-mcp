// WebSocket connection management for MCP server
import { useState, useEffect, useRef } from 'react';

export interface WebSocketState {
  connected: boolean;
  socket: WebSocket | null;
  serverPort: number;
  channel: string | null;
  connectionMessage: string;
}

export interface ProgressData {
  commandId: string;
  commandType: string;
  status: 'started' | 'in_progress' | 'completed' | 'error';
  progress: number;
  totalItems: number;
  processedItems: number;
  message: string;
  timestamp: number;
  payload?: unknown;
}

export interface WebSocketHook {
  state: WebSocketState;
  connect: (port: number) => Promise<void>;
  disconnect: () => void;
  sendCommand: (command: string, params: Record<string, unknown>) => Promise<unknown>;
  sendSuccessResponse: (id: string, result: unknown) => void;
  sendErrorResponse: (id: string, errorMessage: string) => void;
  sendProgressUpdate: (progressData: ProgressData) => void;
}

export function useWebSocket(): WebSocketHook {
  const [state, setState] = useState<WebSocketState>({
    connected: false,
    socket: null,
    serverPort: 3055,
    channel: null,
    connectionMessage: 'Not connected to Cursor MCP server'
  });

  const pendingRequests = useRef(new Map<string, { resolve: (value: unknown) => void; reject: (error: Error) => void }>());

  // Generate unique IDs
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  };

  // Generate random channel name
  const generateChannelName = () => {
    const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  // Handle WebSocket messages
  const handleSocketMessage = async (payload: { type: string; message?: unknown; channel?: string }) => {
    const data = payload.message as Record<string, unknown>;
    console.log("handleSocketMessage", data);

    // If it's a response to a previous request
    if (data?.id && typeof data.id === 'string' && pendingRequests.current.has(data.id)) {
      const { resolve, reject } = pendingRequests.current.get(data.id)!;
      pendingRequests.current.delete(data.id);

      if (data.error) {
        reject(new Error(typeof data.error === 'string' ? data.error : 'Unknown error'));
      } else {
        resolve(data.result);
      }
      return;
    }

    // If it's a new command
    if (data?.command && typeof data.command === 'string') {
      try {
        // Send the command to the plugin code
        parent.postMessage(
          {
            pluginMessage: {
              type: "execute-command",
              id: data.id,
              command: data.command,
              params: data.params,
            },
          },
          "*"
        );
      } catch (error) {
        // Send error back to WebSocket
        const idStr = typeof data.id === 'string' ? data.id : 'unknown';
        sendErrorResponse(idStr, (error as Error).message || "Error executing command");
      }
    }
  };

  // Connect to WebSocket server
  const connect = async (port: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        if (state.connected && state.socket) {
          setState(prev => ({ ...prev, connectionMessage: "Already connected to server" }));
          resolve();
          return;
        }

        const socket = new WebSocket(`ws://localhost:${port}`);

        socket.onopen = () => {
          // Generate random channel name
          const channelName = generateChannelName();
          console.log("Joining channel:", channelName);

          // Join the channel
          socket.send(
            JSON.stringify({
              type: "join",
              channel: channelName.trim(),
            })
          );

          setState(prev => ({ 
            ...prev, 
            socket,
            serverPort: port,
            channel: channelName,
            connectionMessage: "Connecting..."
          }));
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("Received message:", data);

            if (data.type === "system") {
              // Successfully joined channel
              if (data.message && data.message.result) {
                const channelName = data.channel;
                setState(prev => ({
                  ...prev,
                  connected: true,
                  connectionMessage: `Connected to server on port ${port} in channel: ${channelName}`
                }));

                // Notify the plugin code
                parent.postMessage(
                  {
                    pluginMessage: {
                      type: "notify",
                      message: `Connected to Cursor MCP server on port ${port} in channel: ${channelName}`,
                    },
                  },
                  "*"
                );
                resolve();
              }
            } else if (data.type === "error") {
              console.error("Error:", data.message);
              setState(prev => ({
                ...prev,
                connected: false,
                socket: null,
                connectionMessage: `Error: ${data.message}`
              }));
              socket.close();
              reject(new Error(data.message));
            }

            handleSocketMessage(data);
          } catch (error) {
            console.error("Error parsing message:", error);
            reject(error);
          }
        };

        socket.onclose = () => {
          setState(prev => ({
            ...prev,
            connected: false,
            socket: null,
            connectionMessage: "Disconnected from server"
          }));
        };

        socket.onerror = (error) => {
          console.error("WebSocket error:", error);
          setState(prev => ({
            ...prev,
            connected: false,
            socket: null,
            connectionMessage: "Connection error"
          }));
          reject(error);
        };
      } catch (error) {
        console.error("Connection error:", error);
        setState(prev => ({
          ...prev,
          connectionMessage: `Connection error: ${(error as Error).message || "Unknown error"}`
        }));
        reject(error);
      }
    });
  };

  // Disconnect from WebSocket server
  const disconnect = () => {
    if (state.socket) {
      state.socket.close();
      setState(prev => ({
        ...prev,
        connected: false,
        socket: null,
        connectionMessage: "Disconnected from server"
      }));
    }
  };

  // Send a command to the WebSocket server
  const sendCommand = async (command: string, params: Record<string, unknown>): Promise<unknown> => {
    return new Promise((resolve, reject) => {
      if (!state.connected || !state.socket) {
        reject(new Error("Not connected to server"));
        return;
      }

      const id = generateId();
      pendingRequests.current.set(id, { resolve, reject });

      state.socket.send(
        JSON.stringify({
          id,
          type: "message",
          channel: state.channel,
          message: {
            id,
            command,
            params,
          },
        })
      );

      // Set timeout to reject the promise after 30 seconds
      setTimeout(() => {
        if (pendingRequests.current.has(id)) {
          pendingRequests.current.delete(id);
          reject(new Error("Request timed out"));
        }
      }, 30000);
    });
  };

  // Send success response back to WebSocket
  const sendSuccessResponse = (id: string, result: unknown) => {
    if (!state.connected || !state.socket) {
      console.error("Cannot send response: socket not connected");
      return;
    }

    state.socket.send(
      JSON.stringify({
        id,
        type: "message",
        channel: state.channel,
        message: {
          id,
          result,
        },
      })
    );
  };

  // Send error response back to WebSocket
  const sendErrorResponse = (id: string, errorMessage: string) => {
    if (!state.connected || !state.socket) {
      console.error("Cannot send error response: socket not connected");
      return;
    }

    state.socket.send(
      JSON.stringify({
        id,
        type: "message",
        channel: state.channel,
        message: {
          id,
          error: errorMessage,
          result: {}
        },
      })
    );
  };

  // Send operation progress update to server
  const sendProgressUpdate = (progressData: ProgressData) => {
    if (!state.connected || !state.socket) {
      console.error("Cannot send progress update: socket not connected");
      return;
    }
    
    console.log("Sending progress update to server:", progressData);
    
    state.socket.send(
      JSON.stringify({
        id: progressData.commandId,
        type: "progress_update",
        channel: state.channel,
        message: {
          id: progressData.commandId,
          type: "progress_update",
          data: progressData
        }
      })
    );
  };

  // Listen for messages from the plugin code
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data.pluginMessage;
      if (!message) return;

      console.log("Received message from plugin:", message);

      switch (message.type) {
        case "command-result":
          // Forward the result from plugin code back to WebSocket
          sendSuccessResponse(message.id, message.result);
          break;
        case "command-error":
          // Forward the error from plugin code back to WebSocket
          sendErrorResponse(message.id, message.error);
          break;
        case "command_progress":
          // Forward progress update to server
          sendProgressUpdate(message);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [state.connected, state.socket, state.channel]);

  return {
    state,
    connect,
    disconnect,
    sendCommand,
    sendSuccessResponse,
    sendErrorResponse,
    sendProgressUpdate
  };
} 
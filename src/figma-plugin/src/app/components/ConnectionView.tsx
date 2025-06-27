import React, { useState, useEffect, useRef } from "react";
import styles from "../app.module.scss";

interface ConnectionState {
  connected: boolean;
  socket: WebSocket | null;
  serverPort: number;
  pendingRequests: Map<string, { resolve: (value: unknown) => void; reject: (reason?: unknown) => void }>;
  channel: string | null;
}

interface ProgressData {
  commandId: string;
  commandType: string;
  status: 'started' | 'in_progress' | 'completed' | 'error';
  progress: number;
  totalItems: number;
  processedItems: number;
  message: string;
}

const ConnectionView: React.FC = () => {
  const [port, setPort] = useState<number>(3055);
  const [connectionStatus, setConnectionStatus] = useState<string>("Not connected to Cursor MCP server");
  const [connectionClass, setConnectionClass] = useState<string>("disconnected");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [showProgress, setShowProgress] = useState<boolean>(false);

  const stateRef = useRef<ConnectionState>({
    connected: false,
    socket: null,
    serverPort: 3055,
    pendingRequests: new Map(),
    channel: null,
  });

  // Update connection status
  const updateConnectionStatus = (connected: boolean, message?: string) => {
    setIsConnected(connected);
    stateRef.current.connected = connected;
    
    const statusMessage = message || (connected 
      ? "Connected to Cursor MCP server" 
      : "Not connected to Cursor MCP server");
    
    setConnectionStatus(statusMessage);
    setConnectionClass(connected ? "connected" : "disconnected");
  };

  // Generate channel name
  const generateChannelName = (): string => {
    const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  // Connect to WebSocket server
  const connectToServer = async (serverPort: number) => {
    try {
      if (stateRef.current.connected && stateRef.current.socket) {
        updateConnectionStatus(true, "Already connected to server");
        return;
      }

      stateRef.current.serverPort = serverPort;
      const socket = new WebSocket(`ws://localhost:${serverPort}`);
      stateRef.current.socket = socket;

      socket.onopen = () => {
        const channelName = generateChannelName();
        console.log("Joining channel:", channelName);
        stateRef.current.channel = channelName;

        socket.send(JSON.stringify({
          type: "join",
          channel: channelName.trim(),
        }));
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("Received message:", data);

          if (data.type === "system") {
            if (data.message && data.message.result) {
              stateRef.current.connected = true;
              const channelName = data.channel;
              updateConnectionStatus(true, `Connected to server on port ${serverPort} in channel: <strong>${channelName}</strong>`);

              // Notify the plugin code
              parent.postMessage({
                pluginMessage: {
                  type: "notify",
                  message: `Connected to Cursor MCP server on port ${serverPort} in channel: ${channelName}`,
                },
              }, "*");
            }
          } else if (data.type === "error") {
            console.error("Error:", data.message);
            updateConnectionStatus(false, `Error: ${data.message}`);
            socket.close();
          }

          handleSocketMessage(data);
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      };

      socket.onclose = () => {
        stateRef.current.connected = false;
        stateRef.current.socket = null;
        updateConnectionStatus(false, "Disconnected from server");
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        updateConnectionStatus(false, "Connection error");
        stateRef.current.connected = false;
        stateRef.current.socket = null;
      };
    } catch (error: unknown) {
      console.error("Connection error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      updateConnectionStatus(false, `Connection error: ${errorMessage}`);
    }
  };

  // Handle socket messages
  const handleSocketMessage = async (payload: { message?: unknown }) => {
    const data = payload.message as { command?: string; id?: string; params?: unknown; error?: string; result?: unknown };
    console.log("handleSocketMessage", data);

    // If it's a response to a previous request
    if (data && data.id && stateRef.current.pendingRequests.has(data.id)) {
      const { resolve, reject } = stateRef.current.pendingRequests.get(data.id)!;
      stateRef.current.pendingRequests.delete(data.id);

      if (data.error) {
        reject(new Error(data.error));
      } else {
        resolve(data.result);
      }
      return;
    }

    // If it's a new command
    if (data && data.command) {
      try {
        parent.postMessage({
          pluginMessage: {
            type: "execute-command",
            webSocketCommandId: data.id,
            command: data.command,
            params: data.params,
          },
        }, "*");
      } catch (error: unknown) {
        console.error("Error executing command:", error);
        sendErrorResponse(data.id!, error instanceof Error ? error.message : "Error executing command");
      }
    }
  };

  // Send success response back to WebSocket
  const sendSuccessResponse = (id: string, result: unknown) => {
    if (!stateRef.current.connected || !stateRef.current.socket) {
      console.error("Cannot send response: socket not connected");
      return;
    }

    stateRef.current.socket.send(JSON.stringify({
      id,
      type: "message",
      channel: stateRef.current.channel,
      message: {
        id,
        result,
      },
    }));
  };

  // Send error response back to WebSocket
  const sendErrorResponse = (id: string, errorMessage: string) => {
    if (!stateRef.current.connected || !stateRef.current.socket) {
      console.error("Cannot send error response: socket not connected");
      return;
    }

    stateRef.current.socket.send(JSON.stringify({
      id,
      type: "message",
      channel: stateRef.current.channel,
      message: {
        id,
        error: errorMessage,
        result: {}
      },
    }));
  };

  // Send progress update to server
  const sendProgressUpdateToServer = (progressData: ProgressData) => {
    if (!stateRef.current.connected || !stateRef.current.socket) {
      console.error("Cannot send progress update: socket not connected");
      return;
    }
    
    console.log("Sending progress update to server:", progressData);
    
    stateRef.current.socket.send(JSON.stringify({
      id: progressData.commandId,
      type: "progress_update",
      channel: stateRef.current.channel,
      message: {
        id: progressData.commandId,
        type: "progress_update",
        data: progressData
      }
    }));
  };

  // Handle connect button click
  const handleConnect = () => {
    updateConnectionStatus(false, "Connecting...");
    setConnectionClass("info");
    connectToServer(port);
  };

  // Handle disconnect button click
  const handleDisconnect = () => {
    updateConnectionStatus(false, "Disconnecting...");
    setConnectionClass("info");
    if (stateRef.current.socket) {
      stateRef.current.socket.close();
      stateRef.current.socket = null;
      stateRef.current.connected = false;
      updateConnectionStatus(false, "Disconnected from server");
    }
  };

  // Listen for messages from plugin code
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data.pluginMessage;
      if (!message) return;

      console.log("Received message from plugin:", message);

      switch (message.type) {
        case "connection-status":
          updateConnectionStatus(message.connected, message.message);
          break;
        case "auto-connect":
          handleConnect();
          break;
        case "auto-disconnect":
          handleDisconnect();
          break;
        case "command-result":
          // Forward the result from plugin code back to WebSocket
          sendSuccessResponse(message.id, message.result);
          break;
        case "command-error":
          // Forward the error from plugin code back to WebSocket
          sendErrorResponse(message.id, message.error);
          break;
        case "command_progress":
          // Update UI with progress information
          setProgressData(message);
          setShowProgress(true);
          // Forward progress update to server
          sendProgressUpdateToServer(message);
          
          if (message.status === 'completed' || message.status === 'error') {
            setTimeout(() => {
              setShowProgress(false);
            }, 5000);
          }
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className={styles.settingsContainer}>
      <div className={styles.section}>
        <label htmlFor="port">WebSocket Server Port</label>
        <div className={styles.inputGroup}>
          <input
            type="number"
            id="port"
            placeholder="3055"
            value={port}
            onChange={(e) => setPort(parseInt(e.target.value) || 3055)}
            min="1024"
            max="65535"
            disabled={isConnected}
          />
          <button 
            onClick={handleConnect}
            disabled={isConnected}
            className="primary"
          >
            Connect
          </button>
        </div>
      </div>

      <div className={`${styles.status} ${styles[connectionClass]}`}>
        <span dangerouslySetInnerHTML={{ __html: connectionStatus }} />
      </div>

      <div className={styles.section}>
        <button 
          onClick={handleDisconnect}
          disabled={!isConnected}
          className="secondary"
        >
          Disconnect
        </button>
      </div>

      {showProgress && progressData && (
        <div className={styles.section}>
          <h2>Operation Progress</h2>
          <div className={styles.progressMessage}>{progressData.message}</div>
          <div className={styles.progressBarContainer}>
            <div 
              className={styles.progressBar}
              style={{ width: `${progressData.progress}%` }}
            />
          </div>
          <div className={styles.progressInfo}>
            <div className={`${styles.progressStatus} ${progressData.status === 'completed' ? styles.completed : progressData.status === 'error' ? styles.error : ''}`}>
              {progressData.status === 'started' && 'Started'}
              {progressData.status === 'in_progress' && 'In Progress'}
              {progressData.status === 'completed' && 'Completed'}
              {progressData.status === 'error' && 'Error'}
            </div>
            <div className={styles.progressPercentage}>{progressData.progress}%</div>
          </div>
          {progressData.totalItems > 0 && (
            <div className={styles.progressInfo}>
              <span>Items processed: {progressData.processedItems} / {progressData.totalItems}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConnectionView; 
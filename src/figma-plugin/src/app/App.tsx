import React, { useState, useEffect } from "react";
import styles from "./app.module.scss";
import { router } from "../utils/hashRouter";
import ConnectionView from "./components/ConnectionView";
import AboutView from "./components/AboutView";
import { SettingsView } from "./components/SettingsView";

interface WebSocketCommand {
  id: string;
  command: string;
  params: Record<string, unknown>;
}

interface PluginMessage {
  type: string;
  id?: string;
  command?: string;
  result?: unknown;
  error?: string;
  [key: string]: unknown;
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('connection');
  const [pendingWebSocketCommands, setPendingWebSocketCommands] = useState<Map<string, WebSocketCommand>>(new Map());

  useEffect(() => {
    // Setup routes
    router.addRoute('/', () => {
      setActiveTab('connection');
    });
    
    router.addRoute('/connection', () => {
      setActiveTab('connection');
    });
    
    router.addRoute('/test-tools', () => {
      setActiveTab('test-tools');
    });
    
    // Keep old settings route for backward compatibility
    router.addRoute('/settings', () => {
      setActiveTab('test-tools');
    });
    
    router.addRoute('/about', () => {
      setActiveTab('about');
    });

    // Initialize router
    router.init();

    // Listen for messages from plugin controller
    const handlePluginMessage = (event: MessageEvent) => {
      const message = event.data.pluginMessage as PluginMessage;
      if (!message) return;

      console.log('📥 Received from plugin controller:', message);

      // Handle WebSocket command responses
      if (message.type === 'command-result' && message.id) {
        handleWebSocketCommandResult(message.id, message.result);
      } else if (message.type === 'command-error' && message.id) {
        handleWebSocketCommandError(message.id, message.error || 'Unknown error');
      } else if (message.type === 'command_progress') {
        handleProgressUpdate(message);
      } else {
        // Handle regular UI responses (non-WebSocket)
        console.log('📋 UI Response:', message);
      }
    };

    window.addEventListener('message', handlePluginMessage);

    // Cleanup on unmount
    return () => {
      router.destroy();
      window.removeEventListener('message', handlePluginMessage);
    };
  }, []);

  // Handle WebSocket command execution - reserved for future ConnectionView integration
  // This function is kept for future WebSocket integration
  const executeWebSocketCommand = React.useCallback((wsCommand: WebSocketCommand) => {
    console.log('🔗 Executing WebSocket command:', wsCommand);
    
    // Store the pending command
    setPendingWebSocketCommands(prev => new Map(prev.set(wsCommand.id, wsCommand)));
    
    // Send to plugin controller - preserve execute-command structure
    const message = {
      type: 'execute-command',
      webSocketCommandId: wsCommand.id,  // Mark this as WebSocket origin
      command: wsCommand.command,
      params: wsCommand.params
    };
    
    console.log('📤 Sending to plugin controller:', message);
    parent.postMessage({ pluginMessage: message }, '*');
  }, []);
  
  // Expose function to window for future WebSocket integration
  React.useEffect(() => {
    (window as unknown as { executeWebSocketCommand?: (cmd: WebSocketCommand) => void }).executeWebSocketCommand = executeWebSocketCommand;
    return () => {
      delete (window as unknown as { executeWebSocketCommand?: (cmd: WebSocketCommand) => void }).executeWebSocketCommand;
    };
  }, [executeWebSocketCommand]);

  // Handle WebSocket command success response
  const handleWebSocketCommandResult = (commandId: string, result: unknown) => {
    const command = pendingWebSocketCommands.get(commandId);
    if (!command) {
      // This is normal - ConnectionView handles WebSocket responses directly
      return;
    }

    console.log('✅ WebSocket command completed:', commandId, result);
    
    // Send response back to WebSocket (via ConnectionView)
    const connectionView = document.querySelector('[data-connection-view]') as HTMLElement & {
      sendSuccessResponse?: (id: string, result: unknown) => void;
    };
    if (connectionView && connectionView.sendSuccessResponse) {
      connectionView.sendSuccessResponse(commandId, result);
    }

    // Clean up
    setPendingWebSocketCommands(prev => {
      const newMap = new Map(prev);
      newMap.delete(commandId);
      return newMap;
    });
  };

  // Handle WebSocket command error response
  const handleWebSocketCommandError = (commandId: string, error: string) => {
    const command = pendingWebSocketCommands.get(commandId);
    if (!command) {
      // This is normal - ConnectionView handles WebSocket responses directly
      return;
    }

    console.error('❌ WebSocket command failed:', commandId, error);
    
    // Send error response back to WebSocket (via ConnectionView)
    const connectionView = document.querySelector('[data-connection-view]') as HTMLElement & {
      sendErrorResponse?: (id: string, error: string) => void;
    };
    if (connectionView && connectionView.sendErrorResponse) {
      connectionView.sendErrorResponse(commandId, error);
    }

    // Clean up
    setPendingWebSocketCommands(prev => {
      const newMap = new Map(prev);
      newMap.delete(commandId);
      return newMap;
    });
  };

  // Handle progress updates
  const handleProgressUpdate = (message: PluginMessage) => {
    console.log('📊 Progress update:', message);
    
    // Forward progress to WebSocket if it's a WebSocket command
    if (message.commandId && pendingWebSocketCommands.has(message.commandId as string)) {
      const connectionView = document.querySelector('[data-connection-view]') as HTMLElement & {
        sendProgressUpdate?: (message: PluginMessage) => void;
      };
      if (connectionView && connectionView.sendProgressUpdate) {
        connectionView.sendProgressUpdate(message);
      }
    }
  };

  const handleTabClick = (tab: string) => {
    router.navigate(`/${tab}`);
  };

  const handleSendMessage = (type: string, data?: Record<string, unknown>) => {
    const message = Object.assign({ type }, data);
    console.log('📤 Sending to plugin controller:', message);
    
    // Send message to plugin controller
    parent.postMessage({ pluginMessage: message }, '*');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'connection':
        return <ConnectionView />;
      case 'test-tools':
        return <SettingsView onSendMessage={handleSendMessage} />;
      case 'about':
        return <AboutView />;
      default:
        return <ConnectionView />;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLogo}>
          <img
            className={styles.headerLogoImage}
            src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAMAAAANIilAAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAJcEhZcwAAEJwAABCcASbNOjQAAAB1UExURUdwTP////////////////39/f////////////////////////////7+/v////////////39/f////////////////////////////////////////////////////39/fn5+ejo6P///+rq6uXl5f////Ly8gf4a04AAAAkdFJOUwAOdkZCfz04zIgbT0pkIagnm7C9b6C2LWqSxBMyB11W2Ovsy3D12ZYAAALtSURBVEjHndcJt6ogEADgXNAUcWlxSQVN3/3/P/EBAgJpWdM9p5ue78xANE2n05vIUduffgvn1oA0bX+hvRc1DYjTPHe+tiGIoqhx4zTNq/y72lMURQtmqasuPc4dAmgwfWuZrqquiw8uNnC5BRJT3YXhIZ7Xris0oLjlmOrArz7VHpOb6wpNee0ITVMHvvd25/qgvtFwla8dpxV7xnTi7dbed7iuTY16lZoV7iXQb3cqRgjVgoviKTZSUw2719pbD2OEVu5yjnqeOpZ75lMMobVzfUcwC6lrofGJpdb3jGtj6TkkNKRWtXMsU+ciNdfQUwe+zZ7/vo1CYYgv39G/kShMS6mHL+g8F96K2Uqi52E6j3DFnsc4uR/hMwugYd9bOLoeSTvPE1yx4/sLh9B9fKbziHVM3z/G+dKb5wdKdysxsNCc4+2l/yk7EnrOVhwGBt9auqJ0t9gR13C4cl77bdil88SPuK9jxrXksHjab48Mwo+4ha3aSbZJ52JpC4GFbY7OdsVst4Lls/mKZe1y6fXTonS3RFsIN7C5dAJsO+WiI21jbd8xesFEtoUdLLjH+qGNJ9WRuj3MOOQNycaV6khvsLc0MxsD2Uq7bhcHuBZh4rFdujjT1c6GkaXtszCx3sW3MRRfNjwiI7EjGjGfFjZwUgM9CuNggqRVXz+vOGDTBOCP5UnHE73ghjK1jYNlEIma9UnHBb/qdkvq1MSQjk4yCvGk4UneQylLbWAIio3I1t26q4sNTuM01tqQe9+My5pYv9wk8Ypv92w7JpXYulGoD8aJ3C/bUUp8tW5EuTa2oXI7ZGLzahZYE0l03QqZWI8Lfh1lw+zxEoNIrF8Dm/NQT8rzgz+WP/oQmL6Ud4pud/4DZzMWPKjXZfJufOyiVzzKV4/609yelDaWiZsDc6+DSwOLxNqxeD/6Ah3zf674+Kyf3xUeDi3WDFIKzCpOv/5phB4MD+cs/OWXVdych/GBf/xJd4pL9+1i/wOElMO5v/co4wAAAABJRU5ErkJggg=="
            alt="Logo"
          />
        </div>
        <div className={styles.headerText}>
          <h1>Cursor Talk To Figma Plugin</h1>
          <p>Connect Figma to Cursor AI using MCP</p>
        </div>
      </div>

      <div className={styles.tabs}>
        <div 
          className={`${styles.tab} ${activeTab === 'connection' ? styles.active : ''}`}
          onClick={() => handleTabClick('connection')}
        >
          Connection
        </div>
        <div 
          className={`${styles.tab} ${activeTab === 'test-tools' ? styles.active : ''}`}
          onClick={() => handleTabClick('test-tools')}
        >
          Test Tools
        </div>
        <div 
          className={`${styles.tab} ${activeTab === 'about' ? styles.active : ''}`}
          onClick={() => handleTabClick('about')}
        >
          About
        </div>
      </div>

      <div className={styles.tabContent}>
        {renderContent()}
      </div>
    </div>
  );
};

export default App;

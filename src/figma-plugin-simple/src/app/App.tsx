import React, { useState, useEffect } from "react";
import styles from "./app.module.scss";
import { router } from "../utils/hashRouter";
import ConnectionView from "./components/ConnectionView";
import AboutView from "./components/AboutView";
import { SettingsView } from "./components/SettingsView";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('connection');

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

    // Cleanup on unmount
    return () => {
      router.destroy();
    };
  }, []);

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

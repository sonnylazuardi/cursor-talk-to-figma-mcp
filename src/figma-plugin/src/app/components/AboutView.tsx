import React from "react";
import styles from "../app.module.scss";

const AboutView: React.FC = () => {
  return (
    <div className={styles.settingsContainer}>
      <div className={styles.section}>
        <h1>About Cursor Talk To Figma Plugin</h1>
        <p>
          This plugin allows Cursor AI to communicate with Figma, enabling
          AI-assisted design operations. Created by{' '}
          <a 
            className={styles.link}
            onClick={() => window.open('https://github.com/sonnylazuardi', '_blank')}
          >
            Sonny
          </a>
        </p>
        <p>Version: 1.0.0</p>

        <h2>How to Use</h2>
        <ol>
          <li>Make sure the MCP server is running in Cursor</li>
          <li>Connect to the server using the port number (default: 3055)</li>
          <li>Once connected, you can interact with Figma through Cursor</li>
          <li>Use the Settings tab to test various Figma operations</li>
          <li>The plugin will communicate with your Figma document in real-time</li>
        </ol>

        <h2>Features</h2>
        <ol>
          <li><strong>Document Management:</strong> Get document info, read selections, and node details</li>
          <li><strong>Element Creation:</strong> Create rectangles, text, frames, and other Figma elements</li>
          <li><strong>Text Operations:</strong> Scan and modify text content in your designs</li>
          <li><strong>Layout Controls:</strong> Manage auto-layout, padding, and spacing</li>
          <li><strong>Styling:</strong> Apply colors, strokes, and corner radius to elements</li>
          <li><strong>Annotations:</strong> View and manage design annotations</li>
          <li><strong>Node Management:</strong> Clone, resize, export, and manipulate design elements</li>
        </ol>

        <h2>Technical Details</h2>
        <p>
          This plugin uses WebSocket communication to connect with the MCP (Model Context Protocol) server 
          running in Cursor, enabling seamless AI-assisted design workflows.
        </p>
      </div>
    </div>
  );
};

export default AboutView; 
// Document & Selection controls
import React from 'react';

interface DocumentControlsProps {
  onSendMessage: (type: string, data?: unknown) => void;
}

export const DocumentControls: React.FC<DocumentControlsProps> = ({ onSendMessage }) => {
  return (
    <div className="control-group">
      <h3>📄 Document & Selection</h3>
      <div className="button-row">
        <button onClick={() => onSendMessage('command', { command: 'get_document_info' })}>
          Get Document Info
        </button>
        <button onClick={() => onSendMessage('command', { command: 'get_selection' })}>
          Get Selection
        </button>
      </div>
      <div className="button-row">
        <button onClick={() => onSendMessage('command', { command: 'get_node_info', params: { nodeId: 'selected' } })}>
          Get Node Info
        </button>
        <button onClick={() => onSendMessage('command', { command: 'read_my_design' })}>
          Read Design
        </button>
      </div>
    </div>
  );
}; 
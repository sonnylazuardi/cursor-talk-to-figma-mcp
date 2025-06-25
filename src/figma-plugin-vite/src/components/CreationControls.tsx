// Creation controls
import React from 'react';

interface CreationControlsProps {
  onSendMessage: (type: string, data?: unknown) => void;
}

export const CreationControls: React.FC<CreationControlsProps> = ({ onSendMessage }) => {
  return (
    <div className="control-group">
      <h3>✨ Create Elements</h3>
      <div className="button-row">
        <button onClick={() => onSendMessage('command', { 
          command: 'create_rectangle', 
          params: { x: 100, y: 100, width: 100, height: 100 } 
        })}>
          Create Rectangle
        </button>
        <button onClick={() => onSendMessage('command', { 
          command: 'create_frame', 
          params: { x: 200, y: 100, width: 150, height: 150 } 
        })}>
          Create Frame
        </button>
      </div>
      <div className="button-row">
        <button onClick={() => onSendMessage('command', { 
          command: 'create_text', 
          params: { x: 50, y: 50, text: 'Hello Figma!' } 
        })}>
          Create Text
        </button>
        <button onClick={() => onSendMessage('command', { 
          command: 'create_component_instance', 
          params: { componentKey: 'sample', x: 300, y: 100 } 
        })}>
          Create Instance
        </button>
      </div>
    </div>
  );
}; 
import React from 'react';
import './App.scss';

function App() {
  const executeCommand = (command: string, params?: unknown) => {
    const id = Math.random().toString(36).substring(7);

    // Send command to plugin
    parent.postMessage({
      pluginMessage: {
        type: 'test-command',
        id,
        command,
        params
      }
    }, '*');
  };

  // Listen for messages from plugin
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type, id, result, error } = event.data.pluginMessage || {};
      
      if (type === 'command-result') {
        console.log(`✅ Command result for ${id}:`, result);
      } else if (type === 'command-error') {
        console.error(`❌ Command error for ${id}:`, error);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="app">
      <div className="header">
        <h2>MCP Plugin Test Interface</h2>
      </div>

      <div className="commands-grid">
        {/* Document Commands */}
        <button onClick={() => executeCommand('get_document_info')}>
          Get Document Info
        </button>
        <button onClick={() => executeCommand('get_selection')}>
          Get Selection
        </button>
        <button onClick={() => executeCommand('read_my_design')}>
          Read My Design
        </button>
        <button onClick={() => executeCommand('get_styles')}>
          Get Styles
        </button>
        <button onClick={() => executeCommand('get_local_components')}>
          Get Local Components
        </button>
        <button onClick={() => executeCommand('get_annotations')}>
          Get Annotations
        </button>

        {/* Node Commands */}
        <button onClick={() => executeCommand('get_node_info', { nodeId: 'test-id' })}>
          Get Node Info
        </button>
        <button onClick={() => executeCommand('get_nodes_info', { nodeIds: ['test-id-1', 'test-id-2'] })}>
          Get Nodes Info
        </button>
        <button onClick={() => executeCommand('scan_text_nodes', { nodeId: 'test-id' })}>
          Scan Text Nodes
        </button>
        <button onClick={() => executeCommand('scan_nodes_by_types', { nodeId: 'test-id', types: ['FRAME', 'TEXT'] })}>
          Scan Nodes by Types
        </button>

        {/* Creation Commands */}
        <button onClick={() => executeCommand('create_rectangle', { x: 100, y: 100, width: 200, height: 100 })}>
          Create Rectangle
        </button>
        <button onClick={() => executeCommand('create_frame', { x: 300, y: 100, width: 200, height: 150 })}>
          Create Frame
        </button>
        <button onClick={() => executeCommand('create_text', { x: 500, y: 100, text: 'Hello World' })}>
          Create Text
        </button>
        <button onClick={() => executeCommand('create_component_instance', { componentKey: 'test-key', x: 100, y: 300 })}>
          Create Component Instance
        </button>

        {/* Modification Commands */}
        <button onClick={() => executeCommand('set_fill_color', { nodeId: 'test-id', color: { r: 1, g: 0, b: 0, a: 1 } })}>
          Set Fill Color
        </button>
        <button onClick={() => executeCommand('set_stroke_color', { nodeId: 'test-id', color: { r: 0, g: 1, b: 0, a: 1 }, weight: 2 })}>
          Set Stroke Color
        </button>
        <button onClick={() => executeCommand('move_node', { nodeId: 'test-id', x: 200, y: 200 })}>
          Move Node
        </button>
        <button onClick={() => executeCommand('resize_node', { nodeId: 'test-id', width: 300, height: 200 })}>
          Resize Node
        </button>
        <button onClick={() => executeCommand('set_corner_radius', { nodeId: 'test-id', radius: 10 })}>
          Set Corner Radius
        </button>
        <button onClick={() => executeCommand('set_text_content', { nodeId: 'test-id', text: 'Updated Text' })}>
          Set Text Content
        </button>

        {/* Layout Commands */}
        <button onClick={() => executeCommand('set_layout_mode', { nodeId: 'test-id', layoutMode: 'HORIZONTAL' })}>
          Set Layout Mode
        </button>
        <button onClick={() => executeCommand('set_padding', { nodeId: 'test-id', paddingTop: 10, paddingLeft: 10 })}>
          Set Padding
        </button>
        <button onClick={() => executeCommand('set_axis_align', { nodeId: 'test-id', primaryAxisAlignItems: 'CENTER' })}>
          Set Axis Align
        </button>
        <button onClick={() => executeCommand('set_layout_sizing', { nodeId: 'test-id', layoutSizingHorizontal: 'HUG' })}>
          Set Layout Sizing
        </button>
        <button onClick={() => executeCommand('set_item_spacing', { nodeId: 'test-id', itemSpacing: 20 })}>
          Set Item Spacing
        </button>

        {/* Utility Commands */}
        <button onClick={() => executeCommand('clone_node', { nodeId: 'test-id', x: 400, y: 400 })}>
          Clone Node
        </button>
        <button onClick={() => executeCommand('delete_node', { nodeId: 'test-id' })}>
          Delete Node
        </button>
        <button onClick={() => executeCommand('delete_multiple_nodes', { nodeIds: ['test-id-1', 'test-id-2'] })}>
          Delete Multiple Nodes
        </button>
        <button onClick={() => executeCommand('export_node_as_image', { nodeId: 'test-id', format: 'PNG' })}>
          Export Node as Image
        </button>

        {/* Text Processing Commands */}
        <button onClick={() => executeCommand('set_multiple_text_contents', { nodeId: 'test-id', text: [{ nodeId: 'text-1', text: 'New Text' }] })}>
          Set Multiple Text Contents
        </button>

        {/* Annotation Commands */}
        <button onClick={() => executeCommand('set_annotation', { nodeId: 'test-id', labelMarkdown: 'Test annotation' })}>
          Set Annotation
        </button>
        <button onClick={() => executeCommand('set_multiple_annotations', { nodeId: 'test-id', annotations: [{ nodeId: 'test-id', labelMarkdown: 'Test' }] })}>
          Set Multiple Annotations
        </button>

        {/* Instance Commands */}
        <button onClick={() => executeCommand('get_instance_overrides')}>
          Get Instance Overrides
        </button>
        <button onClick={() => executeCommand('set_instance_overrides', { targetNodeIds: ['test-id'], sourceInstanceId: 'source-id' })}>
          Set Instance Overrides
        </button>

        {/* Reaction Commands */}
        <button onClick={() => executeCommand('get_reactions', { nodeIds: ['test-id-1', 'test-id-2'] })}>
          Get Reactions
        </button>
        <button onClick={() => executeCommand('set_default_connector')}>
          Set Default Connector
        </button>
        <button onClick={() => executeCommand('create_connections', { connections: [{ startNodeId: 'start-id', endNodeId: 'end-id' }] })}>
          Create Connections
        </button>
      </div>

      <div className="footer">
        <p>Check the console for command results and errors.</p>
      </div>
    </div>
  );
}

export default App;

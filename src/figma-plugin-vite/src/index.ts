// Import shared types
import type { 
  CommandProgressUpdate, 
  FigmaCommand,
  CommandParams
} from '../../types/types';

// Import component functions
import { generateCommandId } from './components/utils';
import { getDocumentInfo, getSelection, readMyDesign, getNodeInfo, getNodesInfo } from './components/document';
import { createRectangle, createFrame, createText, moveNode, resizeNode, cloneNode, deleteNode, deleteMultipleNodes } from './components/creation';
import { setFillColor, setStrokeColor, setCornerRadius, getStyles, getLocalComponents } from './components/styling';

// Declare figma global - will be properly typed later
declare const figma: any;
declare const __html__: string;

// TODO: Import component functions when they are ready
// import { generateCommandId } from './components/utils';
// import { getDocumentInfo, getSelection, readMyDesign, getNodeInfo, getNodesInfo } from './components/document';
// import { createRectangle, createFrame, createText, moveNode, resizeNode, cloneNode, deleteNode, deleteMultipleNodes } from './components/creation';
// import { setFillColor, setStrokeColor, setCornerRadius, getStyles, getLocalComponents } from './components/styling';

// Plugin state interface
interface PluginState {
  serverPort: number;
}

// Plugin state
const state: PluginState = {
  serverPort: 3055, // Default port
};

// Show UI with larger size for testing
figma.showUI(__html__, { width: 400, height: 600 });

// Helper function for progress updates
function sendProgressUpdate(
  commandId: string,
  commandType: string,
  status: 'started' | 'in_progress' | 'completed' | 'error',
  progress: number,
  totalItems: number,
  processedItems: number,
  message: string,
  payload: { currentChunk?: number; totalChunks?: number; chunkSize?: number; [key: string]: unknown } | null = null
): CommandProgressUpdate {
  const update: CommandProgressUpdate = {
    type: 'command_progress',
    commandId,
    commandType,
    status,
    progress,
    totalItems,
    processedItems,
    message,
    timestamp: Date.now(),
  };

  // Add optional chunk information if present
  if (payload) {
    if (payload.currentChunk !== undefined && payload.totalChunks !== undefined) {
      update.currentChunk = payload.currentChunk;
      update.totalChunks = payload.totalChunks;
      update.chunkSize = payload.chunkSize;
    }
    update.payload = payload;
  }

  // Send to UI
  figma.ui.postMessage(update);
  console.log(`Progress update: ${status} - ${progress}% - ${message}`);

  return update;
}

// Enhanced command handler with all commands implemented
async function handleCommand<T extends FigmaCommand>(
  command: T, 
  params?: CommandParams[T]
): Promise<unknown> {
  const commandId = generateCommandId();
  
  try {
    sendProgressUpdate(commandId, command, 'started', 0, 1, 0, `Starting ${command}...`);
    
    let result: unknown;
    
    switch (command) {
      // Document & Selection
      case 'get_document_info':
        result = await getDocumentInfo();
        break;
      case 'get_selection':
        result = await getSelection();
        break;
      case 'read_my_design':
        result = await readMyDesign();
        break;
      case 'get_node_info':
        result = await getNodeInfo(params as CommandParams['get_node_info']);
        break;
      case 'get_nodes_info':
        result = await getNodesInfo(params as CommandParams['get_nodes_info']);
        break;
        
      // Creation & Modification
      case 'create_rectangle':
        result = await createRectangle(params as CommandParams['create_rectangle']);
        break;
      case 'create_frame':
        result = await createFrame(params as CommandParams['create_frame']);
        break;
      case 'create_text':
        result = await createText(params as CommandParams['create_text']);
        break;
      case 'move_node':
        result = await moveNode(params as CommandParams['move_node']);
        break;
      case 'resize_node':
        result = await resizeNode(params as CommandParams['resize_node']);
        break;
      case 'clone_node':
        result = await cloneNode(params as CommandParams['clone_node']);
        break;
      case 'delete_node':
        result = await deleteNode(params as CommandParams['delete_node']);
        break;
      case 'delete_multiple_nodes':
        result = await deleteMultipleNodes(params as CommandParams['delete_multiple_nodes']);
        break;
        
      // Styling
      case 'set_fill_color':
        result = await setFillColor(params as CommandParams['set_fill_color']);
        break;
      case 'set_stroke_color':
        result = await setStrokeColor(params as CommandParams['set_stroke_color']);
        break;
      case 'set_corner_radius':
        result = await setCornerRadius(params as CommandParams['set_corner_radius']);
        break;
      case 'get_styles':
        result = await getStyles();
        break;
      case 'get_local_components':
        result = await getLocalComponents();
        break;
        
      // TODO: Implement remaining commands from code.js
      // These would need additional implementation in components/
      case 'create_component_instance':
      case 'get_instance_overrides':
      case 'set_instance_overrides':
      case 'export_node_as_image':
      case 'set_text_content':
      case 'scan_text_nodes':
      case 'set_multiple_text_contents':
      case 'get_annotations':
      case 'set_annotation':
      case 'set_multiple_annotations':
      case 'scan_nodes_by_types':
      case 'set_layout_mode':
      case 'set_padding':
      case 'set_axis_align':
      case 'set_layout_sizing':
      case 'set_item_spacing':
      case 'get_reactions':
      case 'set_default_connector':
      case 'create_connections':
      case 'join':
        throw new Error(`Command ${command} not implemented yet in TypeScript version. Using legacy JavaScript implementation.`);
        
      default:
        throw new Error(`Unknown command: ${command}`);
    }
    
    sendProgressUpdate(commandId, command, 'completed', 100, 1, 1, `Completed ${command}`);
    return result;
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    sendProgressUpdate(commandId, command, 'error', 0, 1, 0, `Error in ${command}: ${errorMessage}`);
    throw error;
  }
}

// UI message handler
figma.ui.onmessage = async (msg: { type: string; command?: string; params?: unknown; id?: string; message?: string; [key: string]: unknown }) => {
  switch (msg.type) {
    case 'test-command':
      try {
        if (!msg.command) {
          throw new Error('Command is required');
        }
        console.log(`🚀 Executing command: ${msg.command}`, msg.params);
        const result = await handleCommand(msg.command as FigmaCommand, msg.params as any);
        
        figma.ui.postMessage({
          type: 'command-result',
          id: msg.id,
          result,
        });
        
        console.log(`✅ Command completed: ${msg.command}`, result);
        figma.notify(`✅ ${msg.command} executed successfully`);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ Command failed: ${msg.command}`, error);
        
        figma.ui.postMessage({
          type: 'command-error',
          id: msg.id,
          error: errorMessage,
        });
        
        figma.notify(`❌ Error: ${errorMessage}`);
      }
      break;
    case 'notify':
      figma.notify(msg.message);
      break;
    case 'close-plugin':
      figma.closePlugin();
      break;
  }
};

// Initialize plugin
(async function initializePlugin() {
  try {
    const savedSettings = await figma.clientStorage.getAsync('settings');
    if (savedSettings && savedSettings.serverPort) {
      state.serverPort = savedSettings.serverPort;
    }

    // Send initial settings to UI
    figma.ui.postMessage({
      type: 'init-settings',
      settings: {
        serverPort: state.serverPort,
      },
    });
    
    figma.notify('🚀 MCP Plugin initialized');
    console.log('🎨 Figma Plugin initialized - TypeScript version with component architecture');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error loading settings:', errorMessage);
  }
})();

// Suppress unused variable warning for sendProgressUpdate - it will be used when more commands are implemented
void sendProgressUpdate;

// Layout Management service for node manipulation operations
import { 
  MoveNodeParams, 
  ResizeNodeParams, 
  DeleteNodeParams,
  DeleteMultipleNodesParams,
  CloneNodeParams,
  NodeInfo 
} from '../types';

export class LayoutManagementService {
  async moveNode(params: MoveNodeParams): Promise<NodeInfo> {
    const { nodeId, x, y } = params;

    if (!nodeId) {
      throw new Error("Missing nodeId parameter");
    }

    if (x === undefined || y === undefined) {
      throw new Error("Missing x or y parameter");
    }

    const node = await figma.getNodeByIdAsync(nodeId);
    if (!node) {
      throw new Error(`Node not found with ID: ${nodeId}`);
    }

    if (!('x' in node) || !('y' in node)) {
      throw new Error(`Node does not support positioning: ${nodeId}`);
    }

    try {
      const positionNode = node as SceneNode;
      positionNode.x = x;
      positionNode.y = y;

      return {
        id: node.id,
        name: node.name,
        type: node.type,
        visible: 'visible' in node ? node.visible : undefined,
        x: positionNode.x,
        y: positionNode.y,
        width: 'width' in positionNode ? positionNode.width : undefined,
        height: 'height' in positionNode ? positionNode.height : undefined,
      };
    } catch (error) {
      throw new Error(`Error moving node: ${(error as Error).message}`);
    }
  }

  async resizeNode(params: ResizeNodeParams): Promise<NodeInfo> {
    const { nodeId, width, height } = params;

    if (!nodeId) {
      throw new Error("Missing nodeId parameter");
    }

    if (width === undefined || height === undefined) {
      throw new Error("Missing width or height parameter");
    }

    const node = await figma.getNodeByIdAsync(nodeId);
    if (!node) {
      throw new Error(`Node not found with ID: ${nodeId}`);
    }

    if (!('resize' in node)) {
      throw new Error(`Node does not support resizing: ${nodeId}`);
    }

    try {
      const resizableNode = node as SceneNode & { resize: (width: number, height: number) => void };
      resizableNode.resize(width, height);

      return {
        id: node.id,
        name: node.name,
        type: node.type,
        visible: 'visible' in node ? node.visible : undefined,
        x: 'x' in resizableNode ? resizableNode.x : undefined,
        y: 'y' in resizableNode ? resizableNode.y : undefined,
        width: resizableNode.width,
        height: resizableNode.height,
      };
    } catch (error) {
      throw new Error(`Error resizing node: ${(error as Error).message}`);
    }
  }

  async deleteNode(params: DeleteNodeParams): Promise<{ success: boolean; nodeId: string }> {
    const { nodeId } = params;

    if (!nodeId) {
      throw new Error("Missing nodeId parameter");
    }

    const node = await figma.getNodeByIdAsync(nodeId);
    if (!node) {
      throw new Error(`Node not found with ID: ${nodeId}`);
    }

    try {
      node.remove();
      return {
        success: true,
        nodeId: nodeId,
      };
    } catch (error) {
      throw new Error(`Error deleting node: ${(error as Error).message}`);
    }
  }

  async deleteMultipleNodes(params: DeleteMultipleNodesParams): Promise<{
    success: boolean;
    deletedCount: number;
    failedCount: number;
    results: Array<{ nodeId: string; success: boolean; error?: string }>;
  }> {
    const { nodeIds } = params;

    if (!nodeIds || !Array.isArray(nodeIds)) {
      throw new Error("Missing or invalid nodeIds parameter");
    }

    const results: Array<{ nodeId: string; success: boolean; error?: string }> = [];
    let deletedCount = 0;
    let failedCount = 0;

    for (const nodeId of nodeIds) {
      try {
        await this.deleteNode({ nodeId });
        results.push({ nodeId, success: true });
        deletedCount++;
      } catch (error) {
        results.push({ 
          nodeId, 
          success: false, 
          error: (error as Error).message 
        });
        failedCount++;
      }
    }

    return {
      success: true,
      deletedCount,
      failedCount,
      results,
    };
  }

  async cloneNode(params: CloneNodeParams): Promise<NodeInfo> {
    const { nodeId, x, y } = params;

    if (!nodeId) {
      throw new Error("Missing nodeId parameter");
    }

    const node = await figma.getNodeByIdAsync(nodeId);
    if (!node) {
      throw new Error(`Node not found with ID: ${nodeId}`);
    }

    if (!('clone' in node)) {
      throw new Error(`Node does not support cloning: ${nodeId}`);
    }

    try {
      const clonableNode = node as SceneNode;
      const clonedNode = clonableNode.clone();
      
      // Position the cloned node if coordinates provided
      if (x !== undefined && y !== undefined && 'x' in clonedNode && 'y' in clonedNode) {
        clonedNode.x = x;
        clonedNode.y = y;
      } else if (x !== undefined && y !== undefined) {
        // If no positioning support but coordinates provided, add offset
        if ('x' in node && 'y' in node) {
          const originalNode = node as SceneNode;
          if ('x' in clonedNode && 'y' in clonedNode) {
            clonedNode.x = originalNode.x + (x || 20);
            clonedNode.y = originalNode.y + (y || 20);
          }
        }
      }

      // Add to same parent or current page
      if (node.parent) {
        if ('appendChild' in node.parent) {
          const parentNode = node.parent as FrameNode | PageNode | ComponentNode | InstanceNode;
          parentNode.appendChild(clonedNode);
        }
      } else {
        figma.currentPage.appendChild(clonedNode);
      }

      return {
        id: clonedNode.id,
        name: clonedNode.name,
        type: clonedNode.type,
        visible: 'visible' in clonedNode ? clonedNode.visible : undefined,
        x: 'x' in clonedNode ? clonedNode.x : undefined,
        y: 'y' in clonedNode ? clonedNode.y : undefined,
        width: 'width' in clonedNode ? clonedNode.width : undefined,
        height: 'height' in clonedNode ? clonedNode.height : undefined,
      };
    } catch (error) {
      throw new Error(`Error cloning node: ${(error as Error).message}`);
    }
  }
} 
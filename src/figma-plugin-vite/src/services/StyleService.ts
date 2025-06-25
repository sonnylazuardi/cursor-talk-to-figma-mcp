// Style service for styling operations
import { 
  SetFillColorParams,
  SetStrokeColorParams,
  SetCornerRadiusParams,
  StyleInfo,
  NodeInfo
} from '../../../types/types';

export class StyleService {
  async setFillColor(params: SetFillColorParams): Promise<NodeInfo> {
    const { nodeId, color } = params;

    if (!nodeId) {
      throw new Error("Missing nodeId parameter");
    }

    if (!color) {
      throw new Error("Missing color parameter");
    }

    const node = await figma.getNodeByIdAsync(nodeId);
    if (!node) {
      throw new Error(`Node not found with ID: ${nodeId}`);
    }

    if (!('fills' in node)) {
      throw new Error(`Node does not support fills: ${nodeId}`);
    }

    try {
      const fillNode = node as SceneNode & { fills: Paint[] };
      fillNode.fills = [{
        type: 'SOLID',
        color: { r: color.r, g: color.g, b: color.b },
        opacity: color.a !== undefined ? color.a : 1
      }];

      const sceneNode = node as SceneNode;
      return {
        id: node.id,
        name: node.name,
        type: node.type,
        x: 'x' in sceneNode ? sceneNode.x : undefined,
        y: 'y' in sceneNode ? sceneNode.y : undefined,
        width: 'width' in sceneNode ? sceneNode.width : undefined,
        height: 'height' in sceneNode ? sceneNode.height : undefined,
      };
    } catch (error) {
      throw new Error(`Error setting fill color: ${(error as Error).message}`);
    }
  }

  async setStrokeColor(params: SetStrokeColorParams): Promise<NodeInfo> {
    const { nodeId, color, weight } = params;

    if (!nodeId) {
      throw new Error("Missing nodeId parameter");
    }

    if (!color) {
      throw new Error("Missing color parameter");
    }

    const node = await figma.getNodeByIdAsync(nodeId);
    if (!node) {
      throw new Error(`Node not found with ID: ${nodeId}`);
    }

    if (!('strokes' in node) || !('strokeWeight' in node)) {
      throw new Error(`Node does not support strokes: ${nodeId}`);
    }

    try {
      const strokeNode = node as SceneNode & { strokes: Paint[]; strokeWeight: number };
      strokeNode.strokes = [{
        type: 'SOLID',
        color: { r: color.r, g: color.g, b: color.b },
        opacity: color.a !== undefined ? color.a : 1
      }];

      if (weight !== undefined) {
        strokeNode.strokeWeight = weight;
      }

      const sceneNode = node as SceneNode;
      return {
        id: node.id,
        name: node.name,
        type: node.type,
        x: 'x' in sceneNode ? sceneNode.x : undefined,
        y: 'y' in sceneNode ? sceneNode.y : undefined,
        width: 'width' in sceneNode ? sceneNode.width : undefined,
        height: 'height' in sceneNode ? sceneNode.height : undefined,
      };
    } catch (error) {
      throw new Error(`Error setting stroke color: ${(error as Error).message}`);
    }
  }

  async setCornerRadius(params: SetCornerRadiusParams): Promise<NodeInfo> {
    const { nodeId, radius, corners } = params;

    if (!nodeId) {
      throw new Error("Missing nodeId parameter");
    }

    if (radius === undefined) {
      throw new Error("Missing radius parameter");
    }

    const node = await figma.getNodeByIdAsync(nodeId);
    if (!node) {
      throw new Error(`Node not found with ID: ${nodeId}`);
    }

    if (!('cornerRadius' in node)) {
      throw new Error(`Node does not support corner radius: ${nodeId}`);
    }

    try {
      const cornerNode = node as SceneNode & { 
        cornerRadius: number;
        topLeftRadius?: number;
        topRightRadius?: number;
        bottomRightRadius?: number;
        bottomLeftRadius?: number;
      };
      
      if (corners && corners.length === 4) {
        // Set individual corner radii
        if (corners[0]) cornerNode.topLeftRadius = radius;
        if (corners[1]) cornerNode.topRightRadius = radius;
        if (corners[2]) cornerNode.bottomRightRadius = radius;
        if (corners[3]) cornerNode.bottomLeftRadius = radius;
      } else {
        // Set uniform corner radius
        cornerNode.cornerRadius = radius;
      }

      const sceneNode = node as SceneNode;
      return {
        id: node.id,
        name: node.name,
        type: node.type,
        x: 'x' in sceneNode ? sceneNode.x : undefined,
        y: 'y' in sceneNode ? sceneNode.y : undefined,
        width: 'width' in sceneNode ? sceneNode.width : undefined,
        height: 'height' in sceneNode ? sceneNode.height : undefined,
      };
    } catch (error) {
      throw new Error(`Error setting corner radius: ${(error as Error).message}`);
    }
  }

  async getStyles(): Promise<StyleInfo[]> {
    try {
      const paintStyles = await figma.getLocalPaintStylesAsync();
      const textStyles = await figma.getLocalTextStylesAsync();
      const effectStyles = await figma.getLocalEffectStylesAsync();

      const allStyles = [
        ...paintStyles.map(style => ({
          id: style.id,
          name: style.name,
          type: 'PAINT' as const,
          description: style.description || undefined,
        })),
        ...textStyles.map(style => ({
          id: style.id,
          name: style.name,
          type: 'TEXT' as const,
          description: style.description || undefined,
        })),
        ...effectStyles.map(style => ({
          id: style.id,
          name: style.name,
          type: 'EFFECT' as const,
          description: style.description || undefined,
        })),
      ];

      return allStyles;
    } catch (error) {
      throw new Error(`Error getting styles: ${(error as Error).message}`);
    }
  }
} 
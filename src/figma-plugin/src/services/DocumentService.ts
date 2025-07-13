// Document & Selection service
import { GetNodeInfoParams, GetNodesInfoParams, NodeInfo } from '@/types/types';

export class DocumentService {
  /**
   * Get information about the current Figma document
   */
  async getDocumentInfo(): Promise<unknown> {
    await figma.currentPage.loadAsync();
    const page = figma.currentPage;
    
    return {
      name: page.name,
      id: page.id,
      type: page.type,
      children: page.children.map((node) => ({
        id: node.id,
        name: node.name,
        type: node.type,
      })),
      currentPage: {
        id: page.id,
        name: page.name,
        childCount: page.children.length,
      },
      pages: [
        {
          id: page.id,
          name: page.name,
          childCount: page.children.length,
        },
      ],
    };
  }

  /**
   * Get information about the current selection
   */
  async getSelection(): Promise<{ selectionCount: number; selection: NodeInfo[] }> {
    return {
      selectionCount: figma.currentPage.selection.length,
      selection: figma.currentPage.selection.map((node) => ({
        id: node.id,
        name: node.name,
        type: node.type,
        visible: node.visible,
      })),
    };
  }

  /**
   * Get detailed node information about the current selection
   */
  async readMyDesign(): Promise<unknown> {
    try {
      // Load all selected nodes in parallel
      const nodes = await Promise.all(
        figma.currentPage.selection.map((node) => figma.getNodeByIdAsync(node.id))
      );

      // Filter out any null values (nodes that weren't found)
      const validNodes = nodes.filter((node) => node !== null);

      // Export all valid nodes in parallel
      const responses = await Promise.all(
        validNodes.map(async (node) => {
          // Type assertion for exportAsync
          const exportableNode = node as unknown as { exportAsync: (options: { format: string }) => Promise<{ document: Record<string, unknown> }> };
          const response = await exportableNode.exportAsync({
            format: 'JSON_REST_V1',
          });
          return {
            nodeId: node!.id,
            document: this.filterFigmaNode(response.document),
          };
        })
      );

      return responses;
    } catch (error) {
      throw new Error(`Error getting nodes info: ${(error as Error).message}`);
    }
  }

  /**
   * Get information about a specific node
   */
  async getNodeInfo(params: GetNodeInfoParams): Promise<unknown> {
    const { nodeId } = params;
    const node = await figma.getNodeByIdAsync(nodeId);

    if (!node) {
      throw new Error(`Node not found with ID: ${nodeId}`);
    }

    // Type assertion for exportAsync
    const exportableNode = node as unknown as { exportAsync: (options: { format: string }) => Promise<{ document: Record<string, unknown> }> };
    const response = await exportableNode.exportAsync({
      format: 'JSON_REST_V1',
    });

    return this.filterFigmaNode(response.document);
  }

  /**
   * Get information about multiple nodes
   */
  async getNodesInfo(params: GetNodesInfoParams): Promise<unknown> {
    const { nodeIds } = params;
    
    try {
      // Load all nodes in parallel
      const nodes = await Promise.all(
        nodeIds.map((id) => figma.getNodeByIdAsync(id))
      );

      // Filter out any null values (nodes that weren't found)
      const validNodes = nodes.filter((node) => node !== null);

      // Export all valid nodes in parallel
      const responses = await Promise.all(
        validNodes.map(async (node) => {
          // Type assertion for exportAsync
          const exportableNode = node as unknown as { exportAsync: (options: { format: string }) => Promise<{ document: Record<string, unknown> }> };
          const response = await exportableNode.exportAsync({
            format: 'JSON_REST_V1',
          });
          return {
            nodeId: node!.id,
            document: this.filterFigmaNode(response.document),
          };
        })
      );

      return responses;
    } catch (error) {
      throw new Error(`Error getting nodes info: ${(error as Error).message}`);
    }
  }

  /**
   * Filter and process Figma node data
   */
  private filterFigmaNode(node: Record<string, unknown>): Record<string, unknown> | null {
    if (node.type === 'VECTOR') {
      return null;
    }

    const filtered: Record<string, unknown> = {
      id: node.id,
      name: node.name,
      type: node.type,
    };

    if (node.fills && Array.isArray(node.fills) && node.fills.length > 0) {
      filtered.fills = node.fills.map((fill: Record<string, unknown>) => {
        const processedFill = Object.assign({}, fill);
        delete processedFill.boundVariables;
        delete processedFill.imageRef;

        if (processedFill.gradientStops && Array.isArray(processedFill.gradientStops)) {
          processedFill.gradientStops = processedFill.gradientStops.map(
            (stop: Record<string, unknown>) => {
              const processedStop = Object.assign({}, stop);
              if (processedStop.color && typeof processedStop.color === 'object') {
                processedStop.color = this.rgbaToHex(processedStop.color as { r: number; g: number; b: number; a?: number });
              }
              delete processedStop.boundVariables;
              return processedStop;
            }
          );
        }

        if (processedFill.color && typeof processedFill.color === 'object') {
          processedFill.color = this.rgbaToHex(processedFill.color as { r: number; g: number; b: number; a?: number });
        }

        return processedFill;
      });
    }

    if (node.strokes && Array.isArray(node.strokes) && node.strokes.length > 0) {
      filtered.strokes = node.strokes.map((stroke: Record<string, unknown>) => {
        const processedStroke = Object.assign({}, stroke);
        delete processedStroke.boundVariables;
        if (processedStroke.color && typeof processedStroke.color === 'object') {
          processedStroke.color = this.rgbaToHex(processedStroke.color as { r: number; g: number; b: number; a?: number });
        }
        return processedStroke;
      });
    }

    if (node.cornerRadius !== undefined) {
      filtered.cornerRadius = node.cornerRadius;
    }

    if (node.absoluteBoundingBox) {
      filtered.absoluteBoundingBox = node.absoluteBoundingBox;
    }

    if (node.characters) {
      filtered.characters = node.characters;
    }

    if (node.style && typeof node.style === 'object') {
      const style = node.style as Record<string, unknown>;
      filtered.style = {
        fontFamily: style.fontFamily,
        fontStyle: style.fontStyle,
        fontWeight: style.fontWeight,
        fontSize: style.fontSize,
        textAlignHorizontal: style.textAlignHorizontal,
        letterSpacing: style.letterSpacing,
        lineHeightPx: style.lineHeightPx,
      };
    }

    if (node.children && Array.isArray(node.children)) {
      filtered.children = node.children
        .map((child: Record<string, unknown>) => this.filterFigmaNode(child))
        .filter((child: Record<string, unknown> | null) => child !== null);
    }

    return filtered;
  }

  /**
   * Convert RGBA color to hex string
   */
  private rgbaToHex(color: { r: number; g: number; b: number; a?: number }): string {
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    const a = color.a !== undefined ? Math.round(color.a * 255) : 255;

    if (a === 255) {
      return (
        '#' +
        [r, g, b]
          .map((x) => x.toString(16).padStart(2, '0'))
          .join('')
      );
    }

    return (
      '#' +
      [r, g, b, a]
        .map((x) => x.toString(16).padStart(2, '0'))
        .join('')
    );
  }
} 
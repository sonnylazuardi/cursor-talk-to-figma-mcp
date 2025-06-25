/**
 * Document & Selection operations
 * Functions for reading document and node information
 */

import type {
  GetNodeInfoParams,
  GetNodesInfoParams,
} from "../../../types/types";
import { rgbaToHex } from "./utils";

// Figma plugin types are automatically available via tsconfig.json typeRoots

/**
 * Get document information
 */
export async function getDocumentInfo() {
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
 * Get current selection
 */
export async function getSelection() {
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
 * Read selected design nodes
 */
export async function readMyDesign() {
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
        if (!node) {
          throw new Error(`Node not found with ID: ${node}`);
        }
        const response = await (node as SceneNode).exportAsync({
          format: "JSON_REST_V1",
        });
        return {
          nodeId: node.id,
          document: filterFigmaNode(
            (response as { document: SceneNode }).document as any
          ),
        };
      })
    );

    return responses;
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Error getting nodes info: ${errorMessage}`);
  }
}

/**
 * Get information about a specific node
 */
export async function getNodeInfo(params: GetNodeInfoParams) {
  const { nodeId } = params;
  const node = await figma.getNodeByIdAsync(nodeId);

  if (!node) {
    throw new Error(`Node not found with ID: ${nodeId}`);
  }

  const response = await (node as SceneNode).exportAsync({
    format: "JSON_REST_V1",
  });

  return filterFigmaNode((response as { document: SceneNode }).document as any);
}

/**
 * Get information about multiple nodes
 */
export async function getNodesInfo(params: GetNodesInfoParams) {
  const { nodeIds } = params;

  try {
    // Load all nodes in parallel
    const nodes = await Promise.all(
      nodeIds.map((id: string) => figma.getNodeByIdAsync(id))
    );

    // Filter out any null values (nodes that weren't found)
    const validNodes = nodes.filter((node) => node !== null);

    // Export all valid nodes in parallel
    const responses = await Promise.all(
      validNodes.map(async (node) => {
        const response = await (node as SceneNode).exportAsync({
          format: "JSON_REST_V1",
        });
        return {
          nodeId: node!.id,
          document: filterFigmaNode((response as { document: SceneNode }).document),
        };
      })
    );

    return responses;
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Error getting nodes info: ${errorMessage}`);
  }
}

/**
 * Filter and process Figma node data
 * Note: Using any type due to complex Figma node type variations that are difficult to type safely
 */
export function filterFigmaNode(
  // @ts-expect-error - Complex Figma node types require flexible typing
  node: any
): Record<string, unknown> | null {
  if (node.type === "VECTOR") {
    return null;
  }

  const filtered: Record<string, unknown> = {
    id: node.id,
    name: node.name,
    type: node.type,
  };

  if (node.fills && node.fills.length > 0) {
    filtered.fills = (node.fills as unknown[]).map((fill) => {
      const processedFill = Object.assign({}, fill as Record<string, unknown>);
      delete processedFill.boundVariables;
      delete processedFill.imageRef;

      if (processedFill.gradientStops) {
        processedFill.gradientStops = (
          processedFill.gradientStops as unknown[]
        ).map((stop) => {
          const processedStop = Object.assign(
            {},
            stop as Record<string, unknown>
          );
          if (processedStop.color) {
            processedStop.color = rgbaToHex(
              processedStop.color as {
                r: number;
                g: number;
                b: number;
                a?: number;
              }
            );
          }
          delete processedStop.boundVariables;
          return processedStop;
        });
      }

      if (processedFill.color) {
        processedFill.color = rgbaToHex(
          processedFill.color as { r: number; g: number; b: number; a?: number }
        );
      }

      return processedFill;
    });
  }

  if (node.strokes && (node.strokes as unknown[]).length > 0) {
    filtered.strokes = (node.strokes as unknown[]).map((stroke) => {
      const processedStroke = Object.assign(
        {},
        stroke as Record<string, unknown>
      );
      delete processedStroke.boundVariables;
      if (processedStroke.color) {
        processedStroke.color = rgbaToHex(
          processedStroke.color as {
            r: number;
            g: number;
            b: number;
            a?: number;
          }
        );
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

  if (node.style) {
    filtered.style = {
      fontFamily: node.style.fontFamily,
      fontStyle: node.style.fontStyle,
      fontWeight: node.style.fontWeight,
      fontSize: node.style.fontSize,
      textAlignHorizontal: node.style.textAlignHorizontal,
      letterSpacing: node.style.letterSpacing,
      lineHeightPx: node.style.lineHeightPx,
    };
  }

  if (node.children) {
    filtered.children = (node.children as unknown[])
      .map((child) => {
        return filterFigmaNode(child as Record<string, unknown>);
      })
      .filter((child) => {
        return child !== null;
      });
  }

  return filtered;
}

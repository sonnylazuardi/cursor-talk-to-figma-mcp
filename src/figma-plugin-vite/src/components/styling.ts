/**
 * Styling & Appearance operations
 * Functions for modifying node appearance and styles
 */

import type { SetFillColorParams, SetStrokeColorParams, SetCornerRadiusParams } from '../../../types/types';

// Declare figma global - will be properly typed later
declare const figma: any;

/**
 * Set fill color of a node
 */
export async function setFillColor(params: SetFillColorParams) {
  const { nodeId, color } = params;
  const node = await figma.getNodeByIdAsync(nodeId);
  
  if (!node) {
    throw new Error(`Node not found with ID: ${nodeId}`);
  }
  
  // Check if node supports fills
  if (!('fills' in node)) {
    throw new Error(`Node type ${node.type} does not support fills`);
  }
  
  node.fills = [{
    type: 'SOLID',
    color: {
      r: color.r,
      g: color.g,
      b: color.b,
    },
    opacity: color.a !== undefined ? color.a : 1,
  }];
  
  return {
    nodeId: nodeId,
    color: color,
    success: true,
  };
}

/**
 * Set stroke color and weight of a node
 */
export async function setStrokeColor(params: SetStrokeColorParams) {
  const { nodeId, color, weight } = params;
  const node = await figma.getNodeByIdAsync(nodeId);
  
  if (!node) {
    throw new Error(`Node not found with ID: ${nodeId}`);
  }
  
  // Check if node supports strokes
  if (!('strokes' in node)) {
    throw new Error(`Node type ${node.type} does not support strokes`);
  }
  
  node.strokes = [{
    type: 'SOLID',
    color: {
      r: color.r,
      g: color.g,
      b: color.b,
    },
    opacity: color.a !== undefined ? color.a : 1,
  }];
  
  if (weight !== undefined) {
    node.strokeWeight = weight;
  }
  
  return {
    nodeId: nodeId,
    color: color,
    weight: weight,
    success: true,
  };
}

/**
 * Set corner radius of a node
 */
export async function setCornerRadius(params: SetCornerRadiusParams) {
  const { nodeId, radius, corners } = params;
  const node = await figma.getNodeByIdAsync(nodeId);
  
  if (!node) {
    throw new Error(`Node not found with ID: ${nodeId}`);
  }
  
  // Check if node supports corner radius
  if (!('cornerRadius' in node)) {
    throw new Error(`Node type ${node.type} does not support corner radius`);
  }
  
  if (corners && corners.length === 4) {
    // Set individual corner radii
    const [topLeft, topRight, bottomRight, bottomLeft] = corners;
    if ('topLeftRadius' in node) {
      // Node supports individual corner radii
      if (topLeft) node.topLeftRadius = radius;
      if (topRight) node.topRightRadius = radius;
      if (bottomRight) node.bottomRightRadius = radius;
      if (bottomLeft) node.bottomLeftRadius = radius;
    } else {
      // Node only supports uniform corner radius
      node.cornerRadius = radius;
    }
  } else {
    // Set all corners to the same radius
    node.cornerRadius = radius;
  }
  
  return {
    nodeId: nodeId,
    radius: radius,
    corners: corners,
    success: true,
  };
}

/**
 * Get all styles from the document
 */
export async function getStyles() {
  const localPaintStyles = await figma.getLocalPaintStylesAsync();
  const localTextStyles = await figma.getLocalTextStylesAsync();
  const localEffectStyles = await figma.getLocalEffectStylesAsync();
  const localGridStyles = await figma.getLocalGridStylesAsync();
  
  return {
    colors: localPaintStyles.map((style: any) => ({
      id: style.id,
      name: style.name,
      key: style.key,
      paint: style.paints[0],
    })),
    texts: localTextStyles.map((style: any) => ({
      id: style.id,
      name: style.name,
      key: style.key,
      fontSize: style.fontSize,
      fontName: style.fontName,
    })),
    effects: localEffectStyles.map((style: any) => ({
      id: style.id,
      name: style.name,
      key: style.key,
    })),
    grids: localGridStyles.map((style: any) => ({
      id: style.id,
      name: style.name,
      key: style.key,
    })),
  };
}

/**
 * Get all local components from the document
 */
export async function getLocalComponents() {
  await figma.loadAllPagesAsync();

  const components = figma.root.findAllWithCriteria({
    types: ["COMPONENT"],
  });

  return {
    count: components.length,
    components: components.map((component: any) => ({
      id: component.id,
      name: component.name,
      key: "key" in component ? component.key : null,
    })),
  };
} 
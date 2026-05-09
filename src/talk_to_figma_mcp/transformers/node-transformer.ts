/**
 * Node transformer for Figma MCP responses
 * Applies filtering, depth limiting, and style simplification
 */

import {
  TransformOptions,
  TypeFilterOptions,
  StyleSimplifyOptions,
  BASE_PROPERTIES,
} from '../types/transform-options.js';
import { rgbaToHex } from '../utils/figma-helpers.js';

interface TransformContext {
  options: TransformOptions;
  currentDepth: number;
  path: string[];
}

/**
 * Main transform function - entry point for transforming Figma node data
 * @param data - Raw Figma response data (single node or array)
 * @param options - Transform options
 * @returns Transformed data
 */
export function transformFigmaNode(data: any, options?: TransformOptions): any {
  // No options = return original behavior (apply default filtering)
  if (!options || Object.keys(options).length === 0) {
    return filterFigmaNodeOriginal(data);
  }

  // Handle array of nodes (e.g., from get_nodes_info or read_my_design)
  if (Array.isArray(data)) {
    return data.map(item => {
      if (item && typeof item === 'object' && 'document' in item) {
        return {
          ...item,
          document: transformSingleNode(item.document, options),
        };
      }
      return transformSingleNode(item, options);
    });
  }

  return transformSingleNode(data, options);
}

/**
 * Transform a single node tree
 */
function transformSingleNode(node: any, options: TransformOptions): any {
  if (!node || typeof node !== 'object') {
    return node;
  }

  const context: TransformContext = {
    options,
    currentDepth: 0,
    path: [],
  };

  return transformNodeRecursive(node, context);
}

/**
 * Recursive transformation with all options applied
 */
function transformNodeRecursive(node: any, context: TransformContext): any {
  if (!node || typeof node !== 'object') {
    return node;
  }

  const { options, currentDepth, path } = context;
  const nodeName = node.name || node.id || 'unknown';
  const currentPath = [...path, nodeName];

  // 1. Check type filter
  if (shouldExcludeByType(node, options.typeFilter)) {
    if (options.typeFilter?.excludeMode === 'stub') {
      return createNodeStub(node, currentPath, options.includeMetadata);
    }
    return null;
  }

  // 2. Check maxDepth - create truncated node if at limit
  if (options.maxDepth !== undefined && currentDepth >= options.maxDepth) {
    return createTruncatedNode(node, currentPath, options.includeMetadata);
  }

  // 3. Build filtered node with properties
  const filtered = buildFilteredNode(node, options);

  // 4. Add metadata if requested
  if (options.includeMetadata) {
    filtered._path = currentPath.join(' / ');
  }

  // 5. Process children
  if (node.children && Array.isArray(node.children)) {
    const childContext: TransformContext = {
      ...context,
      currentDepth: currentDepth + 1,
      path: currentPath,
    };

    const processedChildren = processChildren(node.children, childContext, filtered);

    if (processedChildren.length > 0) {
      filtered.children = processedChildren;
    }
  }

  return filtered;
}

/**
 * Check if node should be excluded based on type filter
 */
function shouldExcludeByType(node: any, typeFilter?: TypeFilterOptions): boolean {
  if (!typeFilter || !node.type) {
    return false;
  }

  // Whitelist mode
  if (typeFilter.include && typeFilter.include.length > 0) {
    return !typeFilter.include.includes(node.type);
  }

  // Blacklist mode
  if (typeFilter.exclude && typeFilter.exclude.length > 0) {
    return typeFilter.exclude.includes(node.type);
  }

  return false;
}

/**
 * Create a stub for excluded node
 */
function createNodeStub(node: any, path: string[], includeMetadata?: boolean): any {
  const stub: any = {
    id: node.id,
    name: node.name,
    type: node.type,
    _excluded: true,
  };

  if (includeMetadata) {
    stub._path = path.join(' / ');
  }

  return stub;
}

/**
 * Create a truncated node (at maxDepth limit)
 */
function createTruncatedNode(node: any, path: string[], includeMetadata?: boolean): any {
  const truncated: any = {
    id: node.id,
    name: node.name,
    type: node.type,
    _truncated: true,
  };

  if (node.children && Array.isArray(node.children)) {
    truncated._childrenCount = node.children.length;
  }

  if (includeMetadata) {
    truncated._path = path.join(' / ');
  }

  return truncated;
}

/**
 * Build filtered node with selected properties
 */
function buildFilteredNode(node: any, options: TransformOptions): any {
  const filtered: any = {
    id: node.id,
    name: node.name,
    type: node.type,
  };

  const propFilter = options.propertyFilter;

  // Determine which properties to include
  const shouldIncludeProp = (prop: string): boolean => {
    if (BASE_PROPERTIES.includes(prop as any)) return true;

    if (propFilter?.include && propFilter.include.length > 0) {
      return propFilter.include.includes(prop);
    }

    if (propFilter?.exclude && propFilter.exclude.length > 0) {
      return !propFilter.exclude.includes(prop);
    }

    return true;
  };

  // Process fills
  if (node.fills?.length > 0 && shouldIncludeProp('fills')) {
    filtered.fills = options.simplifyStyles
      ? simplifyFills(node.fills, options.simplifyStyles)
      : processFills(node.fills);
  }

  // Process strokes
  if (node.strokes?.length > 0 && shouldIncludeProp('strokes')) {
    filtered.strokes = options.simplifyStyles
      ? simplifyStrokes(node.strokes)
      : processStrokes(node.strokes);
  }

  // Process effects
  if (node.effects?.length > 0 && shouldIncludeProp('effects')) {
    filtered.effects = options.simplifyStyles
      ? simplifyEffects(node.effects)
      : processEffects(node.effects);
  }

  // Copy other properties
  const propsToCheck = [
    'cornerRadius',
    'absoluteBoundingBox',
    'characters',
    'style',
    'layoutMode',
    'layoutWrap',
    'itemSpacing',
    'counterAxisSpacing',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'primaryAxisAlignItems',
    'counterAxisAlignItems',
    'layoutSizingHorizontal',
    'layoutSizingVertical',
    'visible',
    'locked',
    'opacity',
    'blendMode',
    'constraints',
    'rotation',
    'x',
    'y',
    'width',
    'height',
  ];

  for (const prop of propsToCheck) {
    if (node[prop] !== undefined && shouldIncludeProp(prop)) {
      if (prop === 'style') {
        filtered.style = extractTextStyle(node.style);
      } else {
        filtered[prop] = node[prop];
      }
    }
  }

  return filtered;
}

/**
 * Process children with maxChildren and pagination
 */
function processChildren(
  children: any[],
  context: TransformContext,
  parentNode: any
): any[] {
  const { options } = context;
  let result = children;
  const totalChildren = children.length;

  // Apply pagination first
  if (options.pagination) {
    const { page, pageSize } = options.pagination;
    const start = page * pageSize;
    const end = start + pageSize;
    result = result.slice(start, end);

    if (options.includeMetadata) {
      parentNode._pagination = {
        page,
        pageSize,
        totalChildren,
        totalPages: Math.ceil(totalChildren / pageSize),
      };
    }
  }

  // Apply maxChildren limit
  if (options.maxChildren !== undefined && result.length > options.maxChildren) {
    const truncatedCount = result.length - options.maxChildren;
    result = result.slice(0, options.maxChildren);

    if (options.includeMetadata) {
      parentNode._childrenTruncated = truncatedCount;
    }
  }

  // Transform each child
  return result
    .map(child => transformNodeRecursive(child, context))
    .filter(child => child !== null);
}

/**
 * Simplify fills to minimal format
 */
function simplifyFills(fills: any[], styleOptions: boolean | StyleSimplifyOptions): any[] {
  const gradientMode = typeof styleOptions === 'object'
    ? styleOptions.gradients || 'remove_stops'
    : 'remove_stops';

  return fills.map(fill => {
    if (fill.type === 'SOLID') {
      return {
        type: fill.type,
        color: fill.color ? rgbaToHex(fill.color) : undefined,
        opacity: fill.opacity,
        visible: fill.visible,
      };
    }

    // Gradients
    if (fill.type?.includes('GRADIENT')) {
      if (gradientMode === 'remove') {
        return null;
      }

      const simplified: any = {
        type: fill.type,
        visible: fill.visible,
      };

      if (gradientMode === 'keep' && fill.gradientStops) {
        simplified.gradientStops = fill.gradientStops.map((stop: any) => ({
          position: stop.position,
          color: stop.color ? rgbaToHex(stop.color) : undefined,
        }));
      }

      return simplified;
    }

    // IMAGE and others - minimal info
    return {
      type: fill.type,
      visible: fill.visible,
    };
  }).filter(Boolean);
}

/**
 * Simplify strokes to minimal format
 */
function simplifyStrokes(strokes: any[]): any[] {
  return strokes.map(stroke => ({
    type: stroke.type,
    color: stroke.color ? rgbaToHex(stroke.color) : undefined,
    opacity: stroke.opacity,
    visible: stroke.visible,
  }));
}

/**
 * Process fills with color conversion (original behavior)
 */
function processFills(fills: any[]): any[] {
  return fills.map(fill => {
    const processedFill = { ...fill };
    delete processedFill.boundVariables;
    delete processedFill.imageRef;

    if (processedFill.gradientStops) {
      processedFill.gradientStops = processedFill.gradientStops.map((stop: any) => {
        const processedStop = { ...stop };
        if (processedStop.color) {
          processedStop.color = rgbaToHex(processedStop.color);
        }
        delete processedStop.boundVariables;
        return processedStop;
      });
    }

    if (processedFill.color) {
      processedFill.color = rgbaToHex(processedFill.color);
    }

    return processedFill;
  });
}

/**
 * Process strokes with color conversion (original behavior)
 */
function processStrokes(strokes: any[]): any[] {
  return strokes.map(stroke => {
    const processedStroke = { ...stroke };
    delete processedStroke.boundVariables;
    if (processedStroke.color) {
      processedStroke.color = rgbaToHex(processedStroke.color);
    }
    return processedStroke;
  });
}

/**
 * Process effects with color conversion (original behavior)
 */
function processEffects(effects: any[]): any[] {
  return effects.map(effect => {
    const processed = { ...effect };
    delete processed.boundVariables;
    if (processed.color) {
      processed.color = rgbaToHex(processed.color);
    }
    return processed;
  });
}

/**
 * Simplify effects to minimal format (type, color, offset, radius, spread)
 */
function simplifyEffects(effects: any[]): any[] {
  return effects.map(effect => {
    const simplified: any = {
      type: effect.type,
      visible: effect.visible,
      radius: effect.radius,
    };
    if (effect.color) {
      simplified.color = rgbaToHex(effect.color);
    }
    if (effect.offset) {
      simplified.offset = effect.offset;
    }
    if (effect.spread !== undefined) {
      simplified.spread = effect.spread;
    }
    if (effect.blendMode) {
      simplified.blendMode = effect.blendMode;
    }
    return simplified;
  });
}

/**
 * Extract text style properties
 */
function extractTextStyle(style: any): any {
  if (!style) return undefined;

  return {
    fontFamily: style.fontFamily,
    fontStyle: style.fontStyle,
    fontWeight: style.fontWeight,
    fontSize: style.fontSize,
    textAlignHorizontal: style.textAlignHorizontal,
    letterSpacing: style.letterSpacing,
    lineHeightPx: style.lineHeightPx,
  };
}

/**
 * Original filter function for backward compatibility
 * Used when no transform options are provided
 */
function filterFigmaNodeOriginal(node: any): any {
  if (!node || typeof node !== 'object') {
    return node;
  }

  // Handle arrays
  if (Array.isArray(node)) {
    return node.map(item => filterFigmaNodeOriginal(item));
  }

  // Handle nodes with document property
  if ('document' in node) {
    return {
      ...node,
      document: filterFigmaNodeOriginal(node.document),
    };
  }

  // Skip VECTOR type nodes
  if (node.type === 'VECTOR') {
    return null;
  }

  const filtered: any = {
    id: node.id,
    name: node.name,
    type: node.type,
  };

  if (node.fills?.length > 0) {
    filtered.fills = processFills(node.fills);
  }

  if (node.strokes?.length > 0) {
    filtered.strokes = processStrokes(node.strokes);
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
    filtered.style = extractTextStyle(node.style);
  }

  if (node.effects?.length > 0) {
    filtered.effects = processEffects(node.effects);
  }

  if (node.children) {
    filtered.children = node.children
      .map((child: any) => filterFigmaNodeOriginal(child))
      .filter((child: any) => child !== null);
  }

  return filtered;
}

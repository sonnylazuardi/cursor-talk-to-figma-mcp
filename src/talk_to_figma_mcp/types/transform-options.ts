/**
 * Transform options for filtering and optimizing Figma node responses
 * All fields are optional - without parameters = original behavior
 */
export interface TransformOptions {
  /**
   * Maximum depth to traverse the node tree.
   * Nodes at maxDepth will have _truncated: true and _childrenCount instead of children.
   */
  maxDepth?: number;

  /**
   * Maximum number of children per node.
   * Excess children are removed and _childrenTruncated count is added.
   */
  maxChildren?: number;

  /**
   * Filter nodes by their type (FRAME, TEXT, COMPONENT, etc.)
   */
  typeFilter?: TypeFilterOptions;

  /**
   * Filter which properties to include/exclude from nodes
   */
  propertyFilter?: PropertyFilterOptions;

  /**
   * Simplify style properties (fills, strokes) to minimal format
   */
  simplifyStyles?: boolean | StyleSimplifyOptions;

  /**
   * Add metadata properties (_path, _truncated, _excluded, etc.)
   */
  includeMetadata?: boolean;

  /**
   * Paginate children array
   */
  pagination?: PaginationOptions;
}

export interface TypeFilterOptions {
  /**
   * Only include these node types (whitelist).
   * If specified, exclude is ignored.
   */
  include?: FigmaNodeType[];

  /**
   * Exclude these node types (blacklist).
   */
  exclude?: FigmaNodeType[];

  /**
   * How to handle excluded nodes:
   * - 'remove': completely remove from tree
   * - 'stub': keep {id, name, type, _excluded: true}
   */
  excludeMode?: 'remove' | 'stub';
}

export interface PropertyFilterOptions {
  /**
   * Only include these properties (whitelist).
   * Base properties (id, name, type, children) are always included.
   */
  include?: string[];

  /**
   * Exclude these properties (blacklist).
   */
  exclude?: string[];
}

export interface StyleSimplifyOptions {
  /**
   * Simplify fills to {type, color, opacity} for SOLID
   */
  fills?: boolean;

  /**
   * How to handle gradients:
   * - 'remove_stops': keep only type (default)
   * - 'keep': keep full gradient data
   * - 'remove': remove gradients entirely
   */
  gradients?: 'remove_stops' | 'keep' | 'remove';

  /**
   * Simplify strokes to {type, color, opacity, weight}
   */
  strokes?: boolean;

  /**
   * Simplify or remove effects
   */
  effects?: boolean;
}

export interface PaginationOptions {
  /**
   * Page number (0-based)
   */
  page: number;

  /**
   * Number of children per page
   */
  pageSize: number;
}

/**
 * Metadata added to transformed nodes
 */
export interface TransformMetadata {
  /** Path from root: "Page / Frame / Component" */
  _path?: string;

  /** Node was truncated due to maxDepth */
  _truncated?: boolean;

  /** Original children count (when truncated) */
  _childrenCount?: number;

  /** Number of children removed due to maxChildren */
  _childrenTruncated?: number;

  /** Node was excluded by type filter */
  _excluded?: boolean;

  /** Pagination info */
  _pagination?: {
    page: number;
    pageSize: number;
    totalChildren: number;
    totalPages: number;
  };
}

/**
 * Figma node types
 */
export type FigmaNodeType =
  | 'DOCUMENT'
  | 'PAGE'
  | 'FRAME'
  | 'GROUP'
  | 'SECTION'
  | 'COMPONENT'
  | 'COMPONENT_SET'
  | 'INSTANCE'
  | 'BOOLEAN_OPERATION'
  | 'VECTOR'
  | 'STAR'
  | 'LINE'
  | 'ELLIPSE'
  | 'POLYGON'
  | 'RECTANGLE'
  | 'TEXT'
  | 'STICKY'
  | 'SHAPE_WITH_TEXT'
  | 'CONNECTOR'
  | 'STAMP'
  | 'WIDGET'
  | 'EMBED'
  | 'LINK_UNFURL'
  | 'MEDIA'
  | 'SLICE';

/**
 * Heavy properties that can be excluded for optimization
 */
export const HEAVY_PROPERTIES = [
  'strokeGeometry',
  'fillGeometry',
  'vectorNetwork',
  'vectorPaths',
  'relativeTransform',
  'absoluteTransform',
  'constraints',
  'layoutGrids',
  'guides',
  'exportSettings',
  'reactions',
  'componentPropertyDefinitions',
  'componentPropertyReferences',
  'overrides',
] as const;

/**
 * Base properties that are always included
 */
export const BASE_PROPERTIES = [
  'id',
  'name',
  'type',
  'children',
] as const;

/**
 * Default properties to include when using simplified mode
 */
export const DEFAULT_INCLUDE_PROPERTIES = [
  'id',
  'name',
  'type',
  'children',
  'characters',
  'fills',
  'strokes',
  'cornerRadius',
  'layoutMode',
  'itemSpacing',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'primaryAxisAlignItems',
  'counterAxisAlignItems',
  'layoutSizingHorizontal',
  'layoutSizingVertical',
] as const;

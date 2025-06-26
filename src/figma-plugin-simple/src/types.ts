// Shared types for Figma MCP plugin

export interface FigmaResponse {
  id: string;
  result?: any;
  error?: string;
}

export interface CommandProgressUpdate {
  type: 'command_progress';
  commandId: string;
  commandType: string;
  status: 'started' | 'in_progress' | 'completed' | 'error';
  progress: number;
  totalItems: number;
  processedItems: number;
  currentChunk?: number;
  totalChunks?: number;
  chunkSize?: number;
  message: string;
  payload?: any;
  timestamp: number;
}

export interface ComponentOverride {
  id: string;
  overriddenFields: string[];
}

export interface getInstanceOverridesResult {
  success: boolean;
  message: string;
  sourceInstanceId: string;
  mainComponentId: string;
  overridesCount: number;
}

export interface setInstanceOverridesResult {
  success: boolean;
  message: string;
  totalCount?: number;
  results?: Array<{
    success: boolean;
    instanceId: string;
    instanceName: string;
    appliedCount?: number;
    message?: string;
  }>;
}

export interface SetMultipleAnnotationsParams {
  nodeId: string;
  annotations: Array<{
    nodeId: string;
    labelMarkdown: string;
    categoryId?: string;
    annotationId?: string;
    properties?: Array<{ type: string }>;
  }>;
}

export interface AnnotationResult {
  success: boolean;
  nodeId: string;
  annotationsApplied?: number;
  annotationsFailed?: number;
  totalAnnotations?: number;
  completedInChunks?: number;
  results?: Array<{
    success: boolean;
    nodeId: string;
    error?: string;
    annotationId?: string;
  }>;
}

export interface TextReplaceResult {
  success: boolean;
  nodeId: string;
  replacementsApplied?: number;
  replacementsFailed?: number;
  totalReplacements?: number;
  completedInChunks?: number;
  results?: Array<{
    success: boolean;
    nodeId: string;
    error?: string;
    originalText?: string;
    translatedText?: string;
  }>;
}

// === Individual Parameter Types ===
export interface RGBAColor {
  r: number;
  g: number;
  b: number;
  a?: number;
}

// === Common Base Types ===
export interface BaseNodeParams {
  nodeId: string;
}

export interface BasePositionParams {
  x: number;
  y: number;
}

export interface BaseSizeParams {
  width: number;
  height: number;
}

export interface BaseCreationParams extends BasePositionParams, BaseSizeParams {
  name?: string;
  parentId?: string;
}

// === Layout Enums and Types ===
export type LayoutMode = 'NONE' | 'HORIZONTAL' | 'VERTICAL';
export type LayoutWrap = 'NO_WRAP' | 'WRAP';
export type PrimaryAxisAlign = 'MIN' | 'MAX' | 'CENTER' | 'SPACE_BETWEEN';
export type CounterAxisAlign = 'MIN' | 'MAX' | 'CENTER' | 'BASELINE';
export type LayoutSizing = 'FIXED' | 'HUG' | 'FILL';

// === Padding Types ===
export interface PaddingParams {
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
}

// === Auto Layout Types ===
export interface AutoLayoutParams extends PaddingParams {
  layoutMode?: LayoutMode;
  layoutWrap?: LayoutWrap;
  primaryAxisAlignItems?: PrimaryAxisAlign;
  counterAxisAlignItems?: CounterAxisAlign;
  layoutSizingHorizontal?: LayoutSizing;
  layoutSizingVertical?: LayoutSizing;
  itemSpacing?: number;
}

// === Style Types ===
export interface StyleParams {
  fillColor?: RGBAColor;
  strokeColor?: RGBAColor;
  strokeWeight?: number;
}

// === Font Types ===
export interface FontParams {
  fontSize?: number;
  fontWeight?: number;
  fontColor?: RGBAColor;
}

export interface GetNodeInfoParams extends BaseNodeParams {}

export interface GetNodesInfoParams {
  nodeIds: string[];
}

export interface CreateRectangleParams extends BaseCreationParams {}

export interface CreateFrameParams extends BaseCreationParams, StyleParams, AutoLayoutParams {}

export interface CreateTextParams extends BasePositionParams, FontParams {
  text: string;
  name?: string;
  parentId?: string;
}

export interface SetFillColorParams extends BaseNodeParams {
  color: RGBAColor;
}

export interface SetStrokeColorParams extends BaseNodeParams {
  color: RGBAColor;
  weight?: number;
}

export interface MoveNodeParams extends BaseNodeParams, BasePositionParams {}

export interface ResizeNodeParams extends BaseNodeParams, BaseSizeParams {}

export interface CloneNodeParams extends BaseNodeParams {
  x?: number;
  y?: number;
}

export interface DeleteNodeParams extends BaseNodeParams {}

export interface DeleteMultipleNodesParams {
  nodeIds: string[];
}

export interface SetCornerRadiusParams extends BaseNodeParams {
  radius: number;
  corners?: boolean[];
}

// === Command Types ===
export type FigmaCommand =
  | "get_document_info"
  | "get_selection"
  | "get_node_info"
  | "get_nodes_info"
  | "read_my_design"
  | "create_rectangle"
  | "create_frame"
  | "create_text"
  | "set_fill_color"
  | "set_stroke_color"
  | "move_node"
  | "resize_node"
  | "delete_node"
  | "delete_multiple_nodes"
  | "get_styles"
  | "get_local_components"
  | "create_component_instance"
  | "get_instance_overrides"
  | "set_instance_overrides"
  | "export_node_as_image"
  | "join"
  | "set_corner_radius"
  | "clone_node"
  | "set_text_content"
  | "scan_text_nodes"
  | "set_multiple_text_contents"
  | "get_annotations"
  | "set_annotation"
  | "set_multiple_annotations"
  | "scan_nodes_by_types"
  | "set_layout_mode"
  | "set_padding"
  | "set_axis_align"
  | "set_layout_sizing"
  | "set_item_spacing"
  | "get_reactions"
  | "set_default_connector"
  | "create_connections";

export type CommandParams = {
  get_document_info: Record<string, never>;
  get_selection: Record<string, never>;
  get_node_info: GetNodeInfoParams;
  get_nodes_info: GetNodesInfoParams;
  create_rectangle: CreateRectangleParams;
  create_frame: CreateFrameParams;
  create_text: CreateTextParams;
  set_fill_color: SetFillColorParams;
  set_stroke_color: SetStrokeColorParams;
  move_node: MoveNodeParams;
  resize_node: ResizeNodeParams;
  delete_node: DeleteNodeParams;
  delete_multiple_nodes: DeleteMultipleNodesParams;
  get_styles: Record<string, never>;
  get_local_components: Record<string, never>;
  get_team_components: Record<string, never>;
  create_component_instance: {
    componentKey: string;
    x: number;
    y: number;
  };
  get_instance_overrides: {
    instanceNodeId: string | null;
  };
  set_instance_overrides: {
    targetNodeIds: string[];
    sourceInstanceId: string;
  };
  export_node_as_image: {
    nodeId: string;
    format?: "PNG" | "JPG" | "SVG" | "PDF";
    scale?: number;
  };
  execute_code: {
    code: string;
  };
  join: {
    channel: string;
  };
  set_corner_radius: SetCornerRadiusParams;
  clone_node: CloneNodeParams;
  set_text_content: SetTextContentParams;
  scan_text_nodes: ScanTextNodesParams;
  set_multiple_text_contents: SetMultipleTextContentsParams;
  get_annotations: {
    nodeId?: string;
    includeCategories?: boolean;
  };
  set_annotation: {
    nodeId: string;
    annotationId?: string;
    labelMarkdown: string;
    categoryId?: string;
    properties?: Array<{ type: string }>;
  };
  set_multiple_annotations: SetMultipleAnnotationsParams;
  scan_nodes_by_types: {
    nodeId: string;
    types: Array<string>;
  };
  get_reactions: { nodeIds: string[] };
  set_default_connector: {
    connectorId?: string | undefined;
  };
  create_connections: {
    connections: Array<{
      startNodeId: string;
      endNodeId: string;
      text?: string;
    }>;
  };
  read_my_design: Record<string, never>;
  set_layout_mode: SetLayoutModeParams;
  set_padding: SetPaddingParams;
  set_axis_align: SetAxisAlignParams;
  set_layout_sizing: SetLayoutSizingParams;
  set_item_spacing: SetItemSpacingParams;
};

export interface ProgressMessage {
  message: FigmaResponse | any;
  type?: string;
  id?: string;
  [key: string]: any; // Allow any other properties
}

export interface NodeInfo {
  id: string;
  name: string;
  type: string;
  visible?: boolean;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface PluginState {
  serverPort: number;
}

// === Prototyping Types ===
export interface ReactionNode {
  id: string;
  name: string;
  type: string;
  depth: number;
  hasReactions: boolean;
  reactions: unknown[];
  path: string;
}

export interface GetReactionsResult {
  nodesCount: number;
  nodesWithReactions: number;
  nodes: ReactionNode[];
}

export interface SetDefaultConnectorResult {
  success: boolean;
  message: string;
  connectorId: string;
  exists?: boolean;
  autoSelected?: boolean;
}

export interface ConnectionResult {
  id?: string;
  startNodeId: string;
  endNodeId: string;
  text?: string;
  error?: string;
}

export interface CreateConnectionsResult {
  success: boolean;
  count: number;
  connections: ConnectionResult[];
}

// === Text Content Types ===
export interface SetTextContentParams extends BaseNodeParams {
  text: string;
}

export interface ScanTextNodesParams extends BaseNodeParams {
  useChunking?: boolean;
  chunkSize?: number;
  commandId?: string;
}

export interface SetMultipleTextContentsParams extends BaseNodeParams {
  text: Array<{ nodeId: string; text: string }>;
  commandId?: string;
}

export interface TextNodeInfo {
  id: string;
  name: string;
  characters: string;
  fontName: any;
  fontSize: number;
  depth: number;
  path: string;
  visible: boolean;
  locked: boolean;
}

export interface ScanTextNodesResult {
  success: boolean;
  message: string;
  count: number;
  textNodes: TextNodeInfo[];
  commandId: string;
  totalNodes?: number;
  processedNodes?: number;
  chunks?: number;
}

// === Layout Types ===
export interface SetLayoutModeParams extends BaseNodeParams {
  layoutMode: LayoutMode;
  layoutWrap?: LayoutWrap;
}

export interface SetPaddingParams extends BaseNodeParams, PaddingParams {}

export interface SetAxisAlignParams extends BaseNodeParams {
  primaryAxisAlignItems?: PrimaryAxisAlign;
  counterAxisAlignItems?: CounterAxisAlign;
}

export interface SetLayoutSizingParams extends BaseNodeParams {
  layoutSizingHorizontal?: LayoutSizing;
  layoutSizingVertical?: LayoutSizing;
}

export interface SetItemSpacingParams extends BaseNodeParams {
  itemSpacing: number;
}

// === Additional Missing Types ===

// Styling Types
export interface SetCornerRadiusParams extends BaseNodeParams {
  radius: number;
  corners?: boolean[];
}

// Component Types
export interface CreateComponentInstanceParams extends BasePositionParams {
  componentKey: string;
}

export interface GetInstanceOverridesParams {
  nodeId?: string;
}

export interface SetInstanceOverridesParams {
  sourceInstanceId: string;
  targetNodeIds: string[];
}

// Export Types
export type ExportFormat = 'PNG' | 'JPG' | 'SVG' | 'PDF';

export interface ExportNodeParams extends BaseNodeParams {
  format?: ExportFormat;
  scale?: number;
}

// Style & Component Result Types
export interface StyleInfo {
  id: string;
  name: string;
  type: string;
  description?: string;
}

export interface ComponentInfo {
  id: string;
  name: string;
  description?: string;
  key: string;
}

export interface ExportResult {
  success: boolean;
  nodeId: string;
  format: ExportFormat;
  scale: number;
  data?: string; // base64 data
  error?: string;
} 
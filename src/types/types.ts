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

export interface GetNodeInfoParams {
  nodeId: string;
}

export interface GetNodesInfoParams {
  nodeIds: string[];
}

export interface CreateRectangleParams {
  x: number;
  y: number;
  width: number;
  height: number;
  name?: string;
  parentId?: string;
}

export interface CreateFrameParams {
  x: number;
  y: number;
  width: number;
  height: number;
  name?: string;
  parentId?: string;
  fillColor?: RGBAColor;
  strokeColor?: RGBAColor;
  strokeWeight?: number;
  layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
  layoutWrap?: 'NO_WRAP' | 'WRAP';
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  primaryAxisAlignItems?: 'MIN' | 'MAX' | 'CENTER' | 'SPACE_BETWEEN';
  counterAxisAlignItems?: 'MIN' | 'MAX' | 'CENTER' | 'BASELINE';
  layoutSizingHorizontal?: 'FIXED' | 'HUG' | 'FILL';
  layoutSizingVertical?: 'FIXED' | 'HUG' | 'FILL';
  itemSpacing?: number;
}

export interface CreateTextParams {
  x: number;
  y: number;
  text: string;
  fontSize?: number;
  fontWeight?: number;
  fontColor?: RGBAColor;
  name?: string;
  parentId?: string;
}

export interface SetFillColorParams {
  nodeId: string;
  color: RGBAColor;
}

export interface SetStrokeColorParams {
  nodeId: string;
  color: RGBAColor;
  weight?: number;
}

export interface MoveNodeParams {
  nodeId: string;
  x: number;
  y: number;
}

export interface ResizeNodeParams {
  nodeId: string;
  width: number;
  height: number;
}

export interface CloneNodeParams {
  nodeId: string;
  x?: number;
  y?: number;
}

export interface DeleteNodeParams {
  nodeId: string;
}

export interface DeleteMultipleNodesParams {
  nodeIds: string[];
}

export interface SetCornerRadiusParams {
  nodeId: string;
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
  set_text_content: {
    nodeId: string;
    text: string;
  };
  scan_text_nodes: {
    nodeId: string;
    useChunking: boolean;
    chunkSize: number;
  };
  set_multiple_text_contents: {
    nodeId: string;
    text: Array<{ nodeId: string; text: string }>;
  };
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
  set_layout_mode: {
    nodeId: string;
    layoutMode: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
    layoutWrap?: 'NO_WRAP' | 'WRAP';
  };
  set_padding: {
    nodeId: string;
    paddingTop?: number;
    paddingRight?: number;
    paddingBottom?: number;
    paddingLeft?: number;
  };
  set_axis_align: {
    nodeId: string;
    primaryAxisAlignItems?: 'MIN' | 'MAX' | 'CENTER' | 'SPACE_BETWEEN';
    counterAxisAlignItems?: 'MIN' | 'MAX' | 'CENTER' | 'BASELINE';
  };
  set_layout_sizing: {
    nodeId: string;
    layoutSizingHorizontal?: 'FIXED' | 'HUG' | 'FILL';
    layoutSizingVertical?: 'FIXED' | 'HUG' | 'FILL';
  };
  set_item_spacing: {
    nodeId: string;
    itemSpacing: number;
  };
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
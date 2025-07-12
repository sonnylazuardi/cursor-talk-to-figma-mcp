import { z } from 'zod';
import { FigmaCommand } from '../types/types.js';

// Base schemas
const RGBAColorSchema = z.object({
  r: z.number().min(0).max(1),
  g: z.number().min(0).max(1),
  b: z.number().min(0).max(1),
  a: z.number().min(0).max(1).optional()
});

// Command parameter schemas matching types.ts
export const CommandParamsSchema = {
  get_document_info: z.object({}),
  get_selection: z.object({}),
  get_node_info: z.object({
    nodeId: z.string()
  }),
  get_nodes_info: z.object({
    nodeIds: z.array(z.string())
  }),
  create_rectangle: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    name: z.string().optional(),
    parentId: z.string().optional()
  }),
  create_frame: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    name: z.string().optional(),
    parentId: z.string().optional(),
    fillColor: RGBAColorSchema.optional(),
    strokeColor: RGBAColorSchema.optional(),
    strokeWeight: z.number().optional()
  }),
  create_text: z.object({
    x: z.number(),
    y: z.number(),
    text: z.string(),
    fontSize: z.number().optional(),
    fontWeight: z.number().optional(),
    fontColor: RGBAColorSchema.optional(),
    name: z.string().optional(),
    parentId: z.string().optional()
  }),
  set_fill_color: z.object({
    nodeId: z.string(),
    color: RGBAColorSchema
  }),
  set_stroke_color: z.object({
    nodeId: z.string(),
    color: RGBAColorSchema,
    weight: z.number().optional()
  }),
  move_node: z.object({
    nodeId: z.string(),
    x: z.number(),
    y: z.number()
  }),
  resize_node: z.object({
    nodeId: z.string(),
    width: z.number(),
    height: z.number()
  }),
  delete_node: z.object({
    nodeId: z.string()
  }),
  delete_multiple_nodes: z.object({
    nodeIds: z.array(z.string())
  }),
  get_styles: z.object({}),
  get_local_components: z.object({}),
  create_component_instance: z.object({
    componentKey: z.string(),
    x: z.number(),
    y: z.number()
  }),
  get_instance_overrides: z.object({
    instanceNodeId: z.string().nullable()
  }),
  set_instance_overrides: z.object({
    targetNodeIds: z.array(z.string()),
    sourceInstanceId: z.string()
  }),
  export_node_as_image: z.object({
    nodeId: z.string(),
    format: z.enum(['PNG', 'JPG', 'SVG', 'PDF']).optional(),
    scale: z.number().optional()
  }),
  join: z.object({
    channel: z.string()
  }),
  set_corner_radius: z.object({
    nodeId: z.string(),
    radius: z.number(),
    corners: z.array(z.boolean()).length(4).optional()
  }),
  clone_node: z.object({
    nodeId: z.string(),
    x: z.number().optional(),
    y: z.number().optional()
  }),
  set_text_content: z.object({
    nodeId: z.string(),
    text: z.string()
  }),
  scan_text_nodes: z.object({
    nodeId: z.string(),
    useChunking: z.boolean(),
    chunkSize: z.number()
  }),
  set_multiple_text_contents: z.object({
    nodeId: z.string(),
    text: z.array(z.object({
      nodeId: z.string(),
      text: z.string()
    }))
  }),
  get_annotations: z.object({
    nodeId: z.string().optional(),
    includeCategories: z.boolean().optional()
  }),
  set_annotation: z.object({
    nodeId: z.string(),
    annotationId: z.string().optional(),
    labelMarkdown: z.string(),
    categoryId: z.string().optional(),
    properties: z.array(z.object({ type: z.string() })).optional()
  }),
  set_multiple_annotations: z.object({
    nodeId: z.string(),
    annotations: z.array(z.object({
      nodeId: z.string(),
      labelMarkdown: z.string(),
      categoryId: z.string().optional(),
      annotationId: z.string().optional(),
      properties: z.array(z.object({ type: z.string() })).optional()
    }))
  }),
  scan_nodes_by_types: z.object({
    nodeId: z.string(),
    types: z.array(z.string())
  }),
  get_reactions: z.object({
    nodeIds: z.array(z.string())
  }),
  set_default_connector: z.object({
    connectorId: z.string().optional()
  }),
  create_connections: z.object({
    connections: z.array(z.object({
      startNodeId: z.string(),
      endNodeId: z.string(),
      text: z.string().optional()
    }))
  }),
  set_layout_mode: z.object({
    nodeId: z.string(),
    layoutMode: z.enum(['NONE', 'HORIZONTAL', 'VERTICAL']),
    layoutWrap: z.enum(['NO_WRAP', 'WRAP']).optional()
  }),
  set_padding: z.object({
    nodeId: z.string(),
    paddingTop: z.number().optional(),
    paddingRight: z.number().optional(),
    paddingBottom: z.number().optional(),
    paddingLeft: z.number().optional()
  }),
  set_axis_align: z.object({
    nodeId: z.string(),
    primaryAxisAlignItems: z.enum(['MIN', 'MAX', 'CENTER', 'SPACE_BETWEEN']).optional(),
    counterAxisAlignItems: z.enum(['MIN', 'MAX', 'CENTER', 'BASELINE']).optional()
  }),
  set_layout_sizing: z.object({
    nodeId: z.string(),
    layoutSizingHorizontal: z.enum(['FIXED', 'HUG', 'FILL']).optional(),
    layoutSizingVertical: z.enum(['FIXED', 'HUG', 'FILL']).optional()
  }),
  set_item_spacing: z.object({
    nodeId: z.string(),
    itemSpacing: z.number()
  }),
  read_my_design: z.object({})
} as const;

// Runtime validation function
export function validateCommandParams(
  command: FigmaCommand,
  params: unknown
): boolean {
  try {
    const schema = CommandParamsSchema[command as keyof typeof CommandParamsSchema];
    schema.parse(params);
    return true;
  } catch (error) {
    console.error(`Validation failed for command ${command}:`, error);
    return false;
  }
}

// Helper function to get validation errors
export function getValidationErrors(
  command: FigmaCommand,
  params: unknown
): string[] {
  try {
    const schema = CommandParamsSchema[command as keyof typeof CommandParamsSchema];
    schema.parse(params);
    return [];
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
    }
    return [String(error)];
  }
} 
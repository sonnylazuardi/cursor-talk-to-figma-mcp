// Figma Plugin - Main Thread Entry Point
console.log("🎨 Loading Figma Plugin...");

// Import services
import { DocumentService } from "../services/DocumentService";
import { AnnotationService } from "../services/AnnotationService";
import { PrototypeService } from "../services/PrototypeService";
import { CreationService } from "../services/CreationService";
import { TextService } from "../services/TextService";
import { LayoutService } from "../services/LayoutService";
import { StyleService } from "../services/StyleService";
import { LayoutManagementService } from "../services/LayoutManagementService";
import { ComponentService } from "../services/ComponentService";
import type { 
  RGBAColor,
  LayoutMode,
  LayoutWrap,
  PrimaryAxisAlign,
  CounterAxisAlign,
  LayoutSizing,
  CreateRectangleParams,
  CreateFrameParams,
  CreateTextParams,
  SetTextContentParams,
  ScanTextNodesParams,
  SetMultipleTextContentsParams,
  SetLayoutModeParams,
  SetPaddingParams,
  SetAxisAlignParams,
  SetLayoutSizingParams,
  SetItemSpacingParams,
  SetFillColorParams,
  SetStrokeColorParams,
  SetCornerRadiusParams,
  MoveNodeParams,
  ResizeNodeParams,
  DeleteNodeParams,
  DeleteMultipleNodesParams,
  CloneNodeParams,
  CreateComponentInstanceParams,
  GetInstanceOverridesParams,
  SetInstanceOverridesParams,
  ExportNodeParams,
  ExportFormat,
} from "../types";

// Initialize services
const documentService = new DocumentService();
const annotationService = new AnnotationService();
const prototypeService = new PrototypeService();
const creationService = new CreationService();
const textService = new TextService();
const layoutService = new LayoutService();
const styleService = new StyleService();
const layoutManagementService = new LayoutManagementService();
const componentService = new ComponentService();

// Show UI
figma.showUI(__html__, { width: 400, height: 600 });

// Handle messages from UI
figma.ui.onmessage = async (msg: { type: string; [key: string]: unknown }) => {
  console.log("🔥 Received message:", msg.type, msg);

  try {
    switch (msg.type) {
      case "test":
        figma.notify("Plugin is working! 🎉");
        figma.ui.postMessage({
          type: "test-result",
          message: "Test successful",
          timestamp: Date.now(),
        });
        break;

      case "get_document_info": {
        const docInfo = await documentService.getDocumentInfo();
        console.log("Document Info:", docInfo);
        figma.notify("Document info logged to console");
        figma.ui.postMessage({
          type: "command_result",
          command: "get_document_info",
          result: docInfo,
        });
        break;
      }

      case "get_selection": {
        const selection = await documentService.getSelection();
        console.log("Selection Info:", selection);
        figma.notify(`${selection.selectionCount} nodes selected`);
        figma.ui.postMessage({
          type: "command_result",
          command: "get_selection",
          result: selection,
        });
        break;
      }

      case "read_my_design": {
        const designInfo = await documentService.readMyDesign();
        console.log("Design Info:", designInfo);
        figma.notify(
          `Read ${
            Array.isArray(designInfo) ? designInfo.length : 0
          } selected nodes`
        );
        figma.ui.postMessage({
          type: "command_result",
          command: "read_my_design",
          result: designInfo,
        });
        break;
      }

      case "get_node_info": {
        if (!msg.nodeId || typeof msg.nodeId !== "string") {
          throw new Error("Missing nodeId parameter");
        }
        const nodeInfo = await documentService.getNodeInfo({
          nodeId: msg.nodeId,
        });
        console.log("Node Info:", nodeInfo);
        figma.notify("Node info logged to console");
        figma.ui.postMessage({
          type: "command_result",
          command: "get_node_info",
          result: nodeInfo,
        });
        break;
      }

      case "get_nodes_info": {
        if (!msg.nodeIds || !Array.isArray(msg.nodeIds)) {
          throw new Error("Missing or invalid nodeIds parameter");
        }
        const nodesInfo = await documentService.getNodesInfo({
          nodeIds: msg.nodeIds as string[],
        });
        console.log("Nodes Info:", nodesInfo);
        figma.notify(
          `Got info for ${
            Array.isArray(nodesInfo) ? nodesInfo.length : 0
          } nodes`
        );
        figma.ui.postMessage({
          type: "command_result",
          command: "get_nodes_info",
          result: nodesInfo,
        });
        break;
      }

      // Annotation commands
      case "get_annotations": {
        const params = {
          nodeId: msg.nodeId as string | undefined,
          includeCategories: msg.includeCategories as boolean | undefined,
        };
        const annotations = await annotationService.getAnnotations(params);
        figma.ui.postMessage({
          type: "get_annotations-result",
          data: annotations,
        });
        break;
      }

      case "set_annotation": {
        const params = {
          nodeId: msg.nodeId as string,
          annotationId: msg.annotationId as string | undefined,
          labelMarkdown: msg.labelMarkdown as string,
          categoryId: msg.categoryId as string | undefined,
          properties: msg.properties as Array<{ type: string }> | undefined,
        };
        if (!params.nodeId || !params.labelMarkdown) {
          throw new Error("nodeId and labelMarkdown are required");
        }
        const result = await annotationService.setAnnotation(params);
        figma.ui.postMessage({
          type: "set_annotation-result",
          data: result,
        });
        break;
      }

      case "set_multiple_annotations": {
        const params = {
          nodeId: msg.nodeId as string,
          annotations: msg.annotations as Array<{
            nodeId: string;
            labelMarkdown: string;
            categoryId?: string;
            annotationId?: string;
            properties?: Array<{ type: string }>;
          }>,
        };
        if (!params.nodeId || !params.annotations) {
          throw new Error("nodeId and annotations are required");
        }
        const result = await annotationService.setMultipleAnnotations(params);
        figma.ui.postMessage({
          type: "set_multiple_annotations-result",
          data: result,
        });
        break;
      }

      case "scan_nodes_by_types": {
        const params = {
          nodeId: msg.nodeId as string,
          types: msg.types as string[],
        };
        if (!params.nodeId || !params.types) {
          throw new Error("nodeId and types are required");
        }
        const result = await annotationService.scanNodesByTypes(params);
        figma.ui.postMessage({
          type: "scan_nodes_by_types-result",
          data: result,
        });
        break;
      }

      // Prototyping commands
      case "get_reactions": {
        const nodeIds = msg.nodeIds as string[];
        if (!nodeIds || !Array.isArray(nodeIds)) {
          throw new Error("nodeIds parameter is required and must be an array");
        }

        const result = await prototypeService.getReactions(nodeIds);
        figma.ui.postMessage({
          type: "get_reactions-result",
          data: result,
        });
        break;
      }

      case "set_default_connector": {
        const connectorId = msg.connectorId as string | undefined;
        const result = await prototypeService.setDefaultConnector(connectorId);
        figma.ui.postMessage({
          type: "set_default_connector-result",
          data: result,
        });
        break;
      }

      case "create_connections": {
        const connections = msg.connections as Array<{
          startNodeId: string;
          endNodeId: string;
          text?: string;
        }>;
        if (!connections || !Array.isArray(connections)) {
          throw new Error(
            "connections parameter is required and must be an array"
          );
        }

        const result = await prototypeService.createConnections(connections);
        figma.ui.postMessage({
          type: "create_connections-result",
          data: result,
        });
        break;
      }

      // Creation commands
      case "create_rectangle": {
        const params: CreateRectangleParams = {
          x: msg.x as number,
          y: msg.y as number,
          width: msg.width as number,
          height: msg.height as number,
          name: msg.name as string | undefined,
          parentId: msg.parentId as string | undefined,
        };
        const result = await creationService.createRectangle(params);
        figma.notify("Rectangle created successfully");
        figma.ui.postMessage({
          type: "command_result",
          command: "create_rectangle",
          result: result,
        });
        break;
      }

      case "create_frame": {
        const params: CreateFrameParams = {
          x: msg.x as number,
          y: msg.y as number,
          width: msg.width as number,
          height: msg.height as number,
          name: msg.name as string | undefined,
          parentId: msg.parentId as string | undefined,
          fillColor: msg.fillColor as RGBAColor | undefined,
          strokeColor: msg.strokeColor as RGBAColor | undefined,
          strokeWeight: msg.strokeWeight as number | undefined,
          layoutMode: msg.layoutMode as LayoutMode | undefined,
          layoutWrap: msg.layoutWrap as LayoutWrap | undefined,
          paddingTop: msg.paddingTop as number | undefined,
          paddingRight: msg.paddingRight as number | undefined,
          paddingBottom: msg.paddingBottom as number | undefined,
          paddingLeft: msg.paddingLeft as number | undefined,
          primaryAxisAlignItems: msg.primaryAxisAlignItems as
            | PrimaryAxisAlign
            | undefined,
          counterAxisAlignItems: msg.counterAxisAlignItems as
            | CounterAxisAlign
            | undefined,
          layoutSizingHorizontal: msg.layoutSizingHorizontal as
            | LayoutSizing
            | undefined,
          layoutSizingVertical: msg.layoutSizingVertical as
            | LayoutSizing
            | undefined,
          itemSpacing: msg.itemSpacing as number | undefined,
        };
        const result = await creationService.createFrame(params);
        figma.notify("Frame created successfully");
        figma.ui.postMessage({
          type: "command_result",
          command: "create_frame",
          result: result,
        });
        break;
      }

      case "create_text": {
        const params: CreateTextParams = {
          x: msg.x as number,
          y: msg.y as number,
          text: msg.text as string,
          fontSize: msg.fontSize as number | undefined,
          fontWeight: msg.fontWeight as number | undefined,
          fontColor: msg.fontColor as RGBAColor | undefined,
          name: msg.name as string | undefined,
          parentId: msg.parentId as string | undefined,
        };
        const result = await creationService.createText(params);
        figma.notify("Text created successfully");
        figma.ui.postMessage({
          type: "command_result",
          command: "create_text",
          result: result,
        });
        break;
      }

      // Text content commands
      case "set_text_content": {
        const params: SetTextContentParams = {
          nodeId: msg.nodeId as string,
          text: msg.text as string,
        };
        if (!params.nodeId || params.text === undefined) {
          throw new Error("nodeId and text are required");
        }
        const result = await textService.setTextContent(params);
        figma.notify("Text content updated successfully");
        figma.ui.postMessage({
          type: "command_result",
          command: "set_text_content",
          result: result,
        });
        break;
      }

      case "scan_text_nodes": {
        const params: ScanTextNodesParams = {
          nodeId: msg.nodeId as string,
          useChunking: msg.useChunking as boolean | undefined,
          chunkSize: msg.chunkSize as number | undefined,
          commandId: msg.commandId as string | undefined,
        };
        if (!params.nodeId) {
          throw new Error("nodeId is required");
        }
        const result = await textService.scanTextNodes(params);
        figma.ui.postMessage({
          type: "scan_text_nodes-result",
          data: result,
        });
        break;
      }

      case "set_multiple_text_contents": {
        const params: SetMultipleTextContentsParams = {
          nodeId: msg.nodeId as string,
          text: msg.text as Array<{ nodeId: string; text: string }>,
          commandId: msg.commandId as string | undefined,
        };
        if (!params.nodeId || !params.text) {
          throw new Error("nodeId and text are required");
        }
        const result = await textService.setMultipleTextContents(params);
        figma.ui.postMessage({
          type: "set_multiple_text_contents-result",
          data: result,
        });
        break;
      }

      // Layout commands
      case "set_layout_mode": {
        const params: SetLayoutModeParams = {
          nodeId: msg.nodeId as string,
          layoutMode: msg.layoutMode as LayoutMode,
          layoutWrap: msg.layoutWrap as LayoutWrap | undefined,
        };
        if (!params.nodeId || !params.layoutMode) {
          throw new Error("nodeId and layoutMode are required");
        }
        const result = await layoutService.setLayoutMode(params);
        figma.notify("Layout mode updated successfully");
        figma.ui.postMessage({
          type: "command_result",
          command: "set_layout_mode",
          result: result,
        });
        break;
      }

      case "set_padding": {
        const params: SetPaddingParams = {
          nodeId: msg.nodeId as string,
          paddingTop: msg.paddingTop as number | undefined,
          paddingRight: msg.paddingRight as number | undefined,
          paddingBottom: msg.paddingBottom as number | undefined,
          paddingLeft: msg.paddingLeft as number | undefined,
        };
        if (!params.nodeId) {
          throw new Error("nodeId is required");
        }
        const result = await layoutService.setPadding(params);
        figma.notify("Padding updated successfully");
        figma.ui.postMessage({
          type: "command_result",
          command: "set_padding",
          result: result,
        });
        break;
      }

      case "set_axis_align": {
        const params: SetAxisAlignParams = {
          nodeId: msg.nodeId as string,
          primaryAxisAlignItems: msg.primaryAxisAlignItems as
            | PrimaryAxisAlign
            | undefined,
          counterAxisAlignItems: msg.counterAxisAlignItems as
            | CounterAxisAlign
            | undefined,
        };
        if (!params.nodeId) {
          throw new Error("nodeId is required");
        }
        const result = await layoutService.setAxisAlign(params);
        figma.notify("Axis alignment updated successfully");
        figma.ui.postMessage({
          type: "command_result",
          command: "set_axis_align",
          result: result,
        });
        break;
      }

      case "set_layout_sizing": {
        const params: SetLayoutSizingParams = {
          nodeId: msg.nodeId as string,
          layoutSizingHorizontal: msg.layoutSizingHorizontal as
            | LayoutSizing
            | undefined,
          layoutSizingVertical: msg.layoutSizingVertical as
            | LayoutSizing
            | undefined,
        };
        if (!params.nodeId) {
          throw new Error("nodeId is required");
        }
        const result = await layoutService.setLayoutSizing(params);
        figma.notify("Layout sizing updated successfully");
        figma.ui.postMessage({
          type: "command_result",
          command: "set_layout_sizing",
          result: result,
        });
        break;
      }

      case "set_item_spacing": {
        const params: SetItemSpacingParams = {
          nodeId: msg.nodeId as string,
          itemSpacing: msg.itemSpacing as number,
        };
        if (!params.nodeId || params.itemSpacing === undefined) {
          throw new Error("nodeId and itemSpacing are required");
        }
        const result = await layoutService.setItemSpacing(params);
        figma.notify("Item spacing updated successfully");
        figma.ui.postMessage({
          type: "command_result",
          command: "set_item_spacing",
          result: result,
        });
        break;
      }

      // Styling commands
      case "set_fill_color": {
        const params: SetFillColorParams = {
          nodeId: msg.nodeId as string,
          color: {
            r: msg.r as number,
            g: msg.g as number,
            b: msg.b as number,
            a: msg.a as number | undefined
          } as RGBAColor,
        };
        if (!params.nodeId || params.color.r === undefined || params.color.g === undefined || params.color.b === undefined) {
          throw new Error("nodeId and color (r, g, b) are required");
        }
        console.log("🎨 Setting fill color:", params);
        const result = await styleService.setFillColor(params);
        figma.notify("Fill color updated successfully");
        figma.ui.postMessage({
          type: "command_result",
          command: "set_fill_color",
          result: result,
        });
        break;
      }

      case "set_stroke_color": {
        const params: SetStrokeColorParams = {
          nodeId: msg.nodeId as string,
          color: {
            r: msg.r as number,
            g: msg.g as number,
            b: msg.b as number,
            a: msg.a as number | undefined
          } as RGBAColor,
          weight: msg.weight as number | undefined,
        };
        if (!params.nodeId || params.color.r === undefined || params.color.g === undefined || params.color.b === undefined) {
          throw new Error("nodeId and color (r, g, b) are required");
        }
        console.log("🎨 Setting stroke color:", params);
        const result = await styleService.setStrokeColor(params);
        figma.notify("Stroke color updated successfully");
        figma.ui.postMessage({
          type: "command_result",
          command: "set_stroke_color",
          result: result,
        });
        break;
      }

      case "set_corner_radius": {
        const params: SetCornerRadiusParams = {
          nodeId: msg.nodeId as string,
          radius: msg.radius as number,
          corners: msg.corners as boolean[] | undefined,
        };
        if (!params.nodeId || params.radius === undefined) {
          throw new Error("nodeId and radius are required");
        }
        const result = await styleService.setCornerRadius(params);
        figma.notify("Corner radius updated successfully");
        figma.ui.postMessage({
          type: "command_result",
          command: "set_corner_radius",
          result: result,
        });
        break;
      }

      // Layout Management commands
      case "move_node": {
        const params: MoveNodeParams = {
          nodeId: msg.nodeId as string,
          x: msg.x as number,
          y: msg.y as number,
        };
        if (!params.nodeId || params.x === undefined || params.y === undefined) {
          throw new Error("nodeId, x, and y are required");
        }
        const result = await layoutManagementService.moveNode(params);
        figma.notify("Node moved successfully");
        figma.ui.postMessage({
          type: "command_result",
          command: "move_node",
          result: result,
        });
        break;
      }

      case "resize_node": {
        const params: ResizeNodeParams = {
          nodeId: msg.nodeId as string,
          width: msg.width as number,
          height: msg.height as number,
        };
        if (!params.nodeId || params.width === undefined || params.height === undefined) {
          throw new Error("nodeId, width, and height are required");
        }
        const result = await layoutManagementService.resizeNode(params);
        figma.notify("Node resized successfully");
        figma.ui.postMessage({
          type: "command_result",
          command: "resize_node",
          result: result,
        });
        break;
      }

      case "delete_node": {
        const params: DeleteNodeParams = {
          nodeId: msg.nodeId as string,
        };
        if (!params.nodeId) {
          throw new Error("nodeId is required");
        }
        const result = await layoutManagementService.deleteNode(params);
        figma.notify("Node deleted successfully");
        figma.ui.postMessage({
          type: "command_result",
          command: "delete_node",
          result: result,
        });
        break;
      }

      case "delete_multiple_nodes": {
        const params: DeleteMultipleNodesParams = {
          nodeIds: msg.nodeIds as string[],
        };
        if (!params.nodeIds || !Array.isArray(params.nodeIds)) {
          throw new Error("nodeIds array is required");
        }
        const result = await layoutManagementService.deleteMultipleNodes(params);
        figma.notify(`Deleted ${result.deletedCount} nodes successfully`);
        figma.ui.postMessage({
          type: "command_result",
          command: "delete_multiple_nodes",
          result: result,
        });
        break;
      }

      case "clone_node": {
        const params: CloneNodeParams = {
          nodeId: msg.nodeId as string,
          x: msg.x as number | undefined,
          y: msg.y as number | undefined,
        };
        if (!params.nodeId) {
          throw new Error("nodeId is required");
        }
        const result = await layoutManagementService.cloneNode(params);
        figma.notify("Node cloned successfully");
        figma.ui.postMessage({
          type: "command_result",
          command: "clone_node",
          result: result,
        });
        break;
      }

      // Component & Style commands
      case "get_styles": {
        console.log("🎨 Getting styles...");
        const result = await componentService.getStyles();
        console.log("🎨 Styles result:", result);
        console.log(`🎨 Found ${result.length} styles:`, result.map(s => `${s.name} (${s.type})`));
        figma.notify(`Found ${result.length} styles`);
        figma.ui.postMessage({
          type: "command_result",
          command: "get_styles",
          result: result,
        });
        break;
      }

      case "get_local_components": {
        const result = await componentService.getLocalComponents();
        figma.notify(`Found ${result.length} local components`);
        figma.ui.postMessage({
          type: "command_result",
          command: "get_local_components",
          result: result,
        });
        break;
      }

      case "create_component_instance": {
        const params: CreateComponentInstanceParams = {
          componentKey: msg.componentKey as string,
          x: msg.x as number,
          y: msg.y as number,
        };
        if (!params.componentKey || params.x === undefined || params.y === undefined) {
          throw new Error("componentKey, x, and y are required");
        }
        const result = await componentService.createComponentInstance(params);
        figma.notify("Component instance created successfully");
        figma.ui.postMessage({
          type: "command_result",
          command: "create_component_instance",
          result: result,
        });
        break;
      }

      case "get_instance_overrides": {
        const params: GetInstanceOverridesParams = {
          nodeId: msg.nodeId as string | undefined,
        };
        const result = await componentService.getInstanceOverrides(params);
        figma.ui.postMessage({
          type: "get_instance_overrides-result",
          data: result,
        });
        break;
      }

      case "set_instance_overrides": {
        const params: SetInstanceOverridesParams = {
          sourceInstanceId: msg.sourceInstanceId as string,
          targetNodeIds: msg.targetNodeIds as string[],
        };
        if (!params.sourceInstanceId || !params.targetNodeIds) {
          throw new Error("sourceInstanceId and targetNodeIds are required");
        }
        const result = await componentService.setInstanceOverrides(params);
        figma.ui.postMessage({
          type: "set_instance_overrides-result",
          data: result,
        });
        break;
      }

      case "export_node_as_image": {
        const params: ExportNodeParams = {
          nodeId: msg.nodeId as string,
          format: msg.format as ExportFormat | undefined,
          scale: msg.scale as number | undefined,
        };
        if (!params.nodeId) {
          throw new Error("nodeId is required");
        }
        const result = await componentService.exportNodeAsImage(params);
        figma.notify(result.success ? "Node exported successfully" : "Export failed");
        figma.ui.postMessage({
          type: "command_result",
          command: "export_node_as_image",
          result: result,
        });
        break;
      }

      case "close":
        figma.closePlugin();
        break;

      default:
        console.warn("Unknown message type:", msg.type);
    }
  } catch (error) {
    console.error("Error handling message:", error);
    figma.notify(`Error: ${error}`);
    figma.ui.postMessage({
      type: "command_error",
      command: msg.type,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Send ready signal
figma.ui.postMessage({
  type: "plugin-ready",
  status: "initialized",
  timestamp: Date.now(),
});

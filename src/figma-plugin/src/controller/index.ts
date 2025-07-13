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
  SetTextContentParams,
  ScanTextNodesParams,
  SetMultipleTextContentsParams,
  SetLayoutModeParams,
  SetPaddingParams,
  SetAxisAlignParams,
  SetLayoutSizingParams,
  SetItemSpacingParams,
  SetCornerRadiusParams,
  CreateComponentInstanceParams,
  GetInstanceOverridesParams,
  SetInstanceOverridesParams,
  ExportNodeParams,
  SetMultipleAnnotationsParams,
} from "@/types/types";

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

// Common command execution function
async function executeCommand(command: string, params: Record<string, unknown>): Promise<unknown> {
  switch (command) {
    // === Document Operations ===
      case "get_document_info": {
      return await documentService.getDocumentInfo();
      }

      case "get_selection": {
      return await documentService.getSelection();
      }

      case "read_my_design": {
      return await documentService.readMyDesign();
      }

      case "get_node_info": {
      if (!params.nodeId || typeof params.nodeId !== "string") {
          throw new Error("Missing nodeId parameter");
        }
      return await documentService.getNodeInfo({
        nodeId: params.nodeId,
      });
      }

      case "get_nodes_info": {
      if (!params.nodeIds || !Array.isArray(params.nodeIds)) {
          throw new Error("Missing or invalid nodeIds parameter");
        }
      return await documentService.getNodesInfo({
        nodeIds: params.nodeIds as string[],
      });
    }

    // === Creation Operations ===
    case "create_rectangle": {
      const rectParams = {
        x: params.x as number,
        y: params.y as number,
        width: params.width as number,
        height: params.height as number,
        name: params.name as string | undefined,
        parentId: params.parentId as string | undefined,
      };
      if (rectParams.x === undefined || rectParams.y === undefined || 
          rectParams.width === undefined || rectParams.height === undefined) {
        throw new Error("Missing required parameters: x, y, width, height");
      }
      return await creationService.createRectangle(rectParams);
    }

    case "create_frame": {
      const frameParams = {
        x: params.x as number,
        y: params.y as number,
        width: params.width as number,
        height: params.height as number,
        name: params.name as string | undefined,
        parentId: params.parentId as string | undefined,
        fillColor: params.fillColor as RGBAColor | undefined,
        strokeColor: params.strokeColor as RGBAColor | undefined,
        strokeWeight: params.strokeWeight as number | undefined,
        layoutMode: params.layoutMode as LayoutMode | undefined,
        layoutWrap: params.layoutWrap as LayoutWrap | undefined,
        paddingTop: params.paddingTop as number | undefined,
        paddingRight: params.paddingRight as number | undefined,
        paddingBottom: params.paddingBottom as number | undefined,
        paddingLeft: params.paddingLeft as number | undefined,
        primaryAxisAlignItems: params.primaryAxisAlignItems as PrimaryAxisAlign | undefined,
        counterAxisAlignItems: params.counterAxisAlignItems as CounterAxisAlign | undefined,
        layoutSizingHorizontal: params.layoutSizingHorizontal as LayoutSizing | undefined,
        layoutSizingVertical: params.layoutSizingVertical as LayoutSizing | undefined,
        itemSpacing: params.itemSpacing as number | undefined,
      };
      if (frameParams.x === undefined || frameParams.y === undefined || 
          frameParams.width === undefined || frameParams.height === undefined) {
        throw new Error("Missing required parameters: x, y, width, height");
      }
      return await creationService.createFrame(frameParams);
    }

    case "create_text": {
      const textParams = {
        x: params.x as number,
        y: params.y as number,
        text: params.text as string,
        fontSize: params.fontSize as number | undefined,
        fontWeight: params.fontWeight as number | undefined,
        fontColor: params.fontColor as RGBAColor | undefined,
        name: params.name as string | undefined,
        parentId: params.parentId as string | undefined,
      };
      if (textParams.x === undefined || textParams.y === undefined || !textParams.text) {
        throw new Error("Missing required parameters: x, y, text");
      }
      return await creationService.createText(textParams);
    }

    // === Text Operations ===
    case "set_text_content": {
      const setTextParams: SetTextContentParams = {
        nodeId: params.nodeId as string,
        text: params.text as string,
      };
      if (!setTextParams.nodeId || !setTextParams.text) {
        throw new Error("Missing required parameters: nodeId, text");
      }
      return await textService.setTextContent(setTextParams);
    }

    case "scan_text_nodes": {
      const scanParams: ScanTextNodesParams = {
        nodeId: params.nodeId as string,
        useChunking: params.useChunking as boolean | undefined,
        chunkSize: params.chunkSize as number | undefined,
      };
      if (!scanParams.nodeId) {
        throw new Error("Missing required parameter: nodeId");
      }
      return await textService.scanTextNodes(scanParams);
    }

    case "set_multiple_text_contents": {
      const multiTextParams: SetMultipleTextContentsParams = {
        nodeId: params.nodeId as string,
        text: params.text as Array<{ nodeId: string; text: string }>,
      };
      if (!multiTextParams.nodeId || !multiTextParams.text) {
        throw new Error("Missing required parameters: nodeId, text");
      }
      return await textService.setMultipleTextContents(multiTextParams);
    }

    // === Style Operations ===
    case "set_fill_color": {
      const fillParams = {
        nodeId: params.nodeId as string,
        color: params.color as RGBAColor,
      };
      if (!fillParams.nodeId || !fillParams.color || 
          fillParams.color.r === undefined || fillParams.color.g === undefined || 
          fillParams.color.b === undefined) {
        throw new Error("Missing required parameters: nodeId, color with r, g, b values");
      }
      return await styleService.setFillColor(fillParams);
    }

    case "set_stroke_color": {
      const strokeParams = {
        nodeId: params.nodeId as string,
        color: params.color as RGBAColor,
        weight: params.weight as number | undefined,
      };
      if (!strokeParams.nodeId || !strokeParams.color || 
          strokeParams.color.r === undefined || strokeParams.color.g === undefined || 
          strokeParams.color.b === undefined) {
        throw new Error("Missing required parameters: nodeId, color with r, g, b values");
      }
      return await styleService.setStrokeColor(strokeParams);
    }

    case "set_corner_radius": {
      const cornerParams: SetCornerRadiusParams = {
        nodeId: params.nodeId as string,
        radius: params.radius as number,
        corners: params.corners as boolean[] | undefined,
      };
      if (!cornerParams.nodeId || cornerParams.radius === undefined) {
        throw new Error("Missing required parameters: nodeId, radius");
      }
      return await styleService.setCornerRadius(cornerParams);
    }

    // === Layout Management Operations ===
    case "move_node": {
      const moveParams = {
        nodeId: params.nodeId as string,
        x: params.x as number,
        y: params.y as number,
      };
      if (!moveParams.nodeId || moveParams.x === undefined || moveParams.y === undefined) {
        throw new Error("Missing required parameters: nodeId, x, y");
      }
      return await layoutManagementService.moveNode(moveParams);
    }

    case "resize_node": {
      const resizeParams = {
        nodeId: params.nodeId as string,
        width: params.width as number,
        height: params.height as number,
      };
      if (!resizeParams.nodeId || resizeParams.width === undefined || resizeParams.height === undefined) {
        throw new Error("Missing required parameters: nodeId, width, height");
      }
      return await layoutManagementService.resizeNode(resizeParams);
    }

    case "clone_node": {
      const cloneParams = {
        nodeId: params.nodeId as string,
        x: params.x as number | undefined,
        y: params.y as number | undefined,
      };
      if (!cloneParams.nodeId) {
        throw new Error("Missing required parameter: nodeId");
      }
      return await layoutManagementService.cloneNode(cloneParams);
    }

    case "delete_node": {
      const deleteParams = {
        nodeId: params.nodeId as string,
      };
      if (!deleteParams.nodeId) {
        throw new Error("Missing required parameter: nodeId");
      }
      return await layoutManagementService.deleteNode(deleteParams);
    }

    case "delete_multiple_nodes": {
      const deleteMultipleParams = {
        nodeIds: params.nodeIds as string[],
      };
      if (!deleteMultipleParams.nodeIds || !Array.isArray(deleteMultipleParams.nodeIds)) {
        throw new Error("Missing required parameter: nodeIds");
      }
      return await layoutManagementService.deleteMultipleNodes(deleteMultipleParams);
    }

    // === Layout Operations ===
      case "set_layout_mode": {
      const layoutModeParams: SetLayoutModeParams = {
        nodeId: params.nodeId as string,
        layoutMode: params.layoutMode as LayoutMode,
        layoutWrap: params.layoutWrap as LayoutWrap | undefined,
      };
      if (!layoutModeParams.nodeId || !layoutModeParams.layoutMode) {
        throw new Error("Missing required parameters: nodeId, layoutMode");
      }
      return await layoutService.setLayoutMode(layoutModeParams);
      }

      case "set_padding": {
      const paddingParams: SetPaddingParams = {
        nodeId: params.nodeId as string,
        paddingTop: params.paddingTop as number | undefined,
        paddingRight: params.paddingRight as number | undefined,
        paddingBottom: params.paddingBottom as number | undefined,
        paddingLeft: params.paddingLeft as number | undefined,
      };
      if (!paddingParams.nodeId) {
        throw new Error("Missing required parameter: nodeId");
      }
      return await layoutService.setPadding(paddingParams);
      }

      case "set_axis_align": {
      const axisAlignParams: SetAxisAlignParams = {
        nodeId: params.nodeId as string,
        primaryAxisAlignItems: params.primaryAxisAlignItems as PrimaryAxisAlign | undefined,
        counterAxisAlignItems: params.counterAxisAlignItems as CounterAxisAlign | undefined,
      };
      if (!axisAlignParams.nodeId) {
        throw new Error("Missing required parameter: nodeId");
      }
      return await layoutService.setAxisAlign(axisAlignParams);
      }

      case "set_layout_sizing": {
      const layoutSizingParams: SetLayoutSizingParams = {
        nodeId: params.nodeId as string,
        layoutSizingHorizontal: params.layoutSizingHorizontal as LayoutSizing | undefined,
        layoutSizingVertical: params.layoutSizingVertical as LayoutSizing | undefined,
      };
      if (!layoutSizingParams.nodeId) {
        throw new Error("Missing required parameter: nodeId");
      }
      return await layoutService.setLayoutSizing(layoutSizingParams);
      }

      case "set_item_spacing": {
      const itemSpacingParams: SetItemSpacingParams = {
        nodeId: params.nodeId as string,
        itemSpacing: params.itemSpacing as number | undefined,
        counterAxisSpacing: params.counterAxisSpacing as number | undefined,
      };
      if (!itemSpacingParams.nodeId) {
        throw new Error("Missing required parameter: nodeId");
      }
      if (itemSpacingParams.itemSpacing === undefined && itemSpacingParams.counterAxisSpacing === undefined) {
        throw new Error("At least one of itemSpacing or counterAxisSpacing must be provided");
      }
      return await layoutService.setItemSpacing(itemSpacingParams);
    }

    // === Component Operations ===
    case "get_styles": {
      return await componentService.getStyles();
    }

    case "get_local_components": {
      return await componentService.getLocalComponents();
    }

    case "create_component_instance": {
      const instanceParams: CreateComponentInstanceParams = {
        componentKey: params.componentKey as string,
        x: params.x as number,
        y: params.y as number,
      };
      if (!instanceParams.componentKey || instanceParams.x === undefined || instanceParams.y === undefined) {
        throw new Error("Missing required parameters: componentKey, x, y");
      }
      return await componentService.createComponentInstance(instanceParams);
    }

    case "get_instance_overrides": {
      const overridesParams: GetInstanceOverridesParams = {
        nodeId: params.nodeId as string | undefined,
      };
      return await componentService.getInstanceOverrides(overridesParams);
    }

    case "set_instance_overrides": {
      const setOverridesParams: SetInstanceOverridesParams = {
        sourceInstanceId: params.sourceInstanceId as string,
        targetNodeIds: params.targetNodeIds as string[],
      };
      if (!setOverridesParams.sourceInstanceId || !setOverridesParams.targetNodeIds) {
        throw new Error("Missing required parameters: sourceInstanceId, targetNodeIds");
      }
      return await componentService.setInstanceOverrides(setOverridesParams);
    }

    case "export_node_as_image": {
      const exportParams: ExportNodeParams = {
        nodeId: params.nodeId as string,
        format: params.format as "PNG" | "JPG" | "SVG" | "PDF" | undefined,
        scale: params.scale as number | undefined,
      };
      if (!exportParams.nodeId) {
        throw new Error("Missing required parameter: nodeId");
      }
      return await componentService.exportNodeAsImage(exportParams);
    }

    // === Annotation Operations ===
    case "get_annotations": {
      const annotationParams = {
        nodeId: params.nodeId as string | undefined,
        includeCategories: params.includeCategories as boolean | undefined,
      };
      return await annotationService.getAnnotations(annotationParams);
    }

    case "set_annotation": {
      const setAnnotationParams = {
        nodeId: params.nodeId as string,
        labelMarkdown: params.labelMarkdown as string,
        categoryId: params.categoryId as string | undefined,
        annotationId: params.annotationId as string | undefined,
        properties: params.properties as Array<{ type: string }> | undefined,
      };
      if (!setAnnotationParams.nodeId || !setAnnotationParams.labelMarkdown) {
        throw new Error("Missing required parameters: nodeId, labelMarkdown");
      }
      return await annotationService.setAnnotation(setAnnotationParams);
    }

    case "set_multiple_annotations": {
      const multiAnnotationParams: SetMultipleAnnotationsParams = {
        nodeId: params.nodeId as string,
        annotations: params.annotations as Array<{
          nodeId: string;
          labelMarkdown: string;
          categoryId?: string;
          annotationId?: string;
          properties?: Array<{ type: string }>;
        }>,
      };
      if (!multiAnnotationParams.nodeId || !multiAnnotationParams.annotations) {
        throw new Error("Missing required parameters: nodeId, annotations");
      }
      return await annotationService.setMultipleAnnotations(multiAnnotationParams);
    }

    case "scan_nodes_by_types": {
      const scanTypesParams = {
        nodeId: params.nodeId as string,
        types: params.types as string[],
      };
      if (!scanTypesParams.nodeId || !scanTypesParams.types) {
        throw new Error("Missing required parameters: nodeId, types");
      }
      return await annotationService.scanNodesByTypes(scanTypesParams);
    }

    // === Prototype Operations ===
    case "get_reactions": {
      const reactionsParams = {
        nodeIds: params.nodeIds as string[],
      };
      if (!reactionsParams.nodeIds || !Array.isArray(reactionsParams.nodeIds)) {
        throw new Error("Missing required parameter: nodeIds");
      }
      return await prototypeService.getReactions(reactionsParams.nodeIds);
    }

    case "set_default_connector": {
      const connectorParams = {
        connectorId: params.connectorId as string | undefined,
      };
      return await prototypeService.setDefaultConnector(connectorParams.connectorId);
    }

    case "create_connections": {
      const connectionsParams = {
        connections: params.connections as Array<{
          startNodeId: string;
          endNodeId: string;
          text?: string;
        }>,
      };
      if (!connectionsParams.connections || !Array.isArray(connectionsParams.connections)) {
        throw new Error("Missing required parameter: connections");
      }
      return await prototypeService.createConnections(connectionsParams.connections);
    }

    // === Channel Operations ===
    case "join": {
      const joinParams = {
        channel: params.channel as string,
      };
      if (!joinParams.channel) {
        throw new Error("Missing required parameter: channel");
      }
      // Join channel operation - this is typically handled by the WebSocket layer
      return { success: true, message: `Joined channel: ${joinParams.channel}` };
    }

    // === Utility Operations ===
    case "notify": {
      const notifyParams = {
        message: params.message as string,
      };
      if (!notifyParams.message) {
        throw new Error("Missing required parameter: message");
      }
      // Show notification in Figma
      figma.notify(notifyParams.message);
      return { success: true, message: `Notification shown: ${notifyParams.message}` };
    }



    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

// Handle messages from UI
figma.ui.onmessage = async (msg: { type: string; [key: string]: unknown }) => {
  console.log("🔥 Received message:", msg.type, msg);

  // Handle execute-command type - extract the actual command
  let commandToExecute = msg.type;
  let paramsToUse: Record<string, unknown> = msg;
  let commandId = msg.id as string | undefined;
  
  if (msg.type === "execute-command") {
    commandToExecute = msg.command as string;
    paramsToUse = (msg.params as Record<string, unknown>) || {};
    commandId = msg.webSocketCommandId as string;
    
    if (!commandToExecute) {
      throw new Error("Missing command parameter in execute-command message");
    }
  }

  try {
    // Execute command using the common function
    const result = await executeCommand(commandToExecute, paramsToUse);
    
    console.log(`✅ Command ${commandToExecute} completed:`, result);
    
    // Always send result to UI (which will forward to WebSocket if needed)
    figma.ui.postMessage({
      type: "command-result",
      id: commandId,
      command: commandToExecute,
      result: result,
    });

  } catch (error) {
    console.error(`❌ Error executing command ${commandToExecute}:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Always send error to UI (which will forward to WebSocket if needed)
    figma.ui.postMessage({
      type: "command-error",
      id: commandId,
      command: commandToExecute,
      error: errorMessage,
    });
    
    figma.notify(`Error: ${errorMessage}`);
  }
};



// Send ready signal
figma.ui.postMessage({
  type: "plugin-ready",
  status: "initialized",
  timestamp: Date.now(),
});

// Layout service for auto layout operations
import {
  SetLayoutModeParams,
  SetPaddingParams,
  SetAxisAlignParams,
  SetLayoutSizingParams,
  SetItemSpacingParams,
} from "../types";

export class LayoutService {
  async moveNode(params: {
    nodeId: string;
    x: number;
    y: number;
  }): Promise<{ message: string }> {
    console.log("Moving node with params:", params);
    return { message: "Move node - to be implemented" };
  }

  async resizeNode(params: {
    nodeId: string;
    width: number;
    height: number;
  }): Promise<{ message: string }> {
    console.log("Resizing node with params:", params);
    return { message: "Resize node - to be implemented" };
  }

  async deleteNode(params: { nodeId: string }): Promise<{ message: string }> {
    console.log("Deleting node with params:", params);
    return { message: "Delete node - to be implemented" };
  }

  async deleteMultipleNodes(params: {
    nodeIds: string[];
  }): Promise<{ message: string }> {
    console.log("Deleting multiple nodes with params:", params);
    return { message: "Delete multiple nodes - to be implemented" };
  }

  async cloneNode(params: {
    nodeId: string;
    x?: number;
    y?: number;
  }): Promise<{ message: string }> {
    console.log("Cloning node with params:", params);
    return { message: "Clone node - to be implemented" };
  }

  async setLayoutMode(
    params: SetLayoutModeParams
  ): Promise<{
    id: string;
    name: string;
    layoutMode: string;
    layoutWrap?: string;
  }> {
    const { nodeId, layoutMode = "NONE", layoutWrap = "NO_WRAP" } = params;

    // Get the target node
    const node = await figma.getNodeByIdAsync(nodeId);
    if (!node) {
      throw new Error(`Node with ID ${nodeId} not found`);
    }

    // Check if node is a frame or component that supports layoutMode
    if (
      node.type !== "FRAME" &&
      node.type !== "COMPONENT" &&
      node.type !== "COMPONENT_SET" &&
      node.type !== "INSTANCE"
    ) {
      throw new Error(`Node type ${node.type} does not support layoutMode`);
    }

    const frameNode = node as
      | FrameNode
      | ComponentNode
      | ComponentSetNode
      | InstanceNode;

    // Set layout mode
    frameNode.layoutMode = layoutMode;

    // Set layoutWrap if applicable
    if (layoutMode !== "NONE") {
      frameNode.layoutWrap = layoutWrap;
    }

    return {
      id: frameNode.id,
      name: frameNode.name,
      layoutMode: frameNode.layoutMode,
      layoutWrap: frameNode.layoutWrap,
    };
  }

  async setPadding(
    params: SetPaddingParams
  ): Promise<{
    id: string;
    name: string;
    paddingTop: number;
    paddingRight: number;
    paddingBottom: number;
    paddingLeft: number;
  }> {
    const { nodeId, paddingTop, paddingRight, paddingBottom, paddingLeft } =
      params;

    // Get the target node
    const node = await figma.getNodeByIdAsync(nodeId);
    if (!node) {
      throw new Error(`Node with ID ${nodeId} not found`);
    }

    // Check if node is a frame or component that supports padding
    if (
      node.type !== "FRAME" &&
      node.type !== "COMPONENT" &&
      node.type !== "COMPONENT_SET" &&
      node.type !== "INSTANCE"
    ) {
      throw new Error(`Node type ${node.type} does not support padding`);
    }

    const frameNode = node as
      | FrameNode
      | ComponentNode
      | ComponentSetNode
      | InstanceNode;

    // Check if the node has auto-layout enabled
    if (frameNode.layoutMode === "NONE") {
      throw new Error(
        "Padding can only be set on auto-layout frames (layoutMode must not be NONE)"
      );
    }

    // Set padding values if provided
    if (paddingTop !== undefined) frameNode.paddingTop = paddingTop;
    if (paddingRight !== undefined) frameNode.paddingRight = paddingRight;
    if (paddingBottom !== undefined) frameNode.paddingBottom = paddingBottom;
    if (paddingLeft !== undefined) frameNode.paddingLeft = paddingLeft;

    return {
      id: frameNode.id,
      name: frameNode.name,
      paddingTop: frameNode.paddingTop,
      paddingRight: frameNode.paddingRight,
      paddingBottom: frameNode.paddingBottom,
      paddingLeft: frameNode.paddingLeft,
    };
  }

  async setAxisAlign(
    params: SetAxisAlignParams
  ): Promise<{
    id: string;
    name: string;
    primaryAxisAlignItems: string;
    counterAxisAlignItems: string;
    layoutMode: string;
  }> {
    const { nodeId, primaryAxisAlignItems, counterAxisAlignItems } = params;

    // Get the target node
    const node = await figma.getNodeByIdAsync(nodeId);
    if (!node) {
      throw new Error(`Node with ID ${nodeId} not found`);
    }

    // Check if node is a frame or component that supports axis alignment
    if (
      node.type !== "FRAME" &&
      node.type !== "COMPONENT" &&
      node.type !== "COMPONENT_SET" &&
      node.type !== "INSTANCE"
    ) {
      throw new Error(`Node type ${node.type} does not support axis alignment`);
    }

    const frameNode = node as
      | FrameNode
      | ComponentNode
      | ComponentSetNode
      | InstanceNode;

    // Check if the node has auto-layout enabled
    if (frameNode.layoutMode === "NONE") {
      throw new Error(
        "Axis alignment can only be set on auto-layout frames (layoutMode must not be NONE)"
      );
    }

    // Validate and set primaryAxisAlignItems if provided
    if (primaryAxisAlignItems !== undefined) {
      if (
        !["MIN", "MAX", "CENTER", "SPACE_BETWEEN"].includes(
          primaryAxisAlignItems
        )
      ) {
        throw new Error(
          "Invalid primaryAxisAlignItems value. Must be one of: MIN, MAX, CENTER, SPACE_BETWEEN"
        );
      }
      frameNode.primaryAxisAlignItems = primaryAxisAlignItems;
    }

    // Validate and set counterAxisAlignItems if provided
    if (counterAxisAlignItems !== undefined) {
      if (
        !["MIN", "MAX", "CENTER", "BASELINE"].includes(counterAxisAlignItems)
      ) {
        throw new Error(
          "Invalid counterAxisAlignItems value. Must be one of: MIN, MAX, CENTER, BASELINE"
        );
      }
      // BASELINE is only valid for horizontal layout
      if (
        counterAxisAlignItems === "BASELINE" &&
        frameNode.layoutMode !== "HORIZONTAL"
      ) {
        throw new Error(
          "BASELINE alignment is only valid for horizontal auto-layout frames"
        );
      }
      frameNode.counterAxisAlignItems = counterAxisAlignItems;
    }

    return {
      id: frameNode.id,
      name: frameNode.name,
      primaryAxisAlignItems: frameNode.primaryAxisAlignItems,
      counterAxisAlignItems: frameNode.counterAxisAlignItems,
      layoutMode: frameNode.layoutMode,
    };
  }

  async setLayoutSizing(
    params: SetLayoutSizingParams
  ): Promise<{
    id: string;
    name: string;
    layoutSizingHorizontal: string;
    layoutSizingVertical: string;
    layoutMode: string;
  }> {
    const { nodeId, layoutSizingHorizontal, layoutSizingVertical } = params;

    // Get the target node
    const node = await figma.getNodeByIdAsync(nodeId);
    if (!node) {
      throw new Error(`Node with ID ${nodeId} not found`);
    }

    // Check if node is a frame or component that supports layout sizing
    if (
      node.type !== "FRAME" &&
      node.type !== "COMPONENT" &&
      node.type !== "COMPONENT_SET" &&
      node.type !== "INSTANCE"
    ) {
      throw new Error(`Node type ${node.type} does not support layout sizing`);
    }

    const frameNode = node as
      | FrameNode
      | ComponentNode
      | ComponentSetNode
      | InstanceNode;

    // Check if the node has auto-layout enabled
    if (frameNode.layoutMode === "NONE") {
      throw new Error(
        "Layout sizing can only be set on auto-layout frames (layoutMode must not be NONE)"
      );
    }

    // Validate and set layoutSizingHorizontal if provided
    if (layoutSizingHorizontal !== undefined) {
      if (!["FIXED", "HUG", "FILL"].includes(layoutSizingHorizontal)) {
        throw new Error(
          "Invalid layoutSizingHorizontal value. Must be one of: FIXED, HUG, FILL"
        );
      }
      // HUG is only valid on auto-layout frames and text nodes
      if (
        layoutSizingHorizontal === "HUG" &&
        !["FRAME", "TEXT"].includes(node.type)
      ) {
        throw new Error(
          "HUG sizing is only valid on auto-layout frames and text nodes"
        );
      }
      // FILL is only valid on auto-layout children
      if (
        layoutSizingHorizontal === "FILL" &&
        (!frameNode.parent ||
          !("layoutMode" in frameNode.parent) ||
          frameNode.parent.layoutMode === "NONE")
      ) {
        throw new Error("FILL sizing is only valid on auto-layout children");
      }
      frameNode.layoutSizingHorizontal = layoutSizingHorizontal;
    }

    // Validate and set layoutSizingVertical if provided
    if (layoutSizingVertical !== undefined) {
      if (!["FIXED", "HUG", "FILL"].includes(layoutSizingVertical)) {
        throw new Error(
          "Invalid layoutSizingVertical value. Must be one of: FIXED, HUG, FILL"
        );
      }
      // HUG is only valid on auto-layout frames and text nodes
      if (
        layoutSizingVertical === "HUG" &&
        !["FRAME", "TEXT"].includes(node.type)
      ) {
        throw new Error(
          "HUG sizing is only valid on auto-layout frames and text nodes"
        );
      }
      // FILL is only valid on auto-layout children
      if (
        layoutSizingVertical === "FILL" &&
        (!frameNode.parent ||
          !("layoutMode" in frameNode.parent) ||
          frameNode.parent.layoutMode === "NONE")
      ) {
        throw new Error("FILL sizing is only valid on auto-layout children");
      }
      frameNode.layoutSizingVertical = layoutSizingVertical;
    }

    return {
      id: frameNode.id,
      name: frameNode.name,
      layoutSizingHorizontal: frameNode.layoutSizingHorizontal,
      layoutSizingVertical: frameNode.layoutSizingVertical,
      layoutMode: frameNode.layoutMode,
    };
  }

  async setItemSpacing(
    params: SetItemSpacingParams
  ): Promise<{
    id: string;
    name: string;
    itemSpacing: number;
    layoutMode: string;
  }> {
    const { nodeId, itemSpacing } = params;

    // Get the target node
    const node = await figma.getNodeByIdAsync(nodeId);
    if (!node) {
      throw new Error(`Node with ID ${nodeId} not found`);
    }

    // Check if node is a frame or component that supports item spacing
    if (
      node.type !== "FRAME" &&
      node.type !== "COMPONENT" &&
      node.type !== "COMPONENT_SET" &&
      node.type !== "INSTANCE"
    ) {
      throw new Error(`Node type ${node.type} does not support item spacing`);
    }

    const frameNode = node as
      | FrameNode
      | ComponentNode
      | ComponentSetNode
      | InstanceNode;

    // Check if the node has auto-layout enabled
    if (frameNode.layoutMode === "NONE") {
      throw new Error(
        "Item spacing can only be set on auto-layout frames (layoutMode must not be NONE)"
      );
    }

    // Set item spacing
    frameNode.itemSpacing = itemSpacing;

    return {
      id: frameNode.id,
      name: frameNode.name,
      itemSpacing: frameNode.itemSpacing,
      layoutMode: frameNode.layoutMode,
    };
  }
}

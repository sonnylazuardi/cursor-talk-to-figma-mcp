// Creation service for creating new elements
import { CreateRectangleParams, CreateFrameParams, CreateTextParams, NodeInfo } from '@/types/types';

export class CreationService {
  
  async createRectangle(params: CreateRectangleParams): Promise<NodeInfo> {
    const {
      x = 0,
      y = 0,
      width = 100,
      height = 100,
      name = "Rectangle",
      parentId,
    } = params;

    const rect = figma.createRectangle();
    rect.x = x;
    rect.y = y;
    rect.resize(width, height);
    rect.name = name;

    // If parentId is provided, append to that node, otherwise append to current page
    if (parentId) {
      const parentNode = await figma.getNodeByIdAsync(parentId);
      if (!parentNode) {
        throw new Error(`Parent node not found with ID: ${parentId}`);
      }
      if (!("appendChild" in parentNode)) {
        throw new Error(`Parent node does not support children: ${parentId}`);
      }
      (parentNode as FrameNode | ComponentNode | ComponentSetNode | InstanceNode | PageNode).appendChild(rect);
    } else {
      figma.currentPage.appendChild(rect);
    }

    return {
      id: rect.id,
      name: rect.name,
      type: rect.type,
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    };
  }

  async createFrame(params: CreateFrameParams): Promise<NodeInfo> {
    const {
      x = 0,
      y = 0,
      width = 100,
      height = 100,
      name = "Frame",
      parentId,
      fillColor,
      strokeColor,
      strokeWeight,
      layoutMode = "NONE",
      layoutWrap = "NO_WRAP",
      paddingTop = 10,
      paddingRight = 10,
      paddingBottom = 10,
      paddingLeft = 10,
      primaryAxisAlignItems = "MIN",
      counterAxisAlignItems = "MIN",
      layoutSizingHorizontal = "FIXED",
      layoutSizingVertical = "FIXED",
      itemSpacing = 0,
    } = params;

    const frame = figma.createFrame();
    frame.x = x;
    frame.y = y;
    frame.resize(width, height);
    frame.name = name;

    // Set layout mode if provided
    if (layoutMode !== "NONE") {
      frame.layoutMode = layoutMode;
      frame.layoutWrap = layoutWrap;

      // Set padding values only when layoutMode is not NONE
      frame.paddingTop = paddingTop;
      frame.paddingRight = paddingRight;
      frame.paddingBottom = paddingBottom;
      frame.paddingLeft = paddingLeft;

      // Set axis alignment only when layoutMode is not NONE
      frame.primaryAxisAlignItems = primaryAxisAlignItems;
      frame.counterAxisAlignItems = counterAxisAlignItems;

      // Set layout sizing only when layoutMode is not NONE
      frame.layoutSizingHorizontal = layoutSizingHorizontal;
      frame.layoutSizingVertical = layoutSizingVertical;

      // Set item spacing only when layoutMode is not NONE
      frame.itemSpacing = itemSpacing;
    }

    // Set fill color if provided
    if (fillColor) {
      const paintStyle = {
        type: "SOLID" as const,
        color: {
          r: parseFloat(fillColor.r.toString()) || 0,
          g: parseFloat(fillColor.g.toString()) || 0,
          b: parseFloat(fillColor.b.toString()) || 0,
        },
        opacity: parseFloat((fillColor.a !== undefined ? fillColor.a.toString() : '1')) || 1,
      };
      frame.fills = [paintStyle];
    }

    // Set stroke color and weight if provided
    if (strokeColor) {
      const strokeStyle = {
        type: "SOLID" as const,
        color: {
          r: parseFloat(strokeColor.r.toString()) || 0,
          g: parseFloat(strokeColor.g.toString()) || 0,
          b: parseFloat(strokeColor.b.toString()) || 0,
        },
        opacity: parseFloat((strokeColor.a !== undefined ? strokeColor.a.toString() : '1')) || 1,
      };
      frame.strokes = [strokeStyle];
    }

    // Set stroke weight if provided
    if (strokeWeight !== undefined) {
      frame.strokeWeight = strokeWeight;
    }

    // If parentId is provided, append to that node, otherwise append to current page
    if (parentId) {
      const parentNode = await figma.getNodeByIdAsync(parentId);
      if (!parentNode) {
        throw new Error(`Parent node not found with ID: ${parentId}`);
      }
      if (!("appendChild" in parentNode)) {
        throw new Error(`Parent node does not support children: ${parentId}`);
      }
      (parentNode as FrameNode | ComponentNode | ComponentSetNode | InstanceNode | PageNode).appendChild(frame);
    } else {
      figma.currentPage.appendChild(frame);
    }

    return {
      id: frame.id,
      name: frame.name,
      type: frame.type,
      x: frame.x,
      y: frame.y,
      width: frame.width,
      height: frame.height,
    };
  }

  async createText(params: CreateTextParams): Promise<NodeInfo> {
    const {
      x = 0,
      y = 0,
      text = "Text",
      fontSize = 14,
      fontWeight = 400,
      fontColor = { r: 0, g: 0, b: 0, a: 1 }, // Default to black
      name = "",
      parentId,
    } = params;

    // Map common font weights to Figma font styles
    const getFontStyle = (weight: number): string => {
      switch (weight) {
        case 100:
          return "Thin";
        case 200:
          return "Extra Light";
        case 300:
          return "Light";
        case 400:
          return "Regular";
        case 500:
          return "Medium";
        case 600:
          return "Semi Bold";
        case 700:
          return "Bold";
        case 800:
          return "Extra Bold";
        case 900:
          return "Black";
        default:
          return "Regular";
      }
    };

    const textNode = figma.createText();
    textNode.x = x;
    textNode.y = y;
    textNode.name = name || text;
    
    try {
      await figma.loadFontAsync({
        family: "Inter",
        style: getFontStyle(fontWeight),
      });
      textNode.fontName = { family: "Inter", style: getFontStyle(fontWeight) };
      textNode.fontSize = parseInt(fontSize.toString());
    } catch (error) {
      console.error("Error setting font size", error);
    }
    
    await this.setCharacters(textNode, text);

    // Set text color
    const paintStyle = {
      type: "SOLID" as const,
      color: {
        r: parseFloat(fontColor.r.toString()) || 0,
        g: parseFloat(fontColor.g.toString()) || 0,
        b: parseFloat(fontColor.b.toString()) || 0,
      },
      opacity: parseFloat((fontColor.a !== undefined ? fontColor.a.toString() : '1')) || 1,
    };
    textNode.fills = [paintStyle];

    // If parentId is provided, append to that node, otherwise append to current page
    if (parentId) {
      const parentNode = await figma.getNodeByIdAsync(parentId);
      if (!parentNode) {
        throw new Error(`Parent node not found with ID: ${parentId}`);
      }
      if (!("appendChild" in parentNode)) {
        throw new Error(`Parent node does not support children: ${parentId}`);
      }
      (parentNode as FrameNode | ComponentNode | ComponentSetNode | InstanceNode | PageNode).appendChild(textNode);
    } else {
      figma.currentPage.appendChild(textNode);
    }

    return {
      id: textNode.id,
      name: textNode.name,
      type: textNode.type,
      x: textNode.x,
      y: textNode.y,
      width: textNode.width,
      height: textNode.height,
    };
  }

  private async setCharacters(node: TextNode, characters: string, options?: { fallbackFont?: FontName }): Promise<boolean> {
    const fallbackFont = (options && options.fallbackFont) || {
      family: "Inter",
      style: "Regular",
    };
    
    try {
      if (node.fontName === figma.mixed) {
        const firstCharFont = node.getRangeFontName(0, 1);
        await figma.loadFontAsync(firstCharFont as FontName);
        node.fontName = firstCharFont as FontName;
      } else {
        await figma.loadFontAsync(node.fontName as FontName);
      }
    } catch (err) {
      console.warn(
        `Failed to load "${(node.fontName as FontName) ? (node.fontName as FontName).family : ''} ${(node.fontName as FontName) ? (node.fontName as FontName).style : ''}" font and replaced with fallback "${fallbackFont.family} ${fallbackFont.style}"`,
        err
      );
      await figma.loadFontAsync(fallbackFont);
      node.fontName = fallbackFont;
    }
    
    try {
      node.characters = characters;
      return true;
    } catch (err) {
      console.warn(`Failed to set characters. Skipped.`, err);
      return false;
    }
  }
} 
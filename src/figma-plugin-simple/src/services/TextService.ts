// Text service for text content operations
import {
  SetTextContentParams,
  ScanTextNodesParams,
  SetMultipleTextContentsParams,
  TextNodeInfo,
  ScanTextNodesResult,
  TextReplaceResult,
} from "../types";
import {
  generateCommandId,
  getNodePath,
  highlightNodeWithFill,
  delay,
  setCharacters,
  withProgress,
  withChunkedProgress,
} from "../utils/common";

export class TextService {
  async setTextContent(params: SetTextContentParams): Promise<{
    id: string;
    name: string;
    characters: string;
    fontName: FontName | typeof figma.mixed;
  }> {
    const { nodeId, text } = params;

    if (!nodeId) {
      throw new Error("Missing nodeId parameter");
    }

    if (text === undefined) {
      throw new Error("Missing text parameter");
    }

    const node = await figma.getNodeByIdAsync(nodeId);
    if (!node) {
      throw new Error(`Node not found with ID: ${nodeId}`);
    }

    if (node.type !== "TEXT") {
      throw new Error(`Node is not a text node: ${nodeId}`);
    }

    const textNode = node as TextNode;

    try {
      await setCharacters(textNode, text);

      return {
        id: textNode.id,
        name: textNode.name,
        characters: textNode.characters,
        fontName: textNode.fontName,
      };
    } catch (error) {
      throw new Error(
        `Error setting text content: ${(error as Error).message}`
      );
    }
  }

  async scanTextNodes(
    params: ScanTextNodesParams
  ): Promise<ScanTextNodesResult> {
    const { nodeId, chunkSize = 0, commandId = generateCommandId() } = params;
    const node = await figma.getNodeByIdAsync(nodeId);

    if (!node) {
      throw new Error(`Node with id ${nodeId} not found`);
    }

    // 🚀 NEW: Non-chunked processing - using withProgress
    if (chunkSize <= 0) {
      return await withProgress(
        commandId,
        "scan_text_nodes",
        `Starting scan of node "${node.name || nodeId}" without chunking`,
        "Scan completed successfully",
        async (_tracker) => {
      const textNodes: TextNodeInfo[] = [];

        if ("children" in node || node.type === "TEXT") {
          await this.findTextNodes(node as SceneNode, [], 0, textNodes);
        }

        return {
          success: true,
          message: `Scanned ${textNodes.length} text nodes.`,
          count: textNodes.length,
          textNodes: textNodes,
          commandId,
        };
        }
      );
    }

    // 🚀 NEW: Chunked processing - using withChunkedProgress
    console.log(`Using chunked scanning with chunk size: ${chunkSize}`);

    // First, collect nodes to process
    const nodesToProcess: Array<{
      node: SceneNode;
      parentPath: string[];
      depth: number;
    }> = [];

    if ("children" in node || node.type === "TEXT") {
      await this.collectNodesToProcess(node as SceneNode, [], 0, nodesToProcess);
    }

    // Process with chunked progress tracking
    const allTextNodes = await withChunkedProgress(
      commandId,
      "scan_text_nodes",
      nodesToProcess,
        chunkSize,
      `Starting chunked scan of node "${node.name || nodeId}"`,
      "Chunked scan completed successfully",
      async (chunk, chunkIndex, totalChunks, _tracker) => {
        console.log(`Processing chunk ${chunkIndex + 1}/${totalChunks}`);
        
      const chunkTextNodes: TextNodeInfo[] = [];

        // Process each node in the chunk
        for (const nodeInfo of chunk) {
        if (nodeInfo.node.type === "TEXT") {
          try {
            await highlightNodeWithFill(nodeInfo.node, 100);
            
            const textNodeInfo = await this.processTextNode(
              nodeInfo.node as TextNode,
              nodeInfo.parentPath,
              nodeInfo.depth
            );
            if (textNodeInfo) {
              chunkTextNodes.push(textNodeInfo);
            }
          } catch (error) {
              console.error(`Error processing text node: ${(error as Error).message}`);
          }
        }

          await delay(5); // Short delay for UI updates
        }
        
        return chunkTextNodes;
        }
    ) as TextNodeInfo[];

    return {
      success: true,
      message: `Scanned ${allTextNodes.length} text nodes using chunked processing.`,
      count: allTextNodes.length,
      textNodes: allTextNodes,
      commandId,
    };
  }

  async setMultipleTextContents(
    params: SetMultipleTextContentsParams
  ): Promise<TextReplaceResult> {
    const { nodeId, text } = params;

    if (!nodeId || !text || !Array.isArray(text)) {
      throw new Error("Missing required parameters: nodeId and text array");
    }

    console.log(
      `Starting text replacement for node: ${nodeId} with ${text.length} text replacements`
    );

    // Use chunked progress for replacing multiple text contents
    const results = await withChunkedProgress(
      generateCommandId(),
      "set_multiple_text_contents",
      text,
      5, // Process 5 text replacements per chunk
      `Starting text replacement for ${text.length} nodes`,
      "Completed text replacement",
             async (chunk, _chunkIndex, _totalChunks, _tracker) => {
      // Process replacements within a chunk in parallel
      const chunkPromises = chunk.map(async (replacement) => {
        if (!replacement.nodeId || replacement.text === undefined) {
          console.error(`Missing nodeId or text for replacement`);
          return {
            success: false,
            nodeId: replacement.nodeId || "unknown",
            error: "Missing nodeId or text in replacement entry",
          };
        }

        try {
          console.log(
            `Attempting to replace text in node: ${replacement.nodeId}`
          );

          // Get the text node to update (just to check it exists and get original text)
          const textNode = await figma.getNodeByIdAsync(replacement.nodeId);

          if (!textNode) {
            console.error(`Text node not found: ${replacement.nodeId}`);
            return {
              success: false,
              nodeId: replacement.nodeId,
              error: `Node not found: ${replacement.nodeId}`,
            };
          }

          if (textNode.type !== "TEXT") {
            console.error(
              `Node is not a text node: ${replacement.nodeId} (type: ${textNode.type})`
            );
            return {
              success: false,
              nodeId: replacement.nodeId,
              error: `Node is not a text node: ${replacement.nodeId} (type: ${textNode.type})`,
            };
  }

          const textNodeTyped = textNode as TextNode;

          // Save original text for the result
          const originalText = textNodeTyped.characters;
          console.log(`Original text: "${originalText}"`);
          console.log(`Will translate to: "${replacement.text}"`);

                    // Highlight the node before changing text
          await highlightNodeWithFill(textNodeTyped, 100);

          // Use the existing setTextContent function to handle font loading and text setting
          await this.setTextContent({
            nodeId: replacement.nodeId,
            text: replacement.text,
          });

          // Brief delay after text change
          await delay(400);

          console.log(
            `Successfully replaced text in node: ${replacement.nodeId}`
          );
          return {
            success: true,
            nodeId: replacement.nodeId,
            originalText: originalText,
            translatedText: replacement.text,
          };
        } catch (error) {
          console.error(
            `Error replacing text in node ${replacement.nodeId}: ${
              (error as Error).message
            }`
          );
          return {
            success: false,
            nodeId: replacement.nodeId,
            error: `Error applying replacement: ${(error as Error).message}`,
          };
        }
      });

      // Wait for all replacements in this chunk to complete
        const chunkProcessResults = await Promise.all(chunkPromises);
        return chunkProcessResults;
      }
    );

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(
      `Text replacement completed. Success: ${successCount}, Failed: ${failureCount}`
    );

    return {
      success: successCount > 0,
      nodeId,
      replacementsApplied: successCount,
      replacementsFailed: failureCount,
      totalReplacements: text.length,
      results,
    };
  }

  // Helper methods

  private async collectNodesToProcess(
    node: SceneNode,
    parentPath: string[] = [],
    depth: number = 0,
    nodesToProcess: Array<{
      node: SceneNode;
      parentPath: string[];
      depth: number;
    }> = []
  ): Promise<void> {
    // Skip invisible nodes
    if (node.visible === false) return;

    // Get the path to this node
    const nodePath = parentPath.slice();
    nodePath.push(node.name || `Unnamed ${node.type}`);

    // Add this node to the processing list
    nodesToProcess.push({
      node,
      parentPath: nodePath,
      depth,
    });

    // If this node has children, recursively collect them
    if ("children" in node && node.children) {
      for (const child of node.children) {
        await this.collectNodesToProcess(
          child,
          nodePath,
          depth + 1,
          nodesToProcess
        );
      }
    }
  }

  private async processTextNode(
    node: TextNode,
    _parentPath: string[],
    depth: number
  ): Promise<TextNodeInfo | null> {
    try {
      return {
        id: node.id,
        name: node.name,
        characters: node.characters,
        fontName: node.fontName,
        fontSize: node.fontSize as number,
        depth: depth,
        path: getNodePath(node),
        visible: node.visible,
        locked: node.locked,
      };
    } catch (error) {
      console.error(
        `Error processing text node ${node.id}: ${(error as Error).message}`
      );
      return null;
    }
  }

  private async findTextNodes(
    node: SceneNode,
    parentPath: string[] = [],
    depth: number = 0,
    textNodes: TextNodeInfo[] = []
  ): Promise<void> {
    // Skip invisible nodes
    if (node.visible === false) return;

    // Get the path to this node
    const nodePath = parentPath.slice();
    nodePath.push(node.name || `Unnamed ${node.type}`);

    // If this is a text node, process it
    if (node.type === "TEXT") {
      // Highlight the text node to show it's being processed
      await highlightNodeWithFill(node, 100);
      
      const textNodeInfo = await this.processTextNode(
        node as TextNode,
        nodePath,
        depth
      );
      if (textNodeInfo) {
        textNodes.push(textNodeInfo);
      }
    }

    // If this node has children, recursively find text nodes in them
    if ("children" in node && node.children) {
      for (const child of node.children) {
        await this.findTextNodes(child, nodePath, depth + 1, textNodes);
  }
    }
  }
}

// Text service for text content operations
import {
  SetTextContentParams,
  ScanTextNodesParams,
  SetMultipleTextContentsParams,
  TextNodeInfo,
  ScanTextNodesResult,
  TextReplaceResult,
} from "../../../types/types";
import {
  sendProgressUpdate,
  generateCommandId,
  getNodePath,
  highlightNodeWithFill,
  delay,
  setCharacters,
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
    console.log(`Starting to scan text nodes from node ID: ${params.nodeId}`);
    const {
      nodeId,
      useChunking = true,
      chunkSize = 10,
      commandId = generateCommandId(),
    } = params;

    const node = await figma.getNodeByIdAsync(nodeId);

    if (!node) {
      console.error(`Node with ID ${nodeId} not found`);
      // Send error progress update
      sendProgressUpdate(
        commandId,
        "scan_text_nodes",
        "error",
        0,
        0,
        0,
        `Node with ID ${nodeId} not found`,
        { error: `Node not found: ${nodeId}` }
      );
      throw new Error(`Node with ID ${nodeId} not found`);
    }

    // If chunking is not enabled, use the original implementation
    if (!useChunking) {
      const textNodes: TextNodeInfo[] = [];
      try {
        // Send started progress update
        sendProgressUpdate(
          commandId,
          "scan_text_nodes",
          "started",
          0,
          1, // Not known yet how many nodes there are
          0,
          `Starting scan of node "${node.name || nodeId}" without chunking`,
          null
        );

        if ("children" in node || node.type === "TEXT") {
          await this.findTextNodes(node as SceneNode, [], 0, textNodes);
        }

        // Send completed progress update
        sendProgressUpdate(
          commandId,
          "scan_text_nodes",
          "completed",
          100,
          textNodes.length,
          textNodes.length,
          `Scan complete. Found ${textNodes.length} text nodes.`,
          { textNodes }
        );

        return {
          success: true,
          message: `Scanned ${textNodes.length} text nodes.`,
          count: textNodes.length,
          textNodes: textNodes,
          commandId,
        };
      } catch (error) {
        console.error("Error scanning text nodes:", error);

        // Send error progress update
        sendProgressUpdate(
          commandId,
          "scan_text_nodes",
          "error",
          0,
          0,
          0,
          `Error scanning text nodes: ${(error as Error).message}`,
          { error: (error as Error).message }
        );

        throw new Error(
          `Error scanning text nodes: ${(error as Error).message}`
        );
      }
    }

    // Chunked implementation
    console.log(`Using chunked scanning with chunk size: ${chunkSize}`);

    // First, collect all nodes to process (without processing them yet)
    const nodesToProcess: Array<{
      node: SceneNode;
      parentPath: string[];
      depth: number;
    }> = [];

    // Send started progress update
    sendProgressUpdate(
      commandId,
      "scan_text_nodes",
      "started",
      0,
      0, // Not known yet how many nodes there are
      0,
      `Starting chunked scan of node "${node.name || nodeId}"`,
      { chunkSize }
    );

    if ("children" in node || node.type === "TEXT") {
      await this.collectNodesToProcess(
        node as SceneNode,
        [],
        0,
        nodesToProcess
      );
    }

    const totalNodes = nodesToProcess.length;
    console.log(`Found ${totalNodes} total nodes to process`);

    // Calculate number of chunks needed
    const totalChunks = Math.ceil(totalNodes / chunkSize);
    console.log(`Will process in ${totalChunks} chunks`);

    // Send update after node collection
    sendProgressUpdate(
      commandId,
      "scan_text_nodes",
      "in_progress",
      5, // 5% progress for collection phase
      totalNodes,
      0,
      `Found ${totalNodes} nodes to scan. Will process in ${totalChunks} chunks.`,
      {
        totalNodes,
        totalChunks,
        chunkSize,
      }
    );

    // Process nodes in chunks
    const allTextNodes: TextNodeInfo[] = [];
    let processedNodes = 0;
    let chunksProcessed = 0;

    for (let i = 0; i < totalNodes; i += chunkSize) {
      const chunkEnd = Math.min(i + chunkSize, totalNodes);
      console.log(
        `Processing chunk ${
          chunksProcessed + 1
        }/${totalChunks} (nodes ${i} to ${chunkEnd - 1})`
      );

      // Send update before processing chunk
      sendProgressUpdate(
        commandId,
        "scan_text_nodes",
        "in_progress",
        Math.round(5 + (chunksProcessed / totalChunks) * 90), // 5-95% for processing
        totalNodes,
        processedNodes,
        `Processing chunk ${chunksProcessed + 1}/${totalChunks}`,
        {
          currentChunk: chunksProcessed + 1,
          totalChunks,
          textNodesFound: allTextNodes.length,
        }
      );

      const chunkNodes = nodesToProcess.slice(i, chunkEnd);
      const chunkTextNodes: TextNodeInfo[] = [];

      // Process each node in this chunk
      for (const nodeInfo of chunkNodes) {
        if (nodeInfo.node.type === "TEXT") {
          try {
            // Highlight the text node to show it's being processed
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
            console.error(
              `Error processing text node: ${(error as Error).message}`
            );
            // Continue with other nodes
          }
        }

        // Brief delay to allow UI updates and prevent freezing
        await delay(5);
      }

      // Add results from this chunk
      for (const textNode of chunkTextNodes) {
        allTextNodes.push(textNode);
      }
      processedNodes += chunkNodes.length;
      chunksProcessed++;

      // Send update after processing chunk
      sendProgressUpdate(
        commandId,
        "scan_text_nodes",
        "in_progress",
        Math.round(5 + (chunksProcessed / totalChunks) * 90), // 5-95% for processing
        totalNodes,
        processedNodes,
        `Processed chunk ${chunksProcessed}/${totalChunks}. Found ${allTextNodes.length} text nodes so far.`,
        {
          currentChunk: chunksProcessed,
          totalChunks,
          processedNodes,
          textNodesFound: allTextNodes.length,
          chunkResult: chunkTextNodes,
        }
      );

      // Small delay between chunks to prevent UI freezing
      if (i + chunkSize < totalNodes) {
        await delay(50);
      }
    }

    // Send completed progress update
    sendProgressUpdate(
      commandId,
      "scan_text_nodes",
      "completed",
      100,
      totalNodes,
      processedNodes,
      `Scan complete. Found ${allTextNodes.length} text nodes.`,
      {
        textNodes: allTextNodes,
        processedNodes,
        chunks: chunksProcessed,
      }
    );

    return {
      success: true,
      message: `Chunked scan complete. Found ${allTextNodes.length} text nodes.`,
      count: allTextNodes.length,
      textNodes: allTextNodes,
      commandId,
      totalNodes: processedNodes,
      processedNodes: processedNodes,
      chunks: chunksProcessed,
    };
  }

  async setMultipleTextContents(
    params: SetMultipleTextContentsParams
  ): Promise<TextReplaceResult> {
    const { nodeId, text } = params;
    const commandId = params.commandId || generateCommandId();

    if (!nodeId || !text || !Array.isArray(text)) {
      const errorMsg = "Missing required parameters: nodeId and text array";

      // Send error progress update
      sendProgressUpdate(
        commandId,
        "set_multiple_text_contents",
        "error",
        0,
        0,
        0,
        errorMsg,
        { error: errorMsg }
      );

      throw new Error(errorMsg);
    }

    console.log(
      `Starting text replacement for node: ${nodeId} with ${text.length} text replacements`
    );

    // Send started progress update
    sendProgressUpdate(
      commandId,
      "set_multiple_text_contents",
      "started",
      0,
      text.length,
      0,
      `Starting text replacement for ${text.length} nodes`,
      { totalReplacements: text.length }
    );

    // Define the results array and counters
    const results: Array<{
      success: boolean;
      nodeId: string;
      error?: string;
      originalText?: string;
      translatedText?: string;
    }> = [];
    let successCount = 0;
    let failureCount = 0;

    // Split text replacements into chunks of 5
    const CHUNK_SIZE = 5;
    const chunks: Array<Array<{ nodeId: string; text: string }>> = [];

    for (let i = 0; i < text.length; i += CHUNK_SIZE) {
      chunks.push(text.slice(i, i + CHUNK_SIZE));
    }

    console.log(
      `Split ${text.length} replacements into ${chunks.length} chunks`
    );

    // Send chunking info update
    sendProgressUpdate(
      commandId,
      "set_multiple_text_contents",
      "in_progress",
      5, // 5% progress for planning phase
      text.length,
      0,
      `Preparing to replace text in ${text.length} nodes using ${chunks.length} chunks`,
      {
        totalReplacements: text.length,
        chunks: chunks.length,
        chunkSize: CHUNK_SIZE,
      }
    );

    // Process each chunk sequentially
    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex];
      console.log(
        `Processing chunk ${chunkIndex + 1}/${chunks.length} with ${
          chunk.length
        } replacements`
      );

      // Send chunk processing start update
      sendProgressUpdate(
        commandId,
        "set_multiple_text_contents",
        "in_progress",
        Math.round(5 + (chunkIndex / chunks.length) * 90), // 5-95% for processing
        text.length,
        successCount + failureCount,
        `Processing text replacements chunk ${chunkIndex + 1}/${chunks.length}`,
        {
          currentChunk: chunkIndex + 1,
          totalChunks: chunks.length,
          successCount,
          failureCount,
        }
      );

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
      const chunkResults = await Promise.all(chunkPromises);

      // Process results for this chunk
      chunkResults.forEach((result) => {
        if (result.success) {
          successCount++;
        } else {
          failureCount++;
        }
        results.push(result);
      });

      // Send chunk processing complete update with partial results
      sendProgressUpdate(
        commandId,
        "set_multiple_text_contents",
        "in_progress",
        Math.round(5 + ((chunkIndex + 1) / chunks.length) * 90), // 5-95% for processing
        text.length,
        successCount + failureCount,
        `Completed chunk ${chunkIndex + 1}/${
          chunks.length
        }. ${successCount} successful, ${failureCount} failed so far.`,
        {
          currentChunk: chunkIndex + 1,
          totalChunks: chunks.length,
          successCount,
          failureCount,
          chunkResults: chunkResults,
        }
      );

      // Add a small delay between chunks to avoid overloading Figma
      if (chunkIndex < chunks.length - 1) {
        console.log("Pausing between chunks to avoid overloading Figma...");
        await delay(1000); // 1 second delay between chunks
      }
    }

    console.log(
      `Replacement complete: ${successCount} successful, ${failureCount} failed`
    );

    // Send completed progress update
    sendProgressUpdate(
      commandId,
      "set_multiple_text_contents",
      "completed",
      100,
      text.length,
      successCount + failureCount,
      `Text replacement complete: ${successCount} successful, ${failureCount} failed`,
      {
        totalReplacements: text.length,
        successCount,
        failureCount,
        results: results,
      }
    );

    return {
      success: true,
      nodeId,
      replacementsApplied: successCount,
      replacementsFailed: failureCount,
      totalReplacements: text.length,
      completedInChunks: chunks.length,
      results: results,
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

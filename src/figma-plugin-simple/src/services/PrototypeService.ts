import { sendProgressUpdate, generateCommandId, getNodePath, highlightNodeWithAnimation } from '../utils/common';
import type { ReactionNode, GetReactionsResult, SetDefaultConnectorResult, ConnectionResult, CreateConnectionsResult } from '../types';

// Prototype service for prototype operations
export class PrototypeService {

  /**
   * Get all prototype reactions from nodes with visual highlight animation
   * @param nodeIds - Array of node IDs to check for reactions
   * @returns Promise with reaction data
   */
     async getReactions(nodeIds: string[]): Promise<GetReactionsResult> {
     try {
       const commandId = generateCommandId();
       sendProgressUpdate(
        commandId,
        "get_reactions",
        "started",
        0,
        nodeIds.length,
        0,
        `Starting deep search for reactions in ${nodeIds.length} nodes and their children`
      );

      // Function to find nodes with reactions from the node and all its children
             const findNodesWithReactions = async (
         node: SceneNode, 
         processedNodes = new Set<string>(), 
         depth = 0, 
         results: ReactionNode[] = []
       ) => {
        // Skip already processed nodes (prevent circular references)
        if (processedNodes.has(node.id)) {
          return results;
        }
        
        processedNodes.add(node.id);
        
        // Check if the current node has reactions
        let filteredReactions: unknown[] = [];
        if ('reactions' in node && node.reactions && node.reactions.length > 0) {
          // Filter out reactions with navigation === 'CHANGE_TO'
          filteredReactions = node.reactions.filter((r: unknown) => {
            // Some reactions may have action or actions array
            const reaction = r as { action?: { navigation?: string }; actions?: Array<{ navigation?: string }> };
            if (reaction.action && reaction.action.navigation === 'CHANGE_TO') return false;
            if (Array.isArray(reaction.actions)) {
              // If any action in actions array is CHANGE_TO, exclude
              return !reaction.actions.some((a) => a.navigation === 'CHANGE_TO');
            }
            return true;
          });
        }
        const hasFilteredReactions = filteredReactions.length > 0;
        
        // If the node has filtered reactions, add it to results and apply highlight effect
        if (hasFilteredReactions) {
          results.push({
            id: node.id,
            name: node.name,
            type: node.type,
            depth: depth,
            hasReactions: true,
            reactions: filteredReactions,
                       path: getNodePath(node)
         });
         // Apply highlight effect (orange border)
         await highlightNodeWithAnimation(node);
        }
        
        // If node has children, recursively search them
        if ('children' in node) {
          for (const child of node.children) {
            await findNodesWithReactions(child, processedNodes, depth + 1, results);
          }
        }
        
        return results;
      };

             // Array to store all results
       let allResults: ReactionNode[] = [];
      let processedCount = 0;
      const totalCount = nodeIds.length;
      
      // Iterate through each node and its children to search for reactions
      for (let i = 0; i < nodeIds.length; i++) {
        try {
          const nodeId = nodeIds[i];
          const node = await figma.getNodeByIdAsync(nodeId);
          
                     if (!node) {
             processedCount++;
             sendProgressUpdate(
               commandId,
               "get_reactions",
               "in_progress",
               processedCount / totalCount,
               totalCount,
               processedCount,
               `Node not found: ${nodeId}`
             );
             continue;
           }
           
           // Search for reactions in the node and its children
           const processedNodes = new Set<string>();
           const nodeResults = await findNodesWithReactions(node as SceneNode, processedNodes);
           
           // Add results
           allResults = allResults.concat(nodeResults);
           
           // Update progress
           processedCount++;
           sendProgressUpdate(
             commandId,
             "get_reactions",
             "in_progress",
             processedCount / totalCount,
             totalCount,
             processedCount,
             `Processed node ${processedCount}/${totalCount}, found ${nodeResults.length} nodes with reactions`
           );
         } catch (error) {
           processedCount++;
           sendProgressUpdate(
             commandId,
             "get_reactions",
             "in_progress",
             processedCount / totalCount,
             totalCount,
             processedCount,
             `Error processing node: ${error}`
           );
        }
      }

             // Completion update
       sendProgressUpdate(
         commandId,
         "get_reactions",
         "completed",
         1,
         totalCount,
         totalCount,
         `Completed deep search: found ${allResults.length} nodes with reactions.`
       );

      return {
        nodesCount: nodeIds.length,
        nodesWithReactions: allResults.length,
        nodes: allResults
      };
    } catch (error) {
      throw new Error(`Failed to get reactions: ${error}`);
    }
  }

  /**
   * Set a copied FigJam connector as the default connector style
   * @param connectorId - Optional connector ID to set as default
   * @returns Promise with success status
   */
     async setDefaultConnector(connectorId?: string): Promise<SetDefaultConnectorResult> {
    // If connectorId is provided, search and set by that ID (do not check existing storage)
    if (connectorId) {
      // Get node by specified ID
      const node = await figma.getNodeByIdAsync(connectorId);
      if (!node) {
        throw new Error(`Connector node not found with ID: ${connectorId}`);
      }
      
      // Check node type
      if (node.type !== 'CONNECTOR') {
        throw new Error(`Node is not a connector: ${connectorId}`);
      }
      
      // Set the found connector as the default connector
      await figma.clientStorage.setAsync('defaultConnectorId', connectorId);
      
      figma.notify(`Default connector set to: ${connectorId}`);
      return {
        success: true,
        message: `Default connector set to: ${connectorId}`,
        connectorId: connectorId
      };
    } 
    // If connectorId is not provided, check existing storage
    else {
      // Check if there is an existing default connector in client storage
      try {
        const existingConnectorId = await figma.clientStorage.getAsync('defaultConnectorId');
        
        // If there is an existing connector ID, check if the node is still valid
        if (existingConnectorId) {
          try {
            const existingConnector = await figma.getNodeByIdAsync(existingConnectorId);
            
            // If the stored connector still exists and is of type CONNECTOR
            if (existingConnector && existingConnector.type === 'CONNECTOR') {
              figma.notify(`Default connector is already set to: ${existingConnectorId}`);
              return {
                success: true,
                message: `Default connector is already set to: ${existingConnectorId}`,
                connectorId: existingConnectorId,
                exists: true
              };
            }
            // The stored connector is no longer valid - find a new connector
            else {
              console.log(`Stored connector ID ${existingConnectorId} is no longer valid, finding a new connector...`);
            }
          } catch (error) {
            console.log(`Error finding stored connector: ${error}. Will try to set a new one.`);
          }
        }
      } catch (error) {
        console.log(`Error checking for existing connector: ${error}`);
      }
      
      // If there is no stored default connector or it is invalid, find one in the current page
      try {
        // Find CONNECTOR type nodes in the current page
        const currentPageConnectors = figma.currentPage.findAllWithCriteria({ types: ['CONNECTOR'] });
        
        if (currentPageConnectors && currentPageConnectors.length > 0) {
          // Use the first connector found
          const foundConnector = currentPageConnectors[0];
          const autoFoundId = foundConnector.id;
          
          // Set the found connector as the default connector
          await figma.clientStorage.setAsync('defaultConnectorId', autoFoundId);
          
          figma.notify(`Automatically found and set default connector to: ${autoFoundId}`);
          return {
            success: true,
            message: `Automatically found and set default connector to: ${autoFoundId}`,
            connectorId: autoFoundId,
            autoSelected: true
          };
        } else {
          // If no connector is found in the current page, show a guide message
          const errorMsg = 'No connector found in the current page. Please create a connector in Figma first or specify a connector ID.';
          figma.notify(errorMsg);
          throw new Error(errorMsg);
        }
      } catch (error) {
        // Error occurred while running findAllWithCriteria
        throw new Error(`Failed to find a connector: ${error}`);
      }
    }
  }

  /**
   * Create FigJam connector lines between nodes
   * @param connections - Array of connection objects with start/end node IDs and optional text
   * @returns Promise with created connections data
   */
     async createConnections(connections: Array<{
     startNodeId: string;
     endNodeId: string;
     text?: string;
   }>): Promise<CreateConnectionsResult> {
    if (!connections || !Array.isArray(connections)) {
      throw new Error('Missing or invalid connections parameter');
    }
    
         const commandId = generateCommandId();
     sendProgressUpdate(
       commandId,
       "create_connections",
       "started",
       0,
       connections.length,
       0,
       `Starting to create ${connections.length} connections`
     );
    
    // Get default connector ID from client storage
    const defaultConnectorId = await figma.clientStorage.getAsync('defaultConnectorId');
    if (!defaultConnectorId) {
      const errorMsg = 'No default connector set. Please run "set_default_connector" command first.';
      figma.notify(errorMsg);
      throw new Error(errorMsg);
    }
    
    // Get the default connector
    const defaultConnector = await figma.getNodeByIdAsync(defaultConnectorId);
    if (!defaultConnector) {
      throw new Error(`Default connector not found with ID: ${defaultConnectorId}`);
    }
    if (defaultConnector.type !== 'CONNECTOR') {
      throw new Error(`Node is not a connector: ${defaultConnectorId}`);
    }
    
         // Results array for connection creation
     const results: ConnectionResult[] = [];
    let processedCount = 0;
    const totalCount = connections.length;
    
    for (let i = 0; i < connections.length; i++) {
      try {
        const { startNodeId, endNodeId, text } = connections[i];
        
        const startNode = await figma.getNodeByIdAsync(startNodeId);
        if (!startNode) throw new Error(`Start node not found with ID: ${startNodeId}`);
        
        const endNode = await figma.getNodeByIdAsync(endNodeId);
        if (!endNode) throw new Error(`End node not found with ID: ${endNodeId}`);
        
        // Clone the default connector
        const clonedConnector = defaultConnector.clone();
        
        // Update connector name
        clonedConnector.name = `TTF_Connector/${startNode.id}/${endNode.id}`;
        
        // Set start and end points
        if ('connectorStart' in clonedConnector && 'connectorEnd' in clonedConnector) {
          clonedConnector.connectorStart = {
            endpointNodeId: startNodeId,
            magnet: 'AUTO'
          };
          
          clonedConnector.connectorEnd = {
            endpointNodeId: endNodeId,
            magnet: 'AUTO'
          };
        }
        
        // Add text if provided
        if (text && 'text' in clonedConnector && clonedConnector.text) {
          try {
            // Try to load Inter font
            await figma.loadFontAsync({ family: "Inter", style: "Regular" });
            clonedConnector.text.characters = text;
          } catch (textError) {
            console.error("Error setting text:", textError);
            // Continue with connection even if text setting fails
          }
        }
        
        // Add to results
        results.push({
          id: clonedConnector.id,
          startNodeId: startNodeId,
          endNodeId: endNodeId,
          text: text || ""
        });
        
                 // Update progress
         processedCount++;
         sendProgressUpdate(
           commandId,
           "create_connections",
           "in_progress",
           processedCount / totalCount,
           totalCount,
           processedCount,
           `Created connection ${processedCount}/${totalCount}`
         );
         
       } catch (error) {
         console.error("Error creating connection", error);
         processedCount++;
         sendProgressUpdate(
           commandId,
           "create_connections",
           "in_progress",
           processedCount / totalCount,
           totalCount,
           processedCount,
           `Error creating connection: ${error}`
         );
        
        results.push({
          startNodeId: connections[i].startNodeId,
          endNodeId: connections[i].endNodeId,
          text: connections[i].text,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
         // Completion update
     sendProgressUpdate(
       commandId,
       "create_connections",
       "completed",
       1,
       totalCount,
       totalCount,
       `Completed creating ${results.length} connections`
     );
    
    figma.notify(`Created ${results.filter(r => !r.error).length} connections`);
    
    return {
      success: true,
      count: results.length,
      connections: results
    };
  }
} 
// Annotation service for annotation operations
import { 
  SetMultipleAnnotationsParams, 
  AnnotationResult,
  CommandParams
} from '../types';
import { highlightNodeWithFill } from '../utils/common';

export class AnnotationService {
  /**
   * Get all annotations in the current document or specific node
   */
  async getAnnotations(params: CommandParams['get_annotations']): Promise<unknown> {
    try {
      const { nodeId, includeCategories = true } = params;
      console.log('🔍 Getting annotations with params:', { nodeId, includeCategories });

      // Get categories first if needed
      let categoriesMap: Record<string, {
        id: string;
        label: string;
        color: string;
        isPreset: boolean;
      }> = {};
      
      if (includeCategories) {
        const categories = await figma.annotations.getAnnotationCategoriesAsync();
        console.log('📝 Found annotation categories:', categories.length);
        categoriesMap = categories.reduce((map, category) => {
          map[category.id] = {
            id: category.id,
            label: category.label,
            color: category.color,
            isPreset: category.isPreset,
          };
          return map;
        }, {} as Record<string, {
          id: string;
          label: string;
          color: string;
          isPreset: boolean;
        }>);
      }

      if (nodeId) {
        // Get annotations for a specific node
        console.log('🎯 Getting annotations for specific node:', nodeId);
        const node = await figma.getNodeByIdAsync(nodeId);
        if (!node) {
          throw new Error(`Node not found: ${nodeId}`);
        }

        if (!("annotations" in node)) {
          throw new Error(`Node type ${node.type} does not support annotations`);
        }

        const nodeAnnotations = (node as { annotations: readonly Annotation[] }).annotations || [];
        console.log('📋 Node annotations found:', {
          nodeId: node.id,
          nodeName: node.name,
          nodeType: node.type,
          annotationCount: nodeAnnotations.length,
          annotations: nodeAnnotations.map(ann => ({
            labelMarkdown: ann.labelMarkdown,
            categoryId: ann.categoryId,
            properties: ann.properties
          }))
        });

        const result = {
          nodeId: node.id,
          name: node.name,
          annotations: nodeAnnotations,
        };

        if (includeCategories) {
          const finalResult = Object.assign({}, result, {
            categories: Object.values(categoriesMap)
          });
          console.log('✅ Returning specific node result with categories:', {
            nodeId: result.nodeId,
            annotationCount: result.annotations.length,
            categoryCount: Object.values(categoriesMap).length
          });
          return finalResult;
        }

        console.log('✅ Returning specific node result without categories:', {
          nodeId: result.nodeId,
          annotationCount: result.annotations.length
        });
        return result;
      } else {
        // Get all annotations in the current page
        console.log('🌐 Getting all annotations in current page');
        const annotations: Array<{ 
          nodeId: string; 
          name: string; 
          annotations: readonly Annotation[] 
        }> = [];
        
        const processNode = async (node: BaseNode): Promise<void> => {
          if ("annotations" in node) {
            const nodeWithAnnotations = node as { annotations: readonly Annotation[] };
            if (nodeWithAnnotations.annotations && nodeWithAnnotations.annotations.length > 0) {
              annotations.push({
                nodeId: node.id,
                name: node.name,
                annotations: nodeWithAnnotations.annotations,
              });
            }
          }
          if ("children" in node) {
            const parentNode = node as ChildrenMixin;
            for (const child of parentNode.children) {
              await processNode(child);
            }
          }
        };

        // Start from current page
        await processNode(figma.currentPage);

        console.log('📊 Page scan complete:', {
          totalAnnotatedNodes: annotations.length,
          totalAnnotations: annotations.reduce((sum, node) => sum + node.annotations.length, 0),
          annotatedNodes: annotations.map(node => ({
            nodeId: node.nodeId,
            nodeName: node.name,
            annotationCount: node.annotations.length
          }))
        });

        const result = {
          annotatedNodes: annotations,
        };

        if (includeCategories) {
          const finalResult = Object.assign({}, result, {
            categories: Object.values(categoriesMap)
          });
          console.log('✅ Returning page result with categories:', {
            annotatedNodeCount: annotations.length,
            categoryCount: Object.values(categoriesMap).length
          });
          return finalResult;
        }

        console.log('✅ Returning page result without categories:', {
          annotatedNodeCount: annotations.length
        });
        return result;
      }
    } catch (error) {
      console.error('❌ Error getting annotations:', error);
      throw error;
    }
  }

  /**
   * Create or update an annotation
   */
  async setAnnotation(params: CommandParams['set_annotation']): Promise<unknown> {
    try {
      const { nodeId, labelMarkdown, categoryId, properties } = params;

      // Validate required parameters
      if (!nodeId) {
        return { success: false, error: "Missing nodeId" };
      }

      if (!labelMarkdown) {
        return { success: false, error: "Missing labelMarkdown" };
      }

      // Get and validate node
      const node = await figma.getNodeByIdAsync(nodeId);
      if (!node) {
        return { success: false, error: `Node not found: ${nodeId}` };
      }

      // Validate node supports annotations
      if (!("annotations" in node)) {
        return {
          success: false,
          error: `Node type ${node.type} does not support annotations`,
        };
      }

      // Create the annotation object
      const newAnnotation: {
        labelMarkdown: string;
        categoryId?: string;
        properties?: Array<{ type: string }>;
      } = {
        labelMarkdown,
      };

      // Add optional properties
      if (categoryId) {
        newAnnotation.categoryId = categoryId;
      }

      if (properties && Array.isArray(properties) && properties.length > 0) {
        newAnnotation.properties = properties;
      }

      // Set the annotation directly like in code.js
      (node as SceneNode & { annotations: Annotation[] }).annotations = [newAnnotation as Annotation];

      return {
        success: true,
        nodeId: node.id,
        name: node.name,
        annotations: (node as SceneNode & { annotations: Annotation[] }).annotations,
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Set multiple annotations with async progress updates
   */
  async setMultipleAnnotations(params: SetMultipleAnnotationsParams): Promise<AnnotationResult> {
    const { nodeId, annotations } = params;

    if (!annotations || annotations.length === 0) {
      return { 
        success: false, 
        nodeId, 
        annotationsApplied: 0,
        annotationsFailed: 0,
        totalAnnotations: 0,
        results: []
      };
    }

    const results: Array<{ success: boolean; nodeId: string; error?: string; annotationId?: string }> = [];
    let successCount = 0;
    let failureCount = 0;

    // Process annotations sequentially
    for (let i = 0; i < annotations.length; i++) {
      const annotation = annotations[i];

      try {
        // Highlight the node before setting annotation
        const node = await figma.getNodeByIdAsync(annotation.nodeId);
        if (node && 'fills' in node) {
          await highlightNodeWithFill(node as SceneNode, 200);
        }

        const result = await this.setAnnotation({
          nodeId: annotation.nodeId,
          labelMarkdown: annotation.labelMarkdown,
          categoryId: annotation.categoryId,
          properties: annotation.properties,
        });

        const typedResult = result as { success: boolean; error?: string };
        if (typedResult.success) {
          successCount++;
          results.push({ success: true, nodeId: annotation.nodeId });
        } else {
          failureCount++;
          results.push({
            success: false,
            nodeId: annotation.nodeId,
            error: typedResult.error,
          });
        }
      } catch (error) {
        failureCount++;
        const errorResult = {
          success: false,
          nodeId: annotation.nodeId,
          error: (error as Error).message,
        };
        results.push(errorResult);
      }
    }

    return {
      success: successCount > 0,
      nodeId,
      annotationsApplied: successCount,
      annotationsFailed: failureCount,
      totalAnnotations: annotations.length,
      results: results,
    };
  }

  /**
   * Scan for nodes with specific types within a node
   */
  async scanNodesByTypes(params: CommandParams['scan_nodes_by_types']): Promise<unknown> {
    const { nodeId, types = [] } = params || {};

    if (!types || types.length === 0) {
      throw new Error("No types specified to search for");
    }

    const node = await figma.getNodeByIdAsync(nodeId);

    if (!node) {
      throw new Error(`Node with ID ${nodeId} not found`);
    }

    const matchingNodes: Array<{
      id: string;
      name: string;
      type: string;
      visible?: boolean;
      x?: number;
      y?: number;
      width?: number;
      height?: number;
    }> = [];

    // Recursively find nodes with specified types
    await this.findNodesByTypes(node, types, matchingNodes);

    return {
      success: true,
      message: `Found ${matchingNodes.length} matching nodes.`,
      count: matchingNodes.length,
      matchingNodes: matchingNodes,
      searchedTypes: types,
    };
  }

  /**
   * Helper function to recursively find nodes by types
   */
  private async findNodesByTypes(
    node: BaseNode, 
    types: string[], 
    matchingNodes: Array<{
      id: string;
      name: string;
      type: string;
      visible?: boolean;
      x?: number;
      y?: number;
      width?: number;
      height?: number;
    }>
  ): Promise<void> {
    // Check if current node matches any of the specified types
    if (types.includes(node.type)) {
      // Highlight the found node
      if ('fills' in node) {
        await highlightNodeWithFill(node as SceneNode, 150);
      }

      const nodeInfo: {
        id: string;
        name: string;
        type: string;
        visible?: boolean;
        x?: number;
        y?: number;
        width?: number;
        height?: number;
      } = {
        id: node.id,
        name: node.name,
        type: node.type,
      };

      // Add visible property if available
      if ('visible' in node) {
        nodeInfo.visible = (node as SceneNode).visible;
      }

      // Add position and size if available
      if ('x' in node && 'y' in node) {
        const layoutNode = node as LayoutMixin;
        nodeInfo.x = layoutNode.x;
        nodeInfo.y = layoutNode.y;
      }

      if ('width' in node && 'height' in node) {
        const sizedNode = node as LayoutMixin;
        nodeInfo.width = sizedNode.width;
        nodeInfo.height = sizedNode.height;
      }

      matchingNodes.push(nodeInfo);
    }

    // Recursively search children if the node has them
    if ('children' in node) {
      const parentNode = node as ChildrenMixin;
      for (const child of parentNode.children) {
        await this.findNodesByTypes(child, types, matchingNodes);
      }
    }
  }
} 
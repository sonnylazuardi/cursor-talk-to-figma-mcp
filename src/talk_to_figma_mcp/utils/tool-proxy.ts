/**
 * Tool proxy for automatically adding transform parameter to read tools
 */

import { z } from 'zod';
import * as fs from 'fs/promises';
import { transformFigmaNode } from '../transformers/node-transformer.js';
import { coerceSchemaFields } from './schema-coercion.js';

/**
 * List of read tools that should have transform parameter added
 */
export const READ_TOOLS = [
  'get_document_info',
  'get_selection',
  'read_my_design',
  'get_node_info',
  'get_nodes_info',
  'get_styles',
  'get_local_components',
  'scan_text_nodes',
  'scan_nodes_by_types',
  'get_annotations',
  'get_instance_overrides',
  'get_reactions',
] as const;

export type ReadToolName = typeof READ_TOOLS[number];

/**
 * Page cache for preloaded document data
 */
interface PageCache {
  documentInfo: any | null;
  timestamp: number;
  channel: string | null;
}

const pageCache: PageCache = {
  documentInfo: null,
  timestamp: 0,
  channel: null,
};

let isPreloading = false;
let getDocumentInfoHandler: Function | null = null;

/**
 * Zod schema for transform parameter
 */
const transformSchema = z.object({
  maxDepth: z.number().min(0).optional()
    .describe('Maximum depth to traverse the node tree'),
  maxChildren: z.number().min(1).optional()
    .describe('Maximum number of children per node'),
  typeFilter: z.object({
    include: z.array(z.string()).optional()
      .describe('Only include these node types (whitelist)'),
    exclude: z.array(z.string()).optional()
      .describe('Exclude these node types (blacklist)'),
    excludeMode: z.enum(['remove', 'stub']).optional()
      .describe('How to handle excluded nodes: remove or keep as stub'),
  }).optional()
    .describe('Filter nodes by type'),
  propertyFilter: z.object({
    include: z.array(z.string()).optional()
      .describe('Only include these properties'),
    exclude: z.array(z.string()).optional()
      .describe('Exclude these properties'),
  }).optional()
    .describe('Filter node properties'),
  simplifyStyles: z.boolean().optional()
    .describe('Simplify fills/strokes to minimal format'),
  includeMetadata: z.boolean().optional()
    .describe('Add metadata: _path, _truncated, _childrenCount'),
  pagination: z.object({
    page: z.number().min(0)
      .describe('Page number (0-based)'),
    pageSize: z.number().min(1).max(100)
      .describe('Number of children per page'),
  }).optional()
    .describe('Paginate children array'),
}).optional().describe('Options for filtering and transforming the response');

/**
 * Create a proxy wrapper for server.tool that automatically adds transform parameter
 * to read tools and applies transformation to responses
 */
export function createToolProxy(originalTool: Function): Function {
  return function proxyTool(
    name: string,
    description: string,
    rawSchema: Record<string, any>,
    handler: Function
  ) {
    // Accept JSON-stringified arrays/numbers at the top level (some MCP
    // clients stringify complex args, which makes Zod reject them with
    // invalid_type before the handler ever runs).
    const schema = coerceSchemaFields(rawSchema);

    // Store get_document_info handler for preloading
    if (name === 'get_document_info') {
      getDocumentInfoHandler = handler;
    }

    // Check if this is a read tool that needs transform parameter
    if (READ_TOOLS.includes(name as ReadToolName)) {
      // Extend schema with transform, savePath, and noCache parameters
      const extendedSchema = {
        ...schema,
        transform: transformSchema,
        savePath: z.string().optional().describe('Path to save response as JSON file'),
        noCache: z.boolean().optional().describe('Skip cache and fetch fresh data'),
      };

      // Extend description
      const extendedDescription = `${description}. Supports optional 'transform' parameter for filtering/limiting the response.`;

      // Wrap handler to apply transformation and optional file saving
      const wrappedHandler = async (params: any) => {
        const { transform, savePath, noCache, ...originalParams } = params || {};

        // Check cache for get_document_info
        if (name === 'get_document_info' && !noCache && !isPreloading && pageCache.documentInfo) {
          const cachedResult = {
            content: [{
              type: 'text',
              text: JSON.stringify(pageCache.documentInfo),
            }],
          };
          // Apply transformation if needed
          let finalCachedResult = cachedResult;
          if (transform) {
            try {
              const transformed = transformFigmaNode(pageCache.documentInfo, transform);
              finalCachedResult = {
                content: [{
                  type: 'text',
                  text: JSON.stringify(transformed),
                }],
              };
            } catch {
              // Use original cached result
            }
          }
          // Save to file if savePath provided
          if (savePath && finalCachedResult?.content?.[0]?.text) {
            try {
              await fs.writeFile(savePath, finalCachedResult.content[0].text, 'utf-8');
            } catch {
              // Ignore file write errors
            }
          }
          return finalCachedResult;
        }

        // Clear cache if noCache is true
        if (noCache && name === 'get_document_info') {
          pageCache.documentInfo = null;
        }

        // Call original handler
        const result = await handler(Object.keys(originalParams).length > 0 ? originalParams : undefined);

        // Cache the result for get_document_info
        if (name === 'get_document_info' && result?.content?.[0]?.text) {
          try {
            pageCache.documentInfo = JSON.parse(result.content[0].text);
            pageCache.timestamp = Date.now();
          } catch {
            // Ignore parse errors
          }
        }

        // Apply transformation if transform options provided
        let finalResult = result;
        if (transform && result?.content?.[0]?.text) {
          try {
            const data = JSON.parse(result.content[0].text);
            const transformed = transformFigmaNode(data, transform);
            finalResult = {
              ...result,
              content: [{
                type: 'text',
                text: JSON.stringify(transformed),
              }],
            };
          } catch {
            // If parsing fails, use original result
          }
        }

        // Save to file if savePath provided
        if (savePath && finalResult?.content?.[0]?.text) {
          try {
            await fs.writeFile(savePath, finalResult.content[0].text, 'utf-8');
          } catch {
            // Log error but don't interrupt execution
          }
        }

        return finalResult;
      };

      return originalTool(name, extendedDescription, extendedSchema, wrappedHandler);
    }

    // Intercept join_channel for preloading
    if (name === 'join_channel') {
      const wrappedJoinHandler = async (params: any) => {
        const result = await handler(params);

        // After successful join - preload document info
        if (result?.content?.[0]?.text?.includes('Successfully joined') && getDocumentInfoHandler) {
          isPreloading = true;
          try {
            pageCache.channel = params.channel;
            const docResult = await getDocumentInfoHandler({});
            if (docResult?.content?.[0]?.text) {
              pageCache.documentInfo = JSON.parse(docResult.content[0].text);
              pageCache.timestamp = Date.now();
            }
          } catch {
            // Preload failed, cache will be populated on first request
          } finally {
            isPreloading = false;
          }
        }

        return result;
      };
      return originalTool(name, description, schema, wrappedJoinHandler);
    }

    // For non-read tools, pass through without modification
    return originalTool(name, description, schema, handler);
  };
}

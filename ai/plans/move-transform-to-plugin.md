# Plan: Move Transform System from MCP Server to Figma Plugin

## Problem

Double data processing: plugin traverses the full node tree, serializes everything, sends over WebSocket. MCP server then filters/transforms what could have been skipped at the source.

Current flow:
```
Plugin: filterFigmaNode() + supplementNodeProperties()
  → WebSocket (full JSON tree)
    → MCP: transformFigmaNode() (filtering again!)
      → maxDepth/maxChildren/typeFilter/propertyFilter/simplifyStyles/pagination
        → Response to client
```

## Phase 1 — Transform Engine in Plugin (`code.js`)

### 1.1. New function `processNode(exportedNode, figmaNode, options, context)`

Combines `filterFigmaNode` + `supplementNodeProperties` + transform in one recursive pass:

- **typeFilter** — check node type at the start of traversal. If excluded → `null` (remove) or stub `{id, name, type, _excluded: true}`. Currently only VECTOR is hardcoded to skip — will become configurable
- **maxDepth** — track `currentDepth` during recursion. On exceeding → `{id, name, type, _truncated: true, _childrenCount: N}`. Currently plugin traverses entire tree — will stop earlier
- **propertyFilter** — when building the object, copy only include-properties or skip exclude-properties. Currently a fixed set of ~12 properties
- **simplifyStyles** — when processing fills/strokes/effects use simplified format. `serializeEffect` and `rgbaToHex` already exist — extend to fills/strokes
- **maxChildren** — when processing children, truncate array, add `_childrenTruncated`
- **pagination** — slice children by `page`/`pageSize`, add `_pagination` metadata
- **includeMetadata** — `_path` breadcrumb (plugin knows the full path in the tree)

Properties from `supplementNodeProperties` (effects, opacity, blendMode, strokeWeight, strokeAlign, styles) are included in the same pass — no separate call needed.

### 1.2. Fallback without options

If `transform` is not provided — `processNode` works like current `filterFigmaNode` + `supplementNodeProperties` (backward compatibility).

### 1.3. `filterFigmaNode` is preserved

Original function stays in the code as reference. New read handlers call `processNode` instead.

## Phase 2 — Pass Transform Through the Chain

### 2.1. `handleCommand` in plugin

Extract `transform` from `params` and pass to read handlers:

```js
case "get_node_info":
  return await getNodeInfo(params.nodeId, params.transform);
```

### 2.2. Read handlers in plugin — update signatures

| Handler | Current call | New call |
|---------|-------------|----------|
| `getNodeInfo` | `filterFigmaNode(doc)` + `supplementNodeProperties(filtered, node)` | `processNode(doc, node, transform)` |
| `getNodesInfo` | same | same |
| `readMyDesign` | same | same |
| `getDocumentInfo` | returns raw | `processNode` if transform provided |
| `getStyles` | returns raw | filtering by transform |
| `scanTextNodes` | own logic | + typeFilter/propertyFilter |
| Other read tools | raw | + transform |

### 2.3. UI bridge (`ui.html`)

No changes needed — params pass through as-is.

### 2.4. Tool proxy (`tool-proxy.ts`) — key change

Current (line 115):
```ts
const { transform, savePath, noCache, ...originalParams } = params;
// transform is used AFTER plugin response
```

New:
```ts
const { savePath, noCache, ...paramsWithTransform } = params;
// transform is passed TO the plugin as part of params
```

`savePath` and `noCache` stay on MCP side (file system and cache are not the plugin's concern).

### 2.5. `server.ts` — remove direct `transformFigmaNode` calls

In `get_node_info` (line 200) and `get_nodes_info` (line 340), currently:
```ts
JSON.stringify(transformFigmaNode(result))
```
Becomes:
```ts
JSON.stringify(result)  // plugin already filtered
```

## Phase 3 — Cache (`get_document_info`)

Cache stores **raw data** (without transform). On cache hit, transform is applied on MCP side — this is the only place where `transformFigmaNode` remains needed.

| Scenario | Where transform runs |
|----------|---------------------|
| Fresh request | Plugin (processNode) |
| Cache hit | MCP (transformFigmaNode) |

Therefore `node-transformer.ts` is **not deleted**, but only used for cache.

## Phase 4 — Cleanup

- **`node-transformer.ts`** — remove `filterFigmaNodeOriginal` (duplicate of plugin logic), keep `transformFigmaNode` for cache
- **`figma-helpers.ts`** — `rgbaToHex` stays (needed for cache transform)
- **`tool-proxy.ts`** — remove post-processing via `transformFigmaNode` for fresh data
- **CLAUDE.md** — update architecture description

## Implementation Order and Risks

| Step | Risk | Mitigation |
|------|------|------------|
| Phase 1 (processNode) | Filtering regression | Compare processNode output vs filterFigmaNode+supplement on same nodes |
| Phase 2.4 (proxy) | Broken param passing | Incremental — first pass transform through, but keep MCP fallback |
| Phase 2.5 (remove transform in server.ts) | Double processing | Do after confirming plugin filters correctly |
| Phase 3 (cache) | Different results cache/fresh | Cache stores raw, same transform logic |

## Key Files

- Plugin: `src/cursor_mcp_plugin/code.js`
- MCP server: `src/talk_to_figma_mcp/server.ts`
- Transform engine: `src/talk_to_figma_mcp/transformers/node-transformer.ts`
- Transform types: `src/talk_to_figma_mcp/types/transform-options.ts`
- Tool proxy: `src/talk_to_figma_mcp/utils/tool-proxy.ts`
- Helpers: `src/talk_to_figma_mcp/utils/figma-helpers.ts`
- UI bridge: `src/cursor_mcp_plugin/ui.html`

# CLAUDE.md

## Repository

This is a personal fork of [`sonnylazuardi/cursor-talk-to-figma-mcp`](https://github.com/sonnylazuardi/cursor-talk-to-figma-mcp), hosted at [`ivan01march/talk-to-figma-dev`](https://github.com/ivan01march/talk-to-figma-dev). Local customizations live as regular commits on this fork.

## Workflow for Upstream Updates

To pull updates from the original repository, add it as an `upstream` remote (one-time):

```bash
git remote add upstream https://github.com/sonnylazuardi/cursor-talk-to-figma-mcp.git
```

Then sync:

```bash
git fetch upstream
git merge upstream/main   # or: git rebase upstream/main
```

Resolve any merge conflicts manually.

## Local Customizations

### WebSocket Server (`src/socket.ts`)
- Optional TLS — works without SSL certificates (set `SSL_KEY_PATH` and `SSL_CERT_PATH` to enable)
- Structured logging with type, channel, command info
- `list_channels` command — returns active channels with client counts
- Broadcast fix — sends to other clients only (prevents echo)

### MCP Server (`src/talk_to_figma_mcp/server.ts`)
- `list_channels` tool — get active channels list
- `export_node_as_image` — added `savePath` param to save to disk
- Tool proxy — auto-adds `transform` param to read tools
- `get_node_info` / `get_nodes_info` — use `transformFigmaNode` instead of local `filterFigmaNode` (1 import + 2 call sites changed; `filterFigmaNode` itself untouched)

### Figma Plugin (`src/cursor_mcp_plugin/code.js`)
- `filterFigmaNode` — **not modified** (original preserved)
- New functions under `// === LOCAL CUSTOMIZATIONS ===` marker:
  - `serializeEffect` — serializes a single Figma effect with color conversion
  - `supplementNodeProperties` — reads directly from Plugin API and adds to filtered result: `effects`, `opacity`, `blendMode`, `strokeWeight`, `strokeAlign`, `styles` (styleId mapping), `effectStyleId`
  - `getNodeInfoRaw` — returns the unfiltered `JSON_REST_V1` `response.document` from Plugin API. Includes fields the standard pipeline strips: `layoutMode`, padding\*, `itemSpacing`, `primaryAxisAlignItems`/`counterAxisAlignItems`, sizing modes, `visible`, `componentId` (on INSTANCE), `imageRef` in fills, VECTOR nodes
- `getNodeInfo`, `getNodesInfo`, `readMyDesign` — each calls `supplementNodeProperties(result, node)` after `filterFigmaNode`
- New `case "get_node_info_raw"` added to the `handleCommand` switch (4 added lines, no original cases modified)
- **Requires Figma Desktop** to pick up local changes (published plugin ignores local files)

### Transform System (new files)
- `transformers/node-transformer.ts` — filters/limits Figma responses, includes effects support
- `types/transform-options.ts` — TypeScript interfaces
- `utils/tool-proxy.ts` — proxy for auto-adding transform + caching
- `utils/figma-helpers.ts` — utilities (rgbaToHex)

### Caching
- Preloads `get_document_info` after `join_channel` for faster subsequent reads
- Use `noCache: true` to force fresh data

**Transform options for read tools:**
- `maxDepth`, `maxChildren` — limit tree traversal
- `typeFilter`, `propertyFilter` — filter nodes/properties
- `simplifyStyles` — simplify fills/strokes/effects
- `pagination` — paginate children
- `savePath` — save response to JSON
- `noCache` — skip cache

## Known Limitations

### Figma Desktop sleeps when backgrounded
When Figma Desktop is not the foreground window, the OS throttles the plugin sandbox. Async MCP sequences — notably `set_current_page(pageId)` followed by `get_node_info(nodeId)` on the just-switched page — fail or stall with generic errors until the user brings Figma into focus. **Not a bug in this repo.** No code change (retry, delay, cache invalidation) fixes it, because the sandbox itself stops executing. If a user reports flaky cross-page behavior, first ask whether Figma was in the foreground during the run.

## Code Quality Checks

After modifying files, run:

```bash
npx tsc --noEmit                        # Type checking (root)
cd src/talk_to_figma_mcp && npx tsc --noEmit  # Type checking (MCP server)
```

# Talk to Figma MCP — Fork

> **This is a fork** of [`sonnylazuardi/cursor-talk-to-figma-mcp`](https://github.com/sonnylazuardi/cursor-talk-to-figma-mcp) with additional features tailored for our workflow. For the upstream documentation, demo videos and general intro, see the original repository.

This project implements a Model Context Protocol (MCP) integration between AI agents (Cursor, Claude Code) and Figma, allowing the agent to communicate with Figma for reading designs and modifying them programmatically.

https://github.com/user-attachments/assets/129a14d2-ed73-470f-9a4c-2240b2a4885c

## What's different in this fork

The list below covers everything added on top of upstream. Items are grouped by where the change lives — this matters because **plugin-side changes only take effect when you run the plugin locally from `src/cursor_mcp_plugin/` in Figma Desktop**. The published plugin on Figma Community is the upstream version and does **not** include these features.

### MCP server (`src/talk_to_figma_mcp/server.ts`) — works out of the box

- **Transform system for read tools.** A tool-proxy automatically attaches a `transform` parameter to read operations, with options:
  - `maxDepth`, `maxChildren` — limit tree traversal
  - `typeFilter`, `propertyFilter` — keep only the node types / properties you need
  - `simplifyStyles` — flatten fills / strokes / effects
  - `pagination` — paginate children
  - `savePath` — dump the response to a JSON file on disk
  - `noCache` — force a fresh read, bypassing the cache
- **Response caching.** After `join_channel` the server preloads `get_document_info` so subsequent reads are faster. Use `noCache: true` to force a refresh.
- **`list_channels` tool** — list active WebSocket channels and their client counts.
- **`export_node_as_image` — `savePath` parameter** added, so the exported image can be written directly to disk instead of only being returned inline.
- **Unified node transformation.** `get_node_info` / `get_nodes_info` now go through `transformFigmaNode` (in `transformers/node-transformer.ts`) instead of the local `filterFigmaNode`, which gives consistent filtering and effects support.

### WebSocket server (`src/socket.ts`) — works out of the box

- **Optional TLS.** Runs in plain WS by default; set `SSL_KEY_PATH` and `SSL_CERT_PATH` to enable WSS.
- **Structured logging** with type / channel / command tags.
- **`list_channels` command** at the socket layer (used by the MCP tool above).
- **Broadcast fix** — messages are sent to other clients only, eliminating self-echo.

### Figma plugin (`src/cursor_mcp_plugin/code.js`) — **requires local plugin install in Figma Desktop**

The features below depend on changes inside the plugin's `code.js`. They will **not** work if you install the plugin from the published Figma Community listing — you must load this repo's plugin via *Plugins → Development → Import plugin from manifest…* (see [Figma Plugin](#figma-plugin) below).

- **Supplemented node properties.** After the standard filtered response, the plugin reads directly from the Plugin API and adds fields that upstream strips out:
  - `effects` (with serialized colors)
  - `opacity`, `blendMode`
  - `strokeWeight`, `strokeAlign`
  - `styles` (styleId mapping)
  - `effectStyleId`

  Applied automatically to `get_node_info`, `get_nodes_info` and `read_my_design`.
- **`get_node_info_raw` command.** Returns the unfiltered `JSON_REST_V1` `response.document` from the Plugin API — the same shape Figma's REST API would return. Includes fields the standard pipeline drops:
  - `layoutMode`, all padding fields, `itemSpacing`
  - `primaryAxisAlignItems` / `counterAxisAlignItems`, sizing modes
  - `visible`, `componentId` (on `INSTANCE`)
  - `imageRef` inside fills
  - `VECTOR` nodes

## Project Structure

- `src/talk_to_figma_mcp/` — TypeScript MCP server for Figma integration
  - `transformers/node-transformer.ts` — filters / limits Figma responses (fork addition)
  - `types/transform-options.ts` — TypeScript interfaces for transform options (fork addition)
  - `utils/tool-proxy.ts` — proxy that auto-adds `transform` + caching (fork addition)
  - `utils/figma-helpers.ts` — helpers, e.g. `rgbaToHex` (fork addition)
- `src/cursor_mcp_plugin/` — Figma plugin for communicating with the agent
- `src/socket.ts` — WebSocket server bridging the MCP server and the Figma plugin

## How to use

1. Install Bun if you haven't already:

   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. Run setup (this also installs the MCP into your Cursor's active project):

   ```bash
   bun setup
   ```

3. Start the WebSocket server:

   ```bash
   bun socket
   ```

4. Install the Figma plugin **locally from this repo** (see [Figma Plugin](#figma-plugin)) — this is required to get the fork's plugin-side features. The published Figma Community plugin will work for upstream features only.

## Manual Setup and Installation

### MCP Server: Integration with Cursor

For a local checkout of this fork, point Cursor at the local server (recommended, so you get the fork's MCP-side changes):

```json
{
  "mcpServers": {
    "TalkToFigma": {
      "command": "bun",
      "args": ["/path-to-repo/src/talk_to_figma_mcp/server.ts"]
    }
  }
}
```

### WebSocket Server

```bash
bun socket
```

To enable TLS, set `SSL_KEY_PATH` and `SSL_CERT_PATH` before starting.

### Figma Plugin

> **Important:** to get the fork's plugin-side features (`get_node_info_raw`, supplemented properties, etc.) you must install the plugin from this repo. The published Figma Community plugin is upstream-only.

1. Use **Figma Desktop** (browser Figma cannot load local development plugins).
2. In Figma, go to *Plugins → Development → Import plugin from manifest…*
3. Select `src/cursor_mcp_plugin/manifest.json` from this repository.
4. The plugin will appear under *Plugins → Development*.

## Windows + WSL Guide

1. Install bun via PowerShell:

   ```bash
   powershell -c "irm bun.sh/install.ps1|iex"
   ```

2. Uncomment the hostname `0.0.0.0` in `src/socket.ts`:

   ```typescript
   // uncomment this to allow connections in windows wsl
   hostname: "0.0.0.0",
   ```

3. Start the WebSocket server:

   ```bash
   bun socket
   ```

## Usage

1. Start the WebSocket server.
2. Install the MCP server in Cursor (pointing at your local checkout — see above).
3. Open Figma Desktop and run the locally-installed plugin from this repo.
4. Connect the plugin to the WebSocket server by joining a channel using `join_channel`.
5. Use Cursor / Claude Code to communicate with Figma via the MCP tools.

## MCP Tools

The MCP server provides the following tools for interacting with Figma. Tools marked **(fork)** are added or extended in this fork; tools marked **(fork, plugin)** additionally require the locally-installed plugin from this repo.

### Document & Selection

- `get_document_info` — get information about the current Figma document
- `get_selection` — get information about the current selection
- `read_my_design` — get detailed node information about the current selection without parameters (**fork, plugin**: returns supplemented properties)
- `get_node_info` — get detailed information about a specific node (**fork, plugin**: returns supplemented properties)
- `get_nodes_info` — get detailed information about multiple nodes by providing an array of node IDs (**fork, plugin**: returns supplemented properties)
- `get_node_info_raw` — **(fork, plugin)** return unfiltered `JSON_REST_V1` document for a node, including layout, padding, alignment, sizing, `componentId`, `imageRef`, VECTOR nodes
- `set_focus` — set focus on a specific node by selecting it and scrolling viewport to it
- `set_selections` — set selection to multiple nodes and scroll viewport to show them

### Annotations

- `get_annotations` — get all annotations in the current document or specific node
- `set_annotation` — create or update an annotation with markdown support
- `set_multiple_annotations` — batch create / update multiple annotations efficiently
- `scan_nodes_by_types` — scan for nodes with specific types (useful for finding annotation targets)

### Prototyping & Connections

- `get_reactions` — get all prototype reactions from nodes with visual highlight animation
- `set_default_connector` — set a copied FigJam connector as the default connector style
- `create_connections` — create FigJam connector lines between nodes, based on prototype flows or custom mapping

### Creating Elements

- `create_rectangle` — create a new rectangle with position, size, and optional name
- `create_frame` — create a new frame with position, size, and optional name
- `create_text` — create a new text node with customizable font properties

### Modifying Text Content

- `scan_text_nodes` — scan text nodes with intelligent chunking for large designs
- `set_text_content` — set the text content of a single text node
- `set_multiple_text_contents` — batch update multiple text nodes efficiently

### Auto Layout & Spacing

- `set_layout_mode` — set the layout mode and wrap behavior of a frame (NONE, HORIZONTAL, VERTICAL)
- `set_padding` — set padding values for an auto-layout frame (top, right, bottom, left)
- `set_axis_align` — set primary and counter axis alignment for auto-layout frames
- `set_layout_sizing` — set horizontal and vertical sizing modes for auto-layout frames (FIXED, HUG, FILL)
- `set_item_spacing` — set distance between children in an auto-layout frame

### Styling

- `set_fill_color` — set the fill color of a node (RGBA)
- `set_stroke_color` — set the stroke color and weight of a node
- `set_corner_radius` — set the corner radius of a node with optional per-corner control

### Layout & Organization

- `move_node` — move a node to a new position
- `resize_node` — resize a node with new dimensions
- `delete_node` — delete a node
- `delete_multiple_nodes` — delete multiple nodes at once efficiently
- `clone_node` — create a copy of an existing node with optional position offset

### Components & Styles

- `get_styles` — get information about local styles
- `get_local_components` — get information about local components
- `create_component_instance` — create an instance of a component
- `get_instance_overrides` — extract override properties from a selected component instance
- `set_instance_overrides` — apply extracted overrides to target instances

### Export & Advanced

- `export_node_as_image` — export a node as an image (PNG, JPG, SVG, or PDF). **(fork)** supports a `savePath` parameter to save directly to disk

### Connection Management

- `join_channel` — join a specific channel to communicate with Figma. **(fork)** preloads `get_document_info` for caching
- `list_channels` — **(fork)** get list of active WebSocket channels with client counts

### Transform options (fork)

All read tools accept an optional `transform` parameter with:

- `maxDepth`, `maxChildren` — limit tree traversal
- `typeFilter`, `propertyFilter` — filter nodes / properties
- `simplifyStyles` — simplify fills / strokes / effects
- `pagination` — paginate children
- `savePath` — save the response to a JSON file
- `noCache` — skip the cache and force a fresh read

### MCP Prompts

The MCP server includes helper prompts to guide complex design tasks:

- `design_strategy` — best practices for working with Figma designs
- `read_design_strategy` — best practices for reading Figma designs
- `text_replacement_strategy` — systematic approach for replacing text in Figma designs
- `annotation_conversion_strategy` — strategy for converting manual annotations to Figma's native annotations
- `swap_overrides_instances` — strategy for transferring overrides between component instances
- `reaction_to_connector_strategy` — strategy for converting Figma prototype reactions to connector lines

## Known Limitations

### Figma Desktop sleeps when backgrounded

When Figma Desktop is not the foreground window, the OS throttles the plugin sandbox. Async MCP sequences — notably `set_current_page(pageId)` followed by `get_node_info(nodeId)` on the just-switched page — can fail or stall with generic errors until the user brings Figma into focus. This is not a bug in this repo: no retry, delay or cache invalidation fixes it, because the sandbox itself stops executing. If you see flaky cross-page behavior, first check that Figma was in the foreground during the run.

## Development

### Building the Figma Plugin

1. Navigate to the Figma plugin directory:

   ```bash
   cd src/cursor_mcp_plugin
   ```

2. Edit `code.js` and `ui.html`. New customizations live under the `// === LOCAL CUSTOMIZATIONS ===` marker so they stay easy to spot during upstream merges.

### Syncing with upstream

This fork keeps the original repository as an `upstream` remote. One-time setup:

```bash
git remote add upstream https://github.com/sonnylazuardi/cursor-talk-to-figma-mcp.git
```

Then sync:

```bash
git fetch upstream
git merge upstream/main   # or: git rebase upstream/main
```

### Type checking

After modifying files:

```bash
npx tsc --noEmit                                # root
cd src/talk_to_figma_mcp && npx tsc --noEmit    # MCP server
```

## Best Practices

When working with the Figma MCP:

1. Always join a channel before sending commands
2. Get a document overview with `get_document_info` first
3. Check the current selection with `get_selection` before modifications
4. Use the appropriate creation tool based on needs:
   - `create_frame` for containers
   - `create_rectangle` for basic shapes
   - `create_text` for text elements
5. Verify changes using `get_node_info`
6. Use component instances when possible for consistency
7. Handle errors appropriately — all commands can throw
8. For large designs:
   - Use chunking parameters in `scan_text_nodes`
   - Use the `transform` options (`maxDepth`, `maxChildren`, `pagination`) to keep reads bounded
   - Monitor progress through WebSocket updates
9. For text operations:
   - Use batch operations when possible
   - Consider structural relationships
   - Verify changes with targeted exports
10. For converting legacy annotations:
    - Scan text nodes to identify numbered markers and descriptions
    - Use `scan_nodes_by_types` to find UI elements that annotations refer to
    - Match markers with their target elements using path, name, or proximity
    - Categorize annotations appropriately with `get_annotations`
    - Create native annotations with `set_multiple_annotations` in batches
    - Verify all annotations are linked to their targets
    - Delete legacy annotation nodes after successful conversion
11. Visualize prototype noodles as FigJam connectors:
    - Use `get_reactions` to extract prototype flows
    - Set a default connector with `set_default_connector`
    - Generate connector lines with `create_connections` for clear visual flow mapping

## Credits

- Original project: [`sonnylazuardi/cursor-talk-to-figma-mcp`](https://github.com/sonnylazuardi/cursor-talk-to-figma-mcp)
- Bulk text replacement and instance override propagation: [@dusskapark](https://github.com/dusskapark)

## License

MIT

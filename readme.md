# Cursor Talk to Figma MCP

This project implements a Model Context Protocol (MCP) integration between Cursor AI and Figma, allowing Cursor to communicate with Figma for reading designs and modifying them programmatically.

https://github.com/user-attachments/assets/129a14d2-ed73-470f-9a4c-2240b2a4885c

## Project Structure

- `src/talk_to_figma_mcp/` - TypeScript MCP server를 거의 그대로 사용하고 있습니다.
- `src/cursor_mcp_plugin/` - Figma plugin 입니다. 기존에서 channel authentification 제거해서 `bun socket` 해서 소켓서버 여시고 connect 누리면 바로 연결됩니다.
- `src/socket.ts` - 소켓 서버입니다. 장기적으로 plugin or MCP server 사이드로 통합할 방법을 모색중입니다.

## Get Started

1. Install Bun if you haven't already:

```bash
curl -fsSL https://bun.sh/install | bash
```

2. Run setup, this will also install MCP in your Cursor's active project

```bash
bun setup
```

3. Start the Websocket server

```bash
bun socket
```

4. Figma development 플러그인 로드 (로드 안한 경우)

- Figma PC 클라이언트 > 로고 > plugins > Developmnet 이동
- `src/figma_mcp_plugin/manifest.json` 으로 잡아주시면 플러그인 로드됩니다.
- `Connect` 누르시면 바로 Websocket 서버로 바로 연결됩니다.

5. MCP server

talk-to-figma MCP server 코드를 수정해서 bunx 패키지 로드 아닌 다음과 같은 실행이 필요합니다.

- `src/talk_to_figma_mcp` 로 진입
- `npm run build` 실행: 타입 스크립트 컴파일러(tsc) 사용한 js 서버 빌드

이후 MCP client 실행 시 스스로 서버 로드합니다.

6. MCP Langchain client

현재 OpenAI 4o 로 세팅해두었습니다.
- 최상단 경로 `./` 에 `.env` 파일 및 `OPENAI_API_KEY` 변수 정의
- `./src/langchain_server` 진입
- `venv` 또는 `conda` 통해서 requirement.txt 설치
- `app.py` 실행하면 서버 로드 

## MCP Tools

The MCP server provides the following tools for interacting with Figma:

### Document & Selection

- `get_document_info` - Get information about the current Figma document
- `get_selection` - Get information about the current selection
- `read_my_design` - Get detailed node information about the current selection without parameters
- `get_node_info` - Get detailed information about a specific node
- `get_nodes_info` - Get detailed information about multiple nodes by providing an array of node IDs

### Annotations

- `get_annotations` - Get all annotations in the current document or specific node
- `set_annotation` - Create or update an annotation with markdown support
- `set_multiple_annotations` - Batch create/update multiple annotations efficiently
- `scan_nodes_by_types` - Scan for nodes with specific types (useful for finding annotation targets)

### Creating Elements

- `create_rectangle` - Create a new rectangle with position, size, and optional name
- `create_frame` - Create a new frame with position, size, and optional name
- `create_text` - Create a new text node with customizable font properties

### Modifying text content

- `scan_text_nodes` - Scan text nodes with intelligent chunking for large designs
- `set_text_content` - Set the text content of a single text node
- `set_multiple_text_contents` - Batch update multiple text nodes efficiently

### Styling

- `set_fill_color` - Set the fill color of a node (RGBA)
- `set_stroke_color` - Set the stroke color and weight of a node
- `set_corner_radius` - Set the corner radius of a node with optional per-corner control

### Layout & Organization

- `move_node` - Move a node to a new position
- `resize_node` - Resize a node with new dimensions
- `delete_node` - Delete a node
- `delete_multiple_nodes` - Delete multiple nodes at once efficiently
- `clone_node` - Create a copy of an existing node with optional position offset

### Components & Styles

- `get_styles` - Get information about local styles
- `get_local_components` - Get information about local components
- `create_component_instance` - Create an instance of a component

### Export & Advanced

- `export_node_as_image` - Export a node as an image (PNG, JPG, SVG, or PDF) - limited support on image currently returning base64 as text

## Development

### Building the Figma Plugin

1. Navigate to the Figma plugin directory:

   ```
   cd src/cursor_mcp_plugin
   ```

2. Edit code.js and ui.html

## Best Practices

When working with the Figma MCP:

1. Always join a channel before sending commands
2. Get document overview using `get_document_info` first
3. Check current selection with `get_selection` before modifications
4. Use appropriate creation tools based on needs:
   - `create_frame` for containers
   - `create_rectangle` for basic shapes
   - `create_text` for text elements
5. Verify changes using `get_node_info`
6. Use component instances when possible for consistency
7. Handle errors appropriately as all commands can throw exceptions
8. For large designs:
   - Use chunking parameters in `scan_text_nodes`
   - Monitor progress through WebSocket updates
   - Implement appropriate error handling
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
    - Verify all annotations are properly linked to their targets
    - Delete legacy annotation nodes after successful conversion

## License

MIT

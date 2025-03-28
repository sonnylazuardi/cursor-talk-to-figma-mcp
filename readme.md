# Cursor Talk to Figma MCP for Windows

This project implements a Model Context Protocol (MCP) integration between Cursor AI and Figma, allowing Cursor to communicate with Figma for reading designs and modifying them programmatically.

## Prerequisites

- Windows 10 or later
- [Bun](https://bun.sh) installed on Windows
- [Figma Desktop App](https://www.figma.com/downloads/)
- [Cursor Editor](https://cursor.sh/)

## Project Structure

- `src/talk_to_figma_mcp/` - TypeScript MCP server for Figma integration
- `src/cursor_mcp_plugin/` - Figma plugin for communicating with Cursor
- `src/socket.ts` - WebSocket server that facilitates communication between the MCP server and Figma plugin

## Windows Installation Steps

1. **Install Bun on Windows**
   ```powershell
   powershell -Command "iwr bun.sh/install.ps1 -useb | iex"
   ```
   After installation, restart your terminal.

2. **Clone the repository**
   ```powershell
   git clone https://github.com/MehhdiMarzban/cursor-talk-to-figma-mcp.git
   cd cursor-talk-to-figma-mcp
   ```

3. **Install dependencies**
   ```powershell
   bun install
   ```

4. **Setup MCP Configuration**
   Create `.cursor/mcp.json` in your project root:
   ```powershell
   mkdir .cursor
   ```
   
   Create `mcp.json` with the following content:
   ```json
   {
     "mcpServers": {
       "TalkToFigma": {
         "command": "bun",
         "args": [
           "C:/Users/mehdi/Desktop/cursor-talk-to-figma-mcp/src/talk_to_figma_mcp/server.ts"
         ]
       }
     }
   }
   ```

5. **Start the WebSocket Server**
   ```powershell
   bun start
   ```

## Figma Plugin Setup

1. Open Figma Desktop App
2. Go to Plugins > Development > New Plugin
3. Choose "Link existing plugin"
4. Select the `src/cursor_mcp_plugin/manifest.json` file from this project
5. The plugin will now be available in your Figma development plugins

## Usage

1. Start the WebSocket server using `bun start`
2. Open your Figma document
3. Run the "Cursor MCP Plugin" from your Figma development plugins
4. In Cursor, use the following commands to interact with Figma:
   ```
   mcp_TalkToFigma_join_channel  // Connect to Figma
   mcp_TalkToFigma_get_document_info  // Get document information
   ```

## Available MCP Tools

### Document & Selection
- `get_document_info` - Get information about the current Figma document
- `get_selection` - Get information about the current selection
- `get_node_info` - Get detailed information about a specific node

### Creating Elements
- `create_rectangle` - Create a new rectangle
- `create_frame` - Create a new frame
- `create_text` - Create a new text element

### Styling
- `set_fill_color` - Set the fill color of a node
- `set_stroke_color` - Set the stroke color of a node
- `set_corner_radius` - Set the corner radius of a node

### Layout & Organization
- `move_node` - Move a node to a new position
- `resize_node` - Resize a node
- `delete_node` - Delete a node

### Components & Styles
- `get_styles` - Get all styles from the document
- `get_local_components` - Get all local components
- `create_component_instance` - Create an instance of a component

### Export
- `export_node_as_image` - Export a node as an image

## Troubleshooting

1. **Port 3055 Already in Use**
   ```powershell
   # Find process using port 3055
   netstat -ano | findstr :3055
   
   # Kill the process (replace PID with the actual process ID)
   taskkill /PID PID /F
   ```

2. **Bun Command Not Found**
   - Restart your terminal after installing Bun
   - Make sure Bun is added to your system PATH

## License

MIT

## Acknowledgments

This project is based on [cursor-talk-to-figma-mcp](https://github.com/sonnylazuardi/cursor-talk-to-figma-mcp) by [Sonny Lazuardi](https://github.com/sonnylazuardi), which is licensed under the MIT License.

# Cursor MCP Figma Plugin Test Prompts

This page contains a comprehensive collection of test prompts for systematically testing all MCP tools available in the Figma plugin integration with Cursor AI.

## IMPORTANT: General rules

- Try the happy path first as described below sections
- If faced with an error, monitor the terminal that is running the websocket server for more information

## 🔗 Connection & Basic Information

### Channel Connection
```
Get the channel name from the terminal that is running the websocket server, and join the channel
```

### Document Information
```
Get the current Figma document information
```

### Selection Information
```
- Create a new frame
- Get information about the current selection
```

### Detailed Selection Analysis
```
- Add 3 rectangles to the frame we just created
- set auto layout the frame horizontally and add 24px padding and spacing between them
- Read my design and provide detailed information about the current selection

> if cannot find the selection, ask user to select the frame we just created and try again

```

### Specific Node Information
```
Get information details from the node from the frame node we just created
```

### Multiple Nodes Information
```
Get information about rectangle nodes from the frame node we just created
```

## 📐 Element Creation

### Create Rectangle
```
Create a red rectangle at position x: 100, y: 100 with width 200 and height 150 inside the frame we just created
```

### Create Frame
```
- Get the first frame's position and width information
- Calculate new position: first_frame_x + first_frame_width + 200px gap
- Create a new blue frame at the calculated position with width 300, height 200, and name it "Blue Test Frame"
- Move the frame to the calculated position to ensure proper 200px spacing
```
### Create Text Element
```
Create 3 text elements inside the blue frame with content "Hello," "World," and "Figma!", font size 24px, and white color.

```

### Create Frame with Auto-layout
```
make the blue frame vertical auto-layout, 24px padding, 24px spacing between items, and center alignment
```


### Create Text with Custom Font
```
Create and replace the 'Figma!' text node with content "Talk-to-Figma MCP!" that has bold, font size 24px, font weight 700, and Yellow color
```

## 🎨 Styling & Properties

### Set Fill Color
```
Set the fill color of the blue frame to opacity 0.6 (r: 0, g: 0, b: 1, a: 0.6)
```

### Set Stroke Color
```
Set the stroke color of the blue frame to RoyalBlue (r: 65, g: 105, b: 225) with weight 3px
```

### Set Corner Radius
```
Set the corner radius of the blue frame to 10px
```

### Set Specific Corner Radius
```
Set corner radius to 15px for only top-left and top-right corners of the blue frame
```

### Move Node
```
Move the selected node by offset: -200px on X-axis, +100px on Y-axis 
And back to the original position
```

### Resize Node
```
Resize the selected node to width 400 and height 300
```

## 📝 Text Operations

### Scan Text Nodes
```
Scan all text nodes in the selected frame
```

### Set Text Content
```
Change the text content of the selected text node from "Hello" to "Hello, World!"
```


### Bulk Text Replacement
```
Replace multiple text contents in the selected frame: first text node to "Hello, World!", "Cursor-talk-to-figma", and "Model-Context-Protocol!"
```

### Advanced Text Scanning
```
Scan the selected node again for all text nodes and show their content, position, and styling information
```

## 📦 Auto-layout & Layout Management

### Set Layout Mode
```
- Get the first test frame
- Set the selected frame to vertical auto-layout mode
```

### Set Layout Mode with Wrap
```
- Set the selected frame to horizontal auto-layout again with wrap enabled
- set the counter axis spacing to 30px
- resize the frame to 400px with to test the wrap
```

### Set Padding
```
Set padding of the selected frame to top: 20px, right: 16px, bottom: 20px, left: 16px
```

### Set Axis Alignment
```
Set the selected auto-layout frame's primary axis to CENTER and counter axis to CENTER
```

### Set Layout Sizing
```
Set the selected frame's horizontal sizing to FILL and vertical sizing to HUG
```

### Set Item Spacing
```
Set primary axis alignment to SPACE_BETWEEN 
Set the item spacing of the selected auto-layout frame to 15px
Set the counter axis spacing to 15px
```

## 🔍 Node Scanning & Analysis

### Scan by Node Types
```
Scan the selected frame for all FRAME and COMPONENT type nodes
```

### Comprehensive Node Scan
```
Scan the blue frame for nodes of types: FRAME, COMPONENT, INSTANCE, TEXT
```

## 🎭 Components & Instances

### Get Local Components
```
Get all local components from the current document
```

### Create Component Instance
```
Create an instance of the first component at position x: 400, y: 400
```

### Get Instance Overrides
```
Get override properties from the selected component instance
```

### Set Instance Overrides
```
Apply overrides from the source instance to the selected target instances
```

### Component Instance Workflow
```
First get local components, then create an instance of the first component, and get its override properties
```

## 🎨 Styles & Design System

### Get Document Styles
```
Get all styles from the current document
```

## 📋 Annotations

### Get All Annotations
```
Get all annotations in the current document
```

### Get Node Annotations
```
Get annotations for the selected node
```

### Add Single Annotation
```
Add an annotation to the selected node with text "This is a test annotation"
```

### Add Multiple Annotations
```
Add multiple annotations to different elements in the selected frame
```

### Annotation Conversion Workflow
```
Scan text nodes to identify manual annotations, then convert them to native Figma annotations
```

## 🔗 Prototyping & Connections

### Get Prototype Reactions
```
Get all prototype reactions from the selected nodes
```

### Set Default Connector
```
Set the selected connector as the default connector for creating connections
```

### Create Connections
```
Create connections between nodes based on their prototype reactions
```

### Complete Prototyping Workflow
```
Get reactions from selected nodes, set default connector, and create visual connector lines
```

### Advanced Prototyping Tests

#### Test Reactions from Multiple Nodes
```
Get prototype reactions from nodes ["node1", "node2", "node3"]
```

#### Test Default Connector Setup
```
Set the currently selected connector line as the default connector for future connections
```

#### Test Manual Connection Creation
```
Create connections between specific nodes: from "button1" to "screen2" with text "Navigate to next screen"
```

#### Test Complex Flow Visualization
```
1. Get reactions from all interactive elements in the selected frame
2. Process the reaction data using the reaction_to_connector_strategy
3. Create visual connector lines for the entire user flow
```

## 🗂️ Node Operations

### Clone Node
```
Clone the selected node to position x: 500, y: 500
```

### Clone Node (Same Position)
```
Clone the selected node at the same position
```

### Delete Single Node
```
Delete the selected node
```

### Delete Multiple Nodes
```
Delete multiple selected nodes at once
```

## 📤 Export Operations

### Export as PNG
```
Export the selected node as PNG image
```

### Export as SVG
```
Export the selected node as SVG with scale 2.0
```

### Export as High Quality
```
Export the selected node as PNG with scale 3.0 for high resolution
```

---

## 📝 Usage Instructions

1. **Setup**: Ensure the MCP server is running and connected
2. **Channel**: Always join a channel before testing (use @terminal that is running the websocket server, and use the channel name that is shown in the terminal)
3. **Selection**: Select appropriate nodes in Figma before running node-specific tests
4. **Verification**: Check results in Figma after each operation
5. **Debugging**: Monitor console logs for detailed operation feedback


## 📊 **Total MCP Tools**: 38

- **Connection & Info**: 6 tools (`join_channel`, `get_document_info`, `get_selection`, `read_my_design`, `get_node_info`, `get_nodes_info`)
- **Element Creation**: 3 tools (`create_rectangle`, `create_frame`, `create_text`)
- **Styling & Properties**: 4 tools (`set_fill_color`, `set_stroke_color`, `set_corner_radius`, `move_node`)
- **Node Operations**: 4 tools (`clone_node`, `resize_node`, `delete_node`, `delete_multiple_nodes`)
- **Text Operations**: 3 tools (`set_text_content`, `scan_text_nodes`, `set_multiple_text_contents`)
- **Layout Management**: 5 tools (`set_layout_mode`, `set_padding`, `set_axis_align`, `set_layout_sizing`, `set_item_spacing`)
- **Components & Instances**: 4 tools (`get_local_components`, `create_component_instance`, `get_instance_overrides`, `set_instance_overrides`)
- **Annotations**: 3 tools (`get_annotations`, `set_annotation`, `set_multiple_annotations`)
- **Prototyping**: 3 tools (`get_reactions`, `set_default_connector`, `create_connections`)
- **Analysis & Export**: 3 tools (`scan_nodes_by_types`, `get_styles`, `export_node_as_image`)

When all checklist items are completed, your MCP Figma plugin integration is fully functional! 🎉 
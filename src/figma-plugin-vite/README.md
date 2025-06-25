# Figma MCP Plugin - Modular Architecture

A Figma plugin built with modular architecture, designed to integrate with the Cursor Talk-to-Figma MCP system.

## 🏗️ Architecture Overview

This plugin follows a service-based architecture with clear separation of concerns:

```
src/
├── index.ts                 # 📦 Entry point wrapper
├── main.ts                  # 🚀 Main initialization
├── App.tsx                  # 🎨 React UI component
├── App.scss                 # 💅 Styles
├── services/
│   ├── PluginService.ts         # 🎯 Main coordination service
│   ├── CommandService.ts        # ⚡ Command dispatcher (commented)
│   ├── ProgressService.ts       # 📊 Progress tracking (commented)
│   ├── WebSocketService.ts      # 🌐 Communication placeholder
│   └── groups/                  # 📂 Feature-based service groups
│       ├── DocumentService.ts       # 📄 Document & Selection
│       ├── CreationService.ts       # ✨ Creating Elements
│       ├── StyleService.ts          # 🎨 Styling Operations
│       ├── LayoutService.ts         # 📐 Layout & Organization
│       ├── TextService.ts           # 📝 Text Operations
│       ├── ComponentService.ts      # 🧩 Components & Styles
│       ├── AnnotationService.ts     # 📝 Annotations
│       └── PrototypeService.ts      # 🔗 Prototyping
└── components/
    ├── DocumentControls.tsx     # 📄 Document UI controls (commented)
    └── CreationControls.tsx     # ✨ Creation UI controls (commented)
```

## 📦 Current Status

### ✅ Implemented
- Basic plugin initialization
- Service architecture foundation
- Message communication system
- Simple React UI with logging
- TypeScript integration
- Build system (Vite + Bun)

### 🚧 In Progress (Commented for Testing)
- Command dispatching system
- Individual service implementations
- Complex UI components
- Progress tracking

### 📋 Service Groups (Based on MCP Types)

1. **Document & Selection** (`DocumentService`)
   - get_document_info, get_selection, get_node_info, read_my_design

2. **Creating Elements** (`CreationService`)
   - create_rectangle, create_frame, create_text

3. **Styling** (`StyleService`)
   - set_fill_color, set_stroke_color, set_corner_radius

4. **Layout & Organization** (`LayoutService`)
   - move_node, resize_node, delete_node, clone_node, layout settings

5. **Text Operations** (`TextService`)
   - set_text_content, scan_text_nodes, set_multiple_text_contents

6. **Components & Styles** (`ComponentService`)
   - get_styles, get_local_components, component instances

7. **Annotations** (`AnnotationService`)
   - get_annotations, set_annotation, set_multiple_annotations

8. **Prototyping** (`PrototypeService`)
   - get_reactions, set_default_connector, create_connections

## 🛠️ Development

### Requirements
- [Bun](https://bun.sh) runtime
- Figma Desktop App

### Installation
```bash
cd src/figma-plugin-vite
bun install
```

### Development
```bash
bun run dev
```

### Build
```bash
bun run build
```

### Testing in Figma
1. Open Figma Desktop
2. Go to Plugins → Development → Import plugin from manifest...
3. Select `manifest.json` from this directory
4. The plugin will use files from the `dist/` directory

## 🧪 Current Testing Phase

The plugin is currently in **minimal testing mode** with most complex features commented out to isolate and fix any build or runtime errors.

### Active Features
- ✅ Plugin initialization
- ✅ Basic UI rendering
- ✅ Message communication
- ✅ Test button functionality
- ✅ Logging system

### Temporarily Disabled
- 🚧 Command system (import issues)
- 🚧 Complex UI components 
- 🚧 Service integrations

## 🔧 Troubleshooting

### Common Issues

1. **Build Errors**: Check TypeScript imports and ensure all referenced files exist
2. **Plugin Not Loading**: Verify `manifest.json` paths point to `dist/` directory
3. **UI Not Showing**: Check console for JavaScript errors in Figma

### Debug Steps
1. Check browser console in Figma plugin
2. Verify `dist/index.js` and `dist/index.html` exist after build
3. Test with minimal functionality first
4. Gradually uncomment features to isolate issues

## 📁 File Structure Details

- **index.ts**: Simple wrapper that imports main.ts
- **main.ts**: Calls initializePlugin() from PluginService
- **PluginService.ts**: Core service with UI and message handling
- **App.tsx**: React component with logging and basic controls
- **Service Groups**: Organized by functionality, ready for implementation

## 🚀 Next Steps

1. Implement individual service methods from original `code.js`
2. Gradually uncomment and test each service group
3. Add corresponding UI components for each service
4. Integrate with MCP communication system
5. Add comprehensive error handling and progress tracking

---

**Note**: This is a work-in-progress migration from a monolithic plugin structure to a modular, maintainable architecture.

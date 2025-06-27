# Architecture Documentation

## System Overview

The Cursor Talk to Figma MCP project implements a three-tier architecture that enables seamless communication between Cursor AI and Figma:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Cursor AI     │    │   MCP Server    │    │  Figma Plugin   │
│                 │◄──►│                 │◄──►│                 │
│  (Client)       │    │  (Bridge)       │    │  (Executor)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        │                        │                        │
        ▼                        ▼                        ▼
   MCP Protocol            WebSocket Server         Figma Plugin API
```

## Core Components

### 1. MCP Server (`src/talk_to_figma_mcp/`)

**Purpose**: Acts as a bridge between Cursor's MCP protocol and the WebSocket communication layer.

**Key Features**:
- Implements MCP (Model Context Protocol) specification
- Provides 37+ tools for Figma manipulation
- Type-safe parameter validation using Zod schemas
- Progress tracking and error handling
- Automatic command ID generation

**Technology Stack**:
- TypeScript
- Bun runtime
- Zod for validation
- WebSocket client

### 2. WebSocket Server (`src/socket.ts`)

**Purpose**: Facilitates real-time bidirectional communication between the MCP server and Figma plugin.

**Key Features**:
- Channel-based communication
- Connection management
- Message routing
- Cross-platform support (Windows WSL compatible)

**Configuration**:
- Default port: 3055
- Supports multiple concurrent connections
- Configurable hostname for WSL environments

### 3. Figma Plugin (`src/figma-plugin-vite/`)

**Purpose**: Executes actual Figma operations within the Figma environment.

**Architecture**:
```
src/figma-plugin-vite/
├── src/
│   ├── index.ts          # Main plugin logic & command handling
│   ├── App.tsx           # React UI for testing and interaction
│   ├── App.scss          # Styling
│   └── main.tsx          # React application entry point
├── dist/                 # Build output
├── manifest.json         # Figma plugin configuration
└── vite.config.ts        # Build configuration
```

**Technology Stack**:
- TypeScript
- React 18
- Vite (build tool)
- SCSS for styling
- Figma Plugin API

## Type System Architecture

### Centralized Type Definitions

All type definitions are centralized in `src/types/types.ts` to ensure consistency across the entire system:

```typescript
// Shared between MCP server and Figma plugin
export interface CommandProgressUpdate { ... }
export type FigmaCommand = 'get_document_info' | 'create_rectangle' | ...
export interface CommandParams { ... }
```

### Type Safety Layers

1. **Compile-time**: TypeScript type checking
2. **Runtime**: Zod schema validation
3. **Testing**: Automated type consistency tests

### Validation Pipeline

```
User Input → MCP Server → Zod Validation → WebSocket → Figma Plugin → Figma API
     ↑            ↑            ↑              ↑             ↑           ↑
Type Check   Type Check   Runtime Check   Message      Type Check   API Check
```

## Communication Protocol

### Message Flow

1. **Command Initiation**:
   ```
   Cursor → MCP Server → WebSocket → Figma Plugin
   ```

2. **Progress Updates**:
   ```
   Figma Plugin → WebSocket → MCP Server → Cursor
   ```

3. **Result Return**:
   ```
   Figma Plugin → WebSocket → MCP Server → Cursor
   ```

### Message Format

```typescript
interface WebSocketMessage {
  type: 'command' | 'progress' | 'result' | 'error';
  commandId: string;
  commandType: FigmaCommand;
  payload: any;
  timestamp: number;
}
```

## Build System

### Vite Configuration

The Figma plugin uses Vite for modern, fast builds:

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    react(),
    viteSingleFile(),
    viteStaticCopy({
      targets: [
        { src: 'manifest.json', dest: '' }
      ]
    })
  ],
  build: {
    target: 'es2017',
    outDir: 'dist',
    rollupOptions: {
      input: {
        plugin: 'src/index.ts',
        ui: 'index.html'
      }
    }
  }
});
```

### Development Workflow

1. **Development Mode**: `bun run dev` - Hot reloading for rapid iteration
2. **Production Build**: `bun run build` - Optimized bundle generation
3. **Type Checking**: Continuous TypeScript validation
4. **Testing**: Automated type and communication tests

## Error Handling Strategy

### Hierarchical Error Management

1. **Figma API Level**: Native Figma error handling
2. **Plugin Level**: Try-catch blocks with progress updates
3. **WebSocket Level**: Connection error recovery
4. **MCP Level**: Protocol-compliant error responses
5. **Validation Level**: Zod schema validation errors

### Error Propagation

```typescript
try {
  // Figma operation
  const result = await figma.createRectangle(params);
  sendProgressUpdate(commandId, 'completed', 100, 1, 1, 'Success');
  return result;
} catch (error) {
  sendProgressUpdate(commandId, 'error', 0, 1, 0, error.message);
  throw error;
}
```

## Performance Considerations

### Chunking Strategy

For large operations (e.g., processing many nodes):

```typescript
interface ChunkingConfig {
  chunkSize: number;        // Items per chunk
  totalChunks: number;      // Total number of chunks
  currentChunk: number;     // Current chunk being processed
}
```

### Memory Management

- Lazy loading of node data
- Garbage collection between chunks
- Progress updates to prevent timeouts

## Security Considerations

### Input Validation

1. **Schema Validation**: All inputs validated against Zod schemas
2. **Type Safety**: TypeScript compile-time checks
3. **Sanitization**: Input sanitization for text content

### Communication Security

- Local-only WebSocket communication
- No external network requests
- Channel-based isolation

## Extensibility

### Adding New Commands

1. **Define Types**: Add to `src/types/types.ts`
2. **Add Validation**: Create Zod schema in `src/validation/schemas.ts`
3. **Implement Server**: Add handler in MCP server
4. **Implement Plugin**: Add handler in Figma plugin
5. **Add Tests**: Create validation tests

### Plugin Architecture

The plugin is designed for modularity:

```typescript
// Future component structure
src/figma-plugin-vite/src/
├── components/
│   ├── document.ts       # Document operations
│   ├── creation.ts       # Creation operations
│   ├── styling.ts        # Styling operations
│   └── utils.ts          # Utility functions
├── types/
│   └── plugin.ts         # Plugin-specific types
└── index.ts              # Main orchestrator
```

## Testing Strategy

### Test Categories

1. **Type Validation Tests**: Ensure type consistency
2. **Communication Tests**: Verify message passing
3. **Integration Tests**: End-to-end command execution
4. **Performance Tests**: Large-scale operation testing

### Test Infrastructure

```bash
tests/
├── type-validation.test.ts    # 37+ type consistency tests
├── communication.test.ts      # WebSocket communication tests
└── integration.test.ts        # End-to-end tests (planned)
```

## Deployment Strategy

### Development Deployment

1. Start WebSocket server: `bun socket`
2. Start MCP server: `bunx cursor-talk-to-figma-mcp`
3. Install plugin in Figma development environment
4. Configure Cursor MCP settings

### Production Considerations

- Plugin distribution via Figma Community
- MCP server as npm package
- Automated testing in CI/CD pipeline
- Version synchronization across components

## Future Architecture Improvements

### Planned Enhancements

1. **Component Separation**: Split plugin into focused modules
2. **Caching Layer**: Add intelligent caching for repeated operations
3. **Batch Operations**: Enhanced batch processing capabilities
4. **Plugin UI**: Rich interface for complex operations
5. **Configuration Management**: User preferences and settings

### Scalability Considerations

- Support for multiple Figma documents
- Concurrent operation handling
- Resource usage optimization
- Performance monitoring and analytics 
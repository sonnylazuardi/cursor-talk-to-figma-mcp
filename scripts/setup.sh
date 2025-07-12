#!/bin/bash

echo "🚀 Setting up Cursor Talk to Figma MCP..."

# Create .cursor directory if it doesn't exist
mkdir -p .cursor

echo "📦 Installing root dependencies..."
bun install

echo "📦 Installing Figma plugin dependencies..."
cd src/figma-plugin && bun install && cd ../..

echo "🔨 Building project..."
bun run build

echo "⚙️ Creating MCP configuration..."
# Create mcp.json with the current directory path
echo "{
  \"mcpServers\": {
    \"TalkToFigma\": {
      \"command\": \"bunx\",
      \"args\": [
        \"cursor-talk-to-figma-mcp@latest\"
      ]
    }
  }
}" > .cursor/mcp.json

echo "✅ Setup completed successfully!"
echo "🔗 MCP configuration created at .cursor/mcp.json"
echo "🎯 Figma plugin built and ready to use" 
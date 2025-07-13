#!/bin/bash

# Create .cursor directory if it doesn't exist
mkdir -p .cursor

bun install

# Install dependencies for figma plugin
cd src/figma-plugin
bun install
cd ../..

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


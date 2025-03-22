# Create .cursor directory if it doesn't exist
New-Item -ItemType Directory -Force -Path ".cursor"

# Get current directory path
$CURRENT_DIR = (Get-Location).Path

# Install dependencies
& "$env:USERPROFILE\.bun\bin\bun.exe" install

# Create mcp.json with the current directory path
$mcpJson = @"
{
  "mcpServers": {
    "TalkToFigma": {
      "command": "bun",
      "args": [
        "$($CURRENT_DIR -replace '\\', '/')/src/talk_to_figma_mcp/server.ts"
      ]
    }
  }
}
"@

$mcpJson | Out-File -FilePath ".cursor/mcp.json" -Encoding UTF8 
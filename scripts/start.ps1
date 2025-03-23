# Start WebSocket server in the background
Start-Process -NoNewWindow -FilePath "$env:USERPROFILE\.bun\bin\bun.exe" -ArgumentList "run src/socket.ts"

# Wait a moment for the WebSocket server to start
Start-Sleep -Seconds 2

# Start MCP server
& "$env:USERPROFILE\.bun\bin\bun.exe" start 
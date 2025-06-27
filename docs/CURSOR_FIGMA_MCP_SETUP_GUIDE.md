# Cursor Talk to Figma MCP Setup Guide for AI Agents

## 🎯 Objective
Install and configure Cursor-Figma MCP integration with fail-safe checkpoints at each step.

## 📋 Prerequisites Check

Execute these commands and verify all pass before proceeding:

```bash
# Check 1: Cursor IDE installed
which cursor && echo "✅ Cursor found" || echo "❌ ERROR: Install Cursor IDE first"

# Check 2: Git available  
git --version && echo "✅ Git found" || echo "❌ ERROR: Git not available"

# Check 3: macOS verification
sw_vers -productVersion && echo "✅ macOS confirmed" || echo "❌ ERROR: macOS required"

# Check 4: Detect shell type
echo "🐚 Shell: $SHELL"
```

**CHECKPOINT**: All checks must show ✅ before proceeding.

## 🛡️ Setup Method Selection

Choose your installation method based on your system permissions:

### Method A: Full Installation (Requires sudo/admin access)
- Recommended for personal computers
- Includes Bun runtime installation
- Best performance and features

### Method B: Cursor-Only Installation (No sudo required)
- For restricted environments
- Uses Cursor's built-in terminal and Node.js
- Quick setup without system changes

**Choose Method A if you have admin access, Method B if you don't.**

---

## 🚀 Method A: Full Installation Steps

### Step 1A: Install Bun Runtime

```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Reload shell environment (both zsh and bash)
if [[ "$SHELL" == *"zsh"* ]]; then
    source ~/.zshrc 2>/dev/null || echo "⚠️ No .zshrc found"
    echo "🐚 Using Zsh shell"
elif [[ "$SHELL" == *"bash"* ]]; then
    source ~/.bashrc 2>/dev/null || source ~/.bash_profile 2>/dev/null || echo "⚠️ No .bashrc or .bash_profile found"
    echo "🐚 Using Bash shell"
else
    echo "⚠️ Unknown shell type, trying both..."
    source ~/.zshrc 2>/dev/null || source ~/.bashrc 2>/dev/null || source ~/.bash_profile 2>/dev/null || true
fi

# Verify installation
bun --version && echo "✅ Bun installed successfully" || echo "❌ ERROR: Bun installation failed"
```

**CHECKPOINT**: Must see Bun version number. If failed, try Method B instead.

### Step 2A: Clone and Setup Project

```bash
# Navigate to Sites directory (create if doesn't exist)
mkdir -p ~/Sites && cd ~/Sites

# Clone repository
git clone https://github.com/sonnylazuardi/cursor-talk-to-figma-mcp.git

# Enter project directory
cd cursor-talk-to-figma-mcp

# Verify project structure
ls package.json src && echo "✅ Project structure valid" || echo "❌ ERROR: Invalid project structure"
```

### Step 3A: Setup and Configure

```bash
# Run setup (this installs dependencies, builds, and configures MCP automatically)
bun setup && echo "✅ Setup complete" || echo "❌ ERROR: Setup failed"

# Verify MCP config was created
test -f .cursor/mcp.json && echo "✅ MCP config created" || echo "❌ ERROR: MCP config missing"
```

**Continue to Step 4 (Common Steps) below.**

---

## 🔧 Method B: Cursor-Only Installation (No sudo required)

### Step 1B: Open Cursor and Setup Environment

1. **Open Cursor IDE**
2. **Create new workspace**: File > New Window
3. **Open terminal in Cursor**: Terminal > New Terminal (or `Ctrl+Shift+` `)

### Step 2B: Clone Project in Cursor

```bash
# Navigate to Documents or preferred directory
cd ~/Documents || cd ~/Desktop || cd ~

# Create workspace directory
mkdir -p cursor-workspace && cd cursor-workspace

# Clone repository
git clone https://github.com/sonnylazuardi/cursor-talk-to-figma-mcp.git

# Enter project directory
cd cursor-talk-to-figma-mcp

# Open in Cursor
cursor .
```

### Step 3B: Follow README Setup

**📖 IMPORTANT**: Once Cursor opens with the project, open the `@readme.md` file and follow the "Get Started" section exactly as written there. The readme contains the authoritative setup instructions for this project.

**In Cursor, ask the AI:**
```
Please read the @readme.md file and help me set up this project by following the "Get Started" section step by step.
```

**Continue to Step 4 (Common Steps) below.**

---

## 🔗 Step 4: Launch Cursor with MCP (Common Steps)

**🚨 CRITICAL**: Cursor must be launched from the project directory to load MCP configuration.

```bash
# Verify current directory is correct
pwd | grep "cursor-talk-to-figma-mcp" && echo "✅ Correct directory" || echo "❌ ERROR: Wrong directory"

# If in wrong directory, navigate to project
cd ~/Sites/cursor-talk-to-figma-mcp 2>/dev/null || cd ~/Documents/cursor-workspace/cursor-talk-to-figma-mcp 2>/dev/null || cd ~/Desktop/cursor-workspace/cursor-talk-to-figma-mcp 2>/dev/null

# Launch Cursor from project directory
cursor .

# Wait for initialization
sleep 15
```

**CHECKPOINT**: Cursor should open with the project loaded. Verify in Cursor:
1. Open Settings (`Cmd+,` on Mac, `Ctrl+,` on Windows/Linux)
2. Search "MCP"
3. Confirm "TalkToFigma" shows as "Connected"

## 🌐 Step 5: Start WebSocket Server

### For Method A (Bun users):

```bash
# Open new terminal and navigate to project
cd ~/Sites/cursor-talk-to-figma-mcp

# Start WebSocket server (keep this running)
bun socket
```

### For Method B (Cursor-only users):

**📖 Follow README**: In your Cursor terminal, run the commands from the "Get Started" section in @readme.md:

```bash
# Start WebSocket server (as per readme.md)
bun socket
```

**Note**: If bun is not available in Method B, the AI assistant in Cursor will guide you through the alternative setup when you ask it to follow the readme.

**CHECKPOINT**: Server should start and show "WebSocket server running on port 3001" or similar message. **Keep this terminal open and running.**

---

## 🎯 Final Setup

### Step 6: Install Figma Plugin

**Choose ONE method and install:**

- **Community Plugin**: https://www.figma.com/community/plugin/1485687494525374295/cursor-talk-to-figma-mcp-plugin
- **Local Plugin**: In Figma > Plugins > Development > New Plugin > Link existing plugin > Select manifest.json from your project directory

### Step 7: Test Everything Works

**In Cursor (where MCP is connected):**

1. Test MCP: `join_channel` → Should see "Successfully joined channel"
2. Test Figma: `get_document_info` → Should see JSON data from Figma

**✅ If both commands work, setup is complete!**

---

## ⚠️ Troubleshooting

### Issue: MCP Not Connected
```bash
# Method A users
cd ~/Sites/cursor-talk-to-figma-mcp && cursor .

# Method B users
cd ~/Documents/cursor-workspace/cursor-talk-to-figma-mcp && cursor . || cd ~/Desktop/cursor-workspace/cursor-talk-to-figma-mcp && cursor .
```

### Issue: WebSocket Connection Failed
```bash
# Check if server is running
lsof -i :3001 || echo "Start WebSocket server"

# Method A restart
cd ~/Sites/cursor-talk-to-figma-mcp && bun socket

# Method B restart
cd ~/Documents/cursor-workspace/cursor-talk-to-figma-mcp && bun socket
```

### Issue: Bun Command Not Found (Method A)
```bash
# Reload shell configuration
if [[ "$SHELL" == *"zsh"* ]]; then
    source ~/.zshrc
elif [[ "$SHELL" == *"bash"* ]]; then
    source ~/.bashrc || source ~/.bash_profile
fi

# Check PATH
echo $PATH | grep -o ".bun/bin" && echo "✅ Bun in PATH" || echo "❌ Add ~/.bun/bin to PATH"

# Manual PATH addition for zsh
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc

# Manual PATH addition for bash
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc && source ~/.bashrc
```

### Issue: Permission Denied
```bash
# If you get permission errors, try Method B instead
echo "Switching to Method B - Cursor-Only Installation"
```

### Issue: Figma Plugin Not Working
- Ensure plugin is activated in Figma
- Check WebSocket server is running
- Try refreshing Figma
- Restart Figma if needed

---

## 🔍 Advanced Troubleshooting

### Shell Configuration Check
```bash
# Check which shell you're using
echo "Current shell: $SHELL"
echo "Available shells:"
cat /etc/shells

# Check if configuration files exist
ls -la ~/.zshrc ~/.bashrc ~/.bash_profile 2>/dev/null || echo "Some config files missing"
```

### Network Issues
```bash
# Check if port 3001 is available
lsof -i :3001 && echo "Port 3001 in use" || echo "Port 3001 available"

# Alternative port for WebSocket
export WEBSOCKET_PORT=3002
```

### Environment Variables
```bash
# For zsh users - add to ~/.zshrc
echo 'export CURSOR_FIGMA_MCP_PATH="~/Sites/cursor-talk-to-figma-mcp"' >> ~/.zshrc

# For bash users - add to ~/.bashrc
echo 'export CURSOR_FIGMA_MCP_PATH="~/Sites/cursor-talk-to-figma-mcp"' >> ~/.bashrc
```

---

## ✅ Success Verification

Installation is complete when ALL of the following are true:

### Method A Verification:
1. `bun --version` shows version number
2. `pwd` shows you're in `cursor-talk-to-figma-mcp` directory
3. `test -f .cursor/mcp.json` returns success
4. Cursor Settings shows "TalkToFigma" as "Connected"
5. `join_channel` command works in Cursor
6. `get_document_info` returns Figma data
7. WebSocket server shows active connections

### Method B Verification:
1. Project successfully opens in Cursor
2. `pwd` shows you're in `cursor-talk-to-figma-mcp` directory  
3. `test -f .cursor/mcp.json` returns success (after following readme setup)
4. Cursor Settings shows "TalkToFigma" as "Connected"
5. `join_channel` command works in Cursor
6. `get_document_info` returns Figma data
7. WebSocket server shows active connections

**If any verification fails, repeat the corresponding step above.**

---

## 🚀 Quick Start Commands

### Shell Detection and Setup
```bash
# Quick environment check
curl -fsSL https://raw.githubusercontent.com/sonnylazuardi/cursor-talk-to-figma-mcp/main/scripts/setup.sh | bash
```

### Manual Quick Setup
```bash
# One-liner for Method A (with sudo)
mkdir -p ~/Sites && cd ~/Sites && git clone https://github.com/sonnylazuardi/cursor-talk-to-figma-mcp.git && cd cursor-talk-to-figma-mcp && bun setup && cursor .

# One-liner for Method B (no sudo)
mkdir -p ~/Documents/cursor-workspace && cd ~/Documents/cursor-workspace && git clone https://github.com/sonnylazuardi/cursor-talk-to-figma-mcp.git && cd cursor-talk-to-figma-mcp && cursor .
```

### After Setup - Start Services
```bash
# In one terminal - Start WebSocket server
bun socket

# In another terminal (if using MCP server method)
bunx cursor-talk-to-figma-mcp
```

**Remember**: Always keep the WebSocket server running in a separate terminal for the plugin to work! 
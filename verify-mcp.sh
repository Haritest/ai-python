#!/bin/bash
# MCP Server Verification Test Script

echo "=== MCP Server Verification ==="
echo ""

# Check if settings.json contains MCP server
echo "[1/3] Checking VS Code Settings..."
SETTINGS_FILE="$APPDATA\Code\User\settings.json"

if grep -q "markdown-docs" "$SETTINGS_FILE" 2>/dev/null; then
    echo "✓ MCP Server 'markdown-docs' registered in VS Code settings"
else
    echo "✗ MCP Server not found in settings"
fi

echo ""

# Check if server file exists
echo "[2/3] Checking Server File..."
SERVER_FILE="f:/ai-python/mcp-server-markdown.js"

if [ -f "$SERVER_FILE" ]; then
    echo "✓ Server file exists: $SERVER_FILE"
    echo "  Size: $(wc -c < "$SERVER_FILE") bytes"
else
    echo "✗ Server file not found"
fi

echo ""

# Check MCP settings
echo "[3/3] MCP Configuration..."
if grep -q "chat.mcp.enabled.*true" "$SETTINGS_FILE" 2>/dev/null; then
    echo "✓ MCP is enabled in VS Code settings"
else
    echo "✗ MCP appears to be disabled"
fi

echo ""
echo "=== Next Steps ==="
echo "1. Install Node.js: https://nodejs.org/"
echo "2. Restart VS Code"
echo "3. Open Chat and ask Claude to use MCP tools"
echo "4. Check Output panel for MCP logs: View > Output"

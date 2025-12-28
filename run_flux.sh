#!/bin/bash
# Flux App Launcher
# Loads configuration and starts the server (Robust Version)

echo "🚀 Launching Flux App Server..."

# 1. Kill previous instances (Fixes "Address in Use" error)
echo "🧹 Cleaning up old processes..."
pkill -f "python3 server.py" || true
sleep 1

# 2. Load Config safely (Ignoring comments)
if [ -f flux_config.env ]; then
    echo "✅ Loading configuration..."
    # 'set -a' exports all variables defined in the sourced file
    set -a
    source flux_config.env
    set +a
else
    echo "⚠️ flux_config.env not found. Using defaults."
fi

# Show Configuration
echo "--------------------------------"
echo "🧠 AI Provider: $AI_PROVIDER"
echo "🔗 Ollama URL:  $OLLAMA_URL"
echo "--------------------------------"

# 3. Start Server
python3 server.py 8081

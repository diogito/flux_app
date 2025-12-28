#!/bin/bash
# Flux App Launcher
# Loads configuration and starts the server

echo "🚀 Launching Flux App Server..."

# Check if config exists
if [ -f flux_config.env ]; then
    echo "✅ Loading configuration from flux_config.env..."
    export $(cat flux_config.env | xargs)
else
    echo "⚠️ flux_config.env not found. Using defaults."
fi

# Show Configuration
echo "--------------------------------"
echo "🧠 AI Provider: $AI_PROVIDER"
echo "🔗 Ollama URL:  $OLLAMA_URL"
echo "--------------------------------"

# Start Server
python3 server.py 8081

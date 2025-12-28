# ==========================================
# FLUX HOME CLOUD SERVER SETUP (Windows 11)
# ==========================================
# This script turns your PC into an AI Server.

Write-Host "🚀 Starting Flux Home Cloud Setup..." -ForegroundColor Cyan

# 1. Configure Network Access (Critical for Mobile)
# Setting OLLAMA_HOST to 0.0.0.0 allows your phone to connect.
Write-Host "🌐 Configuring OLLAMA_HOST to 0.0.0.0 (LAN Access)..."
[System.Environment]::SetEnvironmentVariable("OLLAMA_HOST", "0.0.0.0", "User")

Write-Host "✅ Environment Variable Set. (Will apply after restart)" -ForegroundColor Green

# 2. Download Ollama
$installer = "$env:TEMP\OllamaSetup.exe"
$ollamaPath = "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe"

if (-Not (Test-Path $ollamaPath)) {
    Write-Host "⬇️ Downloading Ollama Installer..."
    try {
        Invoke-WebRequest -Uri "https://ollama.com/download/OllamaSetup.exe" -OutFile $installer
        
        Write-Host "📦 Installing Ollama... (Please click 'Yes'/Install on the pop-up)"
        Start-Process -FilePath $installer -Wait
        Write-Host "✅ Ollama Installed." -ForegroundColor Green
    } catch {
        Write-Error "Failed to download or install Ollama. Please install manually from ollama.com"
    }
} else {
    Write-Host "ℹ️ Ollama is already installed." -ForegroundColor Yellow
}

# 3. Pull the Intelligence (Llama 3)
Write-Host "🧠 Downloading Llama 3 (8B Parameters)... This may take a while depending on your internet."
# We start a new prompt to ensure env vars are loaded, but for now we just try direct call
# If this fails, user might need to restart terminal.
try {
    ollama pull llama3
} catch {
    Write-Warning "Could not pull model automatically. Please run 'ollama pull llama3' manually after setup."
}

# 4. Final Instructions
Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "✅ SETUP COMPLETE!" -ForegroundColor Green
Write-Host "=========================================="
Write-Host "IMPORTANT NEXT STEPS:"
Write-Host "1. RESTART your computer (or at least the Ollama app) to apply the 0.0.0.0 setting."
Write-Host "2. After restart, open PowerShell and run: 'ollama serve'"
Write-Host "3. Find your Local IP (run 'ipconfig' and look for IPv4)."
Write-Host "4. Update your mobile app .env with that IP."
Write-Host "=========================================="
Write-Host "Press Enter to exit..."
Read-Host

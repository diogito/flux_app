# ==========================================
# FLUX HOME CLOUD SERVER SETUP (Windows 11)
# ==========================================

Write-Host "🚀 Starting Flux Home Cloud Setup..." -ForegroundColor Cyan

# 1. Configure Network Access
Write-Host "🌐 Configuring OLLAMA_HOST..."
[System.Environment]::SetEnvironmentVariable("OLLAMA_HOST", "0.0.0.0", "User")
Write-Host "✅ Environment Variable Set." -ForegroundColor Green

# 2. Download Ollama
$installer = "$env:TEMP\OllamaSetup.exe"
$ollamaPath = "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe"

$isInstalled = Test-Path $ollamaPath

if ($isInstalled -eq $false) {
    Write-Host "⬇️ Downloading Ollama Installer..."
    Invoke-WebRequest -Uri "https://ollama.com/download/OllamaSetup.exe" -OutFile $installer
    
    Write-Host "📦 Installing Ollama... (Click 'Yes' on the popup)"
    Start-Process -FilePath $installer -Wait
    Write-Host "✅ Ollama Installed." -ForegroundColor Green
}
if ($isInstalled -eq $true) {
    Write-Host "ℹ️ Ollama is already installed." -ForegroundColor Yellow
}

# 3. Pull Llama 3
Write-Host "🧠 Downloading Llama 3 (8B)..."
Write-Host "If this fails, restart and run: 'ollama pull llama3'"
# Attempt to pull without try-catch to avoid parser issues
ollama pull llama3

# 4. Final Instructions
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ SETUP COMPLETE!" -ForegroundColor Green
Write-Host "=========================================="
Write-Host "1. RESTART your computer."
Write-Host "2. Open terminal and run: ollama serve"
Write-Host "3. Find your IP: ipconfig"
Write-Host "4. Update mobile app .env"
Write-Host "=========================================="
Write-Host "Press Enter to exit..."
Read-Host

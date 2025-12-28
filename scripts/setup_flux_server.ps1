# ==========================================
# FLUX HOME CLOUD SERVER SETUP (Windows 11)
# ==========================================
# MODIFIED: Uses BitsTransfer for Progress Bar

Write-Host "🚀 Starting Flux Home Cloud Setup..." -ForegroundColor Cyan

# 0. Setup D: Drive
$drive = "D:"
$baseDir = "D:\FluxAI"

if (Test-Path $drive) {
    Write-Host "💾 D: Drive Detected. Creating workspace at $baseDir..."
    New-Item -ItemType Directory -Force -Path $baseDir | Out-Null
    New-Item -ItemType Directory -Force -Path "$baseDir\Models" | Out-Null
} else {
    Write-Host "⚠️ Drive D: NOT FOUND. Fallback to C:..." -ForegroundColor Red
    $baseDir = "C:\FluxAI"
    New-Item -ItemType Directory -Force -Path $baseDir | Out-Null
}

# 1. Configure Environment
Write-Host "🌐 Configuring Access & Storage..."
[System.Environment]::SetEnvironmentVariable("OLLAMA_HOST", "0.0.0.0", "User")
[System.Environment]::SetEnvironmentVariable("OLLAMA_MODELS", "$baseDir\Models", "User")
Write-Host "✅ Variables Set." -ForegroundColor Green

# 2. Download Ollama (With Progress Bar)
$installer = "$baseDir\OllamaSetup.exe"
$url = "https://ollama.com/download/OllamaSetup.exe"
$ollamaPath = "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe"

$isInstalled = Test-Path $ollamaPath

if ($isInstalled -eq $false) {
    Write-Host "⬇️ Downloading Installer... (Please Wait)"
    
    # Use BITS for visual progress
    Import-Module BitsTransfer
    Start-BitsTransfer -Source $url -Destination $installer -DisplayName "Ollama Download"
    
    Write-Host "✅ Download Complete." -ForegroundColor Green
    
    Write-Host "📦 Installing Ollama... (Click 'Yes' on the popup)"
    Start-Process -FilePath $installer -Wait
    Write-Host "✅ Ollama Installed." -ForegroundColor Green
} else {
    Write-Host "ℹ️ Ollama is already installed." -ForegroundColor Yellow
}

# 3. Pull Llama 3
Write-Host "🧠 Downloading Llama 3 (8B)..."
Write-Host "NOTE: This will be stored in $baseDir\Models"
# 'ollama pull' shows its own progress bar usually
ollama pull llama3

# 4. Final Instructions
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ SETUP COMPLETE!" -ForegroundColor Green
Write-Host "=========================================="
Write-Host "1. RESTART your computer NOW."
Write-Host "2. After restart, open terminal and run: ollama serve"
Write-Host "3. Find your IP: ipconfig"
Write-Host "=========================================="
Write-Host "Press Enter to exit..."
Read-Host

# ==========================================
# FLUX HOME CLOUD SERVER SETUP (Windows 11)
# ==========================================
# MODIFIED: Uses D: Drive for Storage

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

# 1. Configure Environment (Network + Storage)
Write-Host "🌐 Configuring Access & Storage..."

# LAN Access
[System.Environment]::SetEnvironmentVariable("OLLAMA_HOST", "0.0.0.0", "User")

# STORAGE ON D: (Critical for space)
[System.Environment]::SetEnvironmentVariable("OLLAMA_MODELS", "$baseDir\Models", "User")

Write-Host "✅ OLLAMA_HOST = 0.0.0.0" -ForegroundColor Green
Write-Host "✅ OLLAMA_MODELS = $baseDir\Models" -ForegroundColor Green

# 2. Download Ollama
$installer = "$baseDir\OllamaSetup.exe"
$ollamaPath = "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe"

$isInstalled = Test-Path $ollamaPath

if ($isInstalled -eq $false) {
    Write-Host "⬇️ Downloading Installer to $installer..."
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
Write-Host "NOTE: This will be stored in $baseDir\Models"
ollama pull llama3

# 4. Final Instructions
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ SETUP COMPLETE!" -ForegroundColor Green
Write-Host "=========================================="
Write-Host "1. RESTART your computer (to apply D: drive settings)."
Write-Host "2. Open terminal and run: ollama serve"
Write-Host "3. Find your IP: ipconfig"
Write-Host "4. Update mobile app .env"
Write-Host "=========================================="
Write-Host "Press Enter to exit..."
Read-Host

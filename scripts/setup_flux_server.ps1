# ==========================================
# FLUX HOME CLOUD SERVER SETUP (Windows 11)
# ==========================================
# FIXED: No Emojis, Direct Path Execution

Write-Host ">>> Starting Flux Home Cloud Setup..." -ForegroundColor Cyan

# 0. Setup D: Drive
$drive = "D:"
$baseDir = "D:\FluxAI"

if (Test-Path $drive) {
    Write-Host "[DISK] D: Drive Detected. Using D:\FluxAI..."
    New-Item -ItemType Directory -Force -Path $baseDir | Out-Null
    New-Item -ItemType Directory -Force -Path "$baseDir\Models" | Out-Null
} else {
    Write-Host "[WARN] Drive D: NOT FOUND. Using C:\FluxAI..." -ForegroundColor Red
    $baseDir = "C:\FluxAI"
    New-Item -ItemType Directory -Force -Path $baseDir | Out-Null
}

# 1. Configure Environment
Write-Host "[NET] Configuring OLLAMA_HOST and OLLAMA_MODELS..."
[System.Environment]::SetEnvironmentVariable("OLLAMA_HOST", "0.0.0.0", "User")
[System.Environment]::SetEnvironmentVariable("OLLAMA_MODELS", "$baseDir\Models", "User")
Write-Host "[OK] Variables Set." -ForegroundColor Green

# 2. Download Ollama
$installer = "$baseDir\OllamaSetup.exe"
$url = "https://ollama.com/download/OllamaSetup.exe"
# Standard location for user install
$ollamaExe = "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe"

if (-Not (Test-Path $ollamaExe)) {
    Write-Host "[DOWN] Downloading Installer..."
    
    Import-Module BitsTransfer
    Start-BitsTransfer -Source $url -Destination $installer -DisplayName "OllamaDownload"
    
    Write-Host "[INSTALL] Launching Installer... Accept the prompt!"
    Start-Process -FilePath $installer -Wait
    Write-Host "[OK] Installation finished." -ForegroundColor Green
} else {
    Write-Host "[INFO] Ollama is already installed." -ForegroundColor Yellow
}

# 3. Pull Llama 3 (Using Direct Path to avoid PATH issues)
Write-Host "[AI] Downloading Llama 3 Model..."
Write-Host "NOTE: This will be stored in $baseDir\Models"

if (Test-Path $ollamaExe) {
    # Run using the call operator & and full path
    & $ollamaExe pull llama3
} else {
    Write-Warning "Could not find ollama.exe at expected path."
    Write-Warning "Please restart terminal and run: ollama pull llama3"
}

# 4. Final Instructions
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "SETUP COMPLETE!" -ForegroundColor Green
Write-Host "=========================================="
Write-Host "1. CRIFICIAL: RESTART your computer now."
Write-Host "   (This ensures the 0.0.0.0 setting is active)"
Write-Host "2. After restart, run: ollama serve"
Write-Host "3. Find your IP using: ipconfig"
Write-Host "=========================================="
Write-Host "Press Enter to exit..."
Read-Host

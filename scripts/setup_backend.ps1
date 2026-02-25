$ErrorActionPreference = "Stop"

$url = "https://github.com/pocketbase/pocketbase/releases/download/v0.36.3/pocketbase_0.36.3_windows_amd64.zip"
$destDir = "backend"
$zipFile = "$destDir\pocketbase.zip"

if (-not (Test-Path -Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir | Out-Null
}

Write-Host "Downloading PocketBase..."
Invoke-WebRequest -Uri $url -OutFile $zipFile

Write-Host "Extracting..."
Expand-Archive -Path $zipFile -DestinationPath $destDir -Force

Write-Host "Cleaning up..."
Remove-Item -Path $zipFile

Write-Host "PocketBase installed successfully in ./backend"
Write-Host "To start the server, run: ./backend/pocketbase.exe serve"

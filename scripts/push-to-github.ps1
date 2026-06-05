# Finish GitHub login + push Trade RMB to augcargoshipping/tradermb.com
$ErrorActionPreference = "Stop"

$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
  [System.Environment]::GetEnvironmentVariable("Path", "User")

$repoRoot = Split-Path $PSScriptRoot -Parent
Set-Location $repoRoot

Write-Host "Checking GitHub CLI login..." -ForegroundColor Cyan
$status = gh auth status 2>&1 | Out-String
if ($status -notmatch "Logged in") {
  Write-Host ""
  Write-Host "Not logged in yet. Run this first:" -ForegroundColor Yellow
  Write-Host "  gh auth login -h github.com -p https --skip-ssh-key --clipboard" -ForegroundColor White
  Write-Host "Then open https://github.com/login/device and sign in as augcargoshipping." -ForegroundColor White
  exit 1
}

Write-Host $status
Write-Host "Configuring git to use GitHub CLI credentials..." -ForegroundColor Cyan
gh auth setup-git

Write-Host "Pushing to origin main..." -ForegroundColor Cyan
git push -u origin main

Write-Host ""
Write-Host "Done: https://github.com/augcargoshipping/tradermb.com" -ForegroundColor Green

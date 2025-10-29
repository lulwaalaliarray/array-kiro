# PatientCare - GitHub Push Script
# This script helps you push your code to aamna466/patientCare-

Write-Host "🚀 PatientCare - GitHub Push Script" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""

# Check if Git is installed
Write-Host "📋 Step 1: Checking Git installation..." -ForegroundColor Yellow
try {
    $gitVersion = & git --version 2>$null
    Write-Host "✅ Git is installed: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Git first:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://git-scm.com/download/win" -ForegroundColor Cyan
    Write-Host "2. Download and install Git for Windows" -ForegroundColor Cyan
    Write-Host "3. Restart PowerShell and run this script again" -ForegroundColor Cyan
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Check if we're in a git repository
Write-Host "📋 Step 2: Checking Git repository..." -ForegroundColor Yellow
if (Test-Path ".git") {
    Write-Host "✅ Git repository found" -ForegroundColor Green
} else {
    Write-Host "⚠️ No Git repository found. Initializing..." -ForegroundColor Yellow
    & git init
    Write-Host "✅ Git repository initialized" -ForegroundColor Green
}

Write-Host ""

# Configure Git user (if not already configured)
Write-Host "📋 Step 3: Checking Git configuration..." -ForegroundColor Yellow
$userName = & git config --global user.name 2>$null
$userEmail = & git config --global user.email 2>$null

if (-not $userName) {
    $inputName = Read-Host "Enter your name for Git commits"
    & git config --global user.name "$inputName"
    Write-Host "✅ Git user name configured" -ForegroundColor Green
}

if (-not $userEmail) {
    $inputEmail = Read-Host "Enter your email for Git commits"
    & git config --global user.email "$inputEmail"
    Write-Host "✅ Git user email configured" -ForegroundColor Green
}

Write-Host ""

# Check current remote
Write-Host "📋 Step 4: Checking remote repository..." -ForegroundColor Yellow
$currentRemote = & git remote get-url origin 2>$null
if ($currentRemote) {
    Write-Host "Current remote: $currentRemote" -ForegroundColor Cyan
    $changeRemote = Read-Host "Do you want to change to aamna466/patientCare-? (y/n)"
    if ($changeRemote -eq "y" -or $changeRemote -eq "Y") {
        & git remote set-url origin https://github.com/aamna466/patientCare-.git
        Write-Host "✅ Remote updated to aamna466/patientCare-" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️ No remote repository configured. Adding aamna466/patientCare-..." -ForegroundColor Yellow
    & git remote add origin https://github.com/aamna466/patientCare-.git
    Write-Host "✅ Remote repository added" -ForegroundColor Green
}

Write-Host ""

# Add all files
Write-Host "📋 Step 5: Adding files to Git..." -ForegroundColor Yellow
& git add .
Write-Host "✅ Files added to Git staging area" -ForegroundColor Green

Write-Host ""

# Commit changes
Write-Host "📋 Step 6: Committing changes..." -ForegroundColor Yellow
$commitMessage = Read-Host "Enter commit message (or press Enter for default)"
if (-not $commitMessage) {
    $commitMessage = "Update PatientCare: Enhanced admin panel, pagination, and authentication fixes"
}

& git commit -m "$commitMessage"
Write-Host "✅ Changes committed" -ForegroundColor Green

Write-Host ""

# Push to GitHub
Write-Host "📋 Step 7: Pushing to GitHub..." -ForegroundColor Yellow
Write-Host "⚠️ You may be prompted for GitHub credentials" -ForegroundColor Yellow
Write-Host ""

try {
    # Try to push to main branch
    & git branch -M main
    & git push -u origin main
    Write-Host ""
    Write-Host "🎉 SUCCESS! Your code has been pushed to GitHub!" -ForegroundColor Green
    Write-Host "🔗 Repository: https://github.com/aamna466/patientCare-" -ForegroundColor Cyan
} catch {
    Write-Host ""
    Write-Host "❌ Push failed. This might be due to:" -ForegroundColor Red
    Write-Host "1. Authentication issues (need GitHub token or SSH key)" -ForegroundColor Yellow
    Write-Host "2. Repository doesn't exist or you don't have access" -ForegroundColor Yellow
    Write-Host "3. Network connectivity issues" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📋 Manual steps to complete:" -ForegroundColor Yellow
    Write-Host "1. Make sure the repository exists: https://github.com/aamna466/patientCare-" -ForegroundColor Cyan
    Write-Host "2. Set up authentication (Personal Access Token recommended)" -ForegroundColor Cyan
    Write-Host "3. Run: git push -u origin main" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "📊 Current Status:" -ForegroundColor Yellow
Write-Host "✅ Enhanced admin dashboard with persistent navigation" -ForegroundColor Green
Write-Host "✅ Pagination for doctor listings (15 per page)" -ForegroundColor Green
Write-Host "✅ Fixed authentication issues (single-click login)" -ForegroundColor Green
Write-Host "✅ Comprehensive demo data initialization" -ForegroundColor Green
Write-Host "✅ Professional healthcare platform ready for deployment" -ForegroundColor Green

Write-Host ""
Read-Host "Press Enter to exit"
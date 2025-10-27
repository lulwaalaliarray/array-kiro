@echo off
echo 🚀 PatientCare - GitHub Setup Script
echo =====================================
echo.

echo 📋 Step 1: Checking Git installation...
git --version
if %errorlevel% neq 0 (
    echo ❌ Git is not installed or not in PATH
    echo Please install Git from: https://git-scm.com/download/win
    echo Then restart this script
    pause
    exit /b 1
)

echo ✅ Git is installed
echo.

echo 📋 Step 2: Initializing Git repository...
git init
if %errorlevel% neq 0 (
    echo ❌ Failed to initialize Git repository
    pause
    exit /b 1
)

echo ✅ Git repository initialized
echo.

echo 📋 Step 3: Adding files to Git...
git add .
git commit -m "Initial commit: PatientCare healthcare platform for Bahrain"
if %errorlevel% neq 0 (
    echo ❌ Failed to commit files
    pause
    exit /b 1
)

echo ✅ Files committed to Git
echo.

echo 📋 Next Steps:
echo 1. Create a new repository on GitHub.com
echo 2. Copy the repository URL
echo 3. Run this command (replace YOUR_REPO_URL):
echo    git remote add origin YOUR_REPO_URL
echo    git branch -M main
echo    git push -u origin main
echo.

echo 🎉 Setup complete! Your project is ready for GitHub.
echo.
echo 📖 For detailed instructions, see: GITHUB_SETUP_GUIDE.md
echo.
pause
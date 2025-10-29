@echo off
echo 🚀 PatientCare - Quick GitHub Push
echo ==================================
echo.

echo This will push your code to: aamna466/patientCare-
echo.
pause

echo 📋 Checking Git installation...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Git is not installed!
    echo.
    echo Please install Git first:
    echo 1. Go to: https://git-scm.com/download/win
    echo 2. Download and install Git for Windows
    echo 3. Restart and run this script again
    echo.
    pause
    exit /b 1
)

echo ✅ Git is available
echo.

echo 📋 Adding files to Git...
git add .

echo 📋 Committing changes...
git commit -m "Update PatientCare: Enhanced admin panel, pagination, and authentication fixes"

echo 📋 Setting up remote repository...
git remote remove origin >nul 2>&1
git remote add origin https://github.com/aamna466/patientCare-.git

echo 📋 Pushing to GitHub...
git branch -M main
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo 🎉 SUCCESS! Code pushed to GitHub!
    echo 🔗 https://github.com/aamna466/patientCare-
) else (
    echo.
    echo ❌ Push failed. You may need to:
    echo 1. Install Git: https://git-scm.com/download/win
    echo 2. Set up GitHub authentication
    echo 3. Make sure the repository exists
)

echo.
pause
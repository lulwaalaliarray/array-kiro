# Fix Git PATH for current PowerShell session
Write-Host "Adding Git to PATH..." -ForegroundColor Yellow

# Common Git installation paths
$gitPaths = @(
    "C:\Program Files\Git\bin",
    "C:\Program Files\Git\cmd",
    "C:\Program Files (x86)\Git\bin",
    "C:\Program Files (x86)\Git\cmd"
)

foreach ($path in $gitPaths) {
    if (Test-Path $path) {
        $env:PATH += ";$path"
        Write-Host "Added $path to PATH" -ForegroundColor Green
    }
}

# Test if git works now
try {
    git --version
    Write-Host "Git is now working!" -ForegroundColor Green
} catch {
    Write-Host "Git still not working. Try the manual method." -ForegroundColor Red
}
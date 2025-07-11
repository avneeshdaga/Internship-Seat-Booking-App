Write-Host "Fixing React imports for Vite compatibility..."

# Fix CSS imports in components
Get-ChildItem -Path "src\components" -Recurse -Filter "*.tsx" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $content = $content -replace "from '\.\./styles/globals\.css'", "from '../styles/globals.css'"
    $content = $content -replace "import '\.\./styles/globals\.css'", "import '../styles/globals.css'"
    Set-Content $_.FullName $content -Encoding utf8
}

# Fix any other import paths
Get-ChildItem -Path "src" -Recurse -Filter "*.tsx" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $content = $content -replace "from '\.\./(\w+)'", "from '../$1'"
    Set-Content $_.FullName $content -Encoding utf8
}

Write-Host "✅ Import paths fixed for Vite!"

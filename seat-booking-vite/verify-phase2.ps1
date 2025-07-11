Write-Host ""
Write-Host "========================================="
Write-Host "   Phase 2 Migration Verification"
Write-Host "========================================="
Write-Host ""

Write-Host "Checking core files..."
if (Test-Path "src\types\index.ts") { Write-Host " Types" } else { Write-Host " Types MISSING" }
if (Test-Path "src\hooks\useSeatStore.ts") { Write-Host " Store" } else { Write-Host " Store MISSING" }
if (Test-Path "src\hooks\useSVGUtils.ts") { Write-Host " SVG Utils" } else { Write-Host " SVG Utils MISSING" }
if (Test-Path "src\utils\svgHelpers.ts") { Write-Host " SVG Helpers" } else { Write-Host " SVG Helpers MISSING" }
if (Test-Path "src\styles\globals.css") { Write-Host " Styles" } else { Write-Host " Styles MISSING" }

Write-Host ""
Write-Host "Checking components..."
if (Test-Path "src\components\AppLayout.tsx") { Write-Host " AppLayout" } else { Write-Host " AppLayout MISSING" }
if (Test-Path "src\components\Sidebar.tsx") { Write-Host " Sidebar" } else { Write-Host " Sidebar MISSING" }
if (Test-Path "src\components\MainContent.tsx") { Write-Host " MainContent" } else { Write-Host " MainContent MISSING" }
if (Test-Path "src\components\shared\SVGSeat.tsx") { Write-Host " SVGSeat" } else { Write-Host " SVGSeat MISSING" }

Write-Host ""
Write-Host "Checking Vite files..."
if (Test-Path "src\main.tsx") { Write-Host " main.tsx" } else { Write-Host " main.tsx MISSING" }
if (Test-Path "src\App.tsx") { Write-Host " App.tsx" } else { Write-Host " App.tsx MISSING" }

Write-Host ""
Write-Host "Checking dependencies..."
try {
    npm list zustand --depth=0 2>$null | Out-Null
    Write-Host " zustand installed"
} catch {
    Write-Host " zustand NOT installed"
}

Write-Host ""
Write-Host "========================================="
Write-Host "   Testing Core Functionality..."
Write-Host "========================================="
Write-Host ""

Write-Host "Checking store functions..."
$storeContent = Get-Content "src\hooks\useSeatStore.ts" -Raw -ErrorAction SilentlyContinue

if ($storeContent -match "promptForSeatCount") {
    Write-Host " Seat count prompting (from vanilla code)"
} else {
    Write-Host " Missing seat count prompting - CRITICAL"
}

if ($storeContent -match "confirmBooking") {
    Write-Host " Booking confirmation (from vanilla code)"
} else {
    Write-Host " Missing booking confirmation - CRITICAL"
}

if ($storeContent -match "generateGrid") {
    Write-Host " Grid generation (from vanilla code)"
} else {
    Write-Host " Missing grid generation - CRITICAL"
}

if ($storeContent -match "toggleSeatSelection") {
    Write-Host " Seat selection logic (from vanilla code)"
} else {
    Write-Host " Missing seat selection logic - CRITICAL"
}

Write-Host ""
Write-Host "========================================="
Write-Host "Ready to test! Run: npm run dev"
Write-Host "========================================="

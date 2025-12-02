# PowerShell script to add hamburger menu button to all HTML files
$htmlFiles = Get-ChildItem "f:\documentation-website\public\pages\*.html" -File

$hamburgerButton = @"
                <button class="hamburger-menu" aria-label="Toggle sidebar" role="button" tabindex="0" type="button">
                    <span class="hamburger-bar"></span>
                    <span class="hamburger-bar"></span>
                    <span class="hamburger-bar"></span>
                </button>
"@

$count = 0
$skipped = 0

foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    
    # Check if hamburger button already exists
    if ($content -match 'hamburger-menu') {
        Write-Host "Skipping $($file.Name) - already has hamburger button" -ForegroundColor Yellow
        $skipped++
        continue
    }
    
    # Find </div> closing the header-actions and add button before </header>
    if ($content -match '(<div class="header-actions">[\s\S]*?</div>)\s*(</header>)') {
        $newContent = $content -replace '(<div class="header-actions">[\s\S]*?</div>)\s*(</header>)', "`$1`n$hamburgerButton`n                `$2"
        Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8 -NoNewline
        Write-Host "Updated $($file.Name)" -ForegroundColor Green
        $count++
    } else {
        Write-Host "Could not find header pattern in $($file.Name)" -ForegroundColor Red
    }
}

Write-Host "`nSummary:" -ForegroundColor Cyan
Write-Host "Updated: $count files" -ForegroundColor Green
Write-Host "Skipped: $skipped files" -ForegroundColor Yellow
Write-Host "Total: $($htmlFiles.Count) files"

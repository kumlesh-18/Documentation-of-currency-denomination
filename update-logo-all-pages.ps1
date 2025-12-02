# Script to add logo and favicon to all HTML pages
$htmlFiles = Get-ChildItem -Path "public/pages" -Filter "*.html"

foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw
    
    # Add favicon if not present
    if ($content -notmatch 'favicon\.svg') {
        $content = $content -replace '(<title>.*?</title>)', "`$1`n    <link rel=`"icon`" type=`"image/svg+xml`" href=`"../assets/favicon.svg`">"
    }
    
    # Update sidebar header with logo if still using emoji
    if ($content -match '<h2>📚 Documentation</h2>') {
        $oldPattern = '<h2>📚 Documentation</h2>\s*<p style="font-size: 0\.75rem; color: rgba\(255,255,255,0\.6\); margin-top: 0\.5rem;">v1\.0\.0</p>'
        $newContent = @'
<div style="display: flex; align-items: center; gap: 0.75rem;">
                    <img src="../assets/logo-small.svg" alt="Currency Distributor Logo" style="width: 48px; height: 48px;">
                    <div>
                        <h2 style="margin: 0;">Documentation</h2>
                        <p style="font-size: 0.75rem; color: rgba(255,255,255,0.6); margin: 0.25rem 0 0 0;">v1.0.0</p>
                    </div>
                </div>
'@
        $content = $content -replace $oldPattern, $newContent
    }
    
    # Write back to file
    Set-Content -Path $file.FullName -Value $content -NoNewline
    Write-Host "Updated: $($file.Name)" -ForegroundColor Green
}

Write-Host "`nLogo integration complete! Updated $($htmlFiles.Count) files." -ForegroundColor Cyan

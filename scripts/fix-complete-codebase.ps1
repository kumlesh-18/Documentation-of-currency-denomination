# Fix complete-codebase.html corruption
# Handles arrows, box-drawing, checkmarks, and other symbols

Write-Host "╔════════════════════════════════════════════════════╗"
Write-Host "║  Fixing complete-codebase.html Corruption         ║"
Write-Host "╚════════════════════════════════════════════════════╝`n"

$filePath = Join-Path $PSScriptRoot ".." "public" "pages" "complete-codebase.html"

# Define all corruption fixes
$fixes = @(
    # Arrows
    @{ From = "â†'"; To = "→" }
    @{ From = "â†""; To = "↓" }
    @{ From = "â†�"; To = "↑" }
    @{ From = "â†�"; To = "←" }
    
    # Box-drawing characters
    @{ From = "â"Œ"; To = "┌" 
    }
    @{ From = "â"€"; To = "─" }
    @{ From = "â""; To = "┐" 
    }
    @{ From = "â"‚"; To = "│" }
    @{ From = "â"¤"; To = "├" }
    @{ From = "â"œ"; To = "├" }
    @{ From = "â"""; To = "└" }
    @{ From = "â"˜"; To = "┘" }
    @{ From = "â"´"; To = "┴" }
    @{ From = "â"¬"; To = "┬" }
    @{ From = "â"¼"; To = "┼" }
    
    # Checkmarks and crosses
    @{ From = "âœ""; To = "✓" }
    @{ From = "âœ""; To = "✔" }
    @{ From = "âœ—"; To = "✗" }
    @{ From = "âœ˜"; To = "✘" }
    
    # Other symbols
    @{ From = "â–¼"; To = "▼" }
    @{ From = "â–²"; To = "▲" }
    @{ From = "â˜"; To = "☐" }
    @{ From = "â˜'"; To = "☑" }
    @{ From = "â€¢"; To = "•" }
    @{ From = "Â°"; To = "°" }
)

try {
    # Read file
    $content = Get-Content $filePath -Raw -Encoding UTF8
    $originalContent = $content
    $totalReplacements = 0
    $replacementDetails = @()
    
    # Apply all fixes
    foreach ($fix in $fixes) {
        $matches = ([regex]::Matches($content, [regex]::Escape($fix.From))).Count
        
        if ($matches -gt 0) {
            $content = $content.Replace($fix.From, $fix.To)
            $totalReplacements += $matches
            $replacementDetails += @{
                From = $fix.From
                To = $fix.To
                Count = $matches
            }
            Write-Host "✓ Replaced '$($fix.From)' → '$($fix.To)' ($matches times)" -ForegroundColor Green
        }
    }
    
    if ($content -ne $originalContent) {
        # Write fixed content
        Set-Content $filePath -Value $content -Encoding UTF8 -NoNewline
        
        Write-Host "`n╔════════════════════════════════════════════════════╗"
        Write-Host "║                Summary Report                      ║"
        Write-Host "╚════════════════════════════════════════════════════╝`n"
        
        Write-Host "Total replacements: $totalReplacements"
        Write-Host "Unique corruption types fixed: $($replacementDetails.Count)`n"
        
        Write-Host "Replacement breakdown:"
        foreach ($detail in $replacementDetails) {
            Write-Host "  $($detail.From) → $($detail.To): $($detail.Count)"
        }
        
        Write-Host "`n✅ complete-codebase.html has been fixed!" -ForegroundColor Green
    } else {
        Write-Host "✨ No corruption found in complete-codebase.html"
    }
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

exit 0

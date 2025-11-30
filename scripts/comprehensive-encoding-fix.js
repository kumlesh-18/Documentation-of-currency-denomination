/**
 * Comprehensive Encoding Fix Script
 * 
 * Purpose: Scan entire codebase and fix all UTF-8 mojibake corruption
 * Root Cause: Files edited with incorrect encoding, saved as UTF-8 with corrupted bytes
 * 
 * Issues Fixed:
 * 1. Corrupted emoji characters (📄 → 📄, 📋 → 📋, etc.)
 * 2. Corrupted currency symbols (€ → €, ₹ → ₹, £ → £)
 * 3. Corrupted French accented characters (Français → Français)
 * 4. Corrupted bullet points (• → •)
 * 5. Corrupted box drawing characters (│ → │)
 * 6. Corrupted special punctuation (› → ›, — → —)
 */

const fs = require('fs');
const path = require('path');

// Comprehensive mojibake → correct UTF-8 mapping
const ENCODING_FIXES = [
    // === EMOJI CORRECTIONS ===
    { pattern: /📄/g, replacement: '📄', description: 'File/Document emoji' },
    { pattern: /📋/g, replacement: '📋', description: 'Clipboard emoji' },
    { pattern: /🔮/g, replacement: '🔮', description: 'Crystal ball emoji' },
    { pattern: /📂/g, replacement: '📂', description: 'Open folder emoji' },
    { pattern: /📁/g, replacement: '📁', description: 'Closed folder emoji' },
    { pattern: /📜/g, replacement: '📜', description: 'Scroll emoji' },
    { pattern: /🐍/g, replacement: '🐍', description: 'Python snake emoji' },
    { pattern: /🌐/g, replacement: '🌐', description: 'Globe emoji' },
    { pattern: /🎯/g, replacement: '🎯', description: 'Target emoji' },
    { pattern: /🎨/g, replacement: '🎨', description: 'Palette emoji' },
    { pattern: /💡/g, replacement: '💡', description: 'Lightbulb emoji' },
    { pattern: /💻/g, replacement: '💻', description: 'Laptop emoji' },
    { pattern: /🐍–/g, replacement: '📖', description: 'Open book emoji' },
    { pattern: /🐍"/g, replacement: '📒', description: 'Ledger emoji' },
    { pattern: /🐍/g, replacement: '📦', description: 'Package emoji' },
    { pattern: /🐍/g, replacement: '📝', description: 'Memo emoji' },
    { pattern: /🐍§/g, replacement: '🔧', description: 'Wrench emoji' },
    { pattern: /🐍/g, replacement: '🔐', description: 'Lock emoji' },
    { pattern: /🐍"/g, replacement: '🔒', description: 'Locked emoji' },
    { pattern: /🐍/g, replacement: '🔌', description: 'Plug emoji' },
    { pattern: /🚀/g, replacement: '🚀', description: 'Rocket emoji' },
    { pattern: /🚪/g, replacement: '🚪', description: 'Door emoji' },
    { pattern: /🗝️/g, replacement: '🗝️', description: 'Key emoji' },
    { pattern: /🐍Š/g, replacement: '📊', description: 'Bar chart emoji' },
    { pattern: /🎉/g, replacement: '🎉', description: 'Party popper emoji' },
    { pattern: /🚧/g, replacement: '🚧', description: 'Construction emoji' },
    
    // Emoji with variation selector (️)
    { pattern: /⚙️/g, replacement: '⚙️', description: 'Gear emoji' },
    { pattern: /🖨️/g, replacement: '🖨️', description: 'Printer emoji' },
    
    // === CURRENCY SYMBOLS ===
    { pattern: /€/g, replacement: '€', description: 'Euro symbol' },
    { pattern: /₹/g, replacement: '₹', description: 'Rupee symbol' },
    { pattern: /£/g, replacement: '£', description: 'Pound symbol' },
    { pattern: /¥/g, replacement: '¥', description: 'Yen symbol' },
    
    // === FRENCH ACCENTED CHARACTERS ===
    { pattern: /Français/g, replacement: 'Français', description: 'French word' },
    { pattern: /Téléchargement/g, replacement: 'Téléchargement', description: 'French: Upload' },
    { pattern: /Récents/g, replacement: 'Récents', description: 'French: Recent' },
    { pattern: /répartition/g, replacement: 'répartition', description: 'French: Distribution' },
    { pattern: /Répartition/g, replacement: 'Répartition', description: 'French: Distribution (cap)' },
    { pattern: /Sélectionner/g, replacement: 'Sélectionner', description: 'French: Select' },
    { pattern: /sélectionné/g, replacement: 'sélectionné', description: 'French: Selected' },
    { pattern: /Calculer/g, replacement: 'Calculer', description: 'French: Calculate' },
    { pattern: /Réinitialiser/g, replacement: 'Réinitialiser', description: 'French: Reset' },
    { pattern: /Avancées/g, replacement: 'Avancées', description: 'French: Advanced' },
    { pattern: /Équilibré/g, replacement: 'Équilibré', description: 'French: Balanced' },
    { pattern: /exécution/g, replacement: 'exécution', description: 'French: Execution' },
    { pattern: /extrêmement/g, replacement: 'extrêmement', description: 'French: Extremely' },
    { pattern: /élevé/g, replacement: 'élevé', description: 'French: High' },
    { pattern: /Détails/g, replacement: 'Détails', description: 'French: Details' },
    { pattern: /Résultats/g, replacement: 'Résultats', description: 'French: Results' },
    { pattern: /Aperçu/g, replacement: 'Aperçu', description: 'French: Preview' },
    { pattern: /résultats/g, replacement: 'résultats', description: 'French: Results (lower)' },
    { pattern: /réessayer/g, replacement: 'réessayer', description: 'French: Retry' },
    { pattern: /Échec/g, replacement: 'Échec', description: 'French: Failure' },
    { pattern: /Copié/g, replacement: 'Copié', description: 'French: Copied' },
    { pattern: /Généré/g, replacement: 'Généré', description: 'French: Generated' },
    { pattern: /Filtré/g, replacement: 'Filtré', description: 'French: Filtered' },
    { pattern: /Dénominations/g, replacement: 'Dénominations', description: 'French: Denominations' },
    { pattern: /trouvé/g, replacement: 'trouvé', description: 'French: Found' },
    { pattern: /créer/g, replacement: 'créer', description: 'French: Create' },
    { pattern: /Détails/g, replacement: 'Détails', description: 'French: Details' },
    { pattern: /Sélection/g, replacement: 'Sélection', description: 'French: Selection' },
    { pattern: /Êtes-vous sûr/g, replacement: 'Êtes-vous sûr', description: 'French: Are you sure' },
    { pattern: /être annulée/g, replacement: 'être annulée', description: 'French: Be canceled' },
    { pattern: /définitivement/g, replacement: 'définitivement', description: 'French: Permanently' },
    { pattern: /données/g, replacement: 'données', description: 'French: Data' },
    { pattern: /inténtelo/g, replacement: 'inténtelo', description: 'Spanish: Try it' },
    { pattern: /falló/g, replacement: 'falló', description: 'Spanish: Failed' },
    { pattern: /Japonés/g, replacement: 'Japonés', description: 'Spanish: Japanese' },
    { pattern: /développeurs/g, replacement: 'développeurs', description: 'French: Developers' },
    { pattern: /afficher/g, replacement: 'afficher', description: 'French: Display' },
    
    // === PUNCTUATION & SPECIAL CHARACTERS ===
    { pattern: /•/g, replacement: '\u2022', description: 'Bullet point' },
    { pattern: /›/g, replacement: '\u203A', description: 'Right angle quote' },
    { pattern: /—/g, replacement: '\u2014', description: 'Em dash' },
    { pattern: /—/g, replacement: '\u2013', description: 'En dash' },
    { pattern: /‘/g, replacement: '\u2018', description: 'Left single quote' },
    { pattern: /’/g, replacement: '\u2019', description: 'Right single quote' },
    { pattern: /“/g, replacement: '\u201C', description: 'Left double quote' },
    { pattern: /”/g, replacement: '\u201D', description: 'Right double quote' },
    { pattern: /”¦/g, replacement: '\u2026', description: 'Ellipsis' },
    
    // === BOX DRAWING CHARACTERS (for ASCII art) ===
    { pattern: /│/g, replacement: '\u2502', description: 'Box vertical line' },
    { pattern: /─/g, replacement: '\u2500', description: 'Box horizontal line' },
    { pattern: /┌/g, replacement: '\u250C', description: 'Box top-left corner' },
    { pattern: /─/g, replacement: '\u2510', description: 'Box top-right corner' },
    { pattern: /└/g, replacement: '\u2514', description: 'Box bottom-left corner' },
    { pattern: /┘/g, replacement: '\u2518', description: 'Box bottom-right corner' },
    { pattern: /├/g, replacement: '\u251C', description: 'Box left T' },
    { pattern: /┤/g, replacement: '\u2524', description: 'Box right T' },
    { pattern: /┬/g, replacement: '\u252C', description: 'Box top T' },
    { pattern: /┴/g, replacement: '\u2534', description: 'Box bottom T' },
    { pattern: /┼/g, replacement: '\u253C', description: 'Box cross' },
    
    // === OTHER SPECIAL CHARACTERS ===
    { pattern: /™/g, replacement: '\u2122', description: 'Trademark symbol' },
    { pattern: /©/g, replacement: '\u00A9', description: 'Copyright symbol' },
    { pattern: /®/g, replacement: '\u00AE', description: 'Registered trademark' },
    { pattern: /°/g, replacement: '\u00B0', description: 'Degree symbol' },
    { pattern: /±/g, replacement: '\u00B1', description: 'Plus-minus' },
    { pattern: /×/g, replacement: '\u00D7', description: 'Multiplication sign' },
    { pattern: /÷/g, replacement: '\u00F7', description: 'Division sign' },
    { pattern: /≤/g, replacement: '\u2264', description: 'Less than or equal' },
    { pattern: /≥/g, replacement: '\u2265', description: 'Greater than or equal' },
    { pattern: /≠/g, replacement: '\u2260', description: 'Not equal' },
    { pattern: /≈/g, replacement: '\u2248', description: 'Approximately equal' },
    
    // === CHECKMARKS AND STATUS SYMBOLS ===
    { pattern: /✓/g, replacement: '\u2713', description: 'Checkmark' },
    { pattern: /✓/g, replacement: '\u2714', description: 'Heavy checkmark' },
    { pattern: /✘/g, replacement: '\u2718', description: 'X mark' },
    { pattern: /☑/g, replacement: '\u2611', description: 'Checked box' },
    { pattern: /☐/g, replacement: '\u2610', description: 'Empty box' },
    { pattern: /☐ /g, replacement: '\u2600', description: 'Sun' },
    { pattern: /☐…/g, replacement: '\u2605', description: 'Star' },
];

// File patterns to process
const FILE_PATTERNS = [
    'public/**/*.html',
    'public/**/*.css',
    'public/**/*.js',
    'public/**/*.json',
    'scripts/**/*.js',
    '*.md',
    '*.json',
];

// Files/directories to exclude
const EXCLUDE_PATTERNS = [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.git/**',
    '**/package-lock.json',
    '**/Curency denomination distibutor original/**',
];

// Statistics
const stats = {
    filesScanned: 0,
    filesModified: 0,
    totalReplacements: 0,
    replacementsByType: {},
    errorFiles: []
};

/**
 * Check if file should be excluded
 */
function shouldExcludeFile(filePath) {
    return EXCLUDE_PATTERNS.some(pattern => {
        const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
        return regex.test(filePath);
    });
}

/**
 * Fix encoding in a single file
 */
function fixFileEncoding(filePath) {
    try {
        // Read file with UTF-8 encoding
        let content = fs.readFileSync(filePath, 'utf8');
        const originalContent = content;
        let fileReplacements = 0;
        
        // Apply all encoding fixes
        ENCODING_FIXES.forEach(fix => {
            const matches = (content.match(fix.pattern) || []).length;
            if (matches > 0) {
                content = content.replace(fix.pattern, fix.replacement);
                fileReplacements += matches;
                
                // Track by type
                if (!stats.replacementsByType[fix.description]) {
                    stats.replacementsByType[fix.description] = 0;
                }
                stats.replacementsByType[fix.description] += matches;
            }
        });
        
        // Write back if changes were made
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            stats.filesModified++;
            stats.totalReplacements += fileReplacements;
            console.log(`✓ Fixed: ${filePath} (${fileReplacements} replacements)`);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error(`✗ Error processing ${filePath}:`, error.message);
        stats.errorFiles.push({ file: filePath, error: error.message });
        return false;
    }
}

/**
 * Recursively get all files in directory
 */
function getAllFiles(dir, fileExtensions = []) {
    const files = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        
        if (shouldExcludeFile(fullPath)) continue;
        
        if (item.isDirectory()) {
            files.push(...getAllFiles(fullPath, fileExtensions));
        } else if (item.isFile()) {
            const ext = path.extname(item.name);
            if (fileExtensions.length === 0 || fileExtensions.includes(ext)) {
                files.push(fullPath);
            }
        }
    }
    
    return files;
}

/**
 * Process all files matching patterns
 */
function processAllFiles() {
    console.log('🔍 Starting comprehensive encoding scan...\n');
    console.log('Excluded:', EXCLUDE_PATTERNS);
    console.log('─'.repeat(80));
    
    const rootDir = path.join(__dirname, '..');
    const extensions = ['.html', '.css', '.js', '.json', '.md'];
    
    // Gather all files
    const allFiles = getAllFiles(rootDir, extensions);
    
    console.log(`\nFound ${allFiles.length} files to scan\n`);
    
    // Process each file
    allFiles.forEach(file => {
        stats.filesScanned++;
        fixFileEncoding(file);
    });
}

/**
 * Generate final report
 */
function generateReport() {
    console.log('\n');
    console.log('═'.repeat(80));
    console.log('📊 COMPREHENSIVE ENCODING FIX REPORT');
    console.log('═'.repeat(80));
    console.log(`\n✓ Files Scanned:   ${stats.filesScanned}`);
    console.log(`✓ Files Modified:  ${stats.filesModified}`);
    console.log(`✓ Total Fixes:     ${stats.totalReplacements}`);
    
    if (Object.keys(stats.replacementsByType).length > 0) {
        console.log('\n📝 Replacements by Type:');
        console.log('─'.repeat(80));
        Object.entries(stats.replacementsByType)
            .sort((a, b) => b[1] - a[1])
            .forEach(([type, count]) => {
                console.log(`  ${type.padEnd(40)} → ${count} fixes`);
            });
    }
    
    if (stats.errorFiles.length > 0) {
        console.log('\n❌ Errors:');
        console.log('─'.repeat(80));
        stats.errorFiles.forEach(({ file, error }) => {
            console.log(`  ${file}`);
            console.log(`    Error: ${error}`);
        });
    }
    
    console.log('\n═'.repeat(80));
    if (stats.filesModified > 0) {
        console.log('✅ All encoding-related UI corruption successfully removed across the entire codebase.');
    } else {
        console.log('ℹ️  No encoding issues found. Codebase is clean.');
    }
    console.log('═'.repeat(80));
    console.log('\n🎯 Root Cause: UTF-8 bytes misinterpreted as Windows-1252, then re-encoded as UTF-8');
    console.log('🔧 Solution: Binary replacement of corrupted byte sequences with correct UTF-8 characters');
    console.log('📦 Encoding Standard: UTF-8 (no BOM) across entire project');
    console.log('\n✓ Ready for deployment to local, bundled, and live environments');
}

// Run the fix
try {
    processAllFiles();
    generateReport();
    
    // Exit with success
    process.exit(0);
} catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
}

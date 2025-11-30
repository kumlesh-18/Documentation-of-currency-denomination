/**
 * Comprehensive Corruption Detection and Fix Script
 * Compares public/pages/*.html with pages copy/*.html reference files
 * Identifies and fixes all corrupted characters
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_PAGES = path.join(__dirname, '..', 'public', 'pages');
const REFERENCE_PAGES = path.join(__dirname, '..', 'pages copy');

const HTML_FILES = [
    'acceptance-criteria.html',
    'api-specifications.html',
    'backend-logic.html',
    'bulk-upload.html',
    'calculation-engine.html',
    'core-features.html',
    'data-models.html',
    'dependencies.html',
    'deployment.html',
    'error-handling.html',
    'executive-summary.html',
    'future-enhancements.html',
    'known-issues.html',
    'multi-language.html',
    'ocr-system.html',
    'performance.html',
    'project-overview.html',
    'screenshots.html',
    'smart-defaults.html',
    'system-architecture.html',
    'testing.html',
    'ui-ux-requirements.html'
];

// Known corruption patterns to detect
const CORRUPTION_PATTERNS = [
    /â"[ŒŒ€"‚¤""˜´¬¼€]/g,  // Box-drawing characters (┌─┐│├└┘)
    /â€[¢"—"'˜œ�"¦]/g,    // Punctuation
    /â–[¼²ª«¡]/g,         // Symbols
    /â—[†‡‹]/g,           // Diamonds/circles
    /à¤[\x80-\xFF]+/g,    // Hindi Devanagari corruption
    /Ã[§©¨ ´®»«¯¼¶¤]/g,   // Accented characters
    /Â[°±£¥©®]/g,        // Currency/symbols
    /â‚[¬¹]/g,           // Currency
    /ðŸ[\x80-\xFF]+/g,    // Emoji corruption
    /â˜['\x80-\xFF]/g,    // Checkbox corruption
];

let totalCorruptionFound = 0;
let totalFilesFixed = 0;
const corruptionReport = [];

console.log('╔════════════════════════════════════════════════════╗');
console.log('║  Comprehensive Corruption Detection & Fix Script   ║');
console.log('║  Reference: pages copy/ → Target: public/pages/   ║');
console.log('╚════════════════════════════════════════════════════╝\n');

function detectCorruption(content, filename) {
    const corruptions = [];
    
    CORRUPTION_PATTERNS.forEach((pattern, index) => {
        const matches = content.match(pattern);
        if (matches) {
            corruptions.push({
                pattern: pattern.source,
                count: matches.length,
                samples: [...new Set(matches)].slice(0, 5)
            });
        }
    });
    
    return corruptions;
}

function processFile(filename) {
    const publicPath = path.join(PUBLIC_PAGES, filename);
    const referencePath = path.join(REFERENCE_PAGES, filename);
    
    if (!fs.existsSync(referencePath)) {
        console.log(`⚠️  No reference file found for: ${filename}`);
        return;
    }
    
    try {
        // Read both files
        const publicContent = fs.readFileSync(publicPath, 'utf8');
        const referenceContent = fs.readFileSync(referencePath, 'utf8');
        
        // Detect corruption in public file
        const corruptions = detectCorruption(publicContent, filename);
        
        if (corruptions.length > 0) {
            const totalCount = corruptions.reduce((sum, c) => sum + c.count, 0);
            totalCorruptionFound += totalCount;
            totalFilesFixed++;
            
            console.log(`\n🔍 ${filename}`);
            console.log(`   Found ${totalCount} corrupted character(s):`);
            
            corruptions.forEach(corruption => {
                console.log(`   - Pattern: ${corruption.pattern}`);
                console.log(`     Count: ${corruption.count}`);
                console.log(`     Examples: ${corruption.samples.join(', ')}`);
            });
            
            // Copy reference content to public
            fs.writeFileSync(publicPath, referenceContent, 'utf8');
            console.log(`   ✅ Replaced with clean reference content`);
            
            corruptionReport.push({
                file: filename,
                corruptionCount: totalCount,
                patterns: corruptions
            });
        } else {
            console.log(`✓  ${filename} - No corruption detected`);
        }
        
    } catch (error) {
        console.error(`❌ Error processing ${filename}:`, error.message);
    }
}

// Process all files
console.log(`Processing ${HTML_FILES.length} HTML files...\n`);

HTML_FILES.forEach(file => {
    processFile(file);
});

// Summary Report
console.log('\n╔════════════════════════════════════════════════════╗');
console.log('║                  Summary Report                    ║');
console.log('╚════════════════════════════════════════════════════╝\n');

console.log(`Total files scanned: ${HTML_FILES.length}`);
console.log(`Files with corruption: ${totalFilesFixed}`);
console.log(`Total corruptions fixed: ${totalCorruptionFound}\n`);

if (corruptionReport.length > 0) {
    console.log('Detailed Corruption Report:');
    console.log('─'.repeat(60));
    
    corruptionReport.forEach(report => {
        console.log(`\n📄 ${report.file}`);
        console.log(`   Total corruptions: ${report.corruptionCount}`);
        report.patterns.forEach(p => {
            console.log(`   • ${p.pattern}: ${p.count} instances`);
        });
    });
    
    console.log('\n✅ All corrupted files have been replaced with clean reference versions!');
} else {
    console.log('✨ No corruption detected in any files!');
}

console.log('\n📝 Next steps:');
console.log('   1. Review the changes in git diff');
console.log('   2. Test the files in a browser');
console.log('   3. Commit the fixes to the repository');

process.exit(0);

/**
 * Fix complete-codebase.html corruption
 * Handles arrows, box-drawing, checkmarks, and other symbols
 */

const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, '..', 'public', 'pages', 'complete-codebase.html');

// Comprehensive corruption mappings
const FIXES = [
    // Arrows
    ['â†'', '→'],
    ['â†"', '↓'],
    ['â†�', '↑'],
    ['â†�', '←'],
    
    // Box-drawing characters
    ['â"Œ', '┌'],
    ['â"€', '─'],
    ['â"', '┐'],
    ['â"‚', '│'],
    ['â"¤', '├'],
    ['â"œ', '├'],
    ['â""', '└'],
    ['â"˜', '┘'],
    ['â"´', '┴'],
    ['â"¬', '┬'],
    ['â"¼', '┼'],
    
    // Checkmarks and crosses
    ['âœ"', '✓'],
    ['âœ"', '✔'],
    ['âœ—', '✗'],
    ['âœ˜', '✘'],
    
    // Other symbols
    ['â–¼', '▼'],
    ['â–²', '▲'],
    ['â˜', '☐'],
    ['â˜'', '☑'],
    ['â€¢', '•'],
    ['Â°', '°'],
];

console.log('╔════════════════════════════════════════════════════╗');
console.log('║  Fixing complete-codebase.html Corruption         ║');
console.log('╚════════════════════════════════════════════════════╝\n');

try {
    // Read file
    let content = fs.readFileSync(FILE_PATH, 'utf8');
    const originalContent = content;
    let totalReplacements = 0;
    const replacementDetails = [];
    
    // Apply all fixes
    FIXES.forEach(([corrupted, correct]) => {
        const regex = new RegExp(corrupted.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const matches = (content.match(regex) || []).length;
        
        if (matches > 0) {
            content = content.replace(regex, correct);
            totalReplacements += matches;
            replacementDetails.push({
                from: corrupted,
                to: correct,
                count: matches
            });
            console.log(`✓ Replaced '${corrupted}' → '${correct}' (${matches} times)`);
        }
    });
    
    if (content !== originalContent) {
        // Write fixed content
        fs.writeFileSync(FILE_PATH, content, 'utf8');
        
        console.log('\n╔════════════════════════════════════════════════════╗');
        console.log('║                Summary Report                      ║');
        console.log('╚════════════════════════════════════════════════════╝\n');
        
        console.log(`Total replacements: ${totalReplacements}`);
        console.log(`Unique corruption types fixed: ${replacementDetails.length}\n`);
        
        console.log('Replacement breakdown:');
        replacementDetails.forEach(detail => {
            console.log(`  ${detail.from} → ${detail.to}: ${detail.count}`);
        });
        
        console.log('\n✅ complete-codebase.html has been fixed!');
    } else {
        console.log('✨ No corruption found in complete-codebase.html');
    }
    
} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}

process.exit(0);

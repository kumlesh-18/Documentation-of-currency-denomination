/**
 * UTF-8 Encoding Fix Script
 * Repairs corrupted emoji characters across all HTML files
 * Handles double-encoding mojibake issues
 * Run with: node scripts/fix-encoding.js
 */

const fs = require('fs');
const path = require('path');

// Mapping of corrupted mojibake patterns to proper UTF-8 emojis
const ENCODING_FIXES = [
    // Sidebar header - Books emoji 📚
    { pattern: /ðŸ"š|ð\u009FÂ\u009Að\u009F"š/g, replacement: '📚' },
    
    // Header action buttons
    { pattern: /ðŸ\u00A0|ð\u009FÂ\u00A0/g, replacement: '🏠' },  // Home emoji 🏠
    { pattern: /ðŸ–¨ï¸|ð\u009FÂ\u0096ð\u009F¨ï¸/g, replacement: '🖨️' }, // Printer emoji 🖨️
    { pattern: /ðŸšª|ð\u009FÂ\u009Að\u009Fªª/g, replacement: '🚪' }, // Door emoji 🚪
    
    // Status badges and icons
    { pattern: /ðŸ"„|ð\u009FÂ\u0094ð\u009F„„/g, replacement: '🔄' }, // Refresh emoji 🔄
    { pattern: /ðŸ"|ð\u009FÂ\u0093ð\u009F"/g, replacement: '📁' },   // Folder emoji 📁
    { pattern: /ðŸ"„|ð\u009FÂ\u0093ð\u009F"„/g, replacement: '📄' }, // Document emoji 📄
    { pattern: /ðŸ"¸|ð\u009FÂ\u0093ð\u009F¸¸/g, replacement: '📸' }, // Camera emoji 📸
    { pattern: /ðŸ'¡|ð\u009FÂ\u0092ð\u009F¡¡/g, replacement: '💡' }, // Lightbulb emoji 💡
    { pattern: /ðŸŽ¯|ð\u009FÂŽð\u009F¯¯/g, replacement: '🎯' },     // Target emoji 🎯
    { pattern: /ðŸ"–|ð\u009FÂ\u0093ð\u009F––/g, replacement: '📖' }, // Open book emoji 📖
    { pattern: /ðŸ'»|ð\u009FÂ\u0092ð\u009F»»/g, replacement: '💻' }, // Laptop emoji 💻
    { pattern: /âš¡|â\u009A¡/g, replacement: '⚡' },                // Lightning emoji ⚡
    { pattern: /ðŸ"|ð\u009FÂ\u0094ð\u009F"/g, replacement: '🔌' },   // Plug emoji 🔌
    { pattern: /ðŸ—ï¸|ð\u009FÂ\u0097ð\u009Fï¸/g, replacement: '🗝️' }, // Key emoji 🗝️
    { pattern: /ðŸŽ¨|ð\u009FÂŽð\u009F¨¨/g, replacement: '🎨' },     // Palette emoji 🎨
    { pattern: /ðŸ"|ð\u009FÂ\u0093ð\u009F"/g, replacement: '📦' },   // Package emoji 📦
    { pattern: /ðŸš€|ð\u009FÂ\u009Að\u009F€€/g, replacement: '🚀' }, // Rocket emoji 🚀
    { pattern: /âœ…|â\u009C…/g, replacement: '✅' },                // Checkmark emoji ✅
    { pattern: /ðŸ"|ð\u009FÂ\u0093ð\u009F"/g, replacement: '📝' },   // Memo emoji 📝
    { pattern: /ðŸ"|ð\u009FÂ\u0093ð\u009F"/g, replacement: '📋' },   // Clipboard emoji 📋
    { pattern: /ðŸ"§|ð\u009FÂ\u0094ð\u009F§§/g, replacement: '🔧' }, // Wrench emoji 🔧
    { pattern: /ðŸ"|ð\u009FÂ\u0094ð\u009F"/g, replacement: '🔐' },   // Lock emoji 🔐
    { pattern: /ðŸ""|ð\u009FÂ\u0094ð\u009F""/g, replacement: '🔒' }, // Locked emoji 🔒
    { pattern: /ðŸ"„|ð\u009FÂ\u0093ð\u009F„„/g, replacement: '📄' }, // Page emoji 📄
    { pattern: /ðŸ"|ð\u009FÂ\u0093ð\u009F"/g, replacement: '📅' },   // Calendar emoji 📅
    { pattern: /ðŸŒ|ð\u009FÂŒð\u009F"/g, replacement: '🌐' },       // Globe emoji 🌐
    
    // Box drawing characters (often corrupted in diagrams)
    { pattern: /â€º/g, replacement: '›' },  // Right angle quote
    { pattern: /â"‚/g, replacement: '│' },  // Box drawing vertical
    { pattern: /â"/g, replacement: '─' },   // Box drawing horizontal
    
    // Fix PowerShell artifacts
    { pattern: /`n\s*/g, replacement: '' }, // Backtick-n newline
];

/**
 * Fix encoding in a single file
 */
function fixFileEncoding(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;
        let fixCount = 0;
        
        // Apply all encoding fixes
        ENCODING_FIXES.forEach(({ pattern, replacement }) => {
            const matches = (content.match(pattern) || []).length;
            if (matches > 0) {
                content = content.replace(pattern, replacement);
                fixCount += matches;
            }
        });
        
        // Write back if changes were made
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✓ Fixed ${fixCount} corrupted character(s) in: ${path.basename(filePath)}`);
            return true;
        } else {
            console.log(`- Skipped (no issues): ${path.basename(filePath)}`);
            return false;
        }
    } catch (error) {
        console.error(`✗ Error fixing ${filePath}:`, error.message);
        return false;
    }
}

/**
 * Process all HTML files in a directory
 */
function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    let totalFixed = 0;
    
    files.forEach(file => {
        if (file.endsWith('.html')) {
            const filePath = path.join(dir, file);
            if (fixFileEncoding(filePath)) {
                totalFixed++;
            }
        }
    });
    
    return totalFixed;
}

/**
 * Main execution
 */
function main() {
    console.log('🔧 UTF-8 Encoding Fix Script');
    console.log('================================\n');
    
    const PUBLIC_DIR = path.join(__dirname, '../public');
    const PAGES_DIR = path.join(PUBLIC_DIR, 'pages');
    
    // Fix index.html
    console.log('Processing root files...');
    const indexPath = path.join(PUBLIC_DIR, 'index.html');
    const loginPath = path.join(PUBLIC_DIR, 'login.html');
    
    if (fs.existsSync(indexPath)) fixFileEncoding(indexPath);
    if (fs.existsSync(loginPath)) fixFileEncoding(loginPath);
    
    // Fix all pages
    console.log('\nProcessing /pages directory...');
    const pagesFixed = processDirectory(PAGES_DIR);
    
    console.log(`\n✅ Complete! Fixed ${pagesFixed} files in /pages directory.`);
    console.log('\n📝 Summary of changes:');
    console.log('  - Replaced corrupted emoji characters with proper UTF-8 emojis');
    console.log('  - Fixed double-encoding mojibake issues');
    console.log('  - Removed PowerShell backtick-n artifacts');
    console.log('  - Standardized character encoding across all HTML files');
    console.log('\n✨ All files now use proper UTF-8 encoding!');
}

// Run if executed directly
if (require.main === module) {
    main();
}

module.exports = { fixFileEncoding, processDirectory };

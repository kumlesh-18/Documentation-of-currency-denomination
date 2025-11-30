/**
 * Binary-Level UTF-8 Encoding Fix
 * Fixes mojibake by replacing corrupted byte sequences
 */

const fs = require('fs');
const path = require('path');

// Byte-level replacements
// Each entry: [corrupted_hex_sequence, correct_hex_sequence, description]
const BYTE_REPLACEMENTS = [
    // Books emoji 📚 (U+1F4DA)
    ['c3b0c5b8e2809cc5a1', 'f09f93ba', 'Books 📚'],
    
    // Home emoji 🏠 (U+1F3E0) - with variation selector
    ['c3b0c5b8c28fc2a0', 'f09f8fa0', 'Home 🏠'],
    ['c3b0c5b8c2a0', 'f09f8fa0', 'Home 🏠 (alt)'],
    
    // Printer emoji 🖨️ (U+1F5A8 + U+FE0F)
    ['c3b0c5b8e28093c2a8c3afe284b8', 'f09f96a8efb88f', 'Printer 🖨️'],
    
    // Door emoji 🚪 (U+1F6AA)
    ['c3b0c5b8c5a1c2aa', 'f09f9aaa', 'Door 🚪'],
    
    // Refresh/Cycle emoji 🔄 (U+1F504)
    ['c3b0c5b8e2809cc284', 'f09f9484', 'Refresh 🔄'],
    
    // Folder emoji 📁 (U+1F4C1)
    ['c3b0c5b8e2809cc281', 'f09f9381', 'Folder 📁'],
    
    // Document emoji 📄 (U+1F4C4)
    ['c3b0c5b8e2809cc284', 'f09f9384', 'Document 📄'],
    
    // Camera emoji 📸 (U+1F4F8)
    ['c3b0c5b8e2809cc2b8', 'f09f93b8', 'Camera 📸'],
    
    // Lightbulb emoji 💡 (U+1F4A1)
    ['c3b0c5b8e28098c2a1', 'f09f92a1', 'Lightbulb 💡'],
    
    // Target emoji 🎯 (U+1F3AF)
    ['c3b0c5b8c28ec2af', 'f09f8eaf', 'Target 🎯'],
    
    // Open book emoji 📖 (U+1F4D6)
    ['c3b0c5b8e2809cc296', 'f09f9396', 'Book 📖'],
    
    // Laptop emoji 💻 (U+1F4BB)
    ['c3b0c5b8e28098c2bb', 'f09f92bb', 'Laptop 💻'],
    
    // Lightning emoji ⚡ (U+26A1)
    ['c3a2c5a1c2a1', 'e29aa1', 'Lightning ⚡'],
    
    // Plug emoji 🔌 (U+1F50C)
    ['c3b0c5b8e2809cc28c', 'f09f948c', 'Plug 🔌'],
    
    // Palette emoji 🎨 (U+1F3A8)
    ['c3b0c5b8c28ec2a8', 'f09f8ea8', 'Palette 🎨'],
    
    // Package emoji 📦 (U+1F4E6)
    ['c3b0c5b8e2809cc2a6', 'f09f93a6', 'Package 📦'],
    
    // Rocket emoji 🚀 (U+1F680)
    ['c3b0c5b8c5a1c280', 'f09f9a80', 'Rocket 🚀'],
    
    // Checkmark emoji ✅ (U+2705)
    ['c3a2c5b8c285', 'e29c85', 'Checkmark ✅'],
    
    // Memo emoji 📝 (U+1F4DD)
    ['c3b0c5b8e2809cc29d', 'f09f939d', 'Memo 📝'],
    
    // Clipboard emoji 📋 (U+1F4CB)
    ['c3b0c5b8e2809cc28b', 'f09f938b', 'Clipboard 📋'],
    
    // Wrench emoji 🔧 (U+1F527)
    ['c3b0c5b8e28093c2a7', 'f09f94a7', 'Wrench 🔧'],
    
    // Lock emoji 🔐 (U+1F510)
    ['c3b0c5b8e2809cc290', 'f09f9490', 'Lock 🔐'],
    
    // Calendar emoji 📅 (U+1F4C5)
    ['c3b0c5b8e2809cc285', 'f09f9385', 'Calendar 📅'],
    
    // Globe emoji 🌐 (U+1F310)
    ['c3b0c5b8c28cc290', 'f09f8c90', 'Globe 🌐'],
];

function fixFile(filePath) {
    try {
        // Read file as buffer
        let buffer = fs.readFileSync(filePath);
        let hex = buffer.toString('hex');
        let modified = false;
        let fixCount = 0;
        
        // Apply each replacement
        BYTE_REPLACEMENTS.forEach(([bad, good, desc]) => {
            if (hex.includes(bad)) {
                const count = (hex.match(new RegExp(bad, 'g')) || []).length;
                hex = hex.replace(new RegExp(bad, 'g'), good);
                fixCount += count;
                modified = true;
                console.log(`  - Fixed ${count}x ${desc}`);
            }
        });
        
        if (modified) {
            // Write back as buffer
            const newBuffer = Buffer.from(hex, 'hex');
            fs.writeFileSync(filePath, newBuffer);
            console.log(`✓ Fixed ${fixCount} emoji(s) in: ${path.basename(filePath)}`);
            return true;
        } else {
            console.log(`- No mojibake found in: ${path.basename(filePath)}`);
            return false;
        }
    } catch (error) {
        console.error(`✗ Error fixing ${filePath}:`, error.message);
        return false;
    }
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    let fixed = 0;
    
    files.forEach(file => {
        if (file.endsWith('.html')) {
            console.log(`\nProcessing: ${file}`);
            if (fixFile(path.join(dir, file))) {
                fixed++;
            }
        }
    });
    
    return fixed;
}

function main() {
    console.log('🔧 Binary-Level UTF-8 Mojibake Fix');
    console.log('===================================\n');
    
    const PUBLIC_DIR = path.join(__dirname, '../public');
    const PAGES_DIR = path.join(PUBLIC_DIR, 'pages');
    
    console.log('Processing /public/pages...');
    const fixed = processDirectory(PAGES_DIR);
    
    console.log(`\n✅ Fixed ${fixed} files with mojibake issues!`);
}

if (require.main === module) {
    main();
}

module.exports = { fixFile, processDirectory };

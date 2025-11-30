/**
 * Replace Emoji Icons with SVG Icons for Better Cross-Browser Support
 * Emojis can render differently across operating systems and browsers
 * SVG icons provide consistent, professional appearance
 */

const fs = require('fs');
const path = require('path');

// SVG icon definitions (inline, no external dependencies)
const SVG_ICONS = {
    home: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
    print: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>',
    logout: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>',
    books: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>'
};

// Replacement patterns
const REPLACEMENTS = [
    {
        // Home button
        pattern: /<a href="\.\.\/index\.html" class="action-link">🏠 Home<\/a>/g,
        replacement: `<a href="../index.html" class="action-link">${SVG_ICONS.home} Home</a>`
    },
    {
        // Print button
        pattern: /<a href="javascript:window\.print\(\)" class="action-link">🖨️ Print<\/a>/g,
        replacement: `<a href="javascript:window.print()" class="action-link">${SVG_ICONS.print} Print</a>`
    },
    {
        // Logout button
        pattern: /<a onclick="performLogout\(\)" href="#" class="action-link">🚪 Logout<\/a>/g,
        replacement: `<a onclick="performLogout()" href="#" class="action-link">${SVG_ICONS.logout} Logout</a>`
    },
    {
        // Sidebar header
        pattern: /<h2>📚 Documentation<\/h2>/g,
        replacement: `<h2>${SVG_ICONS.books} Documentation</h2>`
    }
];

function replaceSVG(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        let changeCount = 0;
        
        REPLACEMENTS.forEach(({ pattern, replacement }) => {
            if (pattern.test(content)) {
                const matches = (content.match(pattern) || []).length;
                content = content.replace(pattern, replacement);
                changeCount += matches;
                modified = true;
            }
        });
        
        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✓ Replaced ${changeCount} emoji(s) with SVG in: ${path.basename(filePath)}`);
            return true;
        } else {
            console.log(`- No emojis to replace in: ${path.basename(filePath)}`);
            return false;
        }
    } catch (error) {
        console.error(`✗ Error: ${error.message}`);
        return false;
    }
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    let fixed = 0;
    
    files.forEach(file => {
        if (file.endsWith('.html')) {
            if (replaceSVG(path.join(dir, file))) {
                fixed++;
            }
        }
    });
    
    return fixed;
}

function main() {
    console.log('🎨 Emoji to SVG Icon Replacement');
    console.log('==================================\n');
    
    const PUBLIC_DIR = path.join(__dirname, '../public');
    const PAGES_DIR = path.join(PUBLIC_DIR, 'pages');
    
    console.log('Processing pages...');
    const fixed = processDirectory(PAGES_DIR);
    
    console.log(`\n✅ Replaced emojis with SVG icons in ${fixed} files!`);
    console.log('\n📝 Benefits:');
    console.log('  - Consistent rendering across all browsers and OS');
    console.log('  - Professional appearance');
    console.log('  - Scalable (vector graphics)');
    console.log('  - Color matches text (currentColor)');
}

if (require.main === module) {
    main();
}

module.exports = { replaceSVG, processDirectory };

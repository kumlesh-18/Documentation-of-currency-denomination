/**
 * Batch Path Updater for GitHub Pages Deployment
 * Updates all HTML files to use relative paths instead of absolute paths
 * Run this script with Node.js before deploying to GitHub Pages
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '../public');
const PAGES_DIR = path.join(PUBLIC_DIR, 'pages');

// Replacements to make
const REPLACEMENTS = [
    // CSS links
    { from: 'href="/css/', to: 'href="../css/' },
    { from: 'href="/assets/', to: 'href="../assets/' },
    
    // JS script tags
    { from: 'src="/js/', to: 'src="../js/' },
    
    // Navigation links - from /index.html to ../index.html
    { from: 'href="/index.html"', to: 'href="../index.html"' },
    
    // Navigation links - from /pages/ to ./
    { from: 'href="/pages/', to: 'href="./' },
    
    // Logout links - from /auth/logout to logout handler
    { from: 'href="/auth/logout"', to: 'onclick="performLogout()" href="#"' },
    
    // API calls (for codebase.html)
    { from: 'fetch(\'/api/', to: 'fetch(\'../api/' }
];

// Auth scripts to add before </body>
const AUTH_SCRIPTS = `    <script src="../js/auth-guard.js"></script>
    <script src="../js/auth-logout.js"></script>
`;

/**
 * Update a single HTML file
 */
function updateFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        // Apply all replacements
        REPLACEMENTS.forEach(({ from, to }) => {
            if (content.includes(from)) {
                content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
                modified = true;
            }
        });
        
        // Add auth scripts if not already present
        if (!content.includes('auth-guard.js')) {
            content = content.replace('</body>', AUTH_SCRIPTS + '</body>');
            modified = true;
        }
        
        // Remove old auth-check.js references if they exist
        if (content.includes('auth-check.js')) {
            content = content.replace(/<script src="[^"]*auth-check\.js"><\/script>\s*/g, '');
            modified = true;
        }
        
        // Write back if modified
        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✓ Updated: ${path.basename(filePath)}`);
            return true;
        } else {
            console.log(`- Skipped: ${path.basename(filePath)} (no changes needed)`);
            return false;
        }
    } catch (error) {
        console.error(`✗ Error updating ${filePath}:`, error.message);
        return false;
    }
}

/**
 * Process all HTML files in a directory
 */
function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    let updatedCount = 0;
    
    files.forEach(file => {
        if (file.endsWith('.html')) {
            const filePath = path.join(dir, file);
            if (updateFile(filePath)) {
                updatedCount++;
            }
        }
    });
    
    return updatedCount;
}

/**
 * Main execution
 */
function main() {
    console.log('🔧 GitHub Pages Path Updater');
    console.log('================================\n');
    
    // Update pages directory
    console.log('Processing /pages directory...');
    const pagesUpdated = processDirectory(PAGES_DIR);
    
    console.log(`\n✅ Complete! Updated ${pagesUpdated} files.`);
    console.log('\n📝 Summary of changes:');
    console.log('  - Converted absolute paths (/css/, /js/) to relative paths (../css/, ../js/)');
    console.log('  - Updated navigation links to use relative paths');
    console.log('  - Added auth-guard.js and auth-logout.js to all pages');
    console.log('  - Updated logout links to use client-side handler');
    console.log('\n✨ Your site is now ready for GitHub Pages deployment!');
}

// Run if executed directly
if (require.main === module) {
    main();
}

module.exports = { updateFile, processDirectory };

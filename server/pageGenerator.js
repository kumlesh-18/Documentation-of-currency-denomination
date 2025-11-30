const fs = require('fs').promises;
const path = require('path');

// Page template function
function createPageHTML(title, breadcrumb, content, prev, next) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex, nofollow">
    <title>${title} - Currency Denomination Documentation</title>
    <link rel="stylesheet" href="/css/styles.css">
</head>
<body>
    <div class="app-container">
        <!-- Sidebar Navigation -->
        <nav class="sidebar" id="sidebar">
            <div class="sidebar-header">
                <h2>📚 Documentation</h2>
                <p style="font-size: 0.75rem; color: rgba(255,255,255,0.6); margin-top: 0.5rem;">v1.0.0</p>
            </div>
            
            <div class="sidebar-nav">
                <div class="nav-section">
                    <div class="nav-section-title">Overview</div>
                    <ul class="nav-links">
                        <li><a href="/index.html">Home</a></li>
                        <li><a href="/pages/executive-summary.html">Executive Summary</a></li>
                        <li><a href="/pages/project-overview.html">Project Overview</a></li>
                        <li><a href="/pages/codebase.html">Browse Codebase (Live)</a></li>
                    </ul>
                </div>

                <div class="nav-section">
                    <div class="nav-section-title">Architecture</div>
                    <ul class="nav-links">
                        <li><a href="/pages/system-architecture.html">System Architecture</a></li>
                        <li><a href="/pages/core-features.html">Core Features</a></li>
                        <li><a href="/pages/ui-ux-requirements.html">UI/UX Requirements</a></li>
                    </ul>
                </div>

                <div class="nav-section">
                    <div class="nav-section-title">Implementation</div>
                    <ul class="nav-links">
                        <li><a href="/pages/backend-logic.html">Backend Logic</a></li>
                        <li><a href="/pages/bulk-upload.html">Bulk Upload System</a></li>
                        <li><a href="/pages/ocr-system.html">OCR System</a></li>
                        <li><a href="/pages/smart-defaults.html">Smart Defaults</a></li>
                    </ul>
                </div>

                <div class="nav-section">
                    <div class="nav-section-title">Technical Details</div>
                    <ul class="nav-links">
                        <li><a href="/pages/multi-language.html">Multi-Language Support</a></li>
                        <li><a href="/pages/data-models.html">Data Models & Database</a></li>
                        <li><a href="/pages/api-specifications.html">API Specifications</a></li>
                        <li><a href="/pages/calculation-engine.html">Calculation Engine</a></li>
                    </ul>
                </div>

                <div class="nav-section">
                    <div class="nav-section-title">Operations</div>
                    <ul class="nav-links">
                        <li><a href="/pages/error-handling.html">Error Handling</a></li>
                        <li><a href="/pages/complete-codebase.html">Complete Codebase (Static)</a></li>
                        <li><a href="/pages/dependencies.html">Dependencies & Installation</a></li>
                        <li><a href="/pages/testing.html">Testing & QA</a></li>
                        <li><a href="/pages/deployment.html">Deployment</a></li>
                        <li><a href="/pages/performance.html">Performance Requirements</a></li>
                    </ul>
                </div>

                <div class="nav-section">
                    <div class="nav-section-title">Resources</div>
                    <ul class="nav-links">
                        <li><a href="/pages/known-issues.html">Known Issues & Fixes</a></li>
                        <li><a href="/pages/future-enhancements.html">Future Enhancements</a></li>
                        <li><a href="/pages/screenshots.html">Screenshots & Outputs</a></li>
                        <li><a href="/pages/acceptance-criteria.html">Acceptance Criteria</a></li>
                    </ul>
                </div>
            </div>
        </nav>

        <!-- Main Content -->
        <main class="main-content">
            <!-- Header -->
            <header class="page-header">
                <div class="header-content">
                    <div class="breadcrumbs">
                        <a href="/">Documentation</a>
                        <span>›</span>
                        <span>${breadcrumb}</span>
                    </div>
                    <div class="header-actions">
                        <a href="/" class="btn btn-secondary">Home</a>
                        <button class="btn btn-secondary" onclick="window.print()">Print</button>
                        <a href="/auth/logout" class="btn btn-logout">Logout</a>
                    </div>
                </div>
            </header>

            <!-- Article Content -->
            <article class="article-container">
                <div class="article-content">
                    ${content}
                </div>

                <!-- Navigation Footer -->
                <nav class="page-navigation">
                    ${prev ? `<a href="/pages/${prev}" class="nav-button nav-button-back">Previous</a>` : '<div></div>'}
                    <a href="/" class="nav-button nav-button-toc">Table of Contents</a>
                    ${next ? `<a href="/pages/${next}" class="nav-button nav-button-next">Next</a>` : '<div></div>'}
                </nav>
            </article>
        </main>
    </div>

    <script src="/js/navigation.js"></script>
</body>
</html>`;
}

// Convert markdown-like content to HTML
function convertToHTML(markdown) {
  let html = markdown;
  
  // Convert headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // Convert bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Convert italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Convert code blocks
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
  
  // Convert inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Convert lists
  html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  
  // Convert numbered lists
  html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
  
  // Convert paragraphs
  html = html.split('\n\n').map(para => {
    if (!para.startsWith('<') && para.trim()) {
      return `<p>${para}</p>`;
    }
    return para;
  }).join('\n');
  
  // Convert checkmarks
  html = html.replace(/✅/g, '<span class="badge badge-success">✅</span>');
  html = html.replace(/❌/g, '<span class="badge badge-danger">❌</span>');
  html = html.replace(/🔄/g, '<span class="badge badge-warning">🔄</span>');
  html = html.replace(/⏳/g, '<span class="badge badge-info">⏳</span>');
  
  return html;
}

console.log('Page generator ready. Use manually to create pages from documentation content.');
module.exports = { createPageHTML, convertToHTML };

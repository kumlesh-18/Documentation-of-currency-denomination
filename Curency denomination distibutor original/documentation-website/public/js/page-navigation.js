/**
 * Page Navigation Component
 * Modern horizontal navigation bar with Previous/Next buttons and page indicator
 * @version 2.0.0
 */

(function() {
  'use strict';

  // Page sequence configuration - defines the complete navigation flow
  const PAGE_SEQUENCE = [
    { path: '/', title: 'Home', label: 'Documentation Home' },
    { path: '/pages/executive-summary.html', title: 'Executive Summary', label: 'Executive Summary' },
    { path: '/pages/project-overview.html', title: 'Project Overview', label: 'Project Overview' },
    { path: '/pages/system-architecture.html', title: 'System Architecture', label: 'System Architecture' },
    { path: '/pages/core-features.html', title: 'Core Features', label: 'Core Features' },
    { path: '/pages/ui-ux-requirements.html', title: 'UI/UX Requirements', label: 'UI/UX Requirements' },
    { path: '/pages/backend-logic.html', title: 'Backend Logic', label: 'Backend Logic' },
    { path: '/pages/bulk-upload.html', title: 'Bulk Upload System', label: 'Bulk Upload System' },
    { path: '/pages/ocr-system.html', title: 'OCR System', label: 'OCR System' },
    { path: '/pages/smart-defaults.html', title: 'Smart Defaults', label: 'Smart Defaults' },
    { path: '/pages/multi-language.html', title: 'Multi-Language Support', label: 'Multi-Language Support' },
    { path: '/pages/data-models.html', title: 'Data Models & Database', label: 'Data Models & Database' },
    { path: '/pages/api-specifications.html', title: 'API Specifications', label: 'API Specifications' },
    { path: '/pages/calculation-engine.html', title: 'Calculation Engine', label: 'Calculation Engine' },
    { path: '/pages/error-handling.html', title: 'Error Handling', label: 'Error Handling' },
    { path: '/pages/dependencies.html', title: 'Dependencies & Installation', label: 'Dependencies & Installation' },
    { path: '/pages/testing.html', title: 'Testing & QA', label: 'Testing & QA' },
    { path: '/pages/deployment.html', title: 'Deployment', label: 'Deployment' },
    { path: '/pages/performance.html', title: 'Performance Optimization', label: 'Performance Optimization' },
    { path: '/pages/known-issues.html', title: 'Known Issues & Fixes', label: 'Known Issues & Fixes' },
    { path: '/pages/future-enhancements.html', title: 'Future Enhancements', label: 'Future Enhancements' },
    { path: '/pages/screenshots.html', title: 'Screenshots & Outputs', label: 'Screenshots & Outputs' },
    { path: '/pages/acceptance-criteria.html', title: 'Acceptance Criteria', label: 'Acceptance Criteria' }
  ];

  /**
   * Initialize the page navigation component
   */
  function initPageNavigation() {
    const currentPath = getCurrentPath();
    const currentIndex = findCurrentPageIndex(currentPath);
    
    if (currentIndex === -1) {
      console.warn('Current page not found in navigation sequence');
      return;
    }

    const navContainer = createNavigationBar(currentIndex);
    insertNavigationIntoDOM(navContainer);
    attachKeyboardNavigation(currentIndex);
  }

  /**
   * Get the current page path (normalized)
   */
  function getCurrentPath() {
    let path = window.location.pathname;
    
    // Normalize path
    if (path === '/index.html') {
      path = '/';
    }
    
    return path;
  }

  /**
   * Find the index of the current page in the sequence
   */
  function findCurrentPageIndex(path) {
    return PAGE_SEQUENCE.findIndex(page => page.path === path);
  }

  /**
   * Create the modern navigation bar with 3-part layout
   */
  function createNavigationBar(currentIndex) {
    const container = document.createElement('nav');
    container.className = 'page-navigation-bar';
    container.setAttribute('aria-label', 'Documentation page navigation');

    const prevPage = currentIndex > 0 ? PAGE_SEQUENCE[currentIndex - 1] : null;
    const nextPage = currentIndex < PAGE_SEQUENCE.length - 1 ? PAGE_SEQUENCE[currentIndex + 1] : null;

    // Left: Previous button
    if (prevPage) {
      container.appendChild(createNavigationButton('prev', prevPage));
    } else {
      container.appendChild(createButtonPlaceholder('prev'));
    }

    // Center: Page indicator
    container.appendChild(createPageIndicator(currentIndex));

    // Right: Next button
    if (nextPage) {
      container.appendChild(createNavigationButton('next', nextPage));
    } else {
      container.appendChild(createButtonPlaceholder('next'));
    }

    return container;
  }

  /**
   * Create a modern navigation button (Previous or Next)
   */
  function createNavigationButton(direction, page) {
    const button = document.createElement('a');
    button.href = page.path;
    button.className = `page-nav-btn page-nav-btn--${direction}`;
    button.setAttribute('role', 'button');
    button.setAttribute('aria-label', `${direction === 'prev' ? 'Go to previous page' : 'Go to next page'}: ${page.label}`);

    const icon = document.createElement('span');
    icon.className = 'page-nav-btn__icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = direction === 'prev' ? '◄' : '►';

    const text = document.createElement('span');
    text.className = 'page-nav-btn__text';
    text.textContent = direction === 'prev' ? 'Previous' : 'Next';

    // Arrange elements based on direction
    if (direction === 'prev') {
      button.appendChild(icon);
      button.appendChild(text);
    } else {
      button.appendChild(text);
      button.appendChild(icon);
    }

    // Keyboard interaction
    button.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        window.location.href = page.path;
      }
    });

    return button;
  }

  /**
   * Create an invisible placeholder to maintain layout when button is missing
   */
  function createButtonPlaceholder(direction) {
    const placeholder = document.createElement('div');
    placeholder.className = `page-nav-btn page-nav-btn--${direction} page-nav-btn--disabled`;
    placeholder.setAttribute('aria-hidden', 'true');
    return placeholder;
  }

  /**
   * Create the centered page indicator
   */
  function createPageIndicator(currentIndex) {
    const indicator = document.createElement('div');
    indicator.className = 'page-nav-indicator';
    
    const text = document.createElement('span');
    text.className = 'page-nav-indicator__text';
    text.textContent = `Page ${currentIndex + 1} of ${PAGE_SEQUENCE.length}`;
    text.setAttribute('aria-current', 'page');
    text.setAttribute('aria-label', `Current page: ${currentIndex + 1} of ${PAGE_SEQUENCE.length}`);

    indicator.appendChild(text);

    return indicator;
  }

  /**
   * Insert the navigation bar into the DOM
   */
  function insertNavigationIntoDOM(navBar) {
    const article = document.querySelector('.article-container article, .article-container, article');
    
    if (article) {
      article.appendChild(navBar);
    } else {
      console.error('Could not find suitable container for page navigation');
    }
  }

  /**
   * Attach keyboard shortcuts for navigation
   */
  function attachKeyboardNavigation(currentIndex) {
    document.addEventListener('keydown', (e) => {
      // Alt + Left Arrow = Previous page
      if (e.altKey && e.key === 'ArrowLeft' && currentIndex > 0) {
        e.preventDefault();
        window.location.href = PAGE_SEQUENCE[currentIndex - 1].path;
      }
      
      // Alt + Right Arrow = Next page
      if (e.altKey && e.key === 'ArrowRight' && currentIndex < PAGE_SEQUENCE.length - 1) {
        e.preventDefault();
        window.location.href = PAGE_SEQUENCE[currentIndex + 1].path;
      }
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPageNavigation);
  } else {
    initPageNavigation();
  }

})();

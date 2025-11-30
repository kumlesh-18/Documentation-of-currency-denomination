/**
 * Documentation Website - Enhanced Navigation System
 * Version 3.0 - Modern, Accessible, Responsive
 */

(function() {
    'use strict';

    // ========================================
    // Configuration
    // ========================================
    const CONFIG = {
        breakpoints: {
            mobile: 768,
            tablet: 1024
        },
        session: {
            timeout: 24 * 60 * 60 * 1000, // 24 hours
            checkInterval: 5 * 60 * 1000  // 5 minutes
        },
        animation: {
            duration: 250,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        }
    };

    // ========================================
    // State Management
    // ========================================
    const state = {
        isMobile: window.innerWidth <= CONFIG.breakpoints.mobile,
        sidebarOpen: false,
        lastActivity: Date.now(),
        currentPath: window.location.pathname
    };

    // ========================================
    // Active Link Highlighting
    // ========================================
    function highlightActiveLink() {
        const navLinks = document.querySelectorAll('.nav-links a, .sidebar-links a');
        
        navLinks.forEach(link => {
            const linkPath = new URL(link.href, window.location.origin).pathname;
            
            if (linkPath === state.currentPath) {
                link.classList.add('active');
                link.setAttribute('aria-current', 'page');
            } else {
                link.classList.remove('active');
                link.removeAttribute('aria-current');
            }
        });
    }

    // ========================================
    // Mobile Menu System
    // ========================================
    function initMobileMenu() {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        
        if (!sidebar || !mainContent) return;

        // Create mobile toggle button
        let toggleBtn = document.querySelector('.mobile-menu-toggle');
        
        if (!toggleBtn && state.isMobile) {
            toggleBtn = document.createElement('button');
            toggleBtn.className = 'mobile-menu-toggle';
            toggleBtn.setAttribute('aria-label', 'Toggle navigation menu');
            toggleBtn.setAttribute('aria-expanded', 'false');
            toggleBtn.innerHTML = '<span aria-hidden="true">☰</span>';
            document.body.appendChild(toggleBtn);

            // Create overlay
            const overlay = document.createElement('div');
            overlay.className = 'mobile-overlay';
            overlay.setAttribute('aria-hidden', 'true');
            document.body.appendChild(overlay);

            // Toggle menu
            toggleBtn.addEventListener('click', toggleMobileMenu);
            overlay.addEventListener('click', closeMobileMenu);
        }

        // Handle sidebar links on mobile
        if (state.isMobile) {
            const sidebarLinks = sidebar.querySelectorAll('a');
            sidebarLinks.forEach(link => {
                link.addEventListener('click', () => {
                    setTimeout(closeMobileMenu, 150);
                });
            });
        }
    }

    function toggleMobileMenu() {
        state.sidebarOpen = !state.sidebarOpen;
        updateMobileMenuState();
    }

    function closeMobileMenu() {
        state.sidebarOpen = false;
        updateMobileMenuState();
    }

    function updateMobileMenuState() {
        const sidebar = document.querySelector('.sidebar');
        const toggleBtn = document.querySelector('.mobile-menu-toggle');
        const overlay = document.querySelector('.mobile-overlay');

        if (!sidebar) return;

        if (state.sidebarOpen) {
            sidebar.classList.add('mobile-open');
            overlay?.classList.add('active');
            toggleBtn?.setAttribute('aria-expanded', 'true');
            toggleBtn && (toggleBtn.innerHTML = '<span aria-hidden="true">✕</span>');
            document.body.style.overflow = 'hidden';
        } else {
            sidebar.classList.remove('mobile-open');
            overlay?.classList.remove('active');
            toggleBtn?.setAttribute('aria-expanded', 'false');
            toggleBtn && (toggleBtn.innerHTML = '<span aria-hidden="true">☰</span>');
            document.body.style.overflow = '';
        }
    }

    // ========================================
    // Smooth Scroll for Anchor Links
    // ========================================
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href === '#') return;

                e.preventDefault();
                const target = document.querySelector(href);
                
                if (target) {
                    const headerOffset = 80;
                    const elementPosition = target.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });

                    // Update URL without page jump
                    history.pushState(null, null, href);
                    
                    // Focus for accessibility
                    target.setAttribute('tabindex', '-1');
                    target.focus();
                }
            });
        });
    }

    // ========================================
    // Code Block Copy Functionality
    // ========================================
    function initCodeCopy() {
        document.querySelectorAll('pre code').forEach((codeBlock) => {
            const pre = codeBlock.parentElement;
            if (!pre || pre.querySelector('.copy-code-btn')) return;

            const button = document.createElement('button');
            button.className = 'copy-code-btn';
            button.innerHTML = '<span aria-hidden="true">📋</span> Copy';
            button.setAttribute('aria-label', 'Copy code to clipboard');
            button.style.cssText = `
                position: absolute;
                top: 0.75rem;
                right: 0.75rem;
                padding: 0.5rem 1rem;
                background: rgba(255, 255, 255, 0.15);
                backdrop-filter: blur(10px);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 0.5rem;
                cursor: pointer;
                font-size: 0.75rem;
                font-weight: 600;
                opacity: 0;
                transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                font-family: 'Inter', sans-serif;
            `;

            pre.style.position = 'relative';
            pre.appendChild(button);

            pre.addEventListener('mouseenter', () => {
                button.style.opacity = '1';
            });

            pre.addEventListener('mouseleave', () => {
                if (!button.classList.contains('copied')) {
                    button.style.opacity = '0';
                }
            });

            button.addEventListener('click', async () => {
                try {
                    const code = codeBlock.textContent;
                    await navigator.clipboard.writeText(code);
                    
                    button.innerHTML = '<span aria-hidden="true">✓</span> Copied!';
                    button.classList.add('copied');
                    button.style.background = 'rgba(34, 197, 94, 0.8)';
                    
                    setTimeout(() => {
                        button.innerHTML = '<span aria-hidden="true">📋</span> Copy';
                        button.classList.remove('copied');
                        button.style.background = 'rgba(255, 255, 255, 0.15)';
                    }, 2000);
                } catch (err) {
                    console.error('Failed to copy code:', err);
                    button.innerHTML = '<span aria-hidden="true">✕</span> Error';
                    setTimeout(() => {
                        button.innerHTML = '<span aria-hidden="true">📋</span> Copy';
                    }, 2000);
                }
            });
        });
    }

    // ========================================
    // Table of Contents Generator
    // ========================================
    function generateTableOfContents() {
        const article = document.querySelector('.article-content');
        if (!article) return;

        const headings = article.querySelectorAll('h2, h3');
        if (headings.length < 4) return; // Only generate for pages with 4+ headings

        const tocContainer = document.createElement('nav');
        tocContainer.className = 'table-of-contents';
        tocContainer.setAttribute('aria-label', 'Table of Contents');
        tocContainer.style.cssText = `
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%);
            border: 2px solid rgba(59, 130, 246, 0.2);
            border-radius: 1rem;
            padding: 1.5rem 2rem;
            margin-bottom: 3rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        `;

        const tocTitle = document.createElement('h2');
        tocTitle.textContent = '📑 Table of Contents';
        tocTitle.style.cssText = 'margin-top: 0; font-size: 1.25rem; color: #1e40af; border: none; padding: 0;';
        tocContainer.appendChild(tocTitle);

        const tocList = document.createElement('ul');
        tocList.style.cssText = `
            list-style: none;
            margin: 1rem 0 0 0;
            padding: 0;
        `;

        headings.forEach((heading, index) => {
            const id = heading.id || `section-${index}`;
            heading.id = id;

            const li = document.createElement('li');
            li.style.cssText = `
                margin-bottom: 0.5rem;
                padding-left: ${heading.tagName === 'H3' ? '1.5rem' : '0'};
            `;

            const link = document.createElement('a');
            link.href = `#${id}`;
            link.textContent = heading.textContent.replace(/^[\d.]+\s*/, ''); // Remove numbering
            link.style.cssText = `
                color: ${heading.tagName === 'H2' ? '#2563eb' : '#64748b'};
                font-weight: ${heading.tagName === 'H2' ? '600' : '500'};
                font-size: ${heading.tagName === 'H2' ? '0.9375rem' : '0.875rem'};
            `;

            li.appendChild(link);
            tocList.appendChild(li);
        });

        tocContainer.appendChild(tocList);
        article.insertBefore(tocContainer, article.firstChild);
    }

    // ========================================
    // Session Management
    // ========================================
    function initSessionManagement() {
        const updateActivity = () => {
            state.lastActivity = Date.now();
        };

        document.addEventListener('mousemove', updateActivity, { passive: true });
        document.addEventListener('keypress', updateActivity, { passive: true });
        document.addEventListener('scroll', updateActivity, { passive: true });
        document.addEventListener('click', updateActivity, { passive: true });

        setInterval(() => {
            const inactive = Date.now() - state.lastActivity;
            if (inactive > CONFIG.session.timeout) {
                alert('Your session has expired due to inactivity. Please log in again.');
                window.location.href = '/auth/logout';
            }
        }, CONFIG.session.checkInterval);
    }

    // ========================================
    // Responsive Handling
    // ========================================
    function handleResize() {
        const wasMobile = state.isMobile;
        state.isMobile = window.innerWidth <= CONFIG.breakpoints.mobile;

        if (wasMobile !== state.isMobile) {
            if (!state.isMobile) {
                closeMobileMenu();
                // Remove mobile elements
                const toggleBtn = document.querySelector('.mobile-menu-toggle');
                const overlay = document.querySelector('.mobile-overlay');
                toggleBtn?.remove();
                overlay?.remove();
            } else {
                initMobileMenu();
            }
        }
    }

    // Debounce resize handler
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(handleResize, 150);
    });

    // ========================================
    // Keyboard Navigation
    // ========================================
    function initKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Escape key closes mobile menu
            if (e.key === 'Escape' && state.sidebarOpen) {
                closeMobileMenu();
            }

            // Ctrl/Cmd + K to focus search (if exists)
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.querySelector('input[type="search"]');
                searchInput?.focus();
            }
        });
    }

    // ========================================
    // Print Optimization
    // ========================================
    function initPrintOptimization() {
        window.addEventListener('beforeprint', () => {
            document.body.classList.add('printing');
            closeMobileMenu();
        });

        window.addEventListener('afterprint', () => {
            document.body.classList.remove('printing');
        });
    }

    // ========================================
    // Scroll Progress Indicator
    // ========================================
    function initScrollProgress() {
        const article = document.querySelector('.article-container');
        if (!article) return;

        const progressBar = document.createElement('div');
        progressBar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, #2563eb 0%, #06b6d4 50%, #10b981 100%);
            transform-origin: left;
            transform: scaleX(0);
            z-index: 9999;
            transition: transform 0.1s ease-out;
        `;
        document.body.appendChild(progressBar);

        window.addEventListener('scroll', () => {
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight - windowHeight;
            const scrolled = window.scrollY;
            const progress = scrolled / documentHeight;
            
            progressBar.style.transform = `scaleX(${Math.min(progress, 1)})`;
        }, { passive: true });
    }

    // ========================================
    // Initialization
    // ========================================
    function init() {
        console.log('📚 Documentation Navigation System v3.0 Initializing...');

        highlightActiveLink();
        initMobileMenu();
        initSmoothScroll();
        initCodeCopy();
        generateTableOfContents();
        initSessionManagement();
        initKeyboardNavigation();
        initPrintOptimization();
        initScrollProgress();

        console.log('✅ Documentation Navigation System Ready');
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose utilities globally if needed
    window.DocNavigation = {
        closeMobileMenu,
        toggleMobileMenu,
        highlightActiveLink
    };

})();


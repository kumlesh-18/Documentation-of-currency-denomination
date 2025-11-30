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
            tablet: 1024  // Matches CSS and responsive.js breakpoint
        },
        session: {
            timeout: 24 * 60 * 60 * 1000, // 24 hours
            checkInterval: 5 * 60 * 1000  // 5 minutes
        },
        animation: {
            duration: 250,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        },
        autoCollapse: {
            delay: 1500 // 1.5 seconds delay before auto-hiding sidebar
        }
    };

    // ========================================
    // State Management
    // ========================================
    const state = {
        isMobile: window.innerWidth <= CONFIG.breakpoints.mobile,
        sidebarOpen: false, // Mobile state
        sidebarCollapsed: false, // Desktop state
        autoCollapseTimer: null,
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
    // Desktop Sidebar Toggle
    // ========================================
    function initSidebarToggle() {
        // Create toggle button if it doesn't exist
        let toggleBtn = document.querySelector('.sidebar-toggle');
        if (!toggleBtn) {
            toggleBtn = document.createElement('button');
            toggleBtn.className = 'sidebar-toggle';
            toggleBtn.setAttribute('aria-label', 'Toggle Sidebar');
            toggleBtn.innerHTML = '<span aria-hidden="true">☰</span>';
            document.body.appendChild(toggleBtn);
        }

        // Load saved state
        try {
            const savedState = localStorage.getItem('sidebarCollapsed');
            if (savedState === 'true') {
                setSidebarState(true);
            }
        } catch (e) {
            console.warn('LocalStorage access failed:', e);
        }

        // Event Listener
        toggleBtn.addEventListener('click', () => {
            const isCollapsed = document.querySelector('.sidebar').classList.contains('collapsed');
            setSidebarState(!isCollapsed);
        });

        // Initial visibility check
        updateToggleVisibility();
    }

    function setSidebarState(collapsed) {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        const toggleBtn = document.querySelector('.sidebar-toggle');

        if (!sidebar || !mainContent || !toggleBtn) return;

        state.sidebarCollapsed = collapsed;

        if (collapsed) {
            sidebar.classList.add('collapsed');
            mainContent.classList.add('expanded');
            toggleBtn.classList.add('collapsed');
            toggleBtn.innerHTML = '<span aria-hidden="true">☰</span>';
            toggleBtn.setAttribute('aria-label', 'Expand Sidebar');
            try {
                localStorage.setItem('sidebarCollapsed', 'true');
            } catch (e) { console.warn('LocalStorage write failed:', e); }
            document.body.classList.add('sidebar-collapsed');
        } else {
            sidebar.classList.remove('collapsed');
            mainContent.classList.remove('expanded');
            toggleBtn.classList.remove('collapsed');
            toggleBtn.innerHTML = '<span aria-hidden="true">◀</span>';
            toggleBtn.setAttribute('aria-label', 'Collapse Sidebar');
            try {
                localStorage.setItem('sidebarCollapsed', 'false');
            } catch (e) { console.warn('LocalStorage write failed:', e); }
            document.body.classList.remove('sidebar-collapsed');
        }
    }

    function updateToggleVisibility() {
        const toggleBtn = document.querySelector('.sidebar-toggle');
        if (toggleBtn) {
            toggleBtn.style.display = state.isMobile ? 'none' : 'flex';
        }
    }

    // ========================================
    // Mobile Menu System (Mobile & Tablet)
    // ========================================
    function initMobileMenu() {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        
        if (!sidebar || !mainContent) return;
        
        // Get device type from ResponsiveSystem if available
        const device = window.ResponsiveSystem?.getDevice() || (state.isMobile ? 'mobile' : 'desktop');
        const isMobileOrTablet = device === 'mobile' || device === 'tablet' || state.isMobile;

        // Handle hamburger menu button clicks (from HTML)
        // Works on ALL devices - mobile/tablet use overlay, desktop/laptop toggle sidebar
        const hamburgerBtns = document.querySelectorAll('.hamburger-menu');
        hamburgerBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const device = window.ResponsiveSystem?.getDevice() || (state.isMobile ? 'mobile' : 'desktop');
                const isMobileOrTablet = device === 'mobile' || device === 'tablet' || state.isMobile;
                
                if (isMobileOrTablet) {
                    // Mobile/Tablet: Toggle overlay sidebar
                    toggleMobileMenu();
                } else {
                    // Desktop/Laptop: Toggle sidebar collapse
                    const sidebar = document.querySelector('.sidebar');
                    const isCollapsed = sidebar?.classList.contains('collapsed');
                    setSidebarState(!isCollapsed);
                }
            });
        });

        // Create mobile toggle button for mobile and tablet (dynamic creation)
        let toggleBtn = document.querySelector('.mobile-menu-toggle');
        
        if (!toggleBtn && isMobileOrTablet) {
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

        // Handle sidebar links on mobile and tablet - close menu after navigation
        if (isMobileOrTablet) {
            const sidebarLinks = sidebar.querySelectorAll('a');
            sidebarLinks.forEach(link => {
                // Remove old listeners to prevent duplicates
                const newLink = link.cloneNode(true);
                link.parentNode.replaceChild(newLink, link);
                
                newLink.addEventListener('click', () => {
                    // Auto-hide after navigation with slight delay
                    setTimeout(closeMobileMenu, CONFIG.autoCollapse.delay);
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
        const hamburgerBtns = document.querySelectorAll('.hamburger-menu');
        const overlay = document.querySelector('.mobile-overlay');

        if (!sidebar) return;

        if (state.sidebarOpen) {
            sidebar.classList.add('mobile-open');
            overlay?.classList.add('active');
            toggleBtn?.setAttribute('aria-expanded', 'true');
            toggleBtn && (toggleBtn.innerHTML = '<span aria-hidden="true">✕</span>');
            
            // Update all hamburger menu buttons
            hamburgerBtns.forEach(btn => {
                btn.classList.add('active');
                btn.setAttribute('aria-expanded', 'true');
            });
            
            document.body.style.overflow = 'hidden';
        } else {
            sidebar.classList.remove('mobile-open');
            overlay?.classList.remove('active');
            toggleBtn?.setAttribute('aria-expanded', 'false');
            toggleBtn && (toggleBtn.innerHTML = '<span aria-hidden="true">☰</span>');
            
            // Update all hamburger menu buttons
            hamburgerBtns.forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-expanded', 'false');
            });
            
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
        
        // Get current device from ResponsiveSystem if available
        const device = window.ResponsiveSystem?.getDevice() || (state.isMobile ? 'mobile' : 'desktop');
        const wasDesktopOrLaptop = !wasMobile;
        const isDesktopOrLaptop = device === 'desktop' || device === 'laptop';

        updateToggleVisibility();

        if (wasMobile !== state.isMobile) {
            if (!state.isMobile) {
                // Switching to Desktop/Laptop
                closeMobileMenu();
                // Remove mobile elements
                const toggleBtn = document.querySelector('.mobile-menu-toggle');
                const overlay = document.querySelector('.mobile-overlay');
                toggleBtn?.remove();
                overlay?.remove();
                
                // Restore desktop state
                const savedState = localStorage.getItem('sidebarCollapsed');
                if (savedState === 'true') {
                    setSidebarState(true);
                }
                
                // Re-initialize desktop-only features
                if (isDesktopOrLaptop) {
                    initAutoCollapse();
                    initEdgeDetection();
                }
            } else {
                // Switching to Mobile/Tablet
                initMobileMenu();
                // Clear any desktop timers
                if (state.autoCollapseTimer) {
                    clearTimeout(state.autoCollapseTimer);
                    state.autoCollapseTimer = null;
                }
                // Remove desktop-only elements
                const hotspot = document.querySelector('.sidebar-hotspot');
                hotspot?.remove();
                
                // Reset desktop specific classes to avoid conflicts
                const sidebar = document.querySelector('.sidebar');
                const mainContent = document.querySelector('.main-content');
                sidebar?.classList.remove('collapsed');
                sidebar?.classList.remove('peeking');
                mainContent?.classList.remove('expanded');
            }
        } else if (isDesktopOrLaptop !== wasDesktopOrLaptop) {
            // Device type changed within desktop range (e.g., laptop <-> desktop)
            // Re-initialize desktop features to ensure they're active
            initAutoCollapse();
            initEdgeDetection();
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
    // Edge Detection & Auto-Appear (Desktop Only)
    // ========================================
    function initEdgeDetection() {
        // Get device type from ResponsiveSystem if available
        const device = window.ResponsiveSystem?.getDevice() || (state.isMobile ? 'mobile' : 'desktop');
        
        // ONLY enable on desktop/laptop - disable on mobile and tablet
        if (device === 'mobile' || device === 'tablet' || state.isMobile) {
            // Remove hotspot if it exists
            const existingHotspot = document.querySelector('.sidebar-hotspot');
            if (existingHotspot) {
                existingHotspot.remove();
            }
            return;
        }

        // Create hotspot if it doesn't exist
        let hotspot = document.querySelector('.sidebar-hotspot');
        if (!hotspot) {
            hotspot = document.createElement('div');
            hotspot.className = 'sidebar-hotspot';
            document.body.appendChild(hotspot);
        }

        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;

        // Show sidebar on hover/touch of hotspot
        const startPeek = () => {
            if (state.sidebarCollapsed) {
                sidebar.classList.add('peeking');
                state.isPeeking = true;
            }
        };

        const endPeek = () => {
            sidebar.classList.remove('peeking');
            state.isPeeking = false;
        };

        hotspot.addEventListener('mouseenter', startPeek);
        
        // Hide when leaving sidebar (if peeking)
        sidebar.addEventListener('mouseleave', () => {
            if (state.isPeeking) {
                endPeek();
            }
        });
    }

    // ========================================
    // Auto-Collapse Sidebar Logic (Desktop/Laptop Only)
    // ========================================
    function initAutoCollapse() {
        // Get device type from ResponsiveSystem if available
        const device = window.ResponsiveSystem?.getDevice() || (state.isMobile ? 'mobile' : 'desktop');
        
        // ONLY enable on desktop/laptop - disable on mobile and tablet
        if (device === 'mobile' || device === 'tablet' || state.isMobile) {
            // Clear any existing timers
            if (state.autoCollapseTimer) {
                clearTimeout(state.autoCollapseTimer);
                state.autoCollapseTimer = null;
            }
            return;
        }

        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;

        // Helper to start collapse timer
        const startCollapseTimer = () => {
            if (state.autoCollapseTimer) clearTimeout(state.autoCollapseTimer);
            
            // Don't collapse if user is hovering
            if (sidebar.matches(':hover')) return;

            state.autoCollapseTimer = setTimeout(() => {
                if (!state.isMobile && !state.sidebarCollapsed) {
                    setSidebarState(true);
                }
            }, CONFIG.autoCollapse.delay);
        };

        // Helper to cancel timer
        const cancelCollapseTimer = () => {
            if (state.autoCollapseTimer) {
                clearTimeout(state.autoCollapseTimer);
                state.autoCollapseTimer = null;
            }
        };

        // 1. Check for pending collapse from cross-page navigation
        try {
            if (sessionStorage.getItem('doc_auto_collapse_pending')) {
                sessionStorage.removeItem('doc_auto_collapse_pending');
                // Small delay to allow initial render/hover check
                setTimeout(() => {
                    if (!sidebar.matches(':hover')) {
                        startCollapseTimer();
                    }
                }, 100);
            }
        } catch (e) {
            console.warn('SessionStorage access failed:', e);
        }

        // 2. Event Listeners for Links
        const links = sidebar.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                // If mobile, ignore (handled by initMobileMenu)
                if (state.isMobile) return;

                // If peeking, hide immediately on click
                if (state.isPeeking) {
                    sidebar.classList.remove('peeking');
                    state.isPeeking = false;
                    return;
                }

                // Determine if it's an anchor or new page
                const href = link.getAttribute('href');
                const isAnchor = href && href.startsWith('#');
                
                if (isAnchor) {
                    // For anchor links, start timer immediately (if not hovering, which is unlikely on click, 
                    // but mouseleave will catch it)
                    // Actually, we set a flag so mouseleave knows to start it
                    state.autoCollapsePending = true;
                } else {
                    // Mark for next page load
                    try {
                        sessionStorage.setItem('doc_auto_collapse_pending', 'true');
                    } catch (e) { console.warn('SessionStorage write failed:', e); }
                }
            });
        });

        // 3. Interaction Listeners (Reset/Cancel)
        sidebar.addEventListener('mouseenter', () => {
            cancelCollapseTimer();
            state.autoCollapsePending = false; // User returned, cancel pending intent
        });

        sidebar.addEventListener('mouseleave', () => {
            // If we have a pending intent (from anchor click) or just loaded with pending intent
            if (state.autoCollapsePending) {
                startCollapseTimer();
            }
        });
        
        sidebar.addEventListener('click', (e) => {
            // If clicking something that isn't a link (e.g. whitespace), cancel timer
            if (!e.target.closest('a')) {
                cancelCollapseTimer();
                state.autoCollapsePending = false;
            }
        });
    }

    // ========================================
    // Initialization
    // ========================================
    function safeExecute(name, fn) {
        try {
            fn();
        } catch (error) {
            console.warn(`⚠️ Failed to initialize ${name}:`, error);
        }
    }

    function init() {
        console.log('📚 Documentation Navigation System v3.1 Initializing...');

        safeExecute('Active Link Highlighting', highlightActiveLink);
        safeExecute('Mobile Menu', initMobileMenu);
        safeExecute('Sidebar Toggle', initSidebarToggle);
        safeExecute('Auto Collapse', initAutoCollapse);
        safeExecute('Edge Detection', initEdgeDetection);
        safeExecute('Smooth Scroll', initSmoothScroll);
        safeExecute('Code Copy', initCodeCopy);
        safeExecute('Table of Contents', generateTableOfContents);
        safeExecute('Session Management', initSessionManagement);
        safeExecute('Keyboard Navigation', initKeyboardNavigation);
        safeExecute('Print Optimization', initPrintOptimization);
        safeExecute('Scroll Progress', initScrollProgress);

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
        highlightActiveLink,
        setSidebarState
    };

})();


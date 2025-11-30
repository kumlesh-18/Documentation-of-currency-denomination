/**
 * Responsive Behavior System
 * Auto-detects device type and handles adaptive layout
 */

(function() {
    'use strict';

    // Breakpoint definitions
    const BREAKPOINTS = {
        mobile: 480,
        tablet: 768,
        laptop: 1280,
        desktop: Infinity
    };

    // Device state
    let currentDevice = null;
    let isTouch = false;
    let orientation = null;

    /**
     * Detect device type based on viewport width
     */
    function detectDevice() {
        const width = window.innerWidth;
        
        if (width <= BREAKPOINTS.mobile) return 'mobile';
        if (width <= BREAKPOINTS.tablet) return 'tablet';
        if (width <= BREAKPOINTS.laptop) return 'laptop';
        return 'desktop';
    }

    /**
     * Detect touch capability
     */
    function detectTouch() {
        return ('ontouchstart' in window) || 
               (navigator.maxTouchPoints > 0) || 
               (navigator.msMaxTouchPoints > 0);
    }

    /**
     * Detect orientation
     */
    function detectOrientation() {
        return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    }

    /**
     * Update body classes for device type
     */
    function updateDeviceClasses() {
        const device = detectDevice();
        const touch = detectTouch();
        const orient = detectOrientation();

        // Remove old device classes
        document.body.classList.remove('device-mobile', 'device-tablet', 'device-laptop', 'device-desktop');
        document.body.classList.remove('touch', 'no-touch');
        document.body.classList.remove('portrait', 'landscape');

        // Add new classes
        document.body.classList.add(`device-${device}`);
        document.body.classList.add(touch ? 'touch' : 'no-touch');
        document.body.classList.add(orient);

        // Update state
        if (currentDevice !== device) {
            currentDevice = device;
            document.body.setAttribute('data-device', device);
            
            // Trigger device change event
            window.dispatchEvent(new CustomEvent('devicechange', { 
                detail: { device, touch, orientation: orient } 
            }));
        }

        if (isTouch !== touch) {
            isTouch = touch;
        }

        if (orientation !== orient) {
            orientation = orient;
            window.dispatchEvent(new CustomEvent('orientationchange', { 
                detail: { orientation: orient } 
            }));
        }
    }

    /**
     * Mobile navigation toggle
     */
    function initMobileNav() {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;

        // Create hamburger button if it doesn't exist
        if (!document.getElementById('mobile-menu-toggle')) {
            const toggle = document.createElement('button');
            toggle.id = 'mobile-menu-toggle';
            toggle.className = 'mobile-menu-toggle';
            toggle.setAttribute('aria-label', 'Toggle navigation menu');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.innerHTML = `
                <span class="hamburger-line"></span>
                <span class="hamburger-line"></span>
                <span class="hamburger-line"></span>
            `;

            // Insert at beginning of body
            document.body.insertBefore(toggle, document.body.firstChild);

            // Toggle functionality
            toggle.addEventListener('click', function() {
                const isOpen = sidebar.classList.toggle('mobile-open');
                toggle.setAttribute('aria-expanded', isOpen);
                toggle.classList.toggle('active', isOpen);
                document.body.classList.toggle('nav-open', isOpen);
            });
        }

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', function(e) {
            if (currentDevice === 'mobile' || currentDevice === 'tablet') {
                if (!sidebar.contains(e.target) && 
                    !e.target.closest('#mobile-menu-toggle') &&
                    sidebar.classList.contains('mobile-open')) {
                    sidebar.classList.remove('mobile-open');
                    const toggle = document.getElementById('mobile-menu-toggle');
                    if (toggle) {
                        toggle.setAttribute('aria-expanded', 'false');
                        toggle.classList.remove('active');
                    }
                    document.body.classList.remove('nav-open');
                }
            }
        });

        // Close sidebar on nav link click (mobile only)
        sidebar.addEventListener('click', function(e) {
            if ((currentDevice === 'mobile' || currentDevice === 'tablet') && 
                e.target.tagName === 'A') {
                sidebar.classList.remove('mobile-open');
                const toggle = document.getElementById('mobile-menu-toggle');
                if (toggle) {
                    toggle.setAttribute('aria-expanded', 'false');
                    toggle.classList.remove('active');
                }
                document.body.classList.remove('nav-open');
            }
        });
    }

    /**
     * Adjust table responsiveness
     */
    function handleResponsiveTables() {
        const tables = document.querySelectorAll('table:not(.no-responsive)');
        
        tables.forEach(table => {
            if (!table.parentElement.classList.contains('table-wrapper')) {
                const wrapper = document.createElement('div');
                wrapper.className = 'table-wrapper';
                table.parentNode.insertBefore(wrapper, table);
                wrapper.appendChild(table);
            }
        });
    }

    /**
     * Handle viewport height for mobile browsers
     */
    function updateVH() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    /**
     * Debounce function for resize events
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Initialize responsive system
     */
    function init() {
        // Initial detection
        updateDeviceClasses();
        updateVH();
        initMobileNav();
        handleResponsiveTables();

        // Update on resize (debounced)
        const debouncedResize = debounce(() => {
            updateDeviceClasses();
            updateVH();
        }, 150);

        window.addEventListener('resize', debouncedResize);
        window.addEventListener('orientationchange', debouncedResize);

        // Re-check on DOM changes (for dynamically added tables)
        if (typeof MutationObserver !== 'undefined') {
            const observer = new MutationObserver(debounce(() => {
                handleResponsiveTables();
            }, 300));

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }

        // Performance optimization: reduce motion if requested
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.documentElement.style.setProperty('--transition-fast', '0ms');
            document.documentElement.style.setProperty('--transition-base', '0ms');
            document.documentElement.style.setProperty('--transition-slow', '0ms');
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Export API
    window.ResponsiveSystem = {
        getDevice: () => currentDevice,
        isTouch: () => isTouch,
        getOrientation: () => orientation,
        refresh: updateDeviceClasses
    };

})();

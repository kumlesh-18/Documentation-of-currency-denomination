/**
 * Client-Side Authentication Guard for Static Deployment
 * Enforces authentication on all protected pages
 * Compatible with GitHub Pages, Netlify, Vercel
 */

(function() {
    'use strict';
    
    // Configuration
    const AUTH_KEY = 'doc_auth_session';
    const LOGIN_PAGE = './login.html';
    
    /**
     * Check if user is authenticated
     * @returns {boolean} - True if valid session exists
     */
    function isAuthenticated() {
        try {
            const session = sessionStorage.getItem(AUTH_KEY);
            if (!session) return false;
            
            const sessionData = JSON.parse(session);
            
            // Check if session exists and hasn't expired
            if (!sessionData || !sessionData.authenticated || !sessionData.timestamp) {
                return false;
            }
            
            // Session expires after 24 hours (86400000 ms)
            const sessionAge = Date.now() - sessionData.timestamp;
            const MAX_AGE = 24 * 60 * 60 * 1000;
            
            if (sessionAge > MAX_AGE) {
                // Session expired - clear it
                sessionStorage.removeItem(AUTH_KEY);
                return false;
            }
            
            return true;
        } catch (error) {
            console.warn('Session validation failed:', error);
            return false;
        }
    }
    
    /**
     * Redirect to login page if not authenticated
     */
    function enforceAuth() {
        if (!isAuthenticated()) {
            // Store the attempted URL for redirect after login
            try {
                sessionStorage.setItem('doc_redirect_after_login', window.location.pathname);
            } catch (e) {
                console.warn('Failed to store redirect URL:', e);
            }
            
            // Redirect to login page
            window.location.replace(LOGIN_PAGE);
        }
    }
    
    /**
     * Initialize authentication guard
     * Only runs on pages other than login
     * Skips if running under server-side authentication (Express.js)
     */
    function init() {
        // Don't run on login page itself
        const currentPage = window.location.pathname;
        if (currentPage.includes('login.html') || currentPage.endsWith('login')) {
            return;
        }
        
        // Skip if running on development server (Express.js handles auth)
        // Detect by checking if we're on localhost with typical dev ports
        const isDevServer = window.location.hostname === 'localhost' && 
                           (window.location.port === '3000' || window.location.port === '5000');
        
        if (isDevServer) {
            console.log('[Auth Guard] Running under dev server - server-side auth active');
            return;
        }
        
        // Enforce authentication (for static hosting only)
        enforceAuth();
        
        // Re-check authentication when page becomes visible (tab switching)
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden) {
                enforceAuth();
            }
        });
        
        // Re-check on focus (window switching)
        window.addEventListener('focus', function() {
            enforceAuth();
        });
    }
    
    // Run immediately - before page renders
    init();
})();

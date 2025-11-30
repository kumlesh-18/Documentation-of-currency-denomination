/**
 * Authentication Logout Handler
 * Clears session and redirects to login page
 */

(function() {
    'use strict';
    
    const AUTH_KEY = 'doc_auth_session';
    const LOGIN_PAGE = './login.html';
    
    /**
     * Handle logout action
     */
    function handleLogout(event) {
        if (event) {
            event.preventDefault();
        }
        
        try {
            // Clear authentication session
            sessionStorage.removeItem(AUTH_KEY);
            sessionStorage.removeItem('doc_redirect_after_login');
            
            // Also clear sidebar state for clean re-login
            try {
                localStorage.removeItem('sidebarCollapsed');
                sessionStorage.removeItem('doc_auto_collapse_pending');
            } catch (e) {
                // Ignore storage errors
            }
            
            // Redirect to login page
            window.location.replace(LOGIN_PAGE);
        } catch (error) {
            console.error('Logout error:', error);
            // Force redirect anyway
            window.location.replace(LOGIN_PAGE);
        }
    }
    
    /**
     * Initialize logout handlers
     */
    function init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', attachLogoutHandlers);
        } else {
            attachLogoutHandlers();
        }
    }
    
    /**
     * Attach event listeners to logout buttons/links
     */
    function attachLogoutHandlers() {
        // Find all logout buttons/links
        const logoutElements = document.querySelectorAll('[href="/auth/logout"], .btn-logout, #logoutBtn, [data-action="logout"]');
        
        logoutElements.forEach(element => {
            element.addEventListener('click', handleLogout);
        });
    }
    
    // Initialize
    init();
    
    // Expose logout function globally for inline onclick handlers
    window.performLogout = handleLogout;
})();

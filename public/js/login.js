document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.getElementById('togglePassword');
    const unlockBtn = document.getElementById('unlockBtn');
    const feedback = document.getElementById('feedback');
    const btnText = document.querySelector('.btn-text');
    const themeToggle = document.getElementById('themeToggle');
    
    // Configuration for static deployment
    const VALID_PASSWORD = 'currency2025'; // Change this to your desired password
    const AUTH_KEY = 'doc_auth_session';
    const DEFAULT_REDIRECT = './index.html';

    // Theme Toggle
    themeToggle.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (isDark) {
            document.documentElement.removeAttribute('data-theme');
            themeToggle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeToggle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
        }
    });

    // Toggle Password Visibility
    toggleBtn.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // Update icon
        if (type === 'text') {
            toggleBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
            toggleBtn.setAttribute('aria-label', 'Hide password');
        } else {
            toggleBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
            toggleBtn.setAttribute('aria-label', 'Show password');
        }
    });

    // Form Submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = passwordInput.value.trim();

        // Client-side validation
        if (!password) {
            showError('Please enter your access key.');
            return;
        }

        // Reset state
        hideFeedback();
        setLoading(true);

        // Detect if running on development server (Express.js) or static hosting
        const isDevServer = window.location.hostname === 'localhost' && 
                           (window.location.port === '3000' || window.location.port === '5000');
        
        if (isDevServer) {
            // SERVER-SIDE AUTHENTICATION (Express.js backend)
            try {
                // Simulate network delay for UX
                await new Promise(resolve => setTimeout(resolve, 800));

                const response = await fetch('/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password })
                });

                const data = await response.json();

                if (data.success) {
                    showSuccess('Access granted. Redirecting...');
                    setTimeout(() => {
                        window.location.href = data.redirect || '/';
                    }, 1000);
                } else {
                    showError(data.message || 'Invalid access key.');
                    setLoading(false);
                    passwordInput.value = '';
                    passwordInput.focus();
                }
            } catch (error) {
                console.error('Login error:', error);
                showError('Connection failed. Please try again.');
                setLoading(false);
            }
        } else {
            // CLIENT-SIDE AUTHENTICATION (Static deployment - GitHub Pages, Netlify, etc.)
            await new Promise(resolve => setTimeout(resolve, 800));

            // Validate password (client-side for static deployment)
            if (password === VALID_PASSWORD) {
                // Create authentication session
                try {
                    const sessionData = {
                        authenticated: true,
                        timestamp: Date.now(),
                        loginTime: new Date().toISOString()
                    };
                    sessionStorage.setItem(AUTH_KEY, JSON.stringify(sessionData));
                    
                    showSuccess('Access granted. Redirecting...');
                    
                    // Redirect after short delay
                    setTimeout(() => {
                        // Check if there's a stored redirect URL
                        const redirectUrl = sessionStorage.getItem('doc_redirect_after_login');
                        if (redirectUrl && redirectUrl !== '/login.html') {
                            sessionStorage.removeItem('doc_redirect_after_login');
                            window.location.href = redirectUrl;
                        } else {
                            window.location.href = DEFAULT_REDIRECT;
                        }
                    }, 1000);
                } catch (error) {
                    console.error('Session creation error:', error);
                    showError('Failed to create session. Please enable cookies/storage.');
                    setLoading(false);
                }
            } else {
                showError('Invalid access key. Please try again.');
                setLoading(false);
                passwordInput.value = '';
                passwordInput.focus();
            }
        }
    });

    // Helper Functions
    function setLoading(isLoading) {
        unlockBtn.disabled = isLoading;
        if (isLoading) {
            if (!unlockBtn.querySelector('.spinner')) {
                const spinner = document.createElement('span');
                spinner.className = 'spinner';
                // Clear content and add spinner + text
                unlockBtn.innerHTML = '';
                unlockBtn.appendChild(spinner);
                unlockBtn.appendChild(document.createTextNode(' Verifying...'));
            }
        } else {
            unlockBtn.innerHTML = '<span class="btn-text">Unlock</span>';
        }
    }

    function showError(message) {
        feedback.textContent = message;
        feedback.className = 'feedback-message visible error';
        passwordInput.classList.add('error');
        
        // Remove error class after animation
        setTimeout(() => {
            passwordInput.classList.remove('error');
        }, 500);
    }

    function showSuccess(message) {
        feedback.textContent = message;
        feedback.className = 'feedback-message visible success';
    }

    function hideFeedback() {
        feedback.classList.remove('visible');
    }
});

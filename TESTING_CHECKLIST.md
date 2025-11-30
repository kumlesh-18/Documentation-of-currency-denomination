# 🧪 Authentication Testing Checklist

Use this checklist to verify the authentication system is working correctly before deploying to GitHub Pages.

## ✅ Pre-Deployment Testing

### **1. Local Server Setup**

- [ ] Local server running on port 8080
  ```bash
  cd public
  python -m http.server 8080
  ```
- [ ] Can access http://localhost:8080/login.html
- [ ] Login page loads without errors (check browser console)

---

### **2. Login Page Tests**

- [ ] **Visual Elements:**
  - [ ] Login card displays centered
  - [ ] Password input field visible
  - [ ] "Unlock" button visible
  - [ ] Theme toggle button (sun/moon icon) visible
  - [ ] Password visibility toggle (eye icon) visible

- [ ] **Functionality:**
  - [ ] Entering password and pressing Enter submits form
  - [ ] Clicking "Unlock" button submits form
  - [ ] Invalid password shows error message
  - [ ] Valid password (`currency2025`) shows success message

- [ ] **Theme Toggle:**
  - [ ] Clicking sun/moon icon switches theme
  - [ ] Light theme has light background
  - [ ] Dark theme has dark background

- [ ] **Password Visibility:**
  - [ ] Clicking eye icon toggles password visibility
  - [ ] Password shows as plain text when visible
  - [ ] Icon changes to "eye-off" when password is visible

---

### **3. Authentication Flow Tests**

**Test Case 1: Direct Login**
- [ ] Go to http://localhost:8080/login.html
- [ ] Enter password: `currency2025`
- [ ] Click "Unlock"
- [ ] Redirects to http://localhost:8080/index.html
- [ ] Home page loads successfully
- [ ] Sidebar navigation visible
- [ ] Header with logout button visible

**Test Case 2: Bypass Attempt (Direct Access)**
- [ ] Clear browser storage (Ctrl+Shift+Delete → Clear cache/cookies)
- [ ] Go directly to http://localhost:8080/index.html (bypassing login)
- [ ] Should immediately redirect to http://localhost:8080/login.html
- [ ] Login page displays

**Test Case 3: Deep Link Protection**
- [ ] Logout (if logged in)
- [ ] Try to access http://localhost:8080/pages/executive-summary.html
- [ ] Should redirect to login page
- [ ] After login, should redirect back to executive-summary.html

**Test Case 4: Session Persistence**
- [ ] Login successfully
- [ ] Navigate to different pages (use sidebar)
- [ ] All pages load without redirecting to login
- [ ] Refresh page (F5)
- [ ] Page reloads without logout
- [ ] Session still valid

**Test Case 5: Logout**
- [ ] Login successfully
- [ ] Go to home page
- [ ] Click "Logout" button in header
- [ ] Redirects to login page
- [ ] Try to navigate back (browser back button)
- [ ] Should redirect to login page (session cleared)

---

### **4. Navigation Tests**

- [ ] **From Home Page:**
  - [ ] Click "Executive Summary" → Loads correctly
  - [ ] Click "Core Features" → Loads correctly
  - [ ] Click "API Specifications" → Loads correctly

- [ ] **From Sub-Pages:**
  - [ ] Navigate to "Executive Summary"
  - [ ] Click "Home" in sidebar → Returns to home page
  - [ ] Click different sections → All load correctly
  - [ ] Breadcrumbs show correct path

- [ ] **Print Functionality:**
  - [ ] Click "Print" button
  - [ ] Print preview shows content only (no sidebar/buttons)

---

### **5. Asset Loading Tests**

- [ ] **CSS Files:**
  - [ ] Login page: Styling loads correctly (not plain HTML)
  - [ ] Home page: Styling loads correctly
  - [ ] Sub-pages: Styling loads correctly

- [ ] **JavaScript Files:**
  - [ ] Login page: `login.js` executes (check console for errors)
  - [ ] Home page: `auth-guard.js`, `navigation.js` execute
  - [ ] Sub-pages: All scripts load without 404 errors

- [ ] **Browser Console:**
  - [ ] No 404 errors for CSS/JS files
  - [ ] No JavaScript errors (except expected warnings)
  - [ ] Network tab shows all resources loaded successfully

---

### **6. Session Expiration Tests**

**Manual Expiration Test:**
- [ ] Login successfully
- [ ] Open browser DevTools (F12)
- [ ] Go to Application → Session Storage
- [ ] Find `doc_auth_session` key
- [ ] Edit `timestamp` value to 25 hours ago (subtract 90000000 from current value)
- [ ] Refresh page
- [ ] Should redirect to login (expired session)

**Storage Clearing Test:**
- [ ] Login successfully
- [ ] Open DevTools → Application → Session Storage
- [ ] Manually delete `doc_auth_session`
- [ ] Refresh page
- [ ] Should redirect to login

---

### **7. Multi-Tab Tests**

- [ ] Login in Tab 1
- [ ] Open Tab 2: http://localhost:8080/index.html
- [ ] Tab 2 should load home page (session shared)
- [ ] Logout in Tab 1
- [ ] Switch to Tab 2 and refresh
- [ ] Tab 2 should redirect to login

---

### **8. Browser Compatibility Tests**

Test in multiple browsers:
- [ ] **Chrome/Edge:** All tests pass
- [ ] **Firefox:** All tests pass
- [ ] **Safari:** All tests pass (if available)

---

### **9. Mobile Responsiveness Tests**

- [ ] Open DevTools → Toggle device toolbar (Ctrl+Shift+M)
- [ ] Test on mobile viewport (375x667)
- [ ] Login page displays correctly on mobile
- [ ] Home page sidebar becomes overlay on mobile
- [ ] Hamburger menu works on mobile
- [ ] All pages readable on mobile

---

## 🚀 GitHub Pages Deployment Tests

After deploying to GitHub Pages:

### **1. Initial Access**
- [ ] Visit: `https://<username>.github.io/<repo-name>/login.html`
- [ ] Login page loads correctly
- [ ] CSS/JS files load (no 404 errors)

### **2. Authentication Flow**
- [ ] Login with correct password
- [ ] Redirects to home page
- [ ] Try to access index.html directly → Redirects to login

### **3. Navigation**
- [ ] Sidebar navigation works
- [ ] All pages load correctly
- [ ] Logout returns to login page

### **4. URL Structure**
- [ ] URLs use correct base path (includes repo name if applicable)
- [ ] Relative paths resolve correctly
- [ ] No hardcoded localhost references

---

## 🐛 Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Login page shows plain HTML (no styling) | CSS path incorrect | Check browser console for 404 errors; verify relative paths |
| Immediate redirect loop on login page | Auth guard running on login page | Verify `auth-guard.js` has login page exclusion check |
| Can access pages without login | Auth guard not loaded | Verify `<script src="auth-guard.js">` is in page `<head>` |
| 404 on CSS/JS files on GitHub Pages | Absolute paths used | Run `npm run prepare-deploy` to update paths |
| Session doesn't persist | sessionStorage disabled | Enable cookies/storage in browser settings |
| Logout doesn't work | Logout script not loaded | Verify `auth-logout.js` is included in page |

---

## ✅ Final Verification

Before deploying to production:

- [ ] All tests in this checklist passed
- [ ] Password changed from default (`currency2025`)
- [ ] No console errors on any page
- [ ] All assets load correctly (no 404s)
- [ ] Authentication flow tested end-to-end
- [ ] `.nojekyll` file present in `/public`
- [ ] `DEPLOYMENT.md` reviewed
- [ ] Code committed to version control

---

## 📝 Test Results Log

**Date:** _________________  
**Tester:** _________________  
**Browser:** _________________  
**Pass/Fail:** _________________  

**Notes:**
```
[Record any issues or observations here]
```

---

**When all tests pass, you're ready to deploy! 🚀**

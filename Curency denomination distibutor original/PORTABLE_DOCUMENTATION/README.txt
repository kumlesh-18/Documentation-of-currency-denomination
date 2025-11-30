================================================================================
  CURRENCY DENOMINATION CALCULATOR - PORTABLE DOCUMENTATION
================================================================================

VERSION: 1.0.0 (Portable)
DATE: November 2025

================================================================================
  QUICK START
================================================================================

OPTION 1 - Simple Launch (Recommended):
----------------------------------------
1. Double-click: START_AND_OPEN.bat
2. Browser will open automatically
3. Login with password: currency2025
4. Browse all 22 documentation pages

OPTION 2 - Manual Launch:
--------------------------
1. Double-click: START.bat
2. Open browser manually to: http://localhost:3000
3. Login with password: currency2025

================================================================================
  WHAT'S INCLUDED
================================================================================

This portable package contains:

✓ Complete Documentation Website (22 pages)
  - Executive Summary
  - Project Overview
  - System Architecture
  - Core Features
  - UI/UX Requirements
  - Backend Logic
  - Bulk Upload System
  - OCR System
  - Smart Defaults
  - Multi-Language Support
  - Data Models & Database
  - API Specifications
  - Calculation Engine
  - Error Handling
  - Dependencies & Installation
  - Known Issues & Fixes
  - Testing & QA
  - Performance Requirements
  - Deployment
  - Future Enhancements
  - Acceptance Criteria
  - Screenshots & Outputs

✓ Embedded Node.js Runtime (no installation required)
✓ All dependencies pre-installed
✓ Password protection system
✓ Responsive design (desktop/tablet/mobile)

================================================================================
  SYSTEM REQUIREMENTS
================================================================================

Operating System:
  - Windows 10 or later (64-bit)
  - Windows 11

Hardware:
  - CPU: Any modern processor
  - RAM: 100 MB minimum
  - Disk Space: 150 MB

Network:
  - NOT REQUIRED (runs completely offline)

================================================================================
  FEATURES
================================================================================

✓ Fully Offline - No internet connection needed
✓ No Installation - Run directly from folder
✓ Portable - Copy folder anywhere, run immediately
✓ Secure - Password protected (password: currency2025)
✓ Complete - All 8071 lines of documentation included
✓ Fast - Loads in under 2 seconds

================================================================================
  FOLDER STRUCTURE
================================================================================

PORTABLE_DOCUMENTATION/
├── START.bat                    ← Launch server (manual browser)
├── START_AND_OPEN.bat          ← Launch server + auto-open browser
├── README.txt                   ← This file
├── CHANGELOG.txt               ← Version history
├── LICENSE.txt                 ← License information
│
├── runtime/                    ← Embedded runtime (DO NOT DELETE)
│   └── node/                   ← Node.js v20.x portable
│       ├── node.exe
│       └── ...
│
└── app/                        ← Application files
    ├── server/                 ← Backend server
    │   └── server.js
    ├── public/                 ← Frontend files
    │   ├── index.html
    │   ├── login.html
    │   ├── css/
    │   ├── js/
    │   └── pages/              ← 22 documentation pages
    ├── package.json
    ├── .env                    ← Configuration
    └── node_modules/           ← Dependencies (pre-installed)

================================================================================
  CONFIGURATION
================================================================================

Password:
---------
Default: currency2025

To change the password:
1. Open: app\.env
2. Run this command in PowerShell:
   node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('YourNewPassword', 10));"
3. Copy the hash output
4. Replace PASSWORD_HASH value in .env
5. Save and restart server

Port:
-----
Default: 3000

To change the port:
1. Open: app\.env
2. Change PORT=3000 to your desired port
3. Save and restart server

================================================================================
  TROUBLESHOOTING
================================================================================

Problem: "Node.js runtime not found"
Solution: Ensure runtime\node\node.exe exists. Re-extract the portable package.

Problem: "Port 3000 already in use"
Solution: Close other applications using port 3000, or change PORT in app\.env

Problem: "Cannot open browser"
Solution: Use START.bat and manually open: http://localhost:3000

Problem: "Login fails with correct password"
Solution: Check app\.env file exists and PASSWORD_HASH is set correctly

Problem: "Pages not loading"
Solution: Ensure all files in app\public\ are intact. Re-extract if needed.

================================================================================
  SECURITY NOTES
================================================================================

⚠ Password Protection:
  - Change default password (currency2025) for production use
  - Use strong passwords (12+ characters, mixed case, numbers, symbols)

⚠ Local Use Only:
  - Server binds to localhost (127.0.0.1) by default
  - NOT accessible from network (secure by default)

⚠ Session Security:
  - Sessions expire after 24 hours of inactivity
  - Change SESSION_SECRET in .env for production

================================================================================
  ADVANCED USAGE
================================================================================

Command Line Options:
--------------------
You can run the server with custom settings:

cd app
..\runtime\node\node.exe server\server.js

Environment Variables:
---------------------
Set in app\.env file:
- PORT=3000                    (Server port)
- SESSION_SECRET=your-secret   (Session encryption key)
- PASSWORD_HASH=...            (Bcrypt hash of password)
- NODE_ENV=production          (Environment mode)

================================================================================
  UNINSTALL
================================================================================

To remove the portable documentation:
1. Close the server (close the command window)
2. Delete the entire PORTABLE_DOCUMENTATION folder
3. No registry entries or system files are created

================================================================================
  SUPPORT
================================================================================

For issues or questions:
1. Check TROUBLESHOOTING section above
2. Review documentation at: http://localhost:3000 (when running)
3. Check app\server\server.js for server configuration

================================================================================
  LICENSE
================================================================================

See LICENSE.txt for licensing information.

================================================================================
  VERSION HISTORY
================================================================================

See CHANGELOG.txt for detailed version history.

================================================================================
  END OF README
================================================================================

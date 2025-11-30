# Project File Structure Analysis

**Currency Denomination Distributor - Complete File Map**

---

## Root Directory Files

### Documentation Files (Keep All)
- ✅ **README.md** - Main project overview and introduction
- ✅ **INDEX.md** - Documentation navigation hub
- ✅ **QUICKSTART.md** - 5-minute quick start guide
- ✅ **GETTING_STARTED.md** - Detailed setup instructions
- ✅ **PROJECT_SUMMARY.md** - Technical specifications and architecture
- ✅ **ROADMAP.md** - Future development plans
- ✅ **STATUS.md** - Current system status report
- ✅ **QUICK_REFERENCE.md** - Command reference card

### Script Files (Keep All)
- ✅ **start.ps1** - Interactive menu for starting components
- ✅ **health-check.ps1** - System health verification script

### Configuration Files (Keep All)
- ✅ **.gitignore** - Git ignore patterns
- ✅ **docker-compose.yml** - Docker configuration for future cloud deployment

### Files to Remove
- ❌ **package.json** - Not needed (no Node.js project currently)
- ❌ **package-lock.json** - Not needed
- ❌ **node_modules/** - Not needed (empty or unnecessary)

---

## packages/core-engine/ Directory

### Python Core Files (Keep All)
- ✅ **engine.py** (464 lines) - Main denomination calculation engine
- ✅ **models.py** (206 lines) - Data models and types
- ✅ **optimizer.py** (338 lines) - Optimization and constraint engine
- ✅ **fx_service.py** (280 lines) - Currency conversion service
- ✅ **__init__.py** - Package initialization

### Test Files (Keep All)
- ✅ **test_engine.py** (332 lines) - Comprehensive test suite (7 tests)
- ✅ **verify.py** (95 lines) - Quick verification script (6 tests)

### Script Files (Keep All)
- ✅ **test.ps1** - PowerShell test runner

### Configuration Files (Keep All)
- ✅ **config/currencies.json** - Currency definitions (INR, USD, EUR, GBP)
- ✅ **config/optimization_profiles.json** - Optimization mode configurations

### Documentation (Keep All)
- ✅ **README.md** - Core engine documentation

---

## packages/local-backend/ Directory

### Application Code (Keep All)
- ✅ **app/main.py** (120 lines) - FastAPI application entry point
- ✅ **app/config.py** (35 lines) - Configuration settings
- ✅ **app/database.py** (156 lines) - Database models and connection
- ✅ **app/__init__.py** - Package initialization

### API Routes (Keep All)
- ✅ **app/api/calculations.py** (250 lines) - Calculation endpoints
- ✅ **app/api/history.py** (145 lines) - History management
- ✅ **app/api/export.py** (180 lines) - Export functionality
- ✅ **app/api/settings.py** (95 lines) - Settings management
- ✅ **app/api/__init__.py** - API package initialization

### Start Scripts (Keep Essential, Remove Duplicates)
- ✅ **start-server.ps1** - Simple server start (KEEP - most reliable)
- ⚠️ **start.ps1** - Complex start with venv setup (OPTIONAL - has issues)
- ❌ **start-simple.ps1** - Duplicate functionality (REMOVE)

### Configuration Files (Keep All)
- ✅ **requirements.txt** - Python dependencies

### Documentation (Keep All)
- ✅ **README.md** - Backend documentation

### Runtime Directories (Keep All)
- ✅ **data/** - SQLite database storage
- ✅ **exports/** - Export file storage

### Files to Remove
- ❌ **venv.old/** - Old broken virtual environment (locked file, manual removal needed)

---

## docs/ Directory (Keep All)

Additional documentation files if any exist in this folder.

---

## Summary of Cleanup Actions

### Files Removed Automatically
1. ❌ package.json (not needed - no Node.js)
2. ❌ package-lock.json (not needed)
3. ❌ node_modules/ (not needed)

### Files to Remove Manually
1. ❌ **packages/local-backend/start-simple.ps1** - Duplicate of start-server.ps1
2. ❌ **packages/local-backend/venv.old/** - Broken virtual environment (locked)
   - Cannot auto-delete due to locked python.exe
   - Safe to delete manually after restart

### Recommended Optional Cleanup
- ⚠️ **packages/local-backend/start.ps1** - Keep if you want venv support, otherwise remove

---

## Final Clean File Count

**Total Essential Files:**
- Documentation: 8 files
- Core Engine: 10 files (5 Python + 2 tests + 1 script + 2 configs)
- Local Backend: 14 files (11 Python + 1 config + 2 scripts)
- Scripts: 2 files (root level)
- Config: 2 files (.gitignore, docker-compose.yml)

**Total: ~36 essential files** (excluding venv.old and redundant scripts)

---

## Disk Space Savings

After cleanup:
- Removed node_modules: ~0 MB (was already empty/missing)
- Removed package files: negligible
- venv.old to remove: ~50-100 MB (requires manual removal)
- start-simple.ps1: negligible

**Recommendation:** Remove `start-simple.ps1` now, and delete `venv.old` folder manually after system restart.

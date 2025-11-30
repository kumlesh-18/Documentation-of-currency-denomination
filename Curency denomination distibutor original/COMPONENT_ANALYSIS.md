# Component Analysis - What Each File Does

**Currency Denomination Distributor System**

---

## 1. Core Engine Components (packages/core-engine/)

### engine.py (464 lines)
**Purpose:** Main denomination calculation logic

**What it does:**
- Calculates optimal currency denomination breakdowns
- Implements greedy algorithm for denomination distribution
- Handles amounts from small (₹1) to massive (1000+ trillion)
- Supports 4 currencies: INR, USD, EUR, GBP
- Provides 3 optimization modes: greedy, minimize_large, balanced

**Key Functions:**
- `calculate_denominations()` - Main entry point for calculations
- `DenominationEngine.calculate()` - Core calculation engine
- `_greedy_breakdown()` - Optimized greedy algorithm implementation

**Example Use:**
```python
result = calculate_denominations(50000, "INR")
# Returns: 25 x ₹2000 notes
```

---

### models.py (206 lines)
**Purpose:** Data structures and type definitions

**What it does:**
- Defines all data models used throughout the system
- Ensures type safety with Python dataclasses
- Provides validation and serialization

**Key Models:**
- `CalculationRequest` - Input parameters for calculations
- `CalculationResult` - Output with breakdown details
- `DenominationBreakdown` - Individual denomination info
- `Constraint` - Constraints to apply (avoid certain notes)
- `OptimizationMode` - Enum for optimization strategies

---

### optimizer.py (338 lines)
**Purpose:** Advanced optimization and constraint handling

**What it does:**
- Applies constraints (e.g., "avoid ₹2000 notes")
- Generates alternative distribution strategies
- Provides smart suggestions for different scenarios
- Implements optimization profiles (minimize large notes, balanced, etc.)

**Key Functions:**
- `apply_constraints()` - Filters out unwanted denominations
- `suggest_alternatives()` - Generates 2-3 alternative breakdowns
- `optimize_for_profile()` - Applies predefined optimization strategies

**Example Use:**
```python
# Avoid ₹2000 notes
constraint = Constraint(type="avoid", denomination=2000)
result = engine.calculate(request_with_constraints)
```

---

### fx_service.py (280 lines)
**Purpose:** Currency conversion and exchange rates

**What it does:**
- Fetches live exchange rates (with offline fallback)
- Caches rates for offline mode
- Converts amounts between currencies
- Provides rate history and timestamps

**Key Functions:**
- `get_exchange_rate()` - Gets current rate between two currencies
- `convert_amount()` - Converts money from one currency to another
- `_fetch_live_rate()` - Fetches from external API
- `_get_cached_rate()` - Returns offline cached rate

**Example Use:**
```python
fx = FXService()
rate, timestamp = fx.get_exchange_rate("USD", "INR")
# Returns: (Decimal('83.12'), datetime(...))
```

---

### test_engine.py (332 lines)
**Purpose:** Comprehensive testing suite

**What it does:**
- Tests all core functionality
- Validates calculations from ₹1 to ₹1 trillion
- Verifies multi-currency support
- Tests optimization modes and constraints
- Ensures FX conversion accuracy

**7 Test Cases:**
1. Basic denomination breakdown (₹50,000)
2. Extremely large amounts (1 trillion)
3. Multi-currency support (USD, EUR, GBP, INR)
4. Optimization modes (greedy vs minimize_large)
5. Constraint application (avoid specific notes)
6. Currency conversion (USD → INR)
7. Alternative distributions

**Run with:** `python test_engine.py`

---

### verify.py (95 lines)
**Purpose:** Quick health check

**What it does:**
- Fast 6-test verification (runs in 2 seconds)
- Checks imports, basic calculations, multi-currency
- Validates large amount handling
- Tests FX service and optimizer
- Used by health-check.ps1

**Run with:** `python verify.py` or `.\test.ps1`

---

### config/currencies.json
**Purpose:** Currency definitions

**What it contains:**
```json
{
  "INR": {
    "name": "Indian Rupee",
    "symbol": "₹",
    "notes": [2000, 500, 200, 100, 50, 20, 10, 5, 2, 1],
    "coins": [10, 5, 2, 1, 0.5]
  },
  "USD": { ... },
  "EUR": { ... },
  "GBP": { ... }
}
```

---

### config/optimization_profiles.json
**Purpose:** Optimization strategy definitions

**What it contains:**
- Predefined strategies (minimize_large, balanced, minimize_coins)
- Weight configurations for each denomination
- Preference rules for optimization

---

## 2. Local Backend Components (packages/local-backend/)

### app/main.py (120 lines)
**Purpose:** FastAPI application entry point

**What it does:**
- Initializes FastAPI server
- Sets up CORS for frontend integration
- Registers API routers (calculations, history, export, settings)
- Configures database connection
- Adds sys.path for core-engine imports
- Provides startup/shutdown event handlers

**Key Features:**
- Swagger docs at `/docs`
- ReDoc at `/redoc`
- Health check endpoint at `/`

**Run with:** `.\start-server.ps1`

---

### app/config.py (35 lines)
**Purpose:** Configuration management

**What it does:**
- Loads environment variables
- Sets database path (data/local.db)
- Configures CORS origins
- Defines app settings (title, version, debug mode)

**Uses:** Pydantic BaseSettings for validation

---

### app/database.py (156 lines)
**Purpose:** Database models and ORM

**What it does:**
- Defines SQLite database schema
- Creates 3 tables: calculations, user_settings, export_records
- Provides database session management
- Maps Python objects to database rows

**3 Database Tables:**
1. **calculations** - Stores all calculation history
2. **user_settings** - User preferences and settings
3. **export_records** - Track of exported files

**Uses:** SQLAlchemy ORM

---

### app/api/calculations.py (250 lines)
**Purpose:** Calculation API endpoints

**What it provides:**
- `POST /calculate` - Perform denomination calculation
- `GET /currencies` - List supported currencies
- `POST /alternatives` - Generate alternative breakdowns
- `GET /exchange-rates` - Get current FX rates
- `POST /convert` - Convert between currencies
- `GET /denominations/{currency}` - Get available denominations

**Example:**
```
POST /calculate
{
  "amount": 50000,
  "currency": "INR"
}

Response:
{
  "total_notes": 25,
  "breakdowns": [
    {"value": 2000, "count": 25, "is_note": true}
  ]
}
```

---

### app/api/history.py (145 lines)
**Purpose:** Calculation history management

**What it provides:**
- `GET /history` - Get all calculation history (with pagination)
- `GET /history/{id}` - Get specific calculation
- `DELETE /history/{id}` - Delete calculation from history
- `DELETE /history` - Clear all history
- `GET /history/stats` - Get usage statistics

**Features:**
- Pagination support
- Filtering by currency/date
- Statistics (total calculations, most used currency, etc.)

---

### app/api/export.py (180 lines)
**Purpose:** Export functionality

**What it provides:**
- `POST /export/pdf` - Export calculation as PDF
- `POST /export/json` - Export as JSON
- `POST /export/csv` - Export as CSV
- `GET /exports` - List all export records
- `GET /exports/{id}/download` - Download exported file

**Export Formats:**
- PDF - Formatted report with breakdown table
- JSON - Machine-readable data
- CSV - Spreadsheet-compatible format

---

### app/api/settings.py (95 lines)
**Purpose:** User settings management

**What it provides:**
- `GET /settings` - Get all settings
- `GET /settings/{key}` - Get specific setting
- `POST /settings` - Update settings
- `DELETE /settings/{key}` - Delete setting

**Common Settings:**
- Default currency
- Preferred optimization mode
- Theme preferences
- Display options

---

### requirements.txt
**Purpose:** Python dependencies

**What it lists:**
```
fastapi>=0.104.0
uvicorn[standard]>=0.24.0
sqlalchemy>=2.0.0
pydantic>=2.0.0
pydantic-settings>=2.0.0
python-multipart>=0.0.6
aiofiles>=23.0.0
```

---

## 3. Documentation Files (Root)

### README.md
**Purpose:** Main project introduction
- Project overview
- Key features
- Technology stack
- Quick start instructions
- Links to other docs

### INDEX.md
**Purpose:** Documentation navigation hub
- Table of contents for all documentation
- Quick links to guides
- File structure overview

### QUICKSTART.md
**Purpose:** 5-minute quick start guide
- Minimal steps to get running
- Essential commands
- First calculation example

### GETTING_STARTED.md
**Purpose:** Detailed setup guide
- Prerequisites and dependencies
- Step-by-step installation
- Configuration options
- Troubleshooting

### PROJECT_SUMMARY.md
**Purpose:** Technical specifications
- Architecture diagrams
- Design patterns used
- Technology choices and rationale
- Performance characteristics
- Future scalability plans

### ROADMAP.md
**Purpose:** Future development plans
- Phase 1: Core Engine ✅ (Complete)
- Phase 2: Desktop App (Planned - 2-3 weeks)
- Phase 3: Cloud Backend (Planned - 2 weeks)
- Phase 4: Mobile App (Planned - 3-4 weeks)
- Phase 5: AI Integration (Planned - 1 week)

### STATUS.md
**Purpose:** Current system status
- What's working right now
- Test results
- Recent changes
- Known issues
- Next steps

### QUICK_REFERENCE.md
**Purpose:** Command cheat sheet
- Essential commands
- Example calculations
- Troubleshooting tips
- Quick links

---

## 4. Utility Scripts (Root)

### start.ps1
**Purpose:** Interactive start menu

**What it does:**
```
Choose an option:
  1. Start Local Backend API
  2. Run Core Engine Tests
  3. View Documentation
  4. Exit
```

### health-check.ps1
**Purpose:** System verification

**What it checks:**
- Python installation
- Core engine availability
- Documentation files
- Project structure integrity

**Output:**
```
Checking Python... OK
Checking Core Engine... OK
Checking Documentation... OK
Checking Project Structure... OK

SYSTEM STATUS: HEALTHY
```

---

## 5. Configuration Files (Root)

### .gitignore
**Purpose:** Git exclusion patterns

**What it ignores:**
- Python cache files (__pycache__, *.pyc)
- Virtual environments (venv/, .venv/)
- Database files (*.db)
- Export files
- IDE settings

### docker-compose.yml
**Purpose:** Docker configuration for future cloud deployment

**What it defines:**
- Backend service container
- PostgreSQL database (for cloud version)
- Network configuration
- Volume mounts

---

## Summary

**Active Components:**
- ✅ Core Engine: 5 Python modules, 1,400+ lines
- ✅ Backend API: 11 Python modules, 1,200+ lines
- ✅ Tests: 2 test suites, 7+6 tests
- ✅ Documentation: 8 markdown files
- ✅ Scripts: 4 PowerShell utilities

**System Capabilities:**
- Calculate denominations for amounts up to 1000+ trillion
- Support 4 currencies with live FX conversion
- REST API with 20+ endpoints
- SQLite database for history
- Export to PDF/JSON/CSV
- Comprehensive testing and verification

**All components are essential and actively used!**

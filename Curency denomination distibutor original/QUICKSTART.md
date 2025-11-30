# Currency Denomination System - Project Quick Start

This guide will help you set up and run the core components of the system.

## 🚀 Quick Start (5 Minutes)

### Step 1: Test the Core Engine

The core engine is pure Python with no external dependencies.

```powershell
# Navigate to core engine
cd packages\core-engine

# Run tests
python test_engine.py

# Or use the PowerShell script
.\test.ps1
```

You should see all tests pass with denomination breakdowns for various amounts and currencies.

### Step 2: Start the Local Backend API

The local backend provides REST API for the desktop app.

```powershell
# Navigate to local backend
cd ..\local-backend

# Run the quick start script (will set up everything)
.\start.ps1
```

This will:
1. Create a virtual environment
2. Install dependencies
3. Create necessary directories
4. Start the FastAPI server on http://localhost:8001

### Step 3: Test the API

Open your browser and go to:
- **Interactive API Docs:** http://localhost:8001/docs
- **API Root:** http://localhost:8001/

Try making a calculation:

```powershell
# PowerShell example
$body = @{
    amount = 50000
    currency = "INR"
    optimization_mode = "greedy"
    save_to_history = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8001/api/v1/calculate" -Method Post -Body $body -ContentType "application/json"
```

## 📋 What's Been Built

### ✅ Completed Components

1. **Core Denomination Engine** (`packages/core-engine/`)
   - ✅ Multi-currency support (INR, USD, EUR, GBP)
   - ✅ Arbitrary precision math (handles amounts up to quadrillion)
   - ✅ Greedy algorithm for optimal breakdown
   - ✅ Multiple optimization modes
   - ✅ Constraint system (avoid, minimize, cap, etc.)
   - ✅ Alternative distribution generation
   - ✅ FX service with cached rates
   - ✅ Pure Python with no dependencies

2. **Local Backend API** (`packages/local-backend/`)
   - ✅ FastAPI REST API
   - ✅ SQLite database
   - ✅ Full calculation endpoints
   - ✅ History management with pagination
   - ✅ CSV export functionality
   - ✅ Settings management
   - ✅ Exchange rate queries
   - ✅ Alternative suggestions
   - ✅ Interactive API documentation

3. **Project Infrastructure**
   - ✅ Monorepo structure
   - ✅ Docker Compose configuration
   - ✅ Comprehensive documentation
   - ✅ Quick start scripts

### 🔄 Next Steps (To Be Built)

4. **Desktop Application** (Electron + React)
   - UI components with dark mode
   - History sidebar
   - Charts and visualizations
   - Export buttons
   - Settings panel

5. **Cloud Backend** (FastAPI + PostgreSQL)
   - Multi-user authentication
   - Cloud sync
   - Public API with rate limiting
   - Analytics dashboard

6. **Mobile Application** (React Native)
   - Cross-platform iOS/Android
   - Shared UI logic with desktop
   - Cloud API integration

7. **Gemini AI Integration**
   - Natural language explanations
   - Alternative suggestions
   - Bulk insights

8. **Analytics Dashboard** (Next.js)
   - Usage statistics
   - Trend analysis
   - Charts and reports

## 🧪 Testing the Core Features

### Test 1: Basic Calculation
```powershell
# From core-engine directory
python -c "from engine import calculate_denominations; r = calculate_denominations(50000, 'INR'); print(f'Amount: {r.original_amount}, Total Notes: {r.total_notes}')"
```

### Test 2: Large Amount (10 Lakh Crore)
```powershell
python -c "from decimal import Decimal; from engine import calculate_denominations; r = calculate_denominations(Decimal('1000000000000'), 'INR'); print(f'Amount: {r.original_amount:,}, Denominations: {r.total_denominations:,}')"
```

### Test 3: Multi-Currency
```powershell
python -c "from engine import DenominationEngine; e = DenominationEngine(); print('Supported:', ', '.join(e.get_supported_currencies()))"
```

### Test 4: API Health Check
```powershell
Invoke-RestMethod -Uri "http://localhost:8001/health"
```

### Test 5: Get Currencies via API
```powershell
Invoke-RestMethod -Uri "http://localhost:8001/api/v1/currencies"
```

## 📁 Project Structure

```
f:\Curency denomination distibutor original\
├── README.md                    # Main project documentation
├── package.json                 # Root workspace configuration
├── docker-compose.yml           # Docker setup
├── .gitignore                   # Git ignore rules
│
├── packages/
│   ├── core-engine/             # ✅ COMPLETE
│   │   ├── engine.py            # Main denomination engine
│   │   ├── models.py            # Data models
│   │   ├── optimizer.py         # Optimization strategies
│   │   ├── fx_service.py        # FX conversion
│   │   ├── test_engine.py       # Test suite
│   │   ├── test.ps1             # Quick test script
│   │   └── config/
│   │       ├── currencies.json  # Currency configurations
│   │       └── fx_rates_cache.json
│   │
│   ├── local-backend/           # ✅ COMPLETE
│   │   ├── app/
│   │   │   ├── main.py          # FastAPI app
│   │   │   ├── config.py        # Settings
│   │   │   ├── database.py      # SQLite models
│   │   │   └── api/
│   │   │       ├── calculations.py  # Calc endpoints
│   │   │       ├── history.py       # History endpoints
│   │   │       ├── export.py        # Export endpoints
│   │   │       └── settings.py      # Settings endpoints
│   │   ├── requirements.txt     # Python dependencies
│   │   ├── README.md            # Backend docs
│   │   └── start.ps1            # Quick start script
│   │
│   ├── desktop-app/             # 🔄 TO BE BUILT
│   ├── mobile-app/              # 🔄 TO BE BUILT
│   ├── cloud-backend/           # 🔄 TO BE BUILT
│   └── web-dashboard/           # 🔄 TO BE BUILT
```

## 🎯 Key Features Demonstrated

### 1. Extreme Large Numbers
The system handles amounts like **10,00,00,00,00,000** (10 lakh crore = 1 trillion) without any issues:
```python
result = calculate_denominations(Decimal("1000000000000"), "INR")
# Works perfectly!
```

### 2. Multi-Currency Support
Supports INR, USD, EUR, GBP with configurable denominations:
```python
result_inr = calculate_denominations(50000, "INR")
result_usd = calculate_denominations(1000, "USD")
result_eur = calculate_denominations(5000, "EUR")
```

### 3. Optimization Modes
Multiple strategies for denomination breakdown:
- **Greedy** - Minimize total count
- **Minimize Large** - Avoid large denominations
- **Balanced** - Balance between large and small
- **Constrained** - Apply custom constraints

### 4. FX Conversion
Built-in currency conversion with cached rates:
```python
converted, rate, timestamp = fx_service.convert_amount(
    Decimal("1000"), "USD", "INR", use_live=False
)
```

### 5. History & Persistence
All calculations saved to SQLite with:
- Full breakdown details
- Timestamps
- Sync status
- Export capability

## 🔧 Troubleshooting

### Python Not Found
Install Python 3.11+ from python.org

### Port 8001 Already in Use
Edit `start.ps1` and change the port:
```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8002
```

### Module Import Errors
Ensure you're in the correct directory when running scripts.

### Virtual Environment Issues
Delete the `venv` folder and run `start.ps1` again.

## 📚 Documentation

- **Main README:** `f:\Curency denomination distibutor original\README.md`
- **Core Engine:** `packages\core-engine\` (pure Python, self-documenting)
- **Local Backend API:** `packages\local-backend\README.md`
- **API Docs:** http://localhost:8001/docs (when server running)

## 🎓 For Your Academic Project

This implementation demonstrates:

1. **Enterprise Architecture**
   - Layered design (Presentation → API → Domain → Infrastructure)
   - Offline-first with online enhancement
   - Microservices-ready structure

2. **Best Practices**
   - Pure domain logic (core engine)
   - RESTful API design
   - Database normalization
   - Error handling
   - Configuration management

3. **Scalability**
   - Arbitrary precision math
   - Efficient algorithms
   - Database indexing
   - Stateless design

4. **Modern Tech Stack**
   - Python 3.11+
   - FastAPI (modern async framework)
   - SQLite → PostgreSQL migration path
   - Docker-ready
   - OpenAPI documentation

## 📞 Next Steps

1. **Test the current components** using the quick start guide above
2. **Review the code** in the core-engine and local-backend
3. **Experiment with the API** using the interactive docs
4. **Ready for desktop app development** - the backend is complete!

---

**Status:** Core components ready for integration with frontend layers! 🚀

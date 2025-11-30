# Getting Started - Run & Test Your System

This guide will help you run and test the complete working system in **less than 5 minutes**.

---

## 🚀 Quick Start (Choose One)

### Option A: Test Core Engine Only (Fastest - 1 minute)

1. **Open PowerShell/Terminal**
2. **Navigate to core engine:**
   ```powershell
   cd "f:\Curency denomination distibutor original\packages\core-engine"
   ```
3. **Run tests:**
   ```powershell
   python test_engine.py
   ```
4. **Expected output:** 7 tests pass, showing denomination breakdowns

✅ **Success!** You've verified the core engine works perfectly.

---

### Option B: Run Full Backend API (Best Demo - 3 minutes)

1. **Open PowerShell as Administrator** (for directory creation permissions)

2. **Navigate to local backend:**
   ```powershell
   cd "f:\Curency denomination distibutor original\packages\local-backend"
   ```

3. **Run the quick start script:**
   ```powershell
   .\start.ps1
   ```

   This will automatically:
   - ✅ Check Python version
   - ✅ Create virtual environment
   - ✅ Install dependencies
   - ✅ Create data directories
   - ✅ Start the API server

4. **Wait for server to start** (about 30 seconds)

5. **Open browser and visit:**
   - **Interactive API Docs:** http://localhost:8001/docs
   - **Alternative Docs:** http://localhost:8001/redoc
   - **API Root:** http://localhost:8001/

✅ **Success!** Your API is running and ready to test.

---

## 📋 What to Test

### Test 1: API Documentation

**URL:** http://localhost:8001/docs

**What you'll see:**
- 20+ API endpoints organized by category
- Interactive testing interface
- Request/response schemas
- Example values

**Try it:**
1. Click on `POST /api/v1/calculate`
2. Click "Try it out"
3. Enter:
   ```json
   {
     "amount": 50000,
     "currency": "INR",
     "optimization_mode": "greedy",
     "save_to_history": true
   }
   ```
4. Click "Execute"
5. See the breakdown: 25 x ₹2000 = ₹50,000

---

### Test 2: PowerShell API Calls

**Make calculations from command line:**

```powershell
# Single calculation
$body = @{
    amount = 75000
    currency = "INR"
    optimization_mode = "greedy"
    save_to_history = $true
} | ConvertTo-Json

$result = Invoke-RestMethod -Uri "http://localhost:8001/api/v1/calculate" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"

# Display result
$result | ConvertTo-Json -Depth 10
```

**Expected output:**
```json
{
  "id": 1,
  "amount": "75000",
  "currency": "INR",
  "breakdowns": [
    {
      "denomination": "2000",
      "count": 37,
      "total_value": "74000",
      "is_note": true
    },
    {
      "denomination": "500",
      "count": 2,
      "total_value": "1000",
      "is_note": true
    }
  ],
  "total_notes": 39,
  "total_coins": 0,
  "total_denominations": 39,
  "optimization_mode": "greedy"
}
```

---

### Test 3: History Management

```powershell
# Get history
Invoke-RestMethod -Uri "http://localhost:8001/api/v1/history?page=1&page_size=10"

# Get quick access (last 10)
Invoke-RestMethod -Uri "http://localhost:8001/api/v1/history/quick-access?count=10"

# Get statistics
Invoke-RestMethod -Uri "http://localhost:8001/api/v1/history/stats"
```

---

### Test 4: Export to CSV

```powershell
# Export all history to CSV
Invoke-WebRequest -Uri "http://localhost:8001/api/v1/export/csv" `
    -OutFile "history_export.csv"

# Open the file
Invoke-Item history_export.csv
```

**What you'll see:** CSV file with all calculations

---

### Test 5: Multi-Currency Support

```powershell
# Get supported currencies
Invoke-RestMethod -Uri "http://localhost:8001/api/v1/currencies"

# Calculate in USD
$usdBody = @{
    amount = 1000
    currency = "USD"
    save_to_history = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8001/api/v1/calculate" `
    -Method Post `
    -Body $usdBody `
    -ContentType "application/json"

# Calculate in EUR
$eurBody = @{
    amount = 5000
    currency = "EUR"
    save_to_history = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8001/api/v1/calculate" `
    -Method Post `
    -Body $eurBody `
    -ContentType "application/json"
```

---

### Test 6: Exchange Rates

```powershell
# Get exchange rates
Invoke-RestMethod -Uri "http://localhost:8001/api/v1/exchange-rates?base=USD"
```

**Expected output:**
```json
{
  "base_currency": "USD",
  "rates": {
    "INR": "83.12",
    "EUR": "0.92",
    "GBP": "0.79"
  },
  "cache_age_hours": 12.5,
  "is_stale": false
}
```

---

### Test 7: Alternative Distributions

```powershell
# Get alternative ways to break down same amount
$altBody = @{
    amount = 5000
    currency = "INR"
    optimization_mode = "greedy"
} | ConvertTo-Json

$alternatives = Invoke-RestMethod -Uri "http://localhost:8001/api/v1/alternatives" `
    -Method Post `
    -Body $altBody `
    -ContentType "application/json"

$alternatives | ConvertTo-Json -Depth 10
```

---

### Test 8: Settings Management

```powershell
# Get all settings
Invoke-RestMethod -Uri "http://localhost:8001/api/v1/settings"

# Update theme to dark
$settingBody = @{
    key = "theme"
    value = "dark"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8001/api/v1/settings" `
    -Method Put `
    -Body $settingBody `
    -ContentType "application/json"

# Get theme setting
Invoke-RestMethod -Uri "http://localhost:8001/api/v1/settings/theme"
```

---

### Test 9: Large Amount (10 Lakh Crore)

```powershell
# Calculate 1 trillion INR
$largeBody = @{
    amount = 1000000000000
    currency = "INR"
    optimization_mode = "greedy"
    save_to_history = $true
} | ConvertTo-Json

$largeResult = Invoke-RestMethod -Uri "http://localhost:8001/api/v1/calculate" `
    -Method Post `
    -Body $largeBody `
    -ContentType "application/json"

# Display
Write-Host "Amount: ₹$($largeResult.amount)"
Write-Host "Total Denominations: $($largeResult.total_denominations)"
```

**Expected:** Handles perfectly without errors!

---

## 🧪 Core Engine Direct Testing

If you want to test the engine directly (without API):

```powershell
cd "f:\Curency denomination distibutor original\packages\core-engine"
python
```

Then in Python:

```python
from engine import calculate_denominations
from decimal import Decimal

# Basic test
result = calculate_denominations(50000, "INR")
print(f"Amount: ₹{result.original_amount:,}")
print(f"Total Notes: {result.total_notes}")

# Multi-currency
result_usd = calculate_denominations(1000, "USD")
result_eur = calculate_denominations(5000, "EUR")
result_gbp = calculate_denominations(2500, "GBP")

# Extreme large amount
huge = Decimal("10000000000000")  # 10 trillion
result_huge = calculate_denominations(huge, "INR")
print(f"10 Trillion INR: {result_huge.total_denominations:,} denominations")

# With optimization mode
from models import OptimizationMode
result_min = calculate_denominations(
    5000, 
    "INR", 
    OptimizationMode.MINIMIZE_LARGE
)
```

---

## 📊 Verify Database

The SQLite database is created automatically at:
```
f:\Curency denomination distibutor original\packages\local-backend\data\local.db
```

**View using DB Browser for SQLite:**
1. Download: https://sqlitebrowser.org/
2. Open: `data\local.db`
3. Browse tables: `calculations`, `user_settings`, `export_records`

**Or use PowerShell:**
```powershell
# Count calculations
sqlite3 data\local.db "SELECT COUNT(*) FROM calculations;"

# View recent calculations
sqlite3 data\local.db "SELECT amount, currency, created_at FROM calculations ORDER BY created_at DESC LIMIT 10;"
```

---

## 🔍 Troubleshooting

### Problem: Python not found
**Solution:** Install Python 3.11+ from https://python.org

### Problem: Port 8001 already in use
**Solution:** Change port in start.ps1:
```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8002
```

### Problem: Permission denied creating directories
**Solution:** Run PowerShell as Administrator

### Problem: Module not found errors
**Solution:** Ensure virtual environment is activated:
```powershell
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Problem: Database locked
**Solution:** Close any other instances of the app, restart the server

### Problem: Import errors in core-engine
**Solution:** The core-engine path is added automatically by the backend. Ensure directory structure is correct.

---

## 📈 Performance Testing

### Test API Performance

```powershell
# Single calculation timing
Measure-Command {
    Invoke-RestMethod -Uri "http://localhost:8001/api/v1/calculate" `
        -Method Post `
        -Body (@{amount=50000; currency="INR"} | ConvertTo-Json) `
        -ContentType "application/json"
}
```

**Expected:** < 200ms

### Bulk Testing

Create a test CSV file: `test_bulk.csv`
```csv
amount,currency
50000,INR
1000,USD
5000,EUR
2500,GBP
100000,INR
```

Then process (when bulk endpoint implemented):
```powershell
# Upload and process
$file = Get-Item test_bulk.csv
# (Bulk endpoint to be implemented in future phases)
```

---

## 🎯 Success Indicators

### You know it's working when:

✅ **Core Engine:**
- All 7 tests pass
- Calculations are accurate
- Large numbers handled correctly

✅ **Backend API:**
- Server starts without errors
- Swagger UI loads at /docs
- Can make successful API calls
- Database file created
- Export files generated

✅ **Performance:**
- API responds in < 200ms
- No errors in console
- Database queries fast

---

## 📱 What's Next?

After verifying everything works:

1. **Present the System**
   - Show Swagger UI
   - Demo live calculations
   - Explain architecture

2. **Extend the System** (optional)
   - Build desktop UI (Phase 2 in ROADMAP.md)
   - Add cloud backend (Phase 3)
   - Create mobile app (Phase 4)

3. **Customize**
   - Add more currencies
   - Implement Excel/PDF export
   - Add custom optimization modes

---

## 💡 Pro Tips

### Quick Demo Script

```powershell
# Open 3 PowerShell windows

# Window 1: Start backend
cd "f:\Curency denomination distibutor original\packages\local-backend"
.\start.ps1

# Window 2: Test API
cd "f:\Curency denomination distibutor original"
Invoke-RestMethod -Uri "http://localhost:8001/api/v1/calculate" `
    -Method Post `
    -Body (@{amount=50000; currency="INR"} | ConvertTo-Json) `
    -ContentType "application/json"

# Window 3: Test core engine
cd "f:\Curency denomination distibutor original\packages\core-engine"
python test_engine.py
```

### API Testing Collection

Save common API calls in a file: `test_api.ps1`

```powershell
$baseUrl = "http://localhost:8001"

# Test 1: Calculate
Write-Host "Test 1: Calculate 50000 INR"
Invoke-RestMethod -Uri "$baseUrl/api/v1/calculate" `
    -Method Post `
    -Body (@{amount=50000; currency="INR"} | ConvertTo-Json) `
    -ContentType "application/json"

# Test 2: Get history
Write-Host "`nTest 2: Get history"
Invoke-RestMethod -Uri "$baseUrl/api/v1/history?page=1&page_size=5"

# Test 3: Get currencies
Write-Host "`nTest 3: Get currencies"
Invoke-RestMethod -Uri "$baseUrl/api/v1/currencies"

# Test 4: Export CSV
Write-Host "`nTest 4: Export CSV"
Invoke-WebRequest -Uri "$baseUrl/api/v1/export/csv" -OutFile "test_export.csv"
Write-Host "Exported to test_export.csv"
```

Run with:
```powershell
.\test_api.ps1
```

---

## 🎓 For Academic Presentation

### Quick Demo Sequence (5 minutes)

1. **Show Architecture** (1 min)
   - Open `docs\ARCHITECTURE.md`
   - Show the layer diagram
   - Explain offline-first design

2. **Demo Core Engine** (1 min)
   ```powershell
   python test_engine.py
   ```
   - Point out large number handling
   - Show multi-currency support

3. **Demo API** (2 min)
   - Open http://localhost:8001/docs
   - Execute POST /api/v1/calculate
   - Show breakdown result
   - Quick history query

4. **Show Code Quality** (1 min)
   - Open `packages\core-engine\engine.py`
   - Point out clean architecture
   - Show documentation

**Total:** Impressive 5-minute demo!

---

## ✅ Final Checklist

Before presenting:

- [ ] Backend starts without errors
- [ ] Can access http://localhost:8001/docs
- [ ] Test calculations work
- [ ] History saves correctly
- [ ] Export generates CSV
- [ ] Core engine tests pass
- [ ] Documentation reviewed
- [ ] Architecture diagram ready

---

**You're ready to demonstrate a production-quality system!** 🚀

**Questions?** Check the main README.md or PROJECT_SUMMARY.md

**Next Steps?** See ROADMAP.md for future development

---

**Created:** November 22, 2025  
**Status:** Ready for testing and demo  
**Time to run:** < 5 minutes

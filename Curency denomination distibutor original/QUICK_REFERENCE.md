# Quick Reference - Currency Denomination System

## Essential Commands

### Health Check
```powershell
.\health-check.ps1
```

### Run Tests
```powershell
# Quick (2 seconds)
cd packages\core-engine
.\test.ps1

# Full suite (5 seconds)
cd packages\core-engine
python test_engine.py
```

### Start Backend
```powershell
cd packages\local-backend
.\start.ps1
# Visit: http://localhost:8001/docs
```

### Interactive Menu
```powershell
.\start.ps1
```

## What Works Right Now

✅ **Core Engine** - Handles 1 trillion+ amounts  
✅ **Multi-Currency** - INR, USD, EUR, GBP  
✅ **API Backend** - 20+ REST endpoints  
✅ **All Tests Pass** - 6 quick + 7 comprehensive  

## Example Calculations

**Basic:**
```
Input: Rs.50,000
Output: 25 x Rs.2000 notes
```

**Large Amount:**
```
Input: Rs.1,000,000,000,000
Output: 500,000,000 denominations
```

**Currency Conversion:**
```
Input: $1,000 USD
Output: Rs.83,120 (41×Rs.2000 + 2×Rs.500 + 1×Rs.100 + 1×Rs.20)
```

## Project Structure

```
Currency Denomination Distributor/
├── packages/
│   ├── core-engine/      ✅ Complete (Python)
│   └── local-backend/    ✅ Complete (FastAPI)
├── README.md             ✅ Complete
├── INDEX.md              ✅ Documentation hub
├── STATUS.md             ✅ System status
├── health-check.ps1      ✅ Health checker
└── start.ps1             ✅ Quick start menu
```

## Documentation

- `README.md` - Overview
- `QUICKSTART.md` - 5-minute guide
- `GETTING_STARTED.md` - Detailed setup
- `ARCHITECTURE.md` - System design
- `ROADMAP.md` - Future plans
- `STATUS.md` - Current status
- `INDEX.md` - All docs

## Troubleshooting

**Import errors?**
```powershell
cd packages\core-engine
python verify.py
```

**API not starting?**
```powershell
cd packages\local-backend
python -m pip install -r requirements.txt
.\start.ps1
```

**Tests failing?**
```powershell
.\health-check.ps1
```

## Next Steps (Optional)

1. Desktop UI (Electron + React) - 2-3 weeks
2. Cloud Backend (PostgreSQL) - 2 weeks  
3. Mobile App (React Native) - 3-4 weeks
4. AI Integration (Gemini) - 1 week

---

**System Ready! 🎉**

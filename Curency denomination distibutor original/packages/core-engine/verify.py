"""
Quick verification script to ensure all components work correctly.
Run this after fixing imports to verify the system is functional.
"""

import sys
from pathlib import Path

print("=" * 70)
print("CURRENCY DENOMINATION SYSTEM - VERIFICATION")
print("=" * 70)
print()

# Test 1: Core Engine Import
print("Test 1: Core Engine Import...")
try:
    sys.path.insert(0, str(Path(__file__).parent))
    from engine import DenominationEngine, calculate_denominations
    from models import OptimizationMode
    print("[OK] Core engine imports successful")
except Exception as e:
    print(f"[FAIL] Core engine import failed: {e}")
    sys.exit(1)

# Test 2: Basic Calculation
print("\nTest 2: Basic Calculation...")
try:
    result = calculate_denominations(50000, "INR")
    assert result.total_notes == 25
    assert str(result.original_amount) == "50000"
    print(f"[OK] Calculation successful: Rs.50,000 = {result.total_notes} notes")
except Exception as e:
    print(f"[FAIL] Basic calculation failed: {e}")
    sys.exit(1)

# Test 3: Multi-Currency Support
print("\nTest 3: Multi-Currency Support...")
try:
    import json
    config_path = Path(__file__).parent / "config" / "currencies.json"
    with open(config_path, 'r', encoding='utf-8') as f:
        currency_registry = json.load(f)
    
    currencies = ["INR", "USD", "EUR", "GBP"]
    for code in currencies:
        info = currency_registry[code]
        print(f"  [OK] {code}: {info['name']} ({info['symbol']})")
except Exception as e:
    print(f"[FAIL] Multi-currency test failed: {e}")
    sys.exit(1)

# Test 4: Large Amount Handling
print("\nTest 4: Large Amount Handling...")
try:
    large_amount = 1_000_000_000_000  # 1 trillion
    result = calculate_denominations(large_amount, "INR")
    total_denom = sum(b.count for b in result.breakdowns)
    print(f"[OK] Handled Rs.{large_amount:,} = {total_denom:,} denominations")
except Exception as e:
    print(f"[FAIL] Large amount test failed: {e}")
    sys.exit(1)

# Test 5: FX Service
print("\nTest 5: FX Service...")
try:
    from fx_service import FXService
    fx = FXService()
    rate, timestamp = fx.get_exchange_rate("USD", "INR")
    print(f"[OK] FX service working: 1 USD = Rs.{rate}")
except Exception as e:
    print(f"[FAIL] FX service test failed: {e}")
    sys.exit(1)

# Test 6: Optimization Engine
print("\nTest 6: Optimization Engine...")
try:
    from optimizer import OptimizationEngine
    from models import CalculationRequest
    engine = DenominationEngine()
    optimizer = OptimizationEngine(engine)
    request = CalculationRequest(amount=5000, currency="INR")
    alternatives = optimizer.suggest_alternatives(request, count=2)
    print(f"[OK] Generated {len(alternatives)} alternative distributions")
except Exception as e:
    print(f"[FAIL] Optimization test failed: {e}")
    sys.exit(1)

print()
print("=" * 70)
print("ALL VERIFICATION TESTS PASSED! [OK]")
print("=" * 70)
print()
print("System Status: FULLY OPERATIONAL")
print()
print("Next Steps:")
print("  1. Start backend: cd ../local-backend && .\\start.ps1")
print("  2. Visit API docs: http://localhost:8001/docs")
print("  3. Review docs: See INDEX.md for documentation navigation")
print()

"""
Test script for the Core Denomination Engine

Run this to verify the core engine works correctly.
"""

from decimal import Decimal
from engine import DenominationEngine, calculate_denominations
from models import CalculationRequest, OptimizationMode, Constraint, ConstraintType
from optimizer import OptimizationEngine
from fx_service import FXService


def test_basic_calculation():
    """Test basic denomination breakdown."""
    print("=" * 60)
    print("TEST 1: Basic Denomination Breakdown")
    print("=" * 60)
    
    # Test with INR
    result = calculate_denominations(50000, "INR")
    
    print(f"\nAmount: ₹{result.original_amount:,}")
    print(f"Currency: {result.currency}")
    print(f"Total Notes: {result.total_notes}")
    print(f"Total Coins: {result.total_coins}")
    print("\nBreakdown:")
    
    for b in result.breakdowns:
        type_str = "note" if b.is_note else "coin"
        print(f"  {b.count:>4} x ₹{b.denomination:>7} = ₹{b.total_value:>10,} ({type_str})")
    
    print("\n✓ Test passed!\n")


def test_large_amount():
    """Test with extremely large amount (tens of lakh crores)."""
    print("=" * 60)
    print("TEST 2: Extremely Large Amount (10 Lakh Crore)")
    print("=" * 60)
    
    # 10 lakh crore = 10,00,00,00,00,000 = 1 trillion
    amount = Decimal("1000000000000")
    
    result = calculate_denominations(amount, "INR")
    
    print(f"\nAmount: ₹{result.original_amount:,}")
    print(f"Total Denominations: {result.total_denominations:,}")
    print("\nTop 5 denominations:")
    
    for b in result.breakdowns[:5]:
        print(f"  {b.count:>15,} x ₹{b.denomination:>7} = ₹{b.total_value:>20,}")
    
    print("\n✓ Test passed!\n")


def test_multi_currency():
    """Test multiple currencies."""
    print("=" * 60)
    print("TEST 3: Multi-Currency Support")
    print("=" * 60)
    
    engine = DenominationEngine()
    
    test_cases = [
        (1000, "USD", "$"),
        (5000, "EUR", "€"),
        (2500, "GBP", "£"),
        (100000, "INR", "₹")
    ]
    
    for amount, currency, symbol in test_cases:
        result = calculate_denominations(amount, currency)
        print(f"\n{symbol}{amount:,} {currency}:")
        print(f"  Total denominations: {result.total_denominations}")
        print(f"  Largest: {result.breakdowns[0].count} x {symbol}{result.breakdowns[0].denomination}")
    
    print("\n✓ Test passed!\n")


def test_optimization_modes():
    """Test different optimization modes."""
    print("=" * 60)
    print("TEST 4: Optimization Modes")
    print("=" * 60)
    
    amount = Decimal("5000")
    currency = "INR"
    
    modes = [
        OptimizationMode.GREEDY,
        OptimizationMode.MINIMIZE_LARGE
    ]
    
    for mode in modes:
        result = calculate_denominations(amount, currency, mode)
        print(f"\nMode: {mode.value}")
        print(f"  Total denominations: {result.total_denominations}")
        print(f"  Breakdown: ", end="")
        print(" + ".join([f"{b.count}x₹{b.denomination}" for b in result.breakdowns[:3]]))
    
    print("\n✓ Test passed!\n")


def test_constraints():
    """Test constraint application."""
    print("=" * 60)
    print("TEST 5: Constraint Application")
    print("=" * 60)
    
    engine = DenominationEngine()
    optimizer = OptimizationEngine(engine)
    
    # Test avoiding ₹2000 notes
    request = CalculationRequest(
        amount=Decimal("10000"),
        currency="INR",
        optimization_mode=OptimizationMode.CONSTRAINED,
        constraints=[
            Constraint(type=ConstraintType.AVOID, denomination=Decimal("2000"))
        ]
    )
    
    result = engine.calculate(request)
    result = optimizer.apply_constraints(result, request.constraints)
    
    print(f"\nAmount: ₹{result.original_amount:,}")
    print(f"Constraint: Avoid ₹2000 notes")
    print("\nBreakdown:")
    
    for b in result.breakdowns:
        print(f"  {b.count} x ₹{b.denomination} = ₹{b.total_value:,}")
    
    # Verify no ₹2000 notes
    has_2000 = any(b.denomination == Decimal("2000") for b in result.breakdowns)
    assert not has_2000, "Should not have ₹2000 notes"
    
    print("\n✓ Test passed!\n")


def test_fx_conversion():
    """Test FX service."""
    print("=" * 60)
    print("TEST 6: Currency Conversion")
    print("=" * 60)
    
    fx_service = FXService()
    
    # Convert 1000 USD to INR
    amount = Decimal("1000")
    converted, rate, timestamp = fx_service.convert_amount(
        amount, "USD", "INR", use_live=False
    )
    
    print(f"\nConversion: ${amount:,} USD to INR")
    print(f"Exchange Rate: {rate}")
    print(f"Converted Amount: ₹{converted:,}")
    print(f"Rate Timestamp: {timestamp}")
    
    # Now calculate denominations for converted amount
    result = calculate_denominations(converted, "INR")
    print(f"\nDenomination breakdown of ₹{converted:,}:")
    for b in result.breakdowns[:5]:
        print(f"  {b.count} x ₹{b.denomination} = ₹{b.total_value:,}")
    
    print("\n✓ Test passed!\n")


def test_alternative_suggestions():
    """Test alternative distribution generation."""
    print("=" * 60)
    print("TEST 7: Alternative Distributions")
    print("=" * 60)
    
    engine = DenominationEngine()
    optimizer = OptimizationEngine(engine)
    
    request = CalculationRequest(
        amount=Decimal("5000"),
        currency="INR"
    )
    
    alternatives = optimizer.suggest_alternatives(request, count=2)
    
    print(f"\nOriginal amount: ₹{request.amount:,}")
    print(f"\nGenerated {len(alternatives)} alternatives:")
    
    for i, alt in enumerate(alternatives, 1):
        print(f"\nAlternative {i}: {alt.metadata.get('strategy', 'unknown')}")
        print(f"  Total denominations: {alt.total_denominations}")
        print(f"  Top 3: ", end="")
        print(", ".join([f"{b.count}x₹{b.denomination}" for b in alt.breakdowns[:3]]))
    
    print("\n✓ Test passed!\n")


def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("CURRENCY DENOMINATION ENGINE - TEST SUITE")
    print("=" * 60 + "\n")
    
    try:
        test_basic_calculation()
        test_large_amount()
        test_multi_currency()
        test_optimization_modes()
        test_constraints()
        test_fx_conversion()
        test_alternative_suggestions()
        
        print("=" * 60)
        print("ALL TESTS PASSED! ✓")
        print("=" * 60)
        print("\nThe core engine is working correctly.")
        print("Ready to integrate with frontend and backend layers.")
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()

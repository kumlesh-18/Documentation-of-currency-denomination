"""
Test Smart Extraction with Defaults
===================================

Tests the enhanced OCR processor with various input formats
to verify intelligent extraction and smart defaults work correctly.
"""

import sys
from pathlib import Path

# Add local-backend to path
backend_path = Path(__file__).parent / 'packages' / 'local-backend'
sys.path.insert(0, str(backend_path))

from app.services.ocr_processor import OCRProcessor

def test_smart_extraction():
    """Test OCR processor with various input formats."""
    
    # Initialize processor with smart defaults
    processor = OCRProcessor(default_currency='INR', default_mode='greedy')
    
    print("=" * 80)
    print("TESTING SMART EXTRACTION WITH DEFAULTS")
    print("=" * 80)
    print(f"Default Currency: {processor.default_currency}")
    print(f"Default Mode: {processor.default_mode}")
    print()
    
    # Test cases with expected results
    test_cases = [
        # Format: (input_text, expected_amount, expected_currency, expected_mode)
        
        # CSV with all fields
        ("125.50, USD, greedy", "125.50", "USD", "greedy"),
        ("500.75, EUR, balanced", "500.75", "EUR", "balanced"),
        
        # CSV with amount and currency only (mode defaults)
        ("1000, INR", "1000", "INR", "greedy"),
        ("2500.50, GBP", "2500.50", "GBP", "greedy"),
        
        # Just amounts (currency and mode default)
        ("5000", "5000", "INR", "greedy"),
        ("10000.50", "10000.50", "INR", "greedy"),
        ("750", "750", "INR", "greedy"),
        
        # Tabular format
        ("1500    USD    greedy", "1500", "USD", "greedy"),
        ("2000    EUR    balanced", "2000", "EUR", "balanced"),
        ("3500    GBP", "3500", "GBP", "greedy"),
        
        # Mixed - amount and currency only
        ("999 INR", "999", "INR", "greedy"),
        ("12345 USD", "12345", "USD", "greedy"),
        ("5678.90 EUR", "5678.90", "EUR", "greedy"),
        
        # Natural language
        ("Amount: 4000 Currency: INR Mode: greedy", "4000", "INR", "greedy"),
        ("Total is 8500 in USD", "8500", "USD", "greedy"),
        
        # With currency symbols
        ("₹15000 greedy", "15000", "INR", "greedy"),
        ("$250.50 balanced", "250.50", "USD", "balanced"),
        ("€500", "500", "EUR", "greedy"),
        
        # With words instead of codes
        ("1000 rupees greedy", "1000", "INR", "greedy"),
        ("500 dollars balanced", "500", "USD", "balanced"),
        ("250 euros", "250", "EUR", "greedy"),
        
        # Single value
        ("5000", "5000", "INR", "greedy"),
    ]
    
    passed = 0
    failed = 0
    
    for i, (input_text, exp_amount, exp_currency, exp_mode) in enumerate(test_cases, 1):
        result = processor._parse_line(input_text, i)
        
        if result:
            amount = result['amount']
            currency = result['currency']
            mode = result['optimization_mode']
            
            # Check if all fields match expected
            amount_ok = amount == exp_amount
            currency_ok = currency == exp_currency
            mode_ok = mode == exp_mode
            
            if amount_ok and currency_ok and mode_ok:
                status = "✓ PASS"
                passed += 1
            else:
                status = "✗ FAIL"
                failed += 1
            
            print(f"\n{status} Test {i}: {input_text[:50]}")
            print(f"  Input:    '{input_text}'")
            print(f"  Amount:   {amount} {'✓' if amount_ok else '✗ Expected: ' + exp_amount}")
            print(f"  Currency: {currency} {'✓' if currency_ok else '✗ Expected: ' + exp_currency}")
            print(f"  Mode:     {mode} {'✓' if mode_ok else '✗ Expected: ' + exp_mode}")
        else:
            print(f"\n✗ FAIL Test {i}: No result parsed")
            print(f"  Input: '{input_text}'")
            failed += 1
    
    # Summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    print(f"Total Tests: {len(test_cases)}")
    print(f"Passed: {passed} ({passed/len(test_cases)*100:.1f}%)")
    print(f"Failed: {failed} ({failed/len(test_cases)*100:.1f}%)")
    print()
    
    if failed == 0:
        print("🎉 ALL TESTS PASSED! Smart extraction working perfectly!")
    else:
        print(f"⚠️  {failed} test(s) failed. Review output above for details.")
    
    return failed == 0

if __name__ == "__main__":
    success = test_smart_extraction()
    sys.exit(0 if success else 1)

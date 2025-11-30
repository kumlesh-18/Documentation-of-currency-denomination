"""
Core Denomination Engine

This module implements the core denomination breakdown logic.
Supports arbitrary precision mathematics for extremely large amounts.

Key Features:
- Greedy algorithm optimized for minimal denomination count
- Support for amounts up to 10^15 (quadrillion) and beyond
- Pure integer mathematics to avoid floating-point errors
- Configurable currency denominations
- Thread-safe and stateless design
"""

import json
from decimal import Decimal, ROUND_DOWN
from pathlib import Path
from typing import List, Dict, Optional
from models import (
    CalculationRequest,
    CalculationResult,
    DenominationBreakdown,
    CurrencyConfig,
    OptimizationMode
)


class DenominationEngine:
    """
    Core engine for currency denomination breakdown.
    
    This is a pure, stateless computation engine with no external dependencies.
    Can be used across desktop, mobile backend, and cloud services.
    """
    
    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize the denomination engine.
        
        Args:
            config_path: Path to currencies.json config file.
                        If None, uses default config location.
        """
        if config_path is None:
            config_path = Path(__file__).parent / "config" / "currencies.json"
        
        self.currencies = self._load_currency_configs(config_path)
    
    def _load_currency_configs(self, config_path: str) -> Dict[str, CurrencyConfig]:
        """Load currency configurations from JSON file."""
        with open(config_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        currencies = {}
        for code, config in data.items():
            currencies[code] = CurrencyConfig(
                code=config['code'],
                name=config['name'],
                symbol=config['symbol'],
                decimal_places=config['decimal_places'],
                notes=[Decimal(str(n)) for n in config['notes']],
                coins=[Decimal(str(c)) for c in config['coins']],
                smallest_unit=Decimal(str(config['smallest_unit'])),
                active=config.get('active', True)
            )
        
        return currencies
    
    def get_currency_config(self, currency_code: str) -> CurrencyConfig:
        """
        Get configuration for a specific currency.
        
        Args:
            currency_code: 3-letter ISO currency code (e.g., 'INR', 'USD')
        
        Returns:
            CurrencyConfig object
        
        Raises:
            ValueError: If currency is not supported
        """
        currency_code = currency_code.upper()
        if currency_code not in self.currencies:
            raise ValueError(
                f"Currency '{currency_code}' not supported. "
                f"Available: {', '.join(self.currencies.keys())}"
            )
        
        config = self.currencies[currency_code]
        if not config.active:
            raise ValueError(f"Currency '{currency_code}' is not currently active")
        
        return config
    
    def calculate(self, request: CalculationRequest) -> CalculationResult:
        """
        Calculate denomination breakdown for given amount.
        
        Args:
            request: CalculationRequest with amount, currency, and options
        
        Returns:
            CalculationResult with denomination breakdown
        
        Raises:
            ValueError: If currency not supported or amount invalid
        """
        # Get currency configuration
        currency_config = self.get_currency_config(request.currency)
        
        # Use the amount (already validated in CalculationRequest.__post_init__)
        amount = request.amount
        
        # Get denominations based on optimization mode
        denominations = self._get_denominations_for_mode(
            currency_config, 
            request.optimization_mode,
            request.constraints
        )
        
        # Perform greedy breakdown
        breakdowns = self._greedy_breakdown(
            amount,
            denominations,
            currency_config
        )
        
        # Calculate totals
        total_notes = sum(b.count for b in breakdowns if b.is_note)
        total_coins = sum(b.count for b in breakdowns if b.is_coin)
        
        # Create result
        result = CalculationResult(
            original_amount=request.amount,
            currency=request.currency,
            breakdowns=breakdowns,
            total_notes=total_notes,
            total_coins=total_coins,
            total_denominations=total_notes + total_coins,
            optimization_mode=request.optimization_mode,
            constraints_applied=request.constraints,
            metadata=request.metadata.copy()
        )
        
        return result
    
    def _get_denominations_for_mode(
        self,
        currency_config: CurrencyConfig,
        mode: OptimizationMode,
        constraints: List
    ) -> List[Decimal]:
        """
        Get sorted denominations based on optimization mode.
        
        Args:
            currency_config: Currency configuration
            mode: Optimization mode
            constraints: List of constraints
        
        Returns:
            Sorted list of denominations to use
        """
        all_denoms = currency_config.all_denominations
        
        if mode == OptimizationMode.GREEDY:
            # Standard greedy: largest first
            return all_denoms
        
        elif mode == OptimizationMode.MINIMIZE_LARGE:
            # Reverse order: prefer smaller denominations
            return sorted(all_denoms)
        
        elif mode == OptimizationMode.MINIMIZE_SMALL:
            # Standard order but could filter out small ones
            # For now, same as greedy
            return all_denoms
        
        elif mode == OptimizationMode.BALANCED:
            # Could implement custom ordering
            return all_denoms
        
        else:
            # Default to greedy
            return all_denoms
    
    def _greedy_breakdown(
        self,
        amount: Decimal,
        denominations: List[Decimal],
        currency_config: CurrencyConfig
    ) -> List[DenominationBreakdown]:
        """
        Perform greedy denomination breakdown.
        
        This is the core algorithm. Uses pure decimal arithmetic to avoid
        floating-point errors, supporting arbitrarily large amounts.
        
        Args:
            amount: Amount to break down
            denominations: Sorted list of denominations (descending)
            currency_config: Currency configuration
        
        Returns:
            List of DenominationBreakdown objects
        """
        remaining = amount
        breakdowns = []
        
        for denom in denominations:
            if remaining <= 0:
                break
            
            # Calculate count for this denomination
            # Using integer division to avoid floating-point issues
            count = int(remaining / denom)
            
            if count > 0:
                total_value = denom * count
                remaining -= total_value
                
                # Determine if note or coin
                is_note = currency_config.is_note(denom)
                
                breakdowns.append(DenominationBreakdown(
                    denomination=denom,
                    count=count,
                    total_value=total_value,
                    is_note=is_note
                ))
        
        # Handle rounding errors (should be minimal with Decimal)
        if remaining > 0:
            # Round down to smallest unit
            remaining = remaining.quantize(
                currency_config.smallest_unit,
                rounding=ROUND_DOWN
            )
            
            if remaining > 0:
                # Add remaining as metadata warning
                # In practice, this should rarely happen with proper denomination sets
                pass
        
        return breakdowns
    
    def generate_alternatives(
        self,
        request: CalculationRequest,
        count: int = 3
    ) -> List[CalculationResult]:
        """
        Generate alternative denomination breakdowns.
        
        Args:
            request: Original calculation request
            count: Number of alternatives to generate
        
        Returns:
            List of alternative CalculationResult objects
        """
        alternatives = []
        
        # Generate alternatives using different optimization modes
        modes = [
            OptimizationMode.GREEDY,
            OptimizationMode.MINIMIZE_LARGE,
            OptimizationMode.BALANCED
        ]
        
        for mode in modes[:count]:
            if mode != request.optimization_mode:
                alt_request = CalculationRequest(
                    amount=request.amount,
                    currency=request.currency,
                    optimization_mode=mode,
                    constraints=request.constraints,
                    metadata={'alternative_to': str(request.optimization_mode)}
                )
                
                result = self.calculate(alt_request)
                alternatives.append(result)
        
        return alternatives
    
    def validate_amount(
        self,
        amount: Decimal,
        currency_code: str
    ) -> tuple[bool, Optional[str]]:
        """
        Validate if amount can be broken down with available denominations.
        
        Args:
            amount: Amount to validate
            currency_code: Currency code
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        try:
            currency_config = self.get_currency_config(currency_code)
            
            # Check if amount is positive
            if amount <= 0:
                return False, "Amount must be positive"
            
            # Check if amount is multiple of smallest unit
            remainder = amount % currency_config.smallest_unit
            if remainder != 0:
                return False, f"Amount must be multiple of {currency_config.smallest_unit}"
            
            return True, None
            
        except ValueError as e:
            return False, str(e)
    
    def get_supported_currencies(self) -> List[str]:
        """Get list of supported currency codes."""
        return [code for code, config in self.currencies.items() if config.active]
    
    def get_currency_info(self, currency_code: str) -> Dict:
        """
        Get detailed information about a currency.
        
        Args:
            currency_code: 3-letter currency code
        
        Returns:
            Dictionary with currency details
        """
        config = self.get_currency_config(currency_code)
        
        return {
            'code': config.code,
            'name': config.name,
            'symbol': config.symbol,
            'decimal_places': config.decimal_places,
            'notes': [str(n) for n in config.notes],
            'coins': [str(c) for c in config.coins],
            'smallest_unit': str(config.smallest_unit),
            'total_denominations': len(config.all_denominations)
        }


# Convenience function for quick calculations
def calculate_denominations(
    amount: float | Decimal | str,
    currency: str,
    optimization_mode: OptimizationMode = OptimizationMode.GREEDY
) -> CalculationResult:
    """
    Quick calculation function.
    
    Args:
        amount: Amount to break down (will be converted to Decimal)
        currency: 3-letter currency code
        optimization_mode: Optimization strategy
    
    Returns:
        CalculationResult
    
    Example:
        >>> result = calculate_denominations(50000, "INR")
        >>> for b in result.breakdowns:
        ...     print(f"{b.count} x {b.denomination} = {b.total_value}")
    """
    engine = DenominationEngine()
    
    request = CalculationRequest(
        amount=Decimal(str(amount)),
        currency=currency,
        optimization_mode=optimization_mode
    )
    
    return engine.calculate(request)

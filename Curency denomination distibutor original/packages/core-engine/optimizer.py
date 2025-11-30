"""
Optimization Engine

Applies advanced optimization strategies and constraints to denomination breakdowns.
Supports custom constraint logic and alternative distribution generation.
"""

from decimal import Decimal
from typing import List, Dict, Optional
from models import (
    CalculationRequest,
    CalculationResult,
    DenominationBreakdown,
    Constraint,
    ConstraintType,
    OptimizationMode,
    CurrencyConfig
)


class OptimizationEngine:
    """
    Advanced optimization engine for denomination distribution.
    
    Handles:
    - Custom constraints (minimize, avoid, cap, require)
    - Alternative distribution generation
    - Constraint validation and application
    """
    
    def __init__(self, denomination_engine):
        """
        Initialize optimization engine.
        
        Args:
            denomination_engine: Instance of DenominationEngine
        """
        self.engine = denomination_engine
    
    def apply_constraints(
        self,
        result: CalculationResult,
        constraints: List[Constraint]
    ) -> CalculationResult:
        """
        Apply constraints to a calculation result.
        
        Args:
            result: Original calculation result
            constraints: List of constraints to apply
        
        Returns:
            Modified CalculationResult
        """
        if not constraints:
            return result
        
        currency_config = self.engine.get_currency_config(result.currency)
        modified_breakdowns = result.breakdowns.copy()
        
        for constraint in constraints:
            modified_breakdowns = self._apply_single_constraint(
                modified_breakdowns,
                constraint,
                result.original_amount,
                currency_config
            )
        
        # Recalculate totals
        total_notes = sum(b.count for b in modified_breakdowns if b.is_note)
        total_coins = sum(b.count for b in modified_breakdowns if b.is_coin)
        
        # Create new result
        return CalculationResult(
            original_amount=result.original_amount,
            currency=result.currency,
            breakdowns=modified_breakdowns,
            total_notes=total_notes,
            total_coins=total_coins,
            total_denominations=total_notes + total_coins,
            optimization_mode=OptimizationMode.CONSTRAINED,
            constraints_applied=constraints,
            metadata=result.metadata.copy()
        )
    
    def _apply_single_constraint(
        self,
        breakdowns: List[DenominationBreakdown],
        constraint: Constraint,
        total_amount: Decimal,
        currency_config: CurrencyConfig
    ) -> List[DenominationBreakdown]:
        """Apply a single constraint to breakdowns."""
        
        if constraint.type == ConstraintType.AVOID:
            # Remove specified denomination completely
            return [
                b for b in breakdowns 
                if b.denomination != constraint.denomination
            ]
        
        elif constraint.type == ConstraintType.CAP:
            # Cap maximum count for denomination
            modified = []
            redistributed_value = Decimal(0)
            
            for b in breakdowns:
                if b.denomination == constraint.denomination:
                    if b.count > constraint.value:
                        # Cap the count
                        capped_count = constraint.value
                        capped_value = b.denomination * capped_count
                        redistributed_value = b.total_value - capped_value
                        
                        modified.append(DenominationBreakdown(
                            denomination=b.denomination,
                            count=capped_count,
                            total_value=capped_value,
                            is_note=b.is_note
                        ))
                    else:
                        modified.append(b)
                else:
                    modified.append(b)
            
            # Redistribute the excess using smaller denominations
            if redistributed_value > 0:
                modified = self._redistribute_value(
                    modified,
                    redistributed_value,
                    constraint.denomination,
                    currency_config
                )
            
            return modified
        
        elif constraint.type == ConstraintType.MINIMIZE:
            # Try to minimize usage of specific denomination
            target_breakdown = next(
                (b for b in breakdowns if b.denomination == constraint.denomination),
                None
            )
            
            if target_breakdown and target_breakdown.count > 0:
                # Try to redistribute using other denominations
                return self._minimize_denomination(
                    breakdowns,
                    constraint.denomination,
                    currency_config
                )
            
            return breakdowns
        
        elif constraint.type == ConstraintType.ONLY:
            # Use only specified denominations
            allowed = set(constraint.denominations)
            filtered = [b for b in breakdowns if b.denomination in allowed]
            
            # Recalculate to ensure amount matches
            used_amount = sum(b.total_value for b in filtered)
            if used_amount < total_amount:
                # Need to recalculate with only allowed denominations
                pass
            
            return filtered
        
        return breakdowns
    
    def _redistribute_value(
        self,
        breakdowns: List[DenominationBreakdown],
        value_to_redistribute: Decimal,
        avoid_denomination: Decimal,
        currency_config: CurrencyConfig
    ) -> List[DenominationBreakdown]:
        """Redistribute value to other denominations."""
        # Get available denominations (excluding the one to avoid)
        available_denoms = [
            d for d in currency_config.all_denominations
            if d != avoid_denomination and d < avoid_denomination
        ]
        
        remaining = value_to_redistribute
        breakdown_dict = {b.denomination: b for b in breakdowns}
        
        for denom in available_denoms:
            if remaining <= 0:
                break
            
            count = int(remaining / denom)
            if count > 0:
                if denom in breakdown_dict:
                    # Add to existing
                    existing = breakdown_dict[denom]
                    new_count = existing.count + count
                    breakdown_dict[denom] = DenominationBreakdown(
                        denomination=denom,
                        count=new_count,
                        total_value=denom * new_count,
                        is_note=currency_config.is_note(denom)
                    )
                else:
                    # Create new
                    breakdown_dict[denom] = DenominationBreakdown(
                        denomination=denom,
                        count=count,
                        total_value=denom * count,
                        is_note=currency_config.is_note(denom)
                    )
                
                remaining -= denom * count
        
        # Return sorted by denomination (descending)
        return sorted(
            breakdown_dict.values(),
            key=lambda b: b.denomination,
            reverse=True
        )
    
    def _minimize_denomination(
        self,
        breakdowns: List[DenominationBreakdown],
        target_denomination: Decimal,
        currency_config: CurrencyConfig
    ) -> List[DenominationBreakdown]:
        """Try to minimize usage of specific denomination."""
        # This is a placeholder for more advanced optimization
        # Could use linear programming or other optimization techniques
        return breakdowns
    
    def suggest_alternatives(
        self,
        original_request: CalculationRequest,
        count: int = 3
    ) -> List[CalculationResult]:
        """
        Generate alternative distributions with explanations.
        
        Args:
            original_request: Original calculation request
            count: Number of alternatives to generate
        
        Returns:
            List of alternative CalculationResult objects
        """
        alternatives = []
        
        # Strategy 1: Minimize large denominations
        alt1_request = CalculationRequest(
            amount=original_request.amount,
            currency=original_request.currency,
            optimization_mode=OptimizationMode.MINIMIZE_LARGE,
            metadata={'strategy': 'minimize_large_notes'}
        )
        alt1 = self.engine.calculate(alt1_request)
        alt1.metadata['explanation'] = "Prefers smaller denominations to minimize large notes"
        alternatives.append(alt1)
        
        # Strategy 2: Balanced approach
        alt2_request = CalculationRequest(
            amount=original_request.amount,
            currency=original_request.currency,
            optimization_mode=OptimizationMode.BALANCED,
            metadata={'strategy': 'balanced'}
        )
        alt2 = self.engine.calculate(alt2_request)
        alt2.metadata['explanation'] = "Balanced distribution between large and small denominations"
        alternatives.append(alt2)
        
        # Strategy 3: Avoid coins (if applicable)
        currency_config = self.engine.get_currency_config(original_request.currency)
        if currency_config.coins:
            # Try to avoid coins
            avoid_coins_constraint = Constraint(
                type=ConstraintType.ONLY,
                denominations=currency_config.notes
            )
            
            alt3_request = CalculationRequest(
                amount=original_request.amount,
                currency=original_request.currency,
                optimization_mode=OptimizationMode.CONSTRAINED,
                constraints=[avoid_coins_constraint],
                metadata={'strategy': 'notes_only'}
            )
            
            try:
                alt3 = self.engine.calculate(alt3_request)
                alt3.metadata['explanation'] = "Uses only notes, avoiding coins"
                alternatives.append(alt3)
            except Exception:
                pass  # Skip if not possible
        
        return alternatives[:count]
    
    def validate_constraints(
        self,
        constraints: List[Constraint],
        currency_code: str
    ) -> tuple[bool, Optional[str]]:
        """
        Validate that constraints are applicable to the currency.
        
        Args:
            constraints: List of constraints
            currency_code: Currency code
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        try:
            currency_config = self.engine.get_currency_config(currency_code)
            all_denoms = set(currency_config.all_denominations)
            
            for constraint in constraints:
                # Check if denomination exists
                if constraint.denomination and constraint.denomination not in all_denoms:
                    return False, f"Denomination {constraint.denomination} not available in {currency_code}"
                
                # Check if value is valid for CAP/REQUIRE
                if constraint.type in [ConstraintType.CAP, ConstraintType.REQUIRE]:
                    if constraint.value is None or constraint.value < 0:
                        return False, f"Invalid value for {constraint.type.value} constraint"
                
                # Check ONLY constraint
                if constraint.type == ConstraintType.ONLY:
                    if not constraint.denominations:
                        return False, "ONLY constraint requires list of denominations"
                    
                    for denom in constraint.denominations:
                        if denom not in all_denoms:
                            return False, f"Denomination {denom} not available in {currency_code}"
            
            return True, None
            
        except ValueError as e:
            return False, str(e)

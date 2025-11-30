"""
Data models for the core denomination engine.

These are pure Python dataclasses with no external dependencies,
making them portable across all platforms (desktop, mobile backend, cloud).
"""

from dataclasses import dataclass, field
from decimal import Decimal
from typing import Dict, List, Optional, Any
from enum import Enum


class OptimizationMode(str, Enum):
    """Optimization strategies for denomination breakdown."""
    GREEDY = "greedy"                          # Minimize total count
    CONSTRAINED = "constrained"                # Apply custom constraints
    MINIMIZE_LARGE = "minimize_large"          # Avoid large denominations
    MINIMIZE_SMALL = "minimize_small"          # Avoid small denominations
    BALANCED = "balanced"                      # Balance between large and small
    AI_SUGGESTED = "ai_suggested"              # Gemini-powered suggestions


class ConstraintType(str, Enum):
    """Types of constraints that can be applied."""
    MINIMIZE = "minimize"                      # Minimize usage of specific denomination
    AVOID = "avoid"                            # Completely avoid denomination
    CAP = "cap"                                # Cap maximum count for denomination
    REQUIRE = "require"                        # Require minimum count
    ONLY = "only"                              # Use only specified denominations


@dataclass
class Constraint:
    """Represents a single constraint on denomination breakdown."""
    type: ConstraintType
    denomination: Optional[Decimal] = None
    value: Optional[int] = None                # For CAP, REQUIRE
    denominations: Optional[List[Decimal]] = None  # For ONLY


@dataclass
class DenominationBreakdown:
    """Represents the count for a single denomination."""
    denomination: Decimal
    count: int
    total_value: Decimal
    is_note: bool                              # True for notes, False for coins
    
    def __post_init__(self):
        """Ensure total_value is calculated correctly."""
        if self.total_value is None:
            self.total_value = self.denomination * self.count
    
    @property
    def is_coin(self) -> bool:
        """Check if this is a coin (opposite of is_note)."""
        return not self.is_note


@dataclass
class CalculationRequest:
    """Input request for denomination calculation."""
    amount: Decimal
    currency: str
    optimization_mode: OptimizationMode = OptimizationMode.GREEDY
    constraints: List[Constraint] = field(default_factory=list)
    source_currency: Optional[str] = None      # For FX conversion
    convert_before_breakdown: bool = True       # Convert then breakdown, or vice versa
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def __post_init__(self):
        """Validate and normalize the request."""
        # Ensure amount is Decimal
        if not isinstance(self.amount, Decimal):
            self.amount = Decimal(str(self.amount))
        
        # Validate amount is positive
        if self.amount <= 0:
            raise ValueError("Amount must be positive")
        
        # Normalize currency codes to uppercase
        self.currency = self.currency.upper()
        if self.source_currency:
            self.source_currency = self.source_currency.upper()


@dataclass
class CalculationResult:
    """Output result from denomination calculation."""
    original_amount: Decimal
    currency: str
    breakdowns: List[DenominationBreakdown]
    total_notes: int
    total_coins: int
    total_denominations: int
    optimization_mode: OptimizationMode
    constraints_applied: List[Constraint]
    
    # FX related fields
    source_currency: Optional[str] = None
    exchange_rate: Optional[Decimal] = None
    converted_amount: Optional[Decimal] = None
    
    # AI/Explanation fields
    explanation: Optional[str] = None
    alternatives: Optional[List['CalculationResult']] = None
    
    # Metadata
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            'original_amount': str(self.original_amount),
            'currency': self.currency,
            'breakdowns': [
                {
                    'denomination': str(b.denomination),
                    'count': b.count,
                    'total_value': str(b.total_value),
                    'is_note': b.is_note
                }
                for b in self.breakdowns
            ],
            'total_notes': self.total_notes,
            'total_coins': self.total_coins,
            'total_denominations': self.total_denominations,
            'optimization_mode': self.optimization_mode.value,
            'constraints_applied': [
                {
                    'type': c.type.value,
                    'denomination': str(c.denomination) if c.denomination else None,
                    'value': c.value,
                    'denominations': [str(d) for d in c.denominations] if c.denominations else None
                }
                for c in self.constraints_applied
            ],
            'source_currency': self.source_currency,
            'exchange_rate': str(self.exchange_rate) if self.exchange_rate else None,
            'converted_amount': str(self.converted_amount) if self.converted_amount else None,
            'explanation': self.explanation,
            'metadata': self.metadata
        }
    
    def get_total_value(self) -> Decimal:
        """Calculate total value from all breakdowns."""
        return sum(b.total_value for b in self.breakdowns)


@dataclass
class BulkCalculationRequest:
    """Request for bulk processing multiple calculations."""
    calculations: List[CalculationRequest]
    generate_summary: bool = True
    generate_analytics: bool = True
    
    def __post_init__(self):
        """Validate bulk request."""
        if not self.calculations:
            raise ValueError("At least one calculation required")


@dataclass
class BulkCalculationResult:
    """Result from bulk processing."""
    results: List[CalculationResult]
    summary: Dict[str, Any]
    analytics: Optional[Dict[str, Any]] = None
    total_processed: int = 0
    successful: int = 0
    failed: int = 0
    errors: List[Dict[str, str]] = field(default_factory=list)
    
    def __post_init__(self):
        """Calculate stats."""
        self.total_processed = len(self.results) + len(self.errors)
        self.successful = len(self.results)
        self.failed = len(self.errors)


@dataclass
class CurrencyConfig:
    """Configuration for a single currency."""
    code: str
    name: str
    symbol: str
    decimal_places: int
    notes: List[Decimal]
    coins: List[Decimal]
    smallest_unit: Decimal
    active: bool = True
    
    @property
    def all_denominations(self) -> List[Decimal]:
        """Get all denominations (notes + coins) in descending order."""
        return sorted(self.notes + self.coins, reverse=True)
    
    def is_note(self, denomination: Decimal) -> bool:
        """Check if denomination is a note."""
        return denomination in self.notes
    
    def is_coin(self, denomination: Decimal) -> bool:
        """Check if denomination is a coin."""
        return denomination in self.coins

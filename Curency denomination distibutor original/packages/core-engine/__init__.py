"""
Currency Denomination Engine - Core Module

This is the brain of the system. Pure Python logic with no framework dependencies.
Handles denomination breakdown for extremely large amounts with arbitrary precision.

Author: Currency Denomination System
License: MIT
"""

__version__ = "1.0.0"
__author__ = "Currency Denomination System Team"

from .engine import DenominationEngine
from .optimizer import OptimizationEngine
from .fx_service import FXService
from .models import (
    CalculationRequest,
    CalculationResult,
    DenominationBreakdown,
    OptimizationMode,
    Constraint
)

__all__ = [
    'DenominationEngine',
    'OptimizationEngine',
    'FXService',
    'CalculationRequest',
    'CalculationResult',
    'DenominationBreakdown',
    'OptimizationMode',
    'Constraint'
]

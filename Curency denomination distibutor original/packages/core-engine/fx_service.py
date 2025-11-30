"""
Foreign Exchange (FX) Service

Handles currency conversion and exchange rate management.
Supports both live rates (online mode) and cached rates (offline mode).
"""

from decimal import Decimal
from datetime import datetime, timedelta
from typing import Dict, Optional, List
import json
from pathlib import Path


class FXService:
    """
    Foreign Exchange service for currency conversion.
    
    Features:
    - Live exchange rate fetching (online mode)
    - Cached rates for offline use
    - Multiple rate providers support
    - Historical rate tracking
    """
    
    def __init__(self, cache_path: Optional[str] = None, api_key: Optional[str] = None):
        """
        Initialize FX service.
        
        Args:
            cache_path: Path to cache file for offline rates
            api_key: API key for live rate provider
        """
        if cache_path is None:
            cache_path = Path(__file__).parent / "config" / "fx_rates_cache.json"
        
        self.cache_path = cache_path
        self.api_key = api_key
        self.cache = self._load_cache()
        
        # Default base rates (fallback)
        self.default_rates = {
            'USD': Decimal('1.0'),      # Base currency
            'EUR': Decimal('0.92'),
            'GBP': Decimal('0.79'),
            'INR': Decimal('83.12')
        }
    
    def _load_cache(self) -> Dict:
        """Load cached exchange rates."""
        try:
            with open(self.cache_path, 'r') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return {'rates': {}, 'last_updated': None}
    
    def _save_cache(self):
        """Save exchange rates to cache."""
        try:
            with open(self.cache_path, 'w') as f:
                json.dump(self.cache, f, indent=2)
        except Exception as e:
            print(f"Warning: Could not save FX cache: {e}")
    
    def get_exchange_rate(
        self,
        from_currency: str,
        to_currency: str,
        use_live: bool = True
    ) -> tuple[Decimal, datetime]:
        """
        Get exchange rate between two currencies.
        
        Args:
            from_currency: Source currency code
            to_currency: Target currency code
            use_live: Whether to fetch live rate (requires internet)
        
        Returns:
            Tuple of (rate, timestamp)
        """
        from_currency = from_currency.upper()
        to_currency = to_currency.upper()
        
        # If same currency, rate is 1
        if from_currency == to_currency:
            return Decimal('1.0'), datetime.now()
        
        # Try to get live rate
        if use_live:
            live_rate = self._fetch_live_rate(from_currency, to_currency)
            if live_rate:
                return live_rate
        
        # Fall back to cached rate
        cache_key = f"{from_currency}_{to_currency}"
        if cache_key in self.cache.get('rates', {}):
            cached = self.cache['rates'][cache_key]
            return (
                Decimal(str(cached['rate'])),
                datetime.fromisoformat(cached['timestamp'])
            )
        
        # Fall back to default rates (for demo purposes)
        if from_currency in self.default_rates and to_currency in self.default_rates:
            # Calculate cross rate through USD
            from_rate = self.default_rates[from_currency]
            to_rate = self.default_rates[to_currency]
            rate = to_rate / from_rate
            
            # Cache this for offline use
            self._cache_rate(from_currency, to_currency, rate, datetime.now())
            
            return rate, datetime.now()
        
        raise ValueError(
            f"Exchange rate not available for {from_currency} to {to_currency}"
        )
    
    def _fetch_live_rate(
        self,
        from_currency: str,
        to_currency: str
    ) -> Optional[tuple[Decimal, datetime]]:
        """
        Fetch live exchange rate from API.
        
        This is a placeholder. In production, integrate with:
        - exchangerate-api.com
        - openexchangerates.org
        - fixer.io
        - or any other FX rate provider
        
        Args:
            from_currency: Source currency
            to_currency: Target currency
        
        Returns:
            Tuple of (rate, timestamp) or None if unavailable
        """
        # TODO: Implement actual API call
        # For now, return None to use cached/default rates
        
        # Example implementation:
        # try:
        #     import requests
        #     url = f"https://api.exchangerate-api.com/v4/latest/{from_currency}"
        #     response = requests.get(url, timeout=5)
        #     if response.status_code == 200:
        #         data = response.json()
        #         rate = Decimal(str(data['rates'][to_currency]))
        #         timestamp = datetime.now()
        #         
        #         # Cache the result
        #         self._cache_rate(from_currency, to_currency, rate, timestamp)
        #         
        #         return rate, timestamp
        # except Exception:
        #     pass
        
        return None
    
    def _cache_rate(
        self,
        from_currency: str,
        to_currency: str,
        rate: Decimal,
        timestamp: datetime
    ):
        """Cache an exchange rate."""
        cache_key = f"{from_currency}_{to_currency}"
        
        if 'rates' not in self.cache:
            self.cache['rates'] = {}
        
        self.cache['rates'][cache_key] = {
            'rate': str(rate),
            'timestamp': timestamp.isoformat(),
            'from': from_currency,
            'to': to_currency
        }
        
        self.cache['last_updated'] = datetime.now().isoformat()
        self._save_cache()
    
    def convert_amount(
        self,
        amount: Decimal,
        from_currency: str,
        to_currency: str,
        use_live: bool = True
    ) -> tuple[Decimal, Decimal, datetime]:
        """
        Convert amount from one currency to another.
        
        Args:
            amount: Amount to convert
            from_currency: Source currency
            to_currency: Target currency
            use_live: Whether to use live rates
        
        Returns:
            Tuple of (converted_amount, exchange_rate, rate_timestamp)
        """
        rate, timestamp = self.get_exchange_rate(
            from_currency,
            to_currency,
            use_live
        )
        
        converted = amount * rate
        
        return converted, rate, timestamp
    
    def get_all_rates(
        self,
        base_currency: str = 'USD',
        use_live: bool = True
    ) -> Dict[str, Decimal]:
        """
        Get exchange rates for all supported currencies.
        
        Args:
            base_currency: Base currency for rates
            use_live: Whether to fetch live rates
        
        Returns:
            Dictionary of currency_code -> rate
        """
        supported = ['USD', 'EUR', 'GBP', 'INR']
        rates = {}
        
        for currency in supported:
            if currency != base_currency:
                try:
                    rate, _ = self.get_exchange_rate(
                        base_currency,
                        currency,
                        use_live
                    )
                    rates[currency] = rate
                except Exception:
                    pass
        
        return rates
    
    def get_cache_age(self) -> Optional[timedelta]:
        """Get age of cached rates."""
        if self.cache.get('last_updated'):
            last_update = datetime.fromisoformat(self.cache['last_updated'])
            return datetime.now() - last_update
        return None
    
    def is_cache_stale(self, max_age_hours: int = 24) -> bool:
        """Check if cache is stale."""
        age = self.get_cache_age()
        if age is None:
            return True
        return age > timedelta(hours=max_age_hours)
    
    def refresh_all_rates(self, base_currency: str = 'USD'):
        """
        Refresh all cached rates.
        
        Args:
            base_currency: Base currency to fetch rates for
        """
        supported = ['USD', 'EUR', 'GBP', 'INR']
        
        for currency in supported:
            if currency != base_currency:
                try:
                    self.get_exchange_rate(
                        base_currency,
                        currency,
                        use_live=True
                    )
                except Exception:
                    pass

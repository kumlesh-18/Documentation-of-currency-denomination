# Smart Currency System Documentation

## Overview

The Smart Currency System provides intelligent, automatic currency detection and recommendation based on:

1. **System Timezone and Region** - Detects user's location from system timezone
2. **Historical Usage Patterns** - Learns from user's calculation history  
3. **Language Preferences** - Falls back to language-based currency mapping
4. **Real-time Adaptation** - Continuously evolves based on actual usage

This creates a seamless, zero-configuration experience where the application automatically suggests the most relevant currency without user intervention.

---

## Architecture

### Frontend Components

#### 1. **smartCurrency.ts Service**
Location: `packages/desktop-app/src/services/smartCurrency.ts`

**Key Features:**
- Timezone detection using `Intl.DateTimeFormat().resolvedOptions().timeZone`
- Locale detection using `navigator.language`
- Currency usage statistics from calculation history
- Caching mechanism (5-minute cache)
- Confidence scoring (high/medium/low)

**Main Methods:**
```typescript
// Get smart recommendation
getSmartCurrencyRecommendation(currentLanguage?: string): Promise<SmartCurrencyRecommendation>

// Record currency usage (invalidates cache)
recordCurrencyUsage(currency: string): void

// Get system info for debugging
getSystemInfo(): { timezone, locale, timestamp }
```

#### 2. **useSmartCurrency Hook**
Location: `packages/desktop-app/src/hooks/useSmartCurrency.ts`

React hook that provides:
```typescript
{
  recommendedCurrency: string | null,
  confidence: 'high' | 'medium' | 'low' | null,
  reason: string | null,
  alternatives: string[],
  isLoading: boolean,
  error: string | null,
  refresh: () => Promise<void>,
  recordUsage: (currency: string) => void
}
```

#### 3. **CalculationForm Integration**
Location: `packages/desktop-app/src/components/CalculationForm.tsx`

- Automatically applies smart currency on first load
- Shows non-intrusive hint when smart currency is used
- Records usage after successful calculations
- Respects user's saved preferences (takes priority over smart recommendation)

### Backend Components

#### 1. **Smart Currency API Endpoint**
Location: `packages/local-backend/app/api/calculations.py`

**Endpoint:** `GET /api/v1/smart-currency`

**Query Parameters:**
- `timezone` (optional): Client timezone (e.g., "Asia/Kolkata")
- `locale` (optional): Client locale (e.g., "en-US")
- `language` (optional): Current app language (default: "en")

**Response:**
```json
{
  "recommended_currency": "INR",
  "confidence": "high",
  "reason": "Based on your usage history (45 calculations, 78%)",
  "alternatives": ["USD", "EUR"],
  "usage_stats": [
    {
      "currency": "INR",
      "count": 45,
      "last_used": "2025-11-24T10:30:00Z",
      "percentage": 78.26
    }
  ],
  "system_info": {
    "timezone": "Asia/Kolkata",
    "locale": "en-IN",
    "language": "hi",
    "timestamp": "2025-11-24T10:45:00Z"
  }
}
```

---

## Decision Priority Logic

The system uses a **3-tier priority system**:

### Priority 1: Historical Usage (Highest Confidence)
- **Trigger:** User has ≥3 calculations in history
- **Confidence:** High (if ≥60% usage) or Medium (if <60%)
- **Reason:** "Based on your usage history (X calculations, Y%)"
- **Example:** User calculated with INR 45 times out of 58 total → Recommend INR

### Priority 2: Timezone-Based Detection (Medium-High Confidence)
- **Trigger:** No significant history, but timezone detected
- **Confidence:** High (exact match) or Medium (region match)
- **Mappings:**
  - `Asia/Kolkata`, `Asia/Mumbai`, `Asia/Delhi` → INR
  - `America/New_York`, `America/Los_Angeles` → USD
  - `Europe/Paris`, `Europe/Berlin`, `Europe/Madrid` → EUR
  - `Europe/London` → GBP
  - `Australia/Sydney`, `Australia/Melbourne` → AUD
  - `Asia/Tokyo` → JPY
  - `Asia/Shanghai`, `Asia/Beijing` → CNY

### Priority 3: Language-Based Fallback (Lowest Confidence)
- **Trigger:** No history and no recognized timezone
- **Confidence:** Medium
- **Mappings:**
  - English (en) → USD
  - Hindi (hi) → INR
  - Spanish (es) → EUR
  - French (fr) → EUR
  - German (de) → EUR
  - Japanese (ja) → JPY
  - Chinese (zh) → CNY

---

## Timezone to Currency Mapping

### Complete Timezone Map

| Region | Timezone Examples | Currency |
|--------|------------------|----------|
| **North America** |
| United States | America/New_York, America/Chicago, America/Los_Angeles, America/Denver, America/Phoenix | USD |
| Canada | America/Toronto, America/Vancouver, America/Montreal | CAD |
| **Europe** |
| UK | Europe/London | GBP |
| Eurozone | Europe/Paris, Europe/Berlin, Europe/Rome, Europe/Madrid, Europe/Amsterdam, Europe/Brussels, Europe/Vienna, Europe/Zurich, Europe/Dublin, Europe/Lisbon, Europe/Stockholm, Europe/Oslo, Europe/Copenhagen, Europe/Helsinki, Europe/Athens, Europe/Warsaw, Europe/Prague, Europe/Budapest | EUR |
| **Asia** |
| India | Asia/Kolkata, Asia/Mumbai, Asia/Delhi, Asia/Bangalore, Asia/Chennai | INR |
| Japan | Asia/Tokyo, Asia/Osaka | JPY |
| China | Asia/Shanghai, Asia/Beijing, Asia/Hong_Kong | CNY |
| Southeast Asia | Asia/Singapore | USD |
| Middle East | Asia/Dubai | USD |
| **Oceania** |
| Australia | Australia/Sydney, Australia/Melbourne, Australia/Brisbane, Australia/Perth | AUD |
| New Zealand | Pacific/Auckland | AUD |

---

## Usage Statistics Tracking

### How It Works

1. **Data Source:** Calculation history from SQLite database
2. **Query:** Last 1000 calculations (ordered by most recent)
3. **Analysis:**
   - Count occurrences of each currency
   - Calculate percentage distribution
   - Track last usage timestamp
   - Sort by most frequently used

### Cache Strategy

- **Cache Duration:** 5 minutes
- **Invalidation:** Manual invalidation after each calculation
- **Benefits:** Reduces database queries while keeping data fresh

### Example Statistics

```typescript
usageStats: [
  { currency: "INR", count: 45, lastUsed: "2025-11-24T...", percentage: 78.26 },
  { currency: "USD", count: 10, lastUsed: "2025-11-23T...", percentage: 17.39 },
  { currency: "EUR", count: 3, lastUsed: "2025-11-22T...", percentage: 5.22 }
]
```

---

## User Interface

### Smart Currency Hint

When smart currency is automatically applied:

```
┌──────────────────────────────────────────────────────┐
│ ✨ Smart Currency: Based on your usage history      │
│    (45 calculations, 78%)                       [×]  │
└──────────────────────────────────────────────────────┘
```

**Features:**
- Non-intrusive notification bar
- Auto-dismisses after 5 seconds
- Manual dismiss with close button
- Only shows for medium/high confidence
- Gradient blue background matching app theme
- Supports dark mode

**Trigger Conditions:**
- Smart currency is used (not from saved settings)
- Confidence is "high" or "medium"
- User hasn't dismissed it manually

---

## Multi-Language Support

### Translation Keys

Added to all 5 languages (en, hi, es, fr, de):

```json
{
  "calculator": {
    "smartCurrency": "Smart Currency" // Translated in each language
  }
}
```

**Translations:**
- **English:** Smart Currency
- **Hindi:** स्मार्ट मुद्रा (Smārt Mudrā)
- **Spanish:** Moneda Inteligente
- **French:** Devise Intelligente
- **German:** Intelligente Währung

---

## Integration Points

### 1. Calculator Page
- Initial currency selection
- Shows smart currency hint
- Records usage after calculation

### 2. Bulk Upload (Future)
- Can use smart currency for rows without currency specified
- Bulk usage statistics contribute to learning

### 3. Settings Page (Future Enhancement)
- Option to enable/disable smart currency
- View currency usage statistics
- Clear usage history

---

## API Integration

### Frontend API Call

```typescript
import { api } from './services/api';

// Get recommendation
const recommendation = await api.getSmartCurrencyRecommendation(
  'Asia/Kolkata',  // timezone
  'en-IN',         // locale  
  'hi'             // language
);

console.log(recommendation);
// {
//   recommended_currency: "INR",
//   confidence: "high",
//   reason: "Based on your system timezone (Asia/Kolkata)",
//   alternatives: ["USD", "JPY", "CNY"],
//   usage_stats: [...],
//   system_info: {...}
// }
```

### Backend Processing

```python
from app.api.calculations import router

# Endpoint handles:
# 1. Parse timezone, locale, language
# 2. Query calculation history
# 3. Analyze currency usage patterns
# 4. Apply priority logic
# 5. Return recommendation with confidence
```

---

## Error Handling

### Frontend Fallbacks

1. **API Error:** Falls back to USD with low confidence
2. **Network Error:** Uses cached data if available
3. **No History:** Uses timezone/language detection
4. **Invalid Timezone:** Uses language-based fallback

### Backend Fallbacks

1. **No History:** Uses timezone mapping
2. **Invalid Timezone:** Uses language mapping
3. **Unknown Language:** Defaults to USD
4. **Database Error:** Returns USD with error logged

---

## Performance Considerations

### Frontend
- **5-minute cache:** Prevents excessive API calls
- **Lazy loading:** Hook only loads when component mounts
- **Debouncing:** Usage recording doesn't block UI

### Backend
- **Limited query:** Max 1000 history records
- **Indexed queries:** Database uses indexes on `created_at` and `currency`
- **In-memory counting:** Uses Python Counter for efficiency

---

## Testing Scenarios

### Scenario 1: New User (No History)
**Input:**
- Timezone: `Asia/Kolkata`
- Language: `hi`
- History: Empty

**Expected:**
- Currency: `INR`
- Confidence: `high`
- Reason: "Based on your system timezone (Asia/Kolkata)"

### Scenario 2: Experienced User (Clear Preference)
**Input:**
- History: 50 calculations (45 INR, 3 USD, 2 EUR)
- Timezone: `America/New_York`

**Expected:**
- Currency: `INR` (not USD!)
- Confidence: `high`
- Reason: "Based on your usage history (45 calculations, 90%)"

### Scenario 3: Multi-Currency User (No Clear Preference)
**Input:**
- History: 30 calculations (10 INR, 10 USD, 10 EUR)
- Timezone: `Europe/London`

**Expected:**
- Currency: `INR` (most recently used)
- Confidence: `medium`
- Reason: "Based on your usage history (10 calculations, 33%)"

### Scenario 4: Unknown Location
**Input:**
- Timezone: `Antarctica/McMurdo`
- Language: `en`
- History: Empty

**Expected:**
- Currency: `USD`
- Confidence: `medium`
- Reason: "Based on your app language (en)"

---

## Future Enhancements

### Phase 2 Features

1. **Time-based Patterns**
   - Detect work hours vs. personal time
   - Different currencies for business/personal

2. **Location History**
   - Track timezone changes (travel)
   - Temporarily switch currency when traveling

3. **Smart Suggestions**
   - Suggest currency based on amount ranges
   - "You usually use INR for amounts under ₹10,000"

4. **User Controls**
   - Settings toggle for smart currency
   - "Always ask" vs. "Always use smart"
   - Currency pinning

5. **Advanced Analytics**
   - Currency usage trends over time
   - Most common currency pairs
   - Conversion patterns

---

## Acceptance Criteria ✓

### System Time Detection
- ✅ Automatically detects timezone using `Intl.DateTimeFormat()`
- ✅ Detects locale using `navigator.language`
- ✅ Passes system info to backend for processing

### Smart Currency Distribution
- ✅ Timezone-to-currency mapping for major regions
- ✅ India (Asia/Kolkata) → INR
- ✅ US (America/*) → USD
- ✅ Europe (Europe/*) → EUR/GBP
- ✅ Asia (various) → INR/JPY/CNY
- ✅ Australia → AUD

### Usage-Based Learning
- ✅ Tracks currency frequency from history
- ✅ Calculates usage percentages
- ✅ Prioritizes frequently used currency
- ✅ Dynamic adaptation (cache invalidation)

### Seamless Integration
- ✅ Works with calculator (automatic currency selection)
- ✅ Works with bulk upload (ready for integration)
- ✅ Works with history tracking
- ✅ No user interruption (automatic + hint)
- ✅ Respects user's saved preferences

### Multi-Language Support
- ✅ All 5 languages supported (en, hi, es, fr, de)
- ✅ Translation keys added
- ✅ Language-based currency fallback

---

## Conclusion

The Smart Currency System provides an intelligent, adaptive, and seamless currency selection experience. It learns from user behavior, respects regional preferences, and continuously improves its recommendations without requiring any configuration or user intervention.

**Key Benefits:**
- 🎯 **Zero Configuration** - Works automatically out of the box
- 🧠 **Self-Learning** - Gets smarter with every calculation
- 🌍 **Region-Aware** - Understands global timezone patterns
- 🔄 **Adaptive** - Evolves based on actual usage
- 🌐 **Multi-Language** - Supports all 5 app languages
- ⚡ **Fast** - Cached recommendations with smart invalidation

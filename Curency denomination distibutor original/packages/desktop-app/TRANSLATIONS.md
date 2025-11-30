# Multi-Language Support Documentation

## Overview

The Currency Denomination Distributor application now supports 5 languages:

- **English** (en) - Default
- **Hindi** (hi) - हिन्दी
- **Spanish** (es) - Español
- **French** (fr) - Français
- **German** (de) - Deutsch

## Architecture

### Backend (FastAPI)

- **Translation Files**: Located in `packages/local-backend/app/locales/`

  - `en.json` - English translations
  - `hi.json` - Hindi translations
  - `es.json` - Spanish translations
  - `fr.json` - French translations
  - `de.json` - German translations
- **API Endpoints**:

  - `GET /api/v1/translations/languages` - Get list of supported languages
  - `GET /api/v1/translations/{language_code}` - Get translations for specific language
  - `GET /api/v1/translations` - Get all translations (admin/debug)
- **Settings Integration**:

  - Language preference stored in `language` setting (default: "en")
  - Persists across sessions via SQLite database

### Frontend (React + TypeScript)

- **Context**: `LanguageContext.tsx` provides:

  - `language` - Current language code
  - `translations` - All translation strings for current language
  - `setLanguage(code)` - Change language and reload translations
  - `t(key, params?)` - Translation function with parameter support
  - `isLoading` - Loading state
  - `supportedLanguages` - Available languages
- **Provider**: Wraps entire app in `main.tsx`

  ```tsx
  <LanguageProvider>
    <App />
  </LanguageProvider>
  ```

## Usage

### In Components

```tsx
import { useLanguage } from '../contexts/LanguageContext';

function MyComponent() {
  const { t, language, setLanguage } = useLanguage();
  
  return (
    <div>
      <h1>{t('app.title')}</h1>
      <p>{t('app.subtitle')}</p>
    
      {/* With parameters */}
      <p>{t('quickAccess.timeAgo.minutesAgo', { count: 5 })}</p>
    
      {/* Change language */}
      <button onClick={() => setLanguage('hi')}>
        Switch to Hindi
      </button>
    </div>
  );
}
```

### Translation Keys

Use dot notation to access nested translations:

```
t('nav.calculator')        → "Calculator"
t('settings.title')        → "Settings"
t('common.save')           → "Save"
t('results.totalAmount')   → "Total Amount"
```

### Parameters

Some translations support dynamic parameters using `{param}` syntax:

```json
{
  "timeAgo": {
    "minutesAgo": "{count} minutes ago"
  }
}
```

Usage:

```tsx
t('quickAccess.timeAgo.minutesAgo', { count: 5 })
// Output: "5 minutes ago"
```

## Translation File Structure

Each language file follows this structure:

```json
{
  "app": {
    "title": "Currency Denomination Distributor",
    "subtitle": "Smart Cash Distribution System"
  },
  "nav": {
    "calculator": "Calculator",
    "history": "History",
    "settings": "Settings"
  },
  "calculator": { ... },
  "results": { ... },
  "history": { ... },
  "quickAccess": { ... },
  "settings": { ... },
  "currencies": { ... },
  "common": { ... }
}
```

## Adding New Translations

### 1. Add to Backend Translation Files

Update all 5 JSON files in `packages/local-backend/app/locales/`:

```json
{
  "newSection": {
    "newKey": "New Text"
  }
}
```

### 2. Use in Frontend

```tsx
{t('newSection.newKey')}
```

## Adding New Languages

### Backend

1. Create new JSON file: `packages/local-backend/app/locales/{code}.json`
2. Copy structure from `en.json` and translate all strings
3. Update `SUPPORTED_LANGUAGES` in `packages/local-backend/app/api/translations.py`:

```python
SUPPORTED_LANGUAGES = {
    "en": "English",
    "hi": "हिन्दी (Hindi)",
    "es": "Español (Spanish)",
    "fr": "Français (French)",
    "de": "Deutsch (German)",
    "it": "Italiano (Italian)"  # New language
}
```

### Frontend

No changes needed! The language will automatically appear in the Settings dropdown.

## Fallback Behavior

1. **Missing Translation**: If a translation key doesn't exist, the key itself is returned and a console warning is logged.
2. **Missing Language File**: If a language file fails to load, the system falls back to English.
3. **Network Error**: On API failure, English translations are loaded as fallback.

## Current Implementation Status

✅ **Fully Translated**:

- Navigation (Calculator, History, Settings)
- Settings page labels and descriptions

🔄 **Partially Translated** (hardcoded strings remain):

- Calculator form
- Results display
- History page
- Quick Access component

To complete translation implementation, replace all hardcoded strings with `t()` calls using the provided translation keys.

## Performance Notes

- Translations are loaded once on app initialization
- Language changes trigger a single API call to fetch new translations
- All translations are cached in React context
- No translation lookups on every render (O(1) dictionary access)

## Testing

### Test Language Switching

1. Go to Settings
2. Change language dropdown
3. Verify UI updates immediately
4. Refresh page - language should persist

### Test Translation Coverage

1. Switch to each language
2. Navigate through all tabs
3. Check for missing translations (look for translation keys instead of text)
4. Check browser console for translation warnings

## Future Enhancements

- [ ] Complete translation of all components
- [ ] Add more languages (Italian, Portuguese, Japanese, etc.)
- [ ] Translation management UI for administrators
- [ ] Automatic language detection from browser settings
- [ ] Region-specific formats (dates, numbers, currency symbols)
- [ ] Right-to-left (RTL) language support (Arabic, Hebrew)

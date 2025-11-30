/**
 * Smart Currency Service
 * 
 * Provides intelligent currency detection and recommendation based on:
 * - System timezone and region
 * - User's currency usage patterns over time
 * - Language preferences
 */

import { api } from './api';

export interface CurrencyUsageStats {
  currency: string;
  count: number;
  lastUsed: string;
  percentage: number;
}

export interface SmartCurrencyRecommendation {
  recommendedCurrency: string;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
  alternatives: string[];
  usageStats: CurrencyUsageStats[];
}

/**
 * Timezone to Currency mapping based on common regional patterns
 */
const TIMEZONE_CURRENCY_MAP: Record<string, string> = {
  // North America
  'America/New_York': 'USD',
  'America/Chicago': 'USD',
  'America/Denver': 'USD',
  'America/Los_Angeles': 'USD',
  'America/Phoenix': 'USD',
  'America/Anchorage': 'USD',
  'America/Toronto': 'CAD',
  'America/Vancouver': 'CAD',
  'America/Montreal': 'CAD',
  'America/Mexico_City': 'USD', // Common for business
  
  // Europe
  'Europe/London': 'GBP',
  'Europe/Paris': 'EUR',
  'Europe/Berlin': 'EUR',
  'Europe/Rome': 'EUR',
  'Europe/Madrid': 'EUR',
  'Europe/Amsterdam': 'EUR',
  'Europe/Brussels': 'EUR',
  'Europe/Vienna': 'EUR',
  'Europe/Zurich': 'EUR',
  'Europe/Dublin': 'EUR',
  'Europe/Lisbon': 'EUR',
  'Europe/Stockholm': 'EUR',
  'Europe/Oslo': 'EUR',
  'Europe/Copenhagen': 'EUR',
  'Europe/Helsinki': 'EUR',
  'Europe/Athens': 'EUR',
  'Europe/Warsaw': 'EUR',
  'Europe/Prague': 'EUR',
  'Europe/Budapest': 'EUR',
  
  // Asia
  'Asia/Kolkata': 'INR',
  'Asia/Mumbai': 'INR',
  'Asia/Delhi': 'INR',
  'Asia/Bangalore': 'INR',
  'Asia/Chennai': 'INR',
  'Asia/Tokyo': 'JPY',
  'Asia/Seoul': 'JPY',
  'Asia/Shanghai': 'CNY',
  'Asia/Beijing': 'CNY',
  'Asia/Hong_Kong': 'CNY',
  'Asia/Singapore': 'USD',
  'Asia/Dubai': 'USD',
  'Asia/Karachi': 'USD',
  
  // Oceania
  'Australia/Sydney': 'AUD',
  'Australia/Melbourne': 'AUD',
  'Australia/Brisbane': 'AUD',
  'Australia/Perth': 'AUD',
  'Pacific/Auckland': 'AUD',
};

/**
 * Language to Currency mapping as fallback
 */
const LANGUAGE_CURRENCY_MAP: Record<string, string> = {
  'en': 'USD',
  'en-US': 'USD',
  'en-GB': 'GBP',
  'en-CA': 'CAD',
  'en-AU': 'AUD',
  'hi': 'INR',
  'es': 'EUR',
  'fr': 'EUR',
  'de': 'EUR',
  'ja': 'JPY',
  'zh': 'CNY',
};

class SmartCurrencyService {
  private usageCache: CurrencyUsageStats[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Detect system timezone
   */
  private detectTimezone(): string {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (error) {
      console.error('Failed to detect timezone:', error);
      return 'UTC';
    }
  }

  /**
   * Detect system locale/language
   */
  private detectLocale(): string {
    try {
      return navigator.language || navigator.languages?.[0] || 'en-US';
    } catch (error) {
      console.error('Failed to detect locale:', error);
      return 'en-US';
    }
  }

  /**
   * Get currency based on timezone
   */
  private getCurrencyFromTimezone(timezone: string): string | null {
    // Direct match
    if (TIMEZONE_CURRENCY_MAP[timezone]) {
      return TIMEZONE_CURRENCY_MAP[timezone];
    }

    // Try to match by region (e.g., "America/Unknown" -> USD)
    const region = timezone.split('/')[0];
    switch (region) {
      case 'America':
        return 'USD';
      case 'Europe':
        return 'EUR';
      case 'Asia':
        // Asia is diverse, check specific patterns
        if (timezone.includes('India') || timezone.includes('Kolkata') || timezone.includes('Calcutta')) {
          return 'INR';
        }
        if (timezone.includes('Tokyo') || timezone.includes('Japan')) {
          return 'JPY';
        }
        if (timezone.includes('China') || timezone.includes('Shanghai') || timezone.includes('Beijing')) {
          return 'CNY';
        }
        return 'USD'; // Default for Asia
      case 'Australia':
      case 'Pacific':
        return 'AUD';
      default:
        return null;
    }
  }

  /**
   * Get currency based on locale/language
   */
  private getCurrencyFromLocale(locale: string): string {
    // Try exact match first
    if (LANGUAGE_CURRENCY_MAP[locale]) {
      return LANGUAGE_CURRENCY_MAP[locale];
    }

    // Try base language (e.g., "en-US" -> "en")
    const baseLanguage = locale.split('-')[0];
    return LANGUAGE_CURRENCY_MAP[baseLanguage] || 'USD';
  }

  /**
   * Fetch currency usage statistics from history
   */
  async getCurrencyUsageStats(forceRefresh = false): Promise<CurrencyUsageStats[]> {
    const now = Date.now();
    
    // Return cache if valid
    if (!forceRefresh && this.usageCache && (now - this.cacheTimestamp) < this.CACHE_DURATION) {
      return this.usageCache;
    }

    try {
      // Fetch all history to analyze currency usage
      const historyResponse = await api.getHistory(1, 1000); // Get up to 1000 records
      
      if (!historyResponse.items || historyResponse.items.length === 0) {
        this.usageCache = [];
        this.cacheTimestamp = now;
        return [];
      }

      // Count currency usage
      const currencyCount: Record<string, { count: number; lastUsed: string }> = {};
      
      historyResponse.items.forEach((item) => {
        const currency = item.currency;
        if (!currencyCount[currency]) {
          currencyCount[currency] = { count: 0, lastUsed: item.created_at };
        }
        currencyCount[currency].count++;
        
        // Track most recent usage
        if (new Date(item.created_at) > new Date(currencyCount[currency].lastUsed)) {
          currencyCount[currency].lastUsed = item.created_at;
        }
      });

      // Calculate percentages and create stats array
      const totalCount = historyResponse.items.length;
      const stats: CurrencyUsageStats[] = Object.entries(currencyCount)
        .map(([currency, data]) => ({
          currency,
          count: data.count,
          lastUsed: data.lastUsed,
          percentage: (data.count / totalCount) * 100,
        }))
        .sort((a, b) => b.count - a.count); // Sort by most used

      this.usageCache = stats;
      this.cacheTimestamp = now;
      
      return stats;
    } catch (error) {
      console.error('Failed to fetch currency usage stats:', error);
      return [];
    }
  }

  /**
   * Get the most frequently used currency
   */
  async getMostUsedCurrency(): Promise<string | null> {
    const stats = await this.getCurrencyUsageStats();
    return stats.length > 0 ? stats[0].currency : null;
  }

  /**
   * Get smart currency recommendation
   */
  async getSmartCurrencyRecommendation(currentLanguage?: string): Promise<SmartCurrencyRecommendation> {
    const timezone = this.detectTimezone();
    const locale = this.detectLocale();
    const usageStats = await this.getCurrencyUsageStats();

    let recommendedCurrency: string;
    let confidence: 'high' | 'medium' | 'low';
    let reason: string;
    const alternatives: string[] = [];

    // Priority 1: User's historical usage (if significant)
    if (usageStats.length > 0 && usageStats[0].count >= 3) {
      // User has used a currency at least 3 times
      recommendedCurrency = usageStats[0].currency;
      confidence = usageStats[0].percentage >= 60 ? 'high' : 'medium';
      reason = `Based on your usage history (${usageStats[0].count} calculations, ${usageStats[0].percentage.toFixed(0)}%)`;
      
      // Add other frequently used currencies as alternatives
      usageStats.slice(1, 4).forEach(stat => alternatives.push(stat.currency));
    }
    // Priority 2: Timezone-based detection
    else {
      const timezoneCurrency = this.getCurrencyFromTimezone(timezone);
      
      if (timezoneCurrency) {
        recommendedCurrency = timezoneCurrency;
        confidence = 'high';
        reason = `Based on your system timezone (${timezone})`;
      }
      // Priority 3: Language/Locale-based detection
      else {
        const localeCurrency = currentLanguage 
          ? this.getCurrencyFromLocale(currentLanguage)
          : this.getCurrencyFromLocale(locale);
        
        recommendedCurrency = localeCurrency;
        confidence = 'medium';
        reason = `Based on your system language (${currentLanguage || locale})`;
      }

      // Add common alternatives based on region
      const region = timezone.split('/')[0];
      switch (region) {
        case 'America':
          alternatives.push('USD', 'CAD');
          break;
        case 'Europe':
          alternatives.push('EUR', 'GBP');
          break;
        case 'Asia':
          alternatives.push('INR', 'JPY', 'CNY', 'USD');
          break;
        case 'Australia':
        case 'Pacific':
          alternatives.push('AUD', 'USD');
          break;
        default:
          alternatives.push('USD', 'EUR', 'GBP');
      }
      
      // Remove recommended currency from alternatives and deduplicate
      const uniqueAlternatives = [...new Set(alternatives)].filter(c => c !== recommendedCurrency);
      alternatives.length = 0;
      alternatives.push(...uniqueAlternatives.slice(0, 3));
    }

    return {
      recommendedCurrency,
      confidence,
      reason,
      alternatives,
      usageStats,
    };
  }

  /**
   * Record a currency usage (called after calculation)
   */
  recordCurrencyUsage(_currency: string): void {
    // Invalidate cache so next request fetches fresh data
    this.usageCache = null;
  }

  /**
   * Get system information for debugging
   */
  getSystemInfo() {
    return {
      timezone: this.detectTimezone(),
      locale: this.detectLocale(),
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const smartCurrencyService = new SmartCurrencyService();

/**
 * useSmartCurrency Hook
 * 
 * Provides smart currency detection and recommendation throughout the app
 */

import { useState, useEffect, useCallback } from 'react';
import { smartCurrencyService, SmartCurrencyRecommendation } from '../services/smartCurrency';
import { useLanguage } from '../contexts/LanguageContext';

interface UseSmartCurrencyReturn {
  recommendedCurrency: string | null;
  confidence: 'high' | 'medium' | 'low' | null;
  reason: string | null;
  alternatives: string[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  recordUsage: (currency: string) => void;
}

export const useSmartCurrency = (): UseSmartCurrencyReturn => {
  const { language } = useLanguage();
  const [recommendation, setRecommendation] = useState<SmartCurrencyRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await smartCurrencyService.getSmartCurrencyRecommendation(language);
      setRecommendation(result);
    } catch (err: any) {
      console.error('Failed to get smart currency recommendation:', err);
      setError(err.message || 'Failed to get currency recommendation');
      
      // Fallback to USD
      setRecommendation({
        recommendedCurrency: 'USD',
        confidence: 'low',
        reason: 'Default fallback',
        alternatives: ['EUR', 'GBP', 'INR'],
        usageStats: [],
      });
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  useEffect(() => {
    fetchRecommendation();
  }, [fetchRecommendation]);

  const recordUsage = useCallback((currency: string) => {
    smartCurrencyService.recordCurrencyUsage(currency);
  }, []);

  const refresh = useCallback(async () => {
    await fetchRecommendation();
  }, [fetchRecommendation]);

  return {
    recommendedCurrency: recommendation?.recommendedCurrency || null,
    confidence: recommendation?.confidence || null,
    reason: recommendation?.reason || null,
    alternatives: recommendation?.alternatives || [],
    isLoading,
    error,
    refresh,
    recordUsage,
  };
};

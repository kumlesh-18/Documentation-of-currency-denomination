import React, { useState, useEffect } from 'react';
import { ArrowRight, RefreshCw, Sparkles } from 'lucide-react';
import { api, CalculationResult } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { useSmartCurrency } from '../hooks/useSmartCurrency';

interface CalculationFormProps {
  onCalculationComplete: (result: CalculationResult) => void;
}

export const CalculationForm: React.FC<CalculationFormProps> = ({ onCalculationComplete }) => {
  const { t } = useLanguage();
  const { recommendedCurrency, confidence, reason, recordUsage } = useSmartCurrency();
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<string>('INR');
  const [optimizationMode, setOptimizationMode] = useState<string>('greedy');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoSaveHistory, setAutoSaveHistory] = useState<boolean>(true);
  const [showSmartCurrencyHint, setShowSmartCurrencyHint] = useState(false);

  useEffect(() => {
    // Load default settings
    const loadSettings = async () => {
      try {
        // Load auto-save setting
        const autoSaveResponse = await api.getSetting('auto_save_history');
        if (autoSaveResponse.exists) {
          setAutoSaveHistory(autoSaveResponse.value);
        }

        // Priority 1: Check if user has saved a preferred currency in settings
        const currencyResponse = await api.getSetting('default_currency');
        if (currencyResponse.exists) {
          setCurrency(currencyResponse.value);
        } else if (recommendedCurrency) {
          // Priority 2: Use smart currency recommendation
          setCurrency(recommendedCurrency);
          // Show hint only if confidence is high or medium
          if (confidence && (confidence === 'high' || confidence === 'medium')) {
            setShowSmartCurrencyHint(true);
            // Auto-hide hint after 5 seconds
            setTimeout(() => setShowSmartCurrencyHint(false), 5000);
          }
        }

        // Load default optimization mode
        const modeResponse = await api.getSetting('default_optimization_mode');
        if (modeResponse.exists) {
          setOptimizationMode(modeResponse.value);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();

    // Poll for auto-save setting changes every 2 seconds
    const checkAutoSaveUpdate = async () => {
      try {
        const response = await api.getSetting('auto_save_history');
        if (response.exists && response.value !== autoSaveHistory) {
          setAutoSaveHistory(response.value);
        }
      } catch (error) {
        // Silently fail - don't spam console
      }
    };

    const intervalId = setInterval(checkAutoSaveUpdate, 2000);
    return () => clearInterval(intervalId);
  }, [autoSaveHistory, recommendedCurrency, confidence]);

  const currencySymbols: Record<string, string> = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Don't convert to number, send as string to preserve precision for large numbers
      if (!amount || amount.trim() === '') {
        throw new Error(t('calculator.enterAmount'));
      }
      
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error(t('calculator.validAmount'));
      }

      // Warn for extremely large numbers
      if (amount.length > 30) {
        if (!confirm(t('calculator.largeAmountWarning'))) {
          setLoading(false);
          return;
        }
      }

      const result = await api.calculate({
        amount: amount,  // Send as string to preserve precision
        currency: currency,
        optimization_mode: optimizationMode,
        save_to_history: autoSaveHistory
      });

      // Record currency usage for smart recommendations
      recordUsage(currency);

      onCalculationComplete(result);
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK') {
        setError(t('calculator.networkError'));
      } else {
        setError(err.response?.data?.detail || err.message || 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl opacity-50"></div>
      
      <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-8">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent mb-2">{t('calculator.title')}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('calculator.subtitle')}</p>
      </div>

      {/* Smart Currency Hint */}
      {showSmartCurrencyHint && reason && (
        <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-lg flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <p className="text-xs text-blue-800 dark:text-blue-300">
            <strong>Smart Currency:</strong> {reason}
          </p>
          <button
            onClick={() => setShowSmartCurrencyHint(false)}
            className="ml-auto text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
            type="button"
          >
            ×
          </button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Currency Selector */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              {t('calculator.currency')}
            </label>
            <div className="relative">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full h-14 px-4 pr-10 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-semibold text-lg appearance-none cursor-pointer hover:border-blue-400 dark:hover:border-blue-500"
              >
                <option value="INR">₹ INR</option>
                <option value="USD">$ USD</option>
                <option value="EUR">€ EUR</option>
                <option value="GBP">£ GBP</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Amount Input */}
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              {t('calculator.amount')}
            </label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-2xl font-bold">
                {currencySymbols[currency]}
              </span>
              <input
                type="text"
                value={amount}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                    setAmount(value);
                  }
                }}
                placeholder={t('calculator.amountPlaceholder')}
                className="w-full h-14 pl-14 pr-6 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-bold text-2xl hover:border-blue-400 dark:hover:border-blue-500 caret-blue-600 dark:caret-blue-400"
                autoComplete="off"
              />
            </div>
          </div>
        </div>

        {/* Advanced Options - Collapsible */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <svg className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {t('calculator.advancedOptions')}
          </button>
          
          {showAdvanced && (
            <div className="mt-4">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                {t('calculator.optimizationMode')}
              </label>
              <select
                value={optimizationMode}
                onChange={(e) => setOptimizationMode(e.target.value)}
                className="w-full h-12 px-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:border-blue-400 dark:hover:border-blue-500"
              >
                <option value="greedy">{t('calculator.greedy')}</option>
                <option value="balanced">{t('calculator.balanced')}</option>
                <option value="minimize_large">{t('calculator.minimizeLarge')}</option>
                <option value="minimize_small">{t('calculator.minimizeSmall')}</option>
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Choose how to optimize the denomination breakdown
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-800">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600 text-white font-bold text-lg rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          {loading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              {t('calculator.calculating')}
            </>
          ) : (
            <>
              {t('calculator.calculate')}
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Moon, Sun, Globe, Zap, RefreshCw, Save, Database, Download, Star } from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

interface Settings {
  theme: string;
  default_currency: string;
  default_optimization_mode: string;
  quick_access_count: number;
  quick_access_enabled: boolean;
  auto_save_history: boolean;
  sync_enabled: boolean;
  language: string;
}

interface SettingsPageProps {
  onSettingsChange?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onSettingsChange }) => {
  const { language, setLanguage, supportedLanguages, t } = useLanguage();
  const [settings, setSettings] = useState<Settings>({
    theme: 'light',
    default_currency: 'INR',
    default_optimization_mode: 'greedy',
    quick_access_count: 10,
    quick_access_enabled: true,
    auto_save_history: true,
    sync_enabled: true,
    language: 'en'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(
    // Check current theme from document on initial load
    document.documentElement.classList.contains('dark')
  );

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    // Apply theme to document and save to localStorage as backup
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await api.getSettings();
      if (response.settings) {
        const loadedSettings = { ...settings, ...response.settings };
        setSettings(loadedSettings);
        
        // Apply theme from settings (already applied in index.html, but sync UI state)
        if (loadedSettings.theme) {
          setIsDarkMode(loadedSettings.theme === 'dark');
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      showMessage('error', t('settings.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Update each setting
      for (const [key, value] of Object.entries(settings)) {
        await api.updateSetting(key, value);
      }
      
      showMessage('success', t('settings.saved'));
      
      // Apply theme immediately
      setIsDarkMode(settings.theme === 'dark');
      
      // Notify parent of settings change
      if (onSettingsChange) {
        onSettingsChange();
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      showMessage('error', t('settings.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm(t('settings.resetConfirm'))) {
      return;
    }

    try {
      setSaving(true);
      const response = await api.resetSettings();
      if (response.settings) {
        setSettings({ ...settings, ...response.settings });
        setIsDarkMode(response.settings.theme === 'dark');
      }
      showMessage('success', t('settings.resetSuccess'));
      
      // Notify parent of settings change
      if (onSettingsChange) {
        onSettingsChange();
      }
    } catch (error) {
      console.error('Failed to reset settings:', error);
      showMessage('error', t('settings.resetError'));
    } finally {
      setSaving(false);
    }
  };

  const handleThemeToggle = () => {
    const newTheme = settings.theme === 'light' ? 'dark' : 'light';
    setSettings({ ...settings, theme: newTheme });
    setIsDarkMode(newTheme === 'dark');
  };

  const handleQuickAccessToggle = async (enabled: boolean) => {
    // Update local state
    setSettings({ ...settings, quick_access_enabled: enabled });
    
    // Immediately save this specific setting to backend
    try {
      await api.updateSetting('quick_access_enabled', enabled);
      showMessage('success', t(enabled ? 'settings.quickAccessEnabled_success' : 'settings.quickAccessDisabled_success'));
      
      // Notify parent immediately for instant UI update
      if (onSettingsChange) {
        onSettingsChange();
      }
    } catch (error) {
      console.error('Failed to update quick access setting:', error);
      showMessage('error', t('settings.error'));
      // Revert local state on error
      setSettings({ ...settings, quick_access_enabled: !enabled });
    }
  };

  const handleQuickAccessCountChange = async (count: number) => {
    // Validate range
    if (count < 5 || count > 20) {
      showMessage('error', t('settings.quickAccessCountError'));
      return;
    }
    
    // Update local state
    setSettings({ ...settings, quick_access_count: count });
    
    // Immediately save to backend
    try {
      await api.updateSetting('quick_access_count', count);
      showMessage('success', t('settings.quickAccessCountUpdated', { count: count.toString() }));
      
      // Notify parent to reload the setting
      if (onSettingsChange) {
        onSettingsChange();
      }
    } catch (error) {
      console.error('Failed to update quick access count:', error);
      showMessage('error', t('settings.error'));
    }
  };

  const handleDefaultCurrencyChange = async (currency: string) => {
    // Update local state
    setSettings({ ...settings, default_currency: currency });
    
    // Immediately save to backend
    try {
      await api.updateSetting('default_currency', currency);
      showMessage('success', t('settings.currencyUpdated', { currency }));
    } catch (error) {
      console.error('Failed to update default currency:', error);
      showMessage('error', t('settings.error'));
      // Revert on error
      const response = await api.getSetting('default_currency');
      if (response.exists) {
        setSettings({ ...settings, default_currency: response.value });
      }
    }
  };

  const handleOptimizationModeChange = async (mode: string) => {
    // Update local state
    setSettings({ ...settings, default_optimization_mode: mode });
    
    // Immediately save to backend
    try {
      await api.updateSetting('default_optimization_mode', mode);
      showMessage('success', t('settings.optimizationUpdated'));
    } catch (error) {
      console.error('Failed to update optimization mode:', error);
      showMessage('error', t('settings.error'));
      // Revert on error
      const response = await api.getSetting('default_optimization_mode');
      if (response.exists) {
        setSettings({ ...settings, default_optimization_mode: response.value });
      }
    }
  };

  const handleLanguageChange = async (newLanguage: string) => {
    try {
      await setLanguage(newLanguage);
      setSettings({ ...settings, language: newLanguage });
      showMessage('success', t('settings.languageUpdated'));
    } catch (error) {
      console.error('Failed to update language:', error);
      showMessage('error', t('settings.error'));
    }
  };

  const handleAutoSaveHistoryToggle = async (enabled: boolean) => {
    // Update local state
    setSettings({ ...settings, auto_save_history: enabled });
    
    // Immediately save this specific setting to backend
    try {
      await api.updateSetting('auto_save_history', enabled);
      showMessage('success', t(enabled ? 'settings.autoSaveEnabled' : 'settings.autoSaveDisabled'));
      
      // Notify parent for any UI updates if needed
      if (onSettingsChange) {
        onSettingsChange();
      }
    } catch (error) {
      console.error('Failed to update auto-save history setting:', error);
      showMessage('error', t('settings.error'));
      // Revert local state on error
      setSettings({ ...settings, auto_save_history: !enabled });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-white" />
            <div>
              <h2 className="text-2xl font-bold text-white">{t('settings.title')}</h2>
              <p className="text-blue-100 text-sm mt-1">{t('settings.subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mx-6 mt-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Settings Content */}
        <div className="p-6 space-y-6">
          
          {/* Appearance */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
              <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('settings.appearance')}</h3>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div>
                <label className="font-medium text-gray-700 dark:text-gray-200">{t('settings.theme')}</label>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.appearanceDesc')}</p>
              </div>
              <button
                onClick={handleThemeToggle}
                className={`relative inline-flex h-10 w-20 items-center rounded-full transition-colors ${
                  isDarkMode ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center transform rounded-full bg-white transition-transform ${
                    isDarkMode ? 'translate-x-11' : 'translate-x-1'
                  }`}
                >
                  {isDarkMode ? (
                    <Moon className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Sun className="w-4 h-4 text-gray-600" />
                  )}
                </span>
              </button>
            </div>
          </div>

          {/* Language & Region */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
              <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('settings.languageRegion')}</h3>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('settings.language')}
              </label>
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                {supportedLanguages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {t('settings.languageDesc')}
              </p>
            </div>
          </div>

          {/* Defaults */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
              <Star className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('settings.defaultPreferences')}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('settings.defaultCurrency')}
                </label>
                <select
                  value={settings.default_currency}
                  onChange={(e) => handleDefaultCurrencyChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="INR">{t('currencies.INR')}</option>
                  <option value="USD">{t('currencies.USD')}</option>
                  <option value="EUR">{t('currencies.EUR')}</option>
                  <option value="GBP">{t('currencies.GBP')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('settings.defaultOptimization')}
                </label>
                <select
                  value={settings.default_optimization_mode}
                  onChange={(e) => handleOptimizationModeChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="greedy">{t('calculator.greedy')}</option>
                  <option value="balanced">{t('calculator.balanced')}</option>
                  <option value="minimize_large">{t('calculator.minimizeLarge')}</option>
                  <option value="minimize_small">{t('calculator.minimizeSmall')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Behavior */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
              <Zap className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('settings.behavior')}</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <label className="font-medium text-gray-700 dark:text-gray-200">{t('settings.autoSaveHistory')}</label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.autoSaveDesc')}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.auto_save_history}
                    onChange={(e) => handleAutoSaveHistoryToggle(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <label className="font-medium text-gray-700 dark:text-gray-200">{t('settings.quickAccessEnabled')}</label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.quickAccessDesc')}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.quick_access_enabled}
                    onChange={(e) => handleQuickAccessToggle(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <label className="font-medium text-gray-700 dark:text-gray-200">{t('settings.quickAccessCount')}</label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.quickAccessCountDesc')}</p>
                </div>
                <input
                  type="number"
                  min="5"
                  max="20"
                  value={settings.quick_access_count}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value)) {
                      // Just update local state while typing
                      setSettings({ ...settings, quick_access_count: value });
                    }
                  }}
                  onBlur={(e) => {
                    const value = parseInt(e.target.value);
                    if (isNaN(value) || value < 5) {
                      handleQuickAccessCountChange(5);
                    } else if (value > 20) {
                      handleQuickAccessCountChange(20);
                    } else {
                      handleQuickAccessCountChange(value);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur(); // Trigger onBlur to save
                    }
                  }}
                  disabled={!settings.quick_access_enabled}
                  className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Data & Sync */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
              <Database className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('settings.dataSync')}</h3>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div>
                <label className="font-medium text-gray-700 dark:text-gray-200">{t('settings.syncEnabled')}</label>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.syncDesc')}</p>
              </div>
              <input
                type="checkbox"
                checked={settings.sync_enabled}
                onChange={(e) => setSettings({ ...settings, sync_enabled: e.target.checked })}
                disabled
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 opacity-50 cursor-not-allowed"
              />
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <button
            onClick={handleReset}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className="w-4 h-4" />
            {t('settings.resetToDefaults')}
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                {t('settings.saving')}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {t('settings.saveChanges')}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Additional Info Card */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Download className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-300">{t('settings.dataStorageTitle')}</h4>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
              {t('settings.dataStorageDesc')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

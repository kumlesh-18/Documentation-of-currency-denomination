import { useState, useEffect } from 'react';
import { Clock, Eye, RefreshCw } from 'lucide-react';
import { api, HistoryItem } from '../services/api';
import { formatRelativeTime } from '../utils/dateFormatter';
import { useLanguage } from '../contexts/LanguageContext';

interface QuickAccessProps {
  onViewDetail: (id: number) => void;
}

export const QuickAccess: React.FC<QuickAccessProps> = ({ onViewDetail }) => {
  const { t } = useLanguage();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickAccessCount, setQuickAccessCount] = useState(10);

  useEffect(() => {
    loadQuickAccess();
    
    // Poll for count changes every 2 seconds (when component is visible)
    const interval = setInterval(() => {
      checkCountUpdate();
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Reload items when count changes
    if (quickAccessCount > 0) {
      loadItems(quickAccessCount);
    }
  }, [quickAccessCount]);

  const checkCountUpdate = async () => {
    try {
      const settingResponse = await api.getSetting('quick_access_count');
      const count = settingResponse.exists ? settingResponse.value : 10;
      if (count !== quickAccessCount) {
        setQuickAccessCount(count);
      }
    } catch (error) {
      console.error('Failed to check count update:', error);
    }
  };

  const loadQuickAccess = async () => {
    try {
      setLoading(true);
      // Load quick access count setting
      const settingResponse = await api.getSetting('quick_access_count');
      const count = settingResponse.exists ? settingResponse.value : 10;
      setQuickAccessCount(count);

      // Load quick access items
      await loadItems(count);
    } catch (error) {
      console.error('Failed to load quick access:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async (count: number) => {
    try {
      const response = await api.getQuickAccess(count);
      setItems(response.items);
    } catch (error) {
      console.error('Failed to load quick access items:', error);
    }
  };

  const formatAmount = (amount: string): string => {
    const num = parseFloat(amount);
    if (num >= 1e6) {
      return (num / 1e6).toFixed(1) + 'M';
    } else if (num >= 1e3) {
      return (num / 1e3).toFixed(1) + 'K';
    }
    return amount;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">{t('quickAccess.title')}</h3>
        </div>
        <button
          onClick={loadQuickAccess}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title={t('quickAccess.refresh')}
        >
          <RefreshCw className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[500px] overflow-y-auto">
        {items.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">
            {t('quickAccess.noItems')}
          </div>
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewDetail(item.id)}
              className="w-full px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {formatAmount(item.amount)} {item.currency}
                    </span>
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full flex-shrink-0">
                      {item.currency}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {t('quickAccess.notesCount', { count: item.total_notes })} • {t('quickAccess.coinsCount', { count: item.total_coins })}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {formatRelativeTime(item.created_at)}
                  </div>
                </div>
                <Eye className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

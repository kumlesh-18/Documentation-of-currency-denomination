import { useState, useRef, useEffect } from 'react';
import { Layout } from './components/Layout';
import { CalculationForm } from './components/CalculationForm';
import { ResultsDisplay } from './components/ResultsDisplay';
import { HistoryPage } from './components/HistoryPage';
import { SettingsPage } from './components/SettingsPage';
import { QuickAccess } from './components/QuickAccess';
import { BulkUploadPage } from './components/BulkUploadPage';
import { CalculationResult, api } from './services/api';

function App() {
  const [activeTab, setActiveTab] = useState<'calculator' | 'history' | 'bulkUpload' | 'settings'>('calculator');
  const [currentResult, setCurrentResult] = useState<CalculationResult | null>(null);
  const [quickAccessEnabled, setQuickAccessEnabled] = useState<boolean | null>(null); // null = loading
  const resultsRef = useRef<HTMLDivElement>(null);

  // Load quick access enabled setting on mount
  useEffect(() => {
    const loadQuickAccessSetting = async () => {
      try {
        const response = await api.getSetting('quick_access_enabled');
        if (response.exists) {
          setQuickAccessEnabled(response.value);
        } else {
          // Default to true if setting doesn't exist
          setQuickAccessEnabled(true);
        }
      } catch (error) {
        console.error('Failed to load quick access setting:', error);
        // Default to true on error
        setQuickAccessEnabled(true);
      }
    };
    loadQuickAccessSetting();
  }, []);

  // Reload quick access setting when switching to calculator tab
  useEffect(() => {
    if (activeTab === 'calculator') {
      const reloadQuickAccessSetting = async () => {
        try {
          const response = await api.getSetting('quick_access_enabled');
          if (response.exists) {
            setQuickAccessEnabled(response.value);
          }
        } catch (error) {
          console.error('Failed to reload quick access setting:', error);
        }
      };
      reloadQuickAccessSetting();
    }
  }, [activeTab]);

  // Scroll to results when a new calculation is completed
  useEffect(() => {
    if (currentResult && resultsRef.current && activeTab === 'calculator') {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start'
        });
      }, 100); // Small delay to ensure DOM is updated
    }
  }, [currentResult, activeTab]);

  const handleViewDetail = async (id: number) => {
    try {
      const detail = await api.getCalculationDetail(id);
      
      // Transform backend response to CalculationResult format
      const calculationResult: CalculationResult = {
        id: detail.id,
        amount: detail.amount,
        currency: detail.currency,
        total_notes: typeof detail.total_notes === 'string' ? parseInt(detail.total_notes) : detail.total_notes,
        total_coins: typeof detail.total_coins === 'string' ? parseInt(detail.total_coins) : detail.total_coins,
        total_denominations: typeof detail.total_denominations === 'string' ? parseInt(detail.total_denominations) : detail.total_denominations,
        breakdowns: detail.result?.breakdowns || [],
        optimization_mode: detail.optimization_mode,
        created_at: detail.created_at
      };
      
      setCurrentResult(calculationResult);
      
      // Scroll to results
      if (resultsRef.current) {
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start'
          });
        }, 100);
      }
    } catch (error) {
      console.error('Failed to load calculation:', error);
      alert('Failed to load calculation details. Please try again.');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'calculator':
        return (
          <div className="h-full flex flex-col">
            {/* Hero Calculator Section */}
            <div className="flex-shrink-0">
              <CalculationForm onCalculationComplete={setCurrentResult} />
            </div>
            
            {/* Results & Quick Access Section */}
            <div ref={resultsRef} className="flex-1 mt-6 grid grid-cols-1 xl:grid-cols-12 gap-6 min-h-0">
              <div className={quickAccessEnabled ? "xl:col-span-8" : "xl:col-span-12"}>
                <ResultsDisplay result={currentResult} />
              </div>
              {/* Only render QuickAccess if enabled and setting is loaded */}
              {quickAccessEnabled === true && (
                <div className="xl:col-span-4">
                  <QuickAccess onViewDetail={handleViewDetail} />
                </div>
              )}
            </div>
          </div>
        );
      case 'history':
        return <HistoryPage />;
      case 'bulkUpload':
        return <BulkUploadPage />;
      case 'settings':
        return <SettingsPage onSettingsChange={async () => {
          // Reload quick access setting when settings are saved
          try {
            const response = await api.getSetting('quick_access_enabled');
            if (response.exists) {
              setQuickAccessEnabled(response.value);
            }
          } catch (error) {
            console.error('Failed to reload quick access setting:', error);
          }
        }} />;
      default:
        return null;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}

export default App;

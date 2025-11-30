import { useState, useEffect } from 'react';
import { Trash2, Download, Eye, CheckSquare, Square, Loader2, AlertCircle, FileText, Printer, ChevronDown, Copy, Check } from 'lucide-react';
import { api, HistoryResponse } from '../services/api';
import { formatDateTime } from '../utils/dateFormatter';
import { useLanguage } from '../contexts/LanguageContext';

// Helper function to format large numbers
const formatLargeNumber = (value: string | number): string => {
  const numStr = value.toString();
  const num = parseFloat(numStr);
  
  // For very large numbers (>= 1 billion), use compact notation
  if (num >= 1e15) {
    return num.toExponential(2);
  } else if (num >= 1e12) {
    return (num / 1e12).toFixed(2) + 'T';
  } else if (num >= 1e9) {
    return (num / 1e9).toFixed(2) + 'B';
  } else if (num >= 1e6) {
    return (num / 1e6).toFixed(2) + 'M';
  } else if (num >= 1e3) {
    return num.toLocaleString();
  }
  return numStr;
};

// Helper function to convert number to words with multi-currency support
const numberToWords = (num: number, currency: string = 'INR'): string => {
  if (num === 0) return 'zero';
  if (num >= 1e15) return formatLargeNumber(num); // Too large for words
  
  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  
  const convertLessThanThousand = (n: number): string => {
    if (n === 0) return '';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) {
      const ten = Math.floor(n / 10);
      const one = n % 10;
      return tens[ten] + (one ? ' ' + ones[one] : '');
    }
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    return ones[hundred] + ' hundred' + (rest ? ' ' + convertLessThanThousand(rest) : '');
  };

  // Indian numbering system for INR
  if (currency === 'INR') {
    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const remainder = num % 1000;
    
    let words = '';
    if (crore > 0) words += convertLessThanThousand(crore) + ' crore ';
    if (lakh > 0) words += convertLessThanThousand(lakh) + ' lakh ';
    if (thousand > 0) words += convertLessThanThousand(thousand) + ' thousand ';
    if (remainder > 0) words += convertLessThanThousand(remainder);
    return words.trim();
  }
  
  // Western/International numbering system (USD, EUR, GBP, etc.)
  const billion = Math.floor(num / 1000000000);
  const million = Math.floor((num % 1000000000) / 1000000);
  const thousand = Math.floor((num % 1000000) / 1000);
  const remainder = num % 1000;
  
  let words = '';
  if (billion > 0) words += convertLessThanThousand(billion) + ' billion ';
  if (million > 0) words += convertLessThanThousand(million) + ' million ';
  if (thousand > 0) words += convertLessThanThousand(thousand) + ' thousand ';
  if (remainder > 0) words += convertLessThanThousand(remainder);
  
  return words.trim();
};

export const HistoryPage = () => {
  const { t } = useLanguage();
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [filterCurrency, setFilterCurrency] = useState<string>('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Copy functionality
  const handleCopyAll = async () => {
    if (!history || history.items.length === 0) {
      alert(t('history.nothingToCopy'));
      return;
    }

    try {
      const textContent = generateHistoryText(history.items);
      await navigator.clipboard.writeText(textContent);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (error) {
      console.error('Failed to copy:', error);
      alert(t('results.copyFailed'));
    }
  };

  const handleCopySelected = async () => {
    if (selectedIds.size === 0) {
      alert(t('history.nothingToCopy'));
      return;
    }

    try {
      const selectedItems = history?.items.filter(item => selectedIds.has(item.id)) || [];
      const textContent = generateHistoryText(selectedItems);
      await navigator.clipboard.writeText(textContent);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (error) {
      console.error('Failed to copy:', error);
      alert(t('results.copyFailed'));
    }
  };

  const generateHistoryText = (items: any[]): string => {
    let text = `${t('history.title')}\n`;
    text += `${'='.repeat(80)}\n`;
    text += `${t('history.totalCalculations')}: ${items.length}\n\n`;
    
    items.forEach((item, index) => {
      text += `${index + 1}. ${t('history.date')}: ${formatDateTime(item.created_at)}\n`;
      text += `   ${t('history.amount')}: ${formatLargeNumber(item.amount)} ${item.currency}\n`;
      text += `   ${t('history.notes')}: ${formatLargeNumber(item.total_notes)} | `;
      text += `${t('history.coins')}: ${formatLargeNumber(item.total_coins)} | `;
      text += `${t('history.total')}: ${formatLargeNumber(item.total_denominations)}\n`;
      if (item.optimization_mode) {
        text += `   ${t('history.optimizationMode')}: ${item.optimization_mode}\n`;
      }
      text += '\n';
    });
    
    return text;
  };

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getHistory(currentPage, 50, filterCurrency || undefined);
      setHistory(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [currentPage, filterCurrency]);

  const toggleSelect = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === history?.items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(history?.items.map(item => item.id) || []));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('history.confirmDelete'))) return;
    
    try {
      await api.deleteCalculation(id);
      await loadHistory();
      setSelectedIds(new Set());
    } catch (err: any) {
      alert(t('history.deleteFailed') + ': ' + err.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(t('history.confirmDeleteSelected', { count: selectedIds.size }))) return;

    try {
      await api.bulkDeleteCalculations(Array.from(selectedIds));
      await loadHistory();
      setSelectedIds(new Set());
    } catch (err: any) {
      alert(t('history.deleteFailed') + ': ' + err.message);
    }
  };

  const handleDeleteAll = async () => {
    if (!history || history.items.length === 0) {
      alert(t('history.noHistoryToDelete'));
      return;
    }

    const totalCount = history.total;
    const confirmMessage = filterCurrency 
      ? t('history.confirmDeleteAll', { count: totalCount, currency: filterCurrency })
      : t('history.confirmDeleteAllGlobal', { count: totalCount });

    if (!confirm(confirmMessage)) return;

    // Double confirmation for safety
    if (!confirm(t('history.confirmDeletePermanent'))) return;

    try {
      // Let the backend handle the filtering and deletion efficiently
      const result = await api.deleteAllHistory(filterCurrency || undefined);
      await loadHistory();
      setSelectedIds(new Set());
      alert(t('history.deleteSuccess', { count: result.deleted_count }));
    } catch (err: any) {
      alert(t('history.deleteFailed') + ': ' + err.message);
    }
  };

  const handleExport = async (selectedOnly = false) => {
    try {
      const ids = selectedOnly ? Array.from(selectedIds) : undefined;
      const blob = await api.exportHistoryCSV(ids, filterCurrency || undefined);
      
      // Download the file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `history_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(t('history.exportFailed') + ': ' + err.message);
    }
  };

  const handleExportPDF = async () => {
    if (!history || history.items.length === 0) {
      alert(t('history.noHistoryToExport'));
      return;
    }

    const htmlContent = generatePrintableHTML();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
    setShowExportMenu(false);
  };

  const handleExportWord = async () => {
    if (!history || history.items.length === 0) {
      alert(t('history.noHistoryToExport'));
      return;
    }

    const htmlContent = generateWordHTML();
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calculation-history-${new Date().toISOString().split('T')[0]}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handlePrint = () => {
    if (!history || history.items.length === 0) {
      alert(t('history.noHistoryToExport'));
      return;
    }

    const htmlContent = generatePrintableHTML();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
    setShowExportMenu(false);
  };

  const generatePrintableHTML = (): string => {
    if (!history) return '';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${t('history.title')}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              max-width: 1200px;
              margin: 0 auto;
            }
            h1 {
              color: #1f2937;
              border-bottom: 3px solid #3b82f6;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            .meta {
              color: #6b7280;
              margin-bottom: 30px;
              font-size: 14px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th {
              background-color: #f3f4f6;
              padding: 12px;
              text-align: left;
              font-weight: 600;
              color: #374151;
              border: 1px solid #e5e7eb;
            }
            td {
              padding: 10px 12px;
              border: 1px solid #e5e7eb;
              color: #1f2937;
            }
            tr:nth-child(even) {
              background-color: #f9fafb;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              color: #9ca3af;
              font-size: 12px;
              border-top: 1px solid #e5e7eb;
              padding-top: 20px;
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>${t('history.title')}</h1>
          <div class="meta">
            <p><strong>${t('history.generated')}:</strong> ${formatDateTime(new Date().toISOString())}</p>
            <p><strong>${t('history.total')}:</strong> ${history.total}</p>
            ${filterCurrency ? `<p><strong>${t('history.filteredBy')}:</strong> ${filterCurrency}</p>` : ''}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>${t('history.dateTime')}</th>
                <th>${t('history.amount')}</th>
                <th>${t('history.currency')}</th>
                <th>${t('history.notes')}</th>
                <th>${t('history.coins')}</th>
                <th>${t('history.totalDenominations')}</th>
                <th>${t('history.optimizationMode')}</th>
              </tr>
            </thead>
            <tbody>
              ${history.items.map(item => `
                <tr>
                  <td>${formatDateTime(item.created_at)}</td>
                  <td>${formatLargeNumber(item.amount)}</td>
                  <td>${item.currency}</td>
                  <td>${formatLargeNumber(item.total_notes)}</td>
                  <td>${formatLargeNumber(item.total_coins)}</td>
                  <td>${formatLargeNumber(item.total_denominations)}</td>
                  <td>${item.optimization_mode}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>${t('history.reportTitle')}</p>
            <p>${t('history.pageNumber')} ${currentPage} ${history.has_more ? t('history.morePagesAvailable') : ''}</p>
          </div>
        </body>
      </html>
    `;
  };

  const generateWordHTML = (): string => {
    if (!history) return '';

    return `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>${t('history.title')}</title>
          <style>
            body { font-family: Calibri, Arial, sans-serif; }
            h1 { color: #1f2937; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f3f4f6; padding: 10px; text-align: left; font-weight: bold; border: 1px solid #000; }
            td { padding: 8px; border: 1px solid #000; }
            .meta { color: #666; margin: 15px 0; }
          </style>
        </head>
        <body>
          <h1>${t('history.title')}</h1>
          <div class="meta">
            <p><strong>${t('history.generated')}:</strong> ${formatDateTime(new Date().toISOString())}</p>
            <p><strong>${t('history.total')}:</strong> ${history.total}</p>
            ${filterCurrency ? `<p><strong>${t('history.filteredBy')}:</strong> ${filterCurrency}</p>` : ''}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>${t('history.dateTime')}</th>
                <th>${t('history.amount')}</th>
                <th>${t('history.currency')}</th>
                <th>${t('history.notes')}</th>
                <th>${t('history.coins')}</th>
                <th>${t('history.total')}</th>
                <th>${t('history.mode')}</th>
              </tr>
            </thead>
            <tbody>
              ${history.items.map(item => `
                <tr>
                  <td>${formatDateTime(item.created_at)}</td>
                  <td>${formatLargeNumber(item.amount)}</td>
                  <td>${item.currency}</td>
                  <td>${formatLargeNumber(item.total_notes)}</td>
                  <td>${formatLargeNumber(item.total_coins)}</td>
                  <td>${formatLargeNumber(item.total_denominations)}</td>
                  <td>${item.optimization_mode}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <p style="margin-top: 30px; color: #999; font-size: 11px; text-align: center;">
            ${t('history.reportTitle')} - ${t('history.generated')} ${formatDateTime(new Date().toISOString())}
          </p>
        </body>
      </html>
    `;
  };

  const handleViewDetail = async (id: number) => {
    try {
      const detail = await api.getCalculationDetail(id);
      const amountNum = parseFloat(detail.amount);
      const amountWords = numberToWords(amountNum, detail.currency);
      const notesWords = numberToWords(detail.total_notes, detail.currency);
      const coinsWords = numberToWords(detail.total_coins, detail.currency);
      const message = `Calculation #${id}\n\nAmount: ${detail.amount} ${detail.currency}\n(${amountWords})\n\nNotes: ${detail.total_notes}\n(${notesWords})\n\nCoins: ${detail.total_coins}\n(${coinsWords})\n\nTotal Denominations: ${detail.total_denominations}`;
      alert(message);
    } catch (err: any) {
      alert('Failed to load details: ' + err.message);
    }
  };

  if (loading && !history) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
        <span className="text-red-700 dark:text-red-400">{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header & Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('history.title')}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {history?.total || 0} {t('history.totalCalculations')}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={filterCurrency}
              onChange={(e) => {
                setFilterCurrency(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">{t('history.allCurrencies')}</option>
              <option value="INR">INR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>

            {/* Copy Success Message */}
            {copySuccess && (
              <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
                <Check className="w-4 h-4" />
                {t('results.copiedToClipboard')}
              </div>
            )}

            {/* Copy All Button */}
            {history && history.items.length > 0 && (
              <button
                onClick={handleCopyAll}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white rounded-lg flex items-center gap-2 text-sm"
                title={t('history.copyAll')}
              >
                <Copy className="w-4 h-4" />
                {t('history.copyAll')}
              </button>
            )}

            {/* Delete All Button */}
            {history && history.items.length > 0 && (
              <button
                onClick={handleDeleteAll}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white rounded-lg flex items-center gap-2 text-sm"
                title={t('history.deleteAll')}
              >
                <Trash2 className="w-4 h-4" />
                {t('history.deleteAll')}
              </button>
            )}

            {/* Export All History Dropdown */}
            {history && history.items.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  disabled={history.items.length === 0}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <Download className="w-4 h-4" />
                  {t('history.exportAll')}
                  <ChevronDown className={`w-4 h-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Export Dropdown Menu */}
                {showExportMenu && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowExportMenu(false)}
                    ></div>

                    {/* Menu */}
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-20 overflow-hidden">
                      <button
                        onClick={() => {
                          handleExport(false);
                          setShowExportMenu(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <div>
                          <div className="font-medium">{t('results.exportCSV')}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{t('results.spreadsheetFormat')}</div>
                        </div>
                      </button>

                      <button
                        onClick={handleExportPDF}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors border-t border-gray-100 dark:border-gray-700"
                      >
                        <FileText className="w-4 h-4 text-red-600 dark:text-red-400" />
                        <div>
                          <div className="font-medium">{t('results.exportPDF')}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{t('results.portableDocument')}</div>
                        </div>
                      </button>

                      <button
                        onClick={handleExportWord}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors border-t border-gray-100 dark:border-gray-700"
                      >
                        <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <div>
                          <div className="font-medium">{t('results.exportWord')}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{t('results.wordFormat')}</div>
                        </div>
                      </button>

                      <button
                        onClick={handlePrint}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors border-t border-gray-100 dark:border-gray-700"
                      >
                        <Printer className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <div>
                          <div className="font-medium">{t('results.print')}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{t('results.printPreview')}</div>
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm text-blue-700 dark:text-blue-400 font-medium">
              {selectedIds.size} {t('history.selected')}
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleCopySelected}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white text-sm rounded-lg flex items-center gap-1"
              >
                <Copy className="w-4 h-4" />
                {t('history.copySelected')}
              </button>
              <button
                onClick={() => handleExport(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-sm rounded-lg flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                {t('history.exportSelected')}
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white text-sm rounded-lg flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                {t('history.deleteSelected')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* History Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={toggleSelectAll}
                    className="flex items-center justify-center"
                  >
                    {selectedIds.size === history?.items.length && history?.items.length > 0 ? (
                      <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">{t('history.date')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">{t('history.amount')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">{t('history.currency')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">{t('history.notes')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">{t('history.coins')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">{t('history.total')}</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">{t('history.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {history?.items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleSelect(item.id)}
                      className="flex items-center justify-center"
                    >
                      {selectedIds.has(item.id) ? (
                        <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {formatDateTime(item.created_at)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 max-w-xs truncate" title={item.amount}>
                    {formatLargeNumber(item.amount)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{item.currency}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate" title={item.total_notes.toString()}>
                    {formatLargeNumber(item.total_notes)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate" title={item.total_coins.toString()}>
                    {formatLargeNumber(item.total_coins)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate" title={item.total_denominations.toString()}>
                    {formatLargeNumber(item.total_denominations)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewDetail(item.id)}
                        className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
                        title={t('history.viewDetails')}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                        title={t('history.delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {history?.items.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-lg font-medium">{t('history.noHistory')}</p>
            <p className="text-sm">{t('history.startCalculating')}</p>
          </div>
        )}

        {/* Pagination */}
        {history && history.total > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {t('history.showing')} {((currentPage - 1) * 50) + 1} - {Math.min(currentPage * 50, history.total)} {t('history.of')} {history.total}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                {t('history.previous')}
              </button>
              <button
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={!history.has_more}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                {t('history.next')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Banknote, Coins, Download, FileText, Printer, FileSpreadsheet, Copy, Check } from 'lucide-react';
import { CalculationResult } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

interface ResultsDisplayProps {
  result: CalculationResult | null;
}

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

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result }) => {
  const { t } = useLanguage();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showCopyMenu, setShowCopyMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Copy to clipboard as text
  const handleCopyAsText = async () => {
    if (!result) return;
    
    try {
      const textContent = generateTextContent(result);
      await navigator.clipboard.writeText(textContent);
      setCopySuccess(true);
      setShowCopyMenu(false);
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (error) {
      console.error('Failed to copy:', error);
      alert(t('results.copyFailed'));
    }
  };

  // Copy to clipboard as JSON
  const handleCopyAsJSON = async () => {
    if (!result) return;
    
    try {
      const jsonContent = JSON.stringify(result, null, 2);
      await navigator.clipboard.writeText(jsonContent);
      setCopySuccess(true);
      setShowCopyMenu(false);
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (error) {
      console.error('Failed to copy:', error);
      alert(t('results.copyFailed'));
    }
  };

  // Generate text content for copying
  const generateTextContent = (data: CalculationResult): string => {
    let text = `${t('results.title')}\n`;
    text += `${'='.repeat(50)}\n\n`;
    text += `${t('results.totalAmount')}: ${formatLargeNumber(data.amount)} ${data.currency}\n`;
    text += `${t('results.totalNotes')}: ${formatLargeNumber(data.total_notes)}\n`;
    text += `${t('results.totalCoins')}: ${formatLargeNumber(data.total_coins)}\n`;
    text += `${t('results.totalDenominations')}: ${formatLargeNumber(data.total_denominations)}\n\n`;
    text += `${t('results.breakdown')}:\n`;
    text += `${'-'.repeat(50)}\n`;
    
    data.breakdowns.forEach(item => {
      const type = item.is_note ? t('results.note') : t('results.coin');
      text += `${parseFloat(item.denomination)} (${type}): ${formatLargeNumber(item.count)} × ${formatLargeNumber(item.total_value)}\n`;
    });
    
    text += `${'-'.repeat(50)}\n`;
    text += `${t('results.total')}: ${formatLargeNumber(data.amount)} ${data.currency}\n`;
    
    return text;
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!result) return;
    
    try {
      const headers = [t('results.denomination'), t('results.type'), t('results.count'), t('results.totalValue')];
      const rows = result.breakdowns.map(item => [
        item.denomination,
        item.is_note ? t('results.note') : t('results.coin'),
        item.count.toString(),
        item.total_value
      ]);
      
      // Add summary row
      rows.push([t('results.total'), '', (result.total_notes + result.total_coins).toString(), result.amount]);
      
      const csvContent = [
        `${t('results.title')} - ${result.amount} ${result.currency}`,
        `${t('history.date')}: ${new Date().toLocaleString()}`,
        '',
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `breakdown_${result.currency}_${result.amount}_${Date.now()}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
      setShowExportMenu(false);
    } catch (error) {
      console.error('Failed to export CSV:', error);
      alert('Failed to export CSV. Please try again.');
    }
  };

  // Export to PDF (using browser print to PDF)
  const handleExportPDF = () => {
    if (!result) return;
    
    try {
      const printContent = generatePrintableHTML(result);
      const printWindow = window.open('', '_blank');
      
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
          printWindow.print();
          setShowExportMenu(false);
        }, 250);
      } else {
        alert('Please allow popups to export to PDF');
      }
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  // Export to Word (using HTML format that Word can open)
  const handleExportWord = () => {
    if (!result) return;
    
    try {
      const wordContent = generateWordHTML(result);
      const blob = new Blob([wordContent], { type: 'application/msword;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `breakdown_${result.currency}_${result.amount}_${Date.now()}.doc`;
      link.click();
      URL.revokeObjectURL(link.href);
      setShowExportMenu(false);
    } catch (error) {
      console.error('Failed to export Word:', error);
      alert('Failed to export to Word. Please try again.');
    }
  };

  // Print
  const handlePrint = () => {
    if (!result) return;
    
    try {
      const printContent = generatePrintableHTML(result);
      const printWindow = window.open('', '_blank');
      
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
          printWindow.print();
          setShowExportMenu(false);
        }, 250);
      } else {
        alert('Please allow popups to print');
      }
    } catch (error) {
      console.error('Failed to print:', error);
      alert('Failed to print. Please try again.');
    }
  };

  // Generate printable HTML
  const generatePrintableHTML = (data: CalculationResult): string => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${t('results.title')} - ${data.amount} ${data.currency}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #333; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
            .meta { color: #666; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 12px; text-align: left; border: 1px solid #ddd; }
            th { background-color: #f3f4f6; font-weight: 600; }
            tr:nth-child(even) { background-color: #f9fafb; }
            .text-right { text-align: right; }
            .note { background-color: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
            .coin { background-color: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
            tfoot { font-weight: bold; background-color: #e5e7eb; }
            @media print {
              body { margin: 20px; }
              @page { margin: 1cm; }
            }
          </style>
        </head>
        <body>
          <h1>${t('results.title')}</h1>
          <div class="meta">
            <p><strong>${t('results.totalAmount')}:</strong> ${formatLargeNumber(data.amount)} ${data.currency}</p>
            <p><strong>${t('results.totalNotes')}:</strong> ${formatLargeNumber(data.total_notes)}</p>
            <p><strong>${t('results.totalCoins')}:</strong> ${formatLargeNumber(data.total_coins)}</p>
            <p><strong>${t('history.date')}:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>${t('results.denomination')}</th>
                <th>${t('results.type')}</th>
                <th class="text-right">${t('results.count')}</th>
                <th class="text-right">${t('results.totalValue')}</th>
              </tr>
            </thead>
            <tbody>
              ${data.breakdowns.map(item => `
                <tr>
                  <td>${parseFloat(item.denomination).toLocaleString()}</td>
                  <td><span class="${item.is_note ? 'note' : 'coin'}">${item.is_note ? t('results.note') : t('results.coin')}</span></td>
                  <td class="text-right">${formatLargeNumber(item.count)}</td>
                  <td class="text-right">${formatLargeNumber(item.total_value)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2">${t('results.total')}</td>
                <td class="text-right">${formatLargeNumber(data.total_notes + data.total_coins)}</td>
                <td class="text-right">${formatLargeNumber(data.amount)}</td>
              </tr>
            </tfoot>
          </table>
        </body>
      </html>
    `;
  };

  // Generate Word-compatible HTML
  const generateWordHTML = (data: CalculationResult): string => {
    return `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>${t('results.title')}</title>
          <style>
            body { font-family: Calibri, Arial, sans-serif; }
            h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 10px; border: 1px solid #ddd; }
            th { background-color: #f3f4f6; font-weight: bold; }
            .text-right { text-align: right; }
          </style>
        </head>
        <body>
          <h1>${t('results.title')}</h1>
          <p><strong>${t('results.totalAmount')}:</strong> ${formatLargeNumber(data.amount)} ${data.currency}</p>
          <p><strong>${t('results.totalNotes')}:</strong> ${formatLargeNumber(data.total_notes)}</p>
          <p><strong>${t('results.totalCoins')}:</strong> ${formatLargeNumber(data.total_coins)}</p>
          <p><strong>${t('history.date')}:</strong> ${new Date().toLocaleString()}</p>
          
          <table>
            <thead>
              <tr>
                <th>${t('results.denomination')}</th>
                <th>${t('results.type')}</th>
                <th>${t('results.count')}</th>
                <th>${t('results.totalValue')}</th>
              </tr>
            </thead>
            <tbody>
              ${data.breakdowns.map(item => `
                <tr>
                  <td>${parseFloat(item.denomination).toLocaleString()}</td>
                  <td>${item.is_note ? t('results.note') : t('results.coin')}</td>
                  <td class="text-right">${formatLargeNumber(item.count)}</td>
                  <td class="text-right">${formatLargeNumber(item.total_value)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr style="font-weight: bold; background-color: #f3f4f6;">
                <td colspan="2">${t('results.total')}</td>
                <td class="text-right">${formatLargeNumber(data.total_notes + data.total_coins)}</td>
                <td class="text-right">${formatLargeNumber(data.amount)}</td>
              </tr>
            </tfoot>
          </table>
        </body>
      </html>
    `;
  };

  if (!result) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 p-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800">
        <Banknote className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-lg font-medium">{t('results.noResults')}</p>
        <p className="text-sm">{t('results.calculate')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('results.totalAmount')}</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 break-all" title={`${result.amount} ${result.currency}`}>
            {formatLargeNumber(result.amount)} {result.currency}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic capitalize">
            {numberToWords(parseFloat(result.amount), result.currency)}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('results.totalNotes')}</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2" title={result.total_notes.toString()}>
            <Banknote className="w-6 h-6 flex-shrink-0" />
            <span className="break-all">{formatLargeNumber(result.total_notes)}</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic capitalize">
            {numberToWords(result.total_notes, result.currency)}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('results.totalCoins')}</div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2" title={result.total_coins.toString()}>
            <Coins className="w-6 h-6 flex-shrink-0" />
            <span className="break-all">{formatLargeNumber(result.total_coins)}</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic capitalize">
            {numberToWords(result.total_coins, result.currency)}
          </div>
        </div>
      </div>

      {/* Breakdown Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">{t('results.title')}</h3>
          
          <div className="flex items-center gap-2">
            {/* Copy Success Message */}
            {copySuccess && (
              <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400 font-medium">
                <Check className="w-4 h-4" />
                {t('results.copiedToClipboard')}
              </div>
            )}

            {/* Copy Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowCopyMenu(!showCopyMenu)}
                className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
              >
                <Copy className="w-4 h-4" />
                {t('results.copy')}
              </button>
              
              {showCopyMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowCopyMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                    <button
                      onClick={handleCopyAsText}
                      className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors"
                    >
                      <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <div>
                        <div className="font-medium">{t('results.copyAsText')}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{t('results.textFormat')}</div>
                      </div>
                    </button>
                    <button
                      onClick={handleCopyAsJSON}
                      className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors border-t border-gray-100 dark:border-gray-700"
                    >
                      <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <div>
                        <div className="font-medium">{t('results.copyAsJSON')}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{t('results.jsonFormat')}</div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Export Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                <Download className="w-4 h-4" />
                {t('results.export')}
              </button>
            
            {showExportMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowExportMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                  <button
                    onClick={handleExportCSV}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    {t('results.exportCSV')}
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    {t('results.exportPDF')}
                  </button>
                  <button
                    onClick={handleExportWord}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    {t('results.exportWord')}
                  </button>
                  <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                  <button
                    onClick={handlePrint}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    {t('results.print')}
                  </button>
                </div>
              </>
            )}
          </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 text-sm">
                <th className="px-6 py-3 font-medium">{t('results.denomination')}</th>
                <th className="px-6 py-3 font-medium">{t('results.type')}</th>
                <th className="px-6 py-3 font-medium text-right">{t('results.count')}</th>
                <th className="px-6 py-3 font-medium text-right">{t('results.totalValue')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {result.breakdowns.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-3 font-medium text-gray-900 dark:text-gray-100">
                    {parseFloat(item.denomination).toLocaleString()}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.is_note 
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' 
                        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400'
                    }`}>
                      {item.is_note ? t('results.note') : t('results.coin')}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right font-mono text-gray-600 dark:text-gray-300 max-w-xs truncate" title={item.count.toString()}>
                    {formatLargeNumber(item.count)}
                  </td>
                  <td className="px-6 py-3 text-right font-mono font-medium text-gray-900 dark:text-gray-100 max-w-xs truncate" title={item.total_value}>
                    {formatLargeNumber(item.total_value)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 dark:bg-gray-900 font-semibold text-gray-900 dark:text-gray-100">
              <tr>
                <td colSpan={2} className="px-6 py-3">{t('results.total')}</td>
                <td className="px-6 py-3 text-right font-mono max-w-xs truncate" title={(result.total_notes + result.total_coins).toString()}>
                  {formatLargeNumber(result.total_notes + result.total_coins)}
                </td>
                <td className="px-6 py-3 text-right font-mono max-w-xs truncate" title={result.amount}>
                  {formatLargeNumber(result.amount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

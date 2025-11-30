import { useState, useRef } from 'react';
import { Upload, FileText, Download, AlertCircle, CheckCircle, XCircle, Loader2, FileDown, Copy, Check, FileImage, FileSpreadsheet } from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

interface BulkCalculationRow {
  row_number: number;
  status: 'success' | 'error';
  amount: string;
  currency: string;
  optimization_mode?: string;
  total_notes?: number;
  total_coins?: number;
  total_denominations?: number;
  error?: string;
  error_message?: string;
  calculation_id?: number;
}

interface BulkUploadResult {
  total_rows: number;
  successful: number;
  failed: number;
  processing_time_seconds: number;
  saved_to_history: boolean;
  results: BulkCalculationRow[];
}

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

export const BulkUploadPage = () => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State management
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveToHistory, setSaveToHistory] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);

  // Supported file types
  const SUPPORTED_EXTENSIONS = [
    '.csv',
    '.pdf',
    '.docx', '.doc',
    '.jpg', '.jpeg', '.png', '.tiff', '.tif', '.bmp', '.gif', '.webp'
  ];

  // File validation
  const validateFile = (file: File): string | null => {
    const fileName = file.name.toLowerCase();
    const isSupported = SUPPORTED_EXTENSIONS.some(ext => fileName.endsWith(ext));
    
    // Check file type
    if (!isSupported) {
      return 'Unsupported file format. Please upload CSV, PDF, Word (.docx), or Image files (JPG, PNG, TIFF, BMP, etc.)';
    }

    // Check file size (max 50MB for images/PDFs, 10MB for others)
    const isImageOrPDF = fileName.match(/\.(pdf|jpg|jpeg|png|tiff|tif|bmp|gif|webp)$/);
    const maxSize = isImageOrPDF ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    
    if (file.size > maxSize) {
      return `File too large. Maximum size: ${isImageOrPDF ? '50MB' : '10MB'}`;
    }

    // Check if file is empty
    if (file.size === 0) {
      return 'File is empty. Please select a valid file.';
    }

    return null;
  };

  // Get file type label
  const getFileTypeLabel = (fileName: string): string => {
    const name = fileName.toLowerCase();
    if (name.endsWith('.csv')) return 'CSV';
    if (name.endsWith('.pdf')) return 'PDF';
    if (name.match(/\.(docx|doc)$/)) return 'Word Document';
    if (name.match(/\.(jpg|jpeg|png|tiff|tif|bmp|gif|webp)$/)) return 'Image';
    return 'Unknown';
  };

  // Get file icon
  const getFileIcon = (fileName: string) => {
    const name = fileName.toLowerCase();
    if (name.endsWith('.csv')) return <FileSpreadsheet className="h-8 w-8 text-green-500" />;
    if (name.endsWith('.pdf')) return <FileText className="h-8 w-8 text-red-500" />;
    if (name.match(/\.(docx|doc)$/)) return <FileText className="h-8 w-8 text-blue-500" />;
    if (name.match(/\.(jpg|jpeg|png|tiff|tif|bmp|gif|webp)$/)) return <FileImage className="h-8 w-8 text-purple-500" />;
    return <FileText className="h-8 w-8 text-gray-500" />;
  };

  // Handle file selection
  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file);
    
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setError(null);
    setUploadResult(null);
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploadStatus('uploading');
    setError(null);

    try {
      const result = await api.uploadBulkCSV(selectedFile, saveToHistory);
      setUploadResult(result);
      setUploadStatus('completed');
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.response?.data?.detail || t('bulkUpload.errors.uploadFailed'));
      setUploadStatus('error');
    }
  };

  // Reset to initial state
  const handleReset = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setError(null);
    setUploadStatus('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Download sample CSV template
  const handleDownloadTemplate = () => {
    const csvContent = `Amount,Currency,Optimization_Mode
50000,INR,greedy
1000.50,usd,Balanced
5000,EUR,minimize_large
250000,,minimize_small
999.99,GBP,greedy
7500
15000.75,USD,greedy
3200,eur,balanced
500000,inr,MINIMIZE_LARGE
125.50,gbp,minimize_small`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'bulk_upload_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export results as CSV
  const handleExportResultsCSV = () => {
    if (!uploadResult) return;

    const headers = ['Row Number', 'Status', 'Amount', 'Currency', 'Optimization Mode', 'Total Notes', 'Total Coins', 'Total Denominations', 'Error'];
    const rows = uploadResult.results.map(row => [
      row.row_number,
      row.status,
      row.amount,
      row.currency,
      row.optimization_mode || '',
      row.total_notes || '',
      row.total_coins || '',
      row.total_denominations || '',
      row.error || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `bulk_upload_results_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export results as JSON
  const handleExportResultsJSON = () => {
    if (!uploadResult) return;

    const jsonContent = JSON.stringify(uploadResult, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `bulk_upload_results_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy results to clipboard
  const handleCopyResults = async () => {
    if (!uploadResult) return;

    try {
      const textContent = `Bulk Upload Results
===================
Total Rows: ${uploadResult.total_rows}
Successful: ${uploadResult.successful}
Failed: ${uploadResult.failed}
Processing Time: ${uploadResult.processing_time_seconds.toFixed(2)}s
Saved to History: ${uploadResult.saved_to_history ? 'Yes' : 'No'}

Detailed Results:
${uploadResult.results.map(row => 
  row.status === 'success'
    ? `Row ${row.row_number}: ✓ ${row.amount} ${row.currency} → ${row.total_denominations} denominations`
    : `Row ${row.row_number}: ✗ ${row.error}`
).join('\n')}`;

      await navigator.clipboard.writeText(textContent);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Bulk Upload & Processing
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Upload CSV, PDF, Word documents, or images for batch denomination calculations with OCR support
            </p>
          </div>
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Download CSV Template
          </button>
        </div>
      </div>

      {/* Upload Section */}
      {uploadStatus === 'idle' || uploadStatus === 'error' ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          {/* Drag and Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
          >
            <Upload className={`w-16 h-16 mx-auto mb-4 ${
              dragActive ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'
            }`} />
            
            {selectedFile ? (
              <div className="space-y-4">
                <div className="inline-flex items-center gap-4 px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800\">
                  {getFileIcon(selectedFile.name)}
                  <div className="text-left flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Selected File:</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                      {selectedFile.name}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900/30 text-xs font-medium text-blue-700 dark:text-blue-300">
                        {getFileTypeLabel(selectedFile.name)}
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </span>
                    </div>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
                >
                  Remove File
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Drag & drop your file here
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  or click to browse
                </p>
                <div className="mt-4">
                  <label className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors">
                    <FileText className="w-4 h-4" />
                    Choose File
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.pdf,.docx,.doc,.jpg,.jpeg,.png,.tiff,.tif,.bmp,.gif,.webp"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                  Supported: CSV, PDF, Word (.docx), Images (JPG, PNG, TIFF, BMP, etc.)
                </p>
              </div>
            )}
          </div>

          {/* File Requirements */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
              File Requirements & Supported Formats
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-1">Supported Formats:</p>
                <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-0.5">
                  <li>• CSV files (.csv)</li>
                  <li>• PDF documents (.pdf) - text or scanned</li>
                  <li>• Word documents (.docx)</li>
                  <li>• Images (JPG, PNG, TIFF, BMP, etc.)</li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-1">Requirements:</p>
                <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-0.5">
                  <li>• Required: Amount and Currency</li>
                  <li>• Optional: Optimization Mode</li>
                  <li>• Max size: 50MB (images/PDFs), 10MB (others)</li>
                  <li>• OCR automatically extracts data from images/PDFs</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900 dark:text-red-200">
                  Upload Error
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="saveToHistory"
                checked={saveToHistory}
                onChange={(e) => setSaveToHistory(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="saveToHistory" className="text-sm text-gray-700 dark:text-gray-300">
                Save to History
              </label>
            </div>
            
            <button
              onClick={handleUpload}
              disabled={!selectedFile}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
            >
              <Upload className="w-4 h-4" />
              Upload & Process
            </button>
          </div>
        </div>
      ) : null}

      {/* Processing Status */}
      {(uploadStatus === 'uploading' || uploadStatus === 'processing') && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-blue-600 dark:text-blue-400 animate-spin" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {uploadStatus === 'uploading' ? 'Uploading File...' : 'Processing Data...'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {uploadStatus === 'uploading' 
                ? 'Sending file to server...' 
                : 'Extracting and calculating denominations. This may take a moment for images and PDFs.'}
            </p>
            {selectedFile && (
              <div className="mt-4 inline-flex items-center gap-3 px-6 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                {getFileIcon(selectedFile.name)}
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {getFileTypeLabel(selectedFile.name)} • {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results Display */}
      {uploadStatus === 'completed' && uploadResult && (
        <div className="space-y-6">
          {/* File Information Card */}
          {selectedFile && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg shadow-sm p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-4">
                {getFileIcon(selectedFile.name)}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Processed File:</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {selectedFile.name}
                  </p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Format: <span className="font-medium text-blue-600 dark:text-blue-400">{getFileTypeLabel(selectedFile.name)}</span>
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Size: <span className="font-medium">{(selectedFile.size / 1024).toFixed(2)} KB</span>
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Processed: <span className="font-medium">{new Date().toLocaleString()}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <FileText className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Rows</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{uploadResult.total_rows}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Successful</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{uploadResult.successful}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Failed</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{uploadResult.failed}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <Loader2 className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Processing Time</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {uploadResult.processing_time_seconds.toFixed(2)}s
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload Another File
            </button>

            <button
              onClick={handleExportResultsCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <FileDown className="w-4 h-4" />
              Export as CSV
            </button>

            <button
              onClick={handleExportResultsJSON}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <FileDown className="w-4 h-4" />
              Export as JSON
            </button>

            <button
              onClick={handleCopyResults}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              {copySuccess ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copySuccess ? 'Copied!' : 'Copy Results'}
            </button>
          </div>

          {/* Results Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Row
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Currency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Denominations
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {uploadResult.results.map((row) => (
                    <tr key={row.row_number} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {row.row_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {row.status === 'success' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                            <CheckCircle className="w-3 h-3" />
                            Success
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                            <XCircle className="w-3 h-3" />
                            Error
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {row.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {row.currency}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {row.status === 'success' ? (
                          <div className="flex items-center gap-4">
                            <span className="text-blue-600 dark:text-blue-400">
                              {row.total_notes} notes
                            </span>
                            <span className="text-green-600 dark:text-green-400">
                              {row.total_coins} coins
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {row.status === 'success' ? (
                          <span className="text-gray-600 dark:text-gray-400">
                            {row.total_denominations} total denominations
                          </span>
                        ) : (
                          <span className="text-red-600 dark:text-red-400">
                            {row.error_message || row.error || 'Processing failed'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

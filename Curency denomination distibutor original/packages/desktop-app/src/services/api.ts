import axios from 'axios';

const API_BASE_URL = 'http://localhost:8001';

export interface CalculationRequest {
  amount: number | string;
  currency: string;
  optimization_mode?: string;
  save_to_history?: boolean;
}

export interface DenominationBreakdown {
  denomination: string;
  count: number;
  is_note: boolean;
  total_value: string;
}

export interface CalculationResult {
  id?: number;
  amount: string;
  currency: string;
  total_notes: number;
  total_coins: number;
  total_denominations: number;
  breakdowns: DenominationBreakdown[];
  optimization_mode?: string;
  created_at?: string;
}

export interface HistoryItem {
  id: number;
  amount: string;
  currency: string;
  total_notes: number;
  total_coins: number;
  total_denominations: number;
  optimization_mode: string;
  source: string;
  synced: boolean;
  created_at: string;
}

export interface HistoryResponse {
  items: HistoryItem[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export const api = {
  calculate: async (data: CalculationRequest): Promise<CalculationResult> => {
    const response = await axios.post(`${API_BASE_URL}/api/v1/calculate`, data);
    return response.data;
  },

  getCurrencies: async () => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/currencies`);
    return response.data;
  },
  
  getHistory: async (page = 1, pageSize = 50, currency?: string): Promise<HistoryResponse> => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/history`, {
      params: { page, page_size: pageSize, currency }
    });
    return response.data;
  },

  getCalculationDetail: async (id: number): Promise<any> => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/history/${id}`);
    return response.data;
  },

  deleteCalculation: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/api/v1/history/${id}`);
  },

  bulkDeleteCalculations: async (ids: number[]): Promise<void> => {
    await axios.post(`${API_BASE_URL}/api/v1/history/bulk-delete`, { ids });
  },

  deleteAllHistory: async (currency?: string): Promise<{ deleted_count: number }> => {
    const response = await axios.delete(`${API_BASE_URL}/api/v1/history`, {
      params: { currency }
    });
    return response.data;
  },

  exportHistoryCSV: async (ids?: number[], currency?: string): Promise<Blob> => {
    const response = await axios.post(`${API_BASE_URL}/api/v1/history/export/csv`, 
      { ids, currency },
      { responseType: 'blob' }
    );
    return response.data;
  },

  // Settings endpoints
  getSettings: async (): Promise<any> => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/settings`);
    return response.data;
  },

  getSetting: async (key: string): Promise<any> => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/settings/${key}`);
    return response.data;
  },

  updateSetting: async (key: string, value: any): Promise<any> => {
    const response = await axios.put(`${API_BASE_URL}/api/v1/settings`, { key, value });
    return response.data;
  },

  deleteSetting: async (key: string): Promise<any> => {
    const response = await axios.delete(`${API_BASE_URL}/api/v1/settings/${key}`);
    return response.data;
  },

  resetSettings: async (): Promise<any> => {
    const response = await axios.post(`${API_BASE_URL}/api/v1/settings/reset`);
    return response.data;
  },

  // Quick Access
  getQuickAccess: async (count: number = 10): Promise<{ items: HistoryItem[], count: number }> => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/history/quick-access`, {
      params: { count }
    });
    return response.data;
  },

  // Translations endpoints
  getSupportedLanguages: async (): Promise<any> => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/translations/languages`);
    return response.data;
  },

  getTranslations: async (languageCode: string): Promise<any> => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/translations/${languageCode}`);
    return response.data;
  },

  // Bulk Upload endpoint
  uploadBulkCSV: async (file: File, saveToHistory: boolean = true): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/bulk-upload`,
      formData,
      {
        params: { 
          save_to_history: saveToHistory
        },
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // Smart Currency Recommendation
  getSmartCurrencyRecommendation: async (timezone?: string, locale?: string, language?: string): Promise<any> => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/smart-currency`, {
      params: { timezone, locale, language }
    });
    return response.data;
  }
};
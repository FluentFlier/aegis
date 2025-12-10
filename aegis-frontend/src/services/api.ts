/**
 * API Service - Connects frontend to backend
 *
 * Base URL: http://localhost:8000 (from .env)
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Generic API fetch wrapper with error handling
 */
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

/**
 * Supplier API
 */
export const suppliersAPI = {
  // Get all suppliers
  getAll: async (params?: {
    status?: string;
    region?: string;
    search?: string;
    min_risk?: number;
    max_risk?: number;
  }) => {
    const queryParams = new URLSearchParams(params as any).toString();
    return apiFetch(`/api/suppliers/${queryParams ? `?${queryParams}` : ''}`);
  },

  // Get single supplier
  getById: async (id: number) => {
    return apiFetch(`/api/suppliers/${id}`);
  },

  // Create supplier
  create: async (data: any) => {
    return apiFetch('/api/suppliers/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update supplier
  update: async (id: number, data: any) => {
    return apiFetch(`/api/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete supplier
  delete: async (id: number) => {
    return apiFetch(`/api/suppliers/${id}`, { method: 'DELETE' });
  },

  // Get risk breakdown
  getRiskBreakdown: async (id: number) => {
    return apiFetch(`/api/suppliers/${id}/risk-breakdown`);
  },

  // Get risk trend
  getRiskTrend: async (id: number, days: number = 90) => {
    return apiFetch(`/api/suppliers/${id}/risk-trend?days=${days}`);
  },

  // Run risk assessment
  assess: async (id: number, contractId?: number) => {
    return apiFetch(`/api/suppliers/${id}/assess`, {
      method: 'POST',
      body: JSON.stringify({ contract_id: contractId }),
    });
  },

  // Get supplier alerts
  getAlerts: async (id: number) => {
    return apiFetch(`/api/suppliers/${id}/alerts`);
  },

  // Get supplier contracts
  getContracts: async (id: number) => {
    return apiFetch(`/api/suppliers/${id}/contracts`);
  },

  // Upload document
  uploadDocument: async (id: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    // We can't use apiFetch for FormData because we don't want Content-Type: application/json
    const url = `${API_BASE_URL}/api/suppliers/${id}/upload-document`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(error.detail || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error (uploadDocument):`, error);
      throw error;
    }
  },
};

/**
 * Analytics API
 */
export const analyticsAPI = {
  // Portfolio summary
  getPortfolioSummary: async () => {
    return apiFetch('/api/analytics/portfolio/summary');
  },

  // Risk distribution
  getRiskDistribution: async () => {
    return apiFetch('/api/analytics/risk-distribution');
  },

  // Risk by region
  getRiskByRegion: async () => {
    return apiFetch('/api/analytics/risk-by-region');
  },

  // Risk by category
  getRiskByCategory: async () => {
    return apiFetch('/api/analytics/risk-by-category');
  },

  // Risk trends
  getRiskTrends: async (days: number = 90) => {
    return apiFetch(`/api/analytics/risk-trends?days=${days}`);
  },

  // Top risks
  getTopRisks: async (limit: number = 10) => {
    return apiFetch(`/api/analytics/top-risks?limit=${limit}`);
  },

  // Contract outcomes
  getContractOutcomes: async () => {
    return apiFetch('/api/analytics/contract-outcomes');
  },

  // Agent activity
  getAgentActivity: async (days: number = 30) => {
    return apiFetch(`/api/analytics/agent-activity?days=${days}`);
  },

  // ESG compliance
  getESGCompliance: async () => {
    return apiFetch('/api/analytics/esg-compliance');
  },
};

/**
 * Alerts API
 */
export const alertsAPI = {
  // Get all alerts
  getAll: async (params?: {
    severity?: string;
    category?: string;
    is_read?: boolean;
    is_resolved?: boolean;
    supplier_id?: number;
  }) => {
    const queryParams = new URLSearchParams(params as any).toString();
    return apiFetch(`/api/alerts/${queryParams ? `?${queryParams}` : ''}`);
  },

  // Get single alert
  getById: async (id: number) => {
    return apiFetch(`/api/alerts/${id}`);
  },

  // Create alert
  create: async (data: any) => {
    return apiFetch('/api/alerts/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Mark as read
  markRead: async (id: number) => {
    return apiFetch(`/api/alerts/${id}/mark-read`, { method: 'PATCH' });
  },

  // Mark as unread
  markUnread: async (id: number) => {
    return apiFetch(`/api/alerts/${id}/mark-unread`, { method: 'PATCH' });
  },

  // Resolve alert
  resolve: async (id: number) => {
    return apiFetch(`/api/alerts/${id}/resolve`, { method: 'PATCH' });
  },

  // Delete alert
  delete: async (id: number) => {
    return apiFetch(`/api/alerts/${id}`, { method: 'DELETE' });
  },

  // Get summary
  getSummary: async () => {
    return apiFetch('/api/alerts/stats/summary');
  },

  // Mark all as read
  markAllRead: async () => {
    return apiFetch('/api/alerts/mark-all-read', { method: 'POST' });
  },
};

/**
 * Agents API
 */
export const agentsAPI = {
  // Dispatch agents
  dispatch: async (data: {
    task: string;
    supplier_id: number;
    contract_id?: number;
    agent_type?: string;
  }) => {
    return apiFetch('/api/agents/dispatch', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get activity
  getActivity: async (params?: {
    supplier_id?: number;
    agent_type?: string;
  }) => {
    const queryParams = new URLSearchParams(params as any).toString();
    return apiFetch(`/api/agents/activity${queryParams ? `?${queryParams}` : ''}`);
  },

  // Get stats
  getStats: async () => {
    return apiFetch('/api/agents/stats');
  },

  // Chat with agent
  chat: async (message: string, context?: any) => {
    return apiFetch('/api/agents/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    });
  },
};

/**
 * ML Models API
 */
export const mlModelsAPI = {
  // Get all versions
  getVersions: async (params?: {
    is_active?: boolean;
    is_approved?: boolean;
  }) => {
    const queryParams = new URLSearchParams(params as any).toString();
    return apiFetch(`/api/ml-models/versions${queryParams ? `?${queryParams}` : ''}`);
  },

  // Get active version
  getActiveVersion: async () => {
    return apiFetch('/api/ml-models/versions/active');
  },

  // Get specific version
  getVersion: async (id: number) => {
    return apiFetch(`/api/ml-models/versions/${id}`);
  },

  // Train new model
  train: async (data: {
    model_type?: string;
    description?: string;
    auto_approve?: boolean;
  }) => {
    return apiFetch('/api/ml-models/train', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Approve version
  approve: async (id: number) => {
    return apiFetch(`/api/ml-models/versions/${id}/approve`, { method: 'POST' });
  },

  // Activate version
  activate: async (id: number) => {
    return apiFetch(`/api/ml-models/versions/${id}/activate`, { method: 'POST' });
  },

  // Rollback to version
  rollback: async (id: number) => {
    return apiFetch(`/api/ml-models/versions/${id}/rollback`, { method: 'POST' });
  },

  // Compare versions
  compare: async (version1Id: number, version2Id: number) => {
    return apiFetch(`/api/ml-models/versions/compare?version_1_id=${version1Id}&version_2_id=${version2Id}`);
  },

  // Get weight evolution
  getWeightEvolution: async (category?: string) => {
    return apiFetch(`/api/ml-models/weight-evolution${category ? `?category=${category}` : ''}`);
  },

  // Check training readiness
  checkTrainingReadiness: async () => {
    return apiFetch('/api/ml-models/training-readiness');
  },
};

/**
 * Health check
 */
export const healthAPI = {
  check: async () => {
    return apiFetch('/health');
  },
};

// Export all APIs
export default {
  suppliers: suppliersAPI,
  analytics: analyticsAPI,
  alerts: alertsAPI,
  agents: agentsAPI,
  mlModels: mlModelsAPI,
  health: healthAPI,
};

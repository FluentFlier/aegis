export interface Supplier {
  id: string;
  name: string;
  logo?: string;
  category: string;
  region: string;
  status: 'Active' | 'Under Review' | 'Critical' | 'Pending';
  riskScore: number;
  riskTrend: number; // Change from last week
  confidence: number; // 0-100
  dimensions: {
    financial: number;
    legal: number;
    esg: number;
    geoClimate: number;
    operational: number;
    pricing: number;
    social: number;
    performance: number;
  };
  trendData: number[]; // 12 months of risk scores
  recentEvents: Event[];
  contractStatus?: string;
  contractTermMonths?: number;
  annualVolume?: number;
  topRiskDrivers?: string[];
}

export interface Event {
  id: string;
  type: 'warning' | 'critical' | 'info';
  title: string;
  description: string;
  timestamp: string;
  supplierId?: string;
  supplierName?: string;
  category: 'Legal' | 'ESG' | 'Financial' | 'Performance' | 'Operational' | 'Geo' | 'Pricing' | 'Social';
  agent?: AgentType;
}

export interface Recommendation {
  id: string;
  title: string;
  summary: string;
  riskImpact: number;
  costImpact: string;
  action: 'Proceed' | 'Negotiate' | 'Replace' | 'Review';
  reasoning: string;
}

export interface ChatMessage {
  id: string;
  sender: 'agent' | 'user';
  message: string;
  timestamp: string;
  quickReplies?: string[];
  agentType?: AgentType;
}

export interface AgentActivity {
  id: string;
  agentType: AgentType;
  action: string;
  supplierId?: string;
  supplierName?: string;
  delta?: number;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
}

export type AgentType = 'Financial' | 'Legal' | 'ESG' | 'Geo' | 'Operational' | 'Pricing' | 'Social' | 'Performance';

export interface ScenarioParams {
  contractTermMonths: number;
  annualVolume: number;
  priceAdjustment: number;
  region: string;
}

export interface ScenarioResult {
  projectedRisk: number;
  costImpact: number;
  confidence: number;
  keyChanges: string[];
}

export type Screen = 'login' | 'dashboard' | 'supplier-detail' | 'alerts' | 'sourcing' | 'contract' | 'analytics' | 'onboarding';

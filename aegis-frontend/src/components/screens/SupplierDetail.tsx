import React, { useState } from 'react';
import { Supplier, Recommendation } from '../../types';
import { RiskArrow } from '../RiskArrow';
import { TrendChart } from '../TrendChart';
import { ScenarioSimulator } from '../ScenarioSimulator';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  Activity,
} from 'lucide-react';

interface SupplierDetailProps {
  supplier: Supplier;
  recommendations: Recommendation[];
  onBack: () => void;
  onApprove: (recommendationId: string) => void;
  onAskAgent: () => void;
}

export function SupplierDetail({
  supplier,
  recommendations,
  onBack,
  onApprove,
  onAskAgent,
}: SupplierDetailProps) {
  const [selectedRecommendation, setSelectedRecommendation] = useState<string | null>(null);

  const dimensionLabels = {
    financial: 'Financial Health',
    legal: 'Legal Compliance',
    esg: 'ESG Performance',
    geoClimate: 'Geo-Political & Climate',
    operational: 'Operational Stability',
    pricing: 'Pricing Volatility',
    social: 'Social Responsibility',
    performance: 'Delivery Performance',
  };

  const getDimensionColor = (score: number) => {
    if (score <= 40) return '#2EB8A9';
    if (score <= 60) return '#7BC96F';
    if (score <= 80) return '#F4B400';
    return '#E63946';
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-[#E63946]" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-[#F4B400]" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-[#2EB8A9]" />;
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-[#F7F9FB] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Back Button */}
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>

        {/* Header */}
        <Card className="p-6 bg-white">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#1F2D3D] to-[#2EB8A9] rounded-xl flex items-center justify-center text-white">
                <Building2 className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-gray-900 mb-2">{supplier.name}</h1>
                <div className="flex items-center gap-4 text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{supplier.region}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    <span>{supplier.category}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{supplier.contractStatus}</span>
                  </div>
                </div>
              </div>
            </div>
            <Badge
              className={`text-white border-0 ${
                supplier.status === 'Active'
                  ? 'bg-[#2EB8A9]'
                  : supplier.status === 'Critical'
                  ? 'bg-[#E63946]'
                  : 'bg-[#F4B400]'
              }`}
            >
              {supplier.status}
            </Badge>
          </div>

          {/* Overall Risk Score */}
          <RiskArrow 
            score={supplier.riskScore} 
            size="large" 
            showLabel={true}
            trend={supplier.riskTrend}
            drivers={supplier.topRiskDrivers}
          />
          
          {/* Confidence Badge */}
          <div className="mt-4 text-center">
            <Badge variant="outline" className="px-4 py-1.5">
              <Activity className="w-3 h-3 mr-2" />
              Confidence: {supplier.confidence}%
            </Badge>
          </div>
        </Card>

        {/* Trend Chart */}
        {supplier.trendData && supplier.trendData.length > 0 && (
          <Card className="p-6 bg-white">
            <TrendChart data={supplier.trendData} title="12-Month Risk Trajectory" />
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dimension Breakdown */}
          <Card className="p-6 bg-white">
            <h2 className="text-gray-900 mb-4">Risk Dimension Breakdown</h2>
            <div className="space-y-4">
              {Object.entries(supplier.dimensions).map(([key, value]) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-700">
                      {dimensionLabels[key as keyof typeof dimensionLabels]}
                    </span>
                    <span className="text-sm tabular-nums" style={{ color: getDimensionColor(value) }}>
                      {value}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-500 rounded-full"
                      style={{
                        width: `${value}%`,
                        backgroundColor: getDimensionColor(value),
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Timeline / Event Feed */}
          <Card className="p-6 bg-white">
            <h2 className="text-gray-900 mb-4">Recent Events</h2>
            <div className="space-y-4">
              {supplier.recentEvents.length > 0 ? (
                supplier.recentEvents.map((event) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="mt-1">{getEventIcon(event.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <h3 className="text-sm text-gray-900">{event.title}</h3>
                        <span className="text-xs text-gray-500">{formatDate(event.timestamp)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                      <Badge variant="outline" className="mt-2 text-xs">
                        {event.category}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No recent events</p>
              )}
            </div>
          </Card>
        </div>

        {/* Contract Panel */}
        <Card className="p-6 bg-white">
          <h2 className="text-gray-900 mb-4">Contract Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Contract Status</p>
              <p className="text-gray-900">{supplier.contractStatus}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Payment Terms</p>
              <p className="text-gray-900">Net 30</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Auto-Renewal</p>
              <p className="text-gray-900">Enabled</p>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <FileText className="w-4 h-4" />
              View Full Contract
            </Button>
            <Button variant="outline" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Contract Analysis
            </Button>
          </div>
        </Card>

        {/* Scenario Simulator */}
        <ScenarioSimulator supplier={supplier} />

        {/* Recommendations */}
        <Card className="p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-gray-900">Decision Options</h2>
            <Button variant="outline" onClick={onAskAgent} className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Ask Aegis Agent
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                onClick={() => setSelectedRecommendation(rec.id)}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedRecommendation === rec.id
                    ? 'border-[#2EB8A9] bg-[#2EB8A9]/5'
                    : 'border-gray-200 hover:border-[#2EB8A9]/50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-gray-900">{rec.title}</h3>
                  <Badge
                    variant="outline"
                    className={
                      rec.action === 'Proceed'
                        ? 'border-[#2EB8A9] text-[#2EB8A9]'
                        : rec.action === 'Negotiate'
                        ? 'border-[#F4B400] text-[#F4B400]'
                        : 'border-[#E63946] text-[#E63946]'
                    }
                  >
                    {rec.action}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3">{rec.summary}</p>
                {rec.reasoning && (
                  <p className="text-xs text-gray-500 mb-3 italic">{rec.reasoning}</p>
                )}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Risk Impact:</span>
                    <span
                      className={rec.riskImpact < 0 ? 'text-[#2EB8A9]' : 'text-[#E63946]'}
                    >
                      {rec.riskImpact > 0 ? '+' : ''}
                      {rec.riskImpact}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Cost Impact:</span>
                    <span className="text-gray-900">{rec.costImpact}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {selectedRecommendation && (
            <div className="mt-6 flex gap-3">
              <Button
                onClick={() => onApprove(selectedRecommendation)}
                className="bg-[#2EB8A9] hover:bg-[#2EB8A9]/90"
              >
                Approve Selected Option
              </Button>
              <Button variant="outline">Request Team Review</Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

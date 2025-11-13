import React from 'react';
import { Supplier } from '../types';
import { RiskArrow } from './RiskArrow';
import { Badge } from './ui/badge';
import { Building2, MapPin, TrendingUp, TrendingDown } from 'lucide-react';

interface SupplierCardProps {
  supplier: Supplier;
  onClick?: () => void;
}

export function SupplierCard({ supplier, onClick }: SupplierCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-[#2EB8A9]';
      case 'Critical':
        return 'bg-[#E63946]';
      case 'Under Review':
        return 'bg-[#F4B400]';
      default:
        return 'bg-gray-400';
    }
  };

  const avgDimensionScore = Object.values(supplier.dimensions).reduce((a, b) => a + b, 0) / 8;

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-[#1F2D3D]/80 dark:border-white/10 glass-card rounded-lg border border-gray-200 p-4 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-12 h-12 bg-gradient-to-br from-[#1F2D3D] to-[#2EB8A9] rounded-lg flex items-center justify-center text-white flex-shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-gray-900 dark:text-white truncate group-hover:text-[#2EB8A9] transition-colors">
              {supplier.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{supplier.category}</p>
            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
              <MapPin className="w-3 h-3" />
              <span>{supplier.region}</span>
            </div>
          </div>
        </div>
        <Badge className={`${getStatusColor(supplier.status)} text-white border-0`}>
          {supplier.status}
        </Badge>
      </div>

      {/* Risk Arrow & Trend */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-gray-600 dark:text-gray-400">Risk Score</span>
          {supplier.riskTrend !== undefined && (
            <div className="flex items-center gap-1">
              {supplier.riskTrend > 0 ? (
                <TrendingUp className="w-3 h-3 text-[#E63946]" />
              ) : supplier.riskTrend < 0 ? (
                <TrendingDown className="w-3 h-3 text-[#2EB8A9]" />
              ) : null}
              <span
                className={`text-xs ${
                  supplier.riskTrend > 0
                    ? 'text-[#E63946]'
                    : supplier.riskTrend < 0
                    ? 'text-[#2EB8A9]'
                    : 'text-gray-600'
                }`}
              >
                {supplier.riskTrend > 0 ? '+' : ''}
                {supplier.riskTrend}
              </span>
            </div>
          )}
        </div>
        <RiskArrow score={supplier.riskScore} size="small" showLabel={false} />
        {/* Sparkline */}
        {supplier.trendData && supplier.trendData.length > 0 && (
          <div className="mt-2">
            <svg width="100%" height="24" className="overflow-visible">
              <polyline
                fill="none"
                stroke={
                  supplier.riskScore <= 40
                    ? '#2EB8A9'
                    : supplier.riskScore <= 60
                    ? '#7BC96F'
                    : supplier.riskScore <= 80
                    ? '#F4B400'
                    : '#E63946'
                }
                strokeWidth="1.5"
                points={supplier.trendData
                  .map((value, index) => {
                    const x = (index / (supplier.trendData!.length - 1)) * 100;
                    const y = 24 - (value / 100) * 24;
                    return `${x}%,${y}`;
                  })
                  .join(' ')}
              />
            </svg>
          </div>
        )}
      </div>

      {/* Mini dimension bars */}
      <div className="space-y-1.5">
        {[
          { label: 'Financial', value: supplier.dimensions.financial },
          { label: 'Legal', value: supplier.dimensions.legal },
          { label: 'Operational', value: supplier.dimensions.operational },
        ].map((dim) => (
          <div key={dim.label} className="flex items-center gap-2">
            <span className="text-xs text-gray-600 dark:text-gray-400 w-20">{dim.label}</span>
            <div className="flex-1 h-1.5 bg-gray-100 dark:bg-[#0F1419] rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-500 rounded-full"
                style={{
                  width: `${dim.value}%`,
                  backgroundColor:
                    dim.value <= 40
                      ? '#2EB8A9'
                      : dim.value <= 60
                      ? '#7BC96F'
                      : dim.value <= 80
                      ? '#F4B400'
                      : '#E63946',
                }}
              ></div>
            </div>
            <span className="text-xs text-gray-500 w-6 text-right tabular-nums">{dim.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

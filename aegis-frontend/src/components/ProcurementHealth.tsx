import React from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import {
  Activity,
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Leaf,
} from 'lucide-react';
import { Supplier } from '../types';

interface ProcurementHealthProps {
  suppliers: Supplier[];
}

export function ProcurementHealth({ suppliers }: ProcurementHealthProps) {
  // Calculate health metrics
  const avgRisk = Math.round(suppliers.reduce((sum, s) => sum + s.riskScore, 0) / suppliers.length);
  const criticalCount = suppliers.filter((s) => s.status === 'Critical').length;
  const avgESG = Math.round(suppliers.reduce((sum, s) => sum + s.dimensions.esg, 0) / suppliers.length);
  const onTimeDelivery = 94; // Mock
  const financialDiversity = 82; // Mock
  
  // Calculate overall health score (0-100)
  const healthScore = Math.round(
    (100 - avgRisk) * 0.35 + // Risk (35%)
    (100 - (criticalCount / suppliers.length * 100)) * 0.25 + // Alerts (25%)
    onTimeDelivery * 0.20 + // Delivery (20%)
    (100 - avgESG) * 0.10 + // ESG (10%)
    financialDiversity * 0.10 // Diversity (10%)
  );

  const getHealthStatus = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: '#34D399', icon: CheckCircle2 };
    if (score >= 65) return { label: 'Good', color: '#2EB8A9', icon: TrendingUp };
    if (score >= 50) return { label: 'Fair', color: '#F4B400', icon: AlertTriangle };
    return { label: 'At Risk', color: '#E63946', icon: AlertTriangle };
  };

  const status = getHealthStatus(healthScore);
  const StatusIcon = status.icon;

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#2EB8A9]" />
              Procurement Health Index
            </CardTitle>
            <CardDescription>Real-time ecosystem performance</CardDescription>
          </div>
          <Badge
            className="px-3 py-1"
            style={{ backgroundColor: `${status.color}20`, color: status.color, borderColor: status.color }}
          >
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Score */}
        <div className="relative">
          <div className="flex items-center justify-center">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="12"
                />
                <motion.circle
                  cx="96"
                  cy="96"
                  r="88"
                  fill="none"
                  stroke={status.color}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 88}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 88 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 88 * (1 - healthScore / 100) }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.p
                  className="text-5xl"
                  style={{ color: status.color }}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {healthScore}
                </motion.p>
                <p className="text-sm text-[#1F2D3D]/60 mt-1">out of 100</p>
              </div>
            </div>
          </div>
        </div>

        {/* Breakdown */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#2EB8A9]" />
              <span>Average Risk Score</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{avgRisk}/100</span>
              <div className="w-24">
                <Progress value={avgRisk} className="h-2" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#F4B400]" />
              <span>Critical Alerts</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{criticalCount}</span>
              <Badge variant={criticalCount > 2 ? 'destructive' : 'secondary'}>
                {((criticalCount / suppliers.length) * 100).toFixed(0)}%
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
              <span>On-Time Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{onTimeDelivery}%</span>
              <div className="w-24">
                <Progress value={onTimeDelivery} className="h-2" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-[#34D399]" />
              <span>ESG Performance</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{100 - avgESG}/100</span>
              <div className="w-24">
                <Progress value={100 - avgESG} className="h-2" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#60A5FA]" />
              <span>Financial Diversity</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{financialDiversity}%</span>
              <div className="w-24">
                <Progress value={financialDiversity} className="h-2" />
              </div>
            </div>
          </div>
        </div>

        {/* Insight */}
        <div className="p-4 bg-gradient-to-br from-[#2EB8A9]/10 to-[#2EB8A9]/5 rounded-lg border border-[#2EB8A9]/20">
          <div className="flex items-start gap-3">
            <StatusIcon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: status.color }} />
            <div>
              <p className="font-medium text-sm mb-1">System Recommendation</p>
              <p className="text-sm text-[#1F2D3D]/70">
                {healthScore >= 80 && 'Your procurement ecosystem is performing excellently. Continue monitoring ESG compliance and maintain supplier relationships.'}
                {healthScore >= 65 && healthScore < 80 && 'Overall health is good. Focus on reducing critical alerts and improving delivery performance.'}
                {healthScore >= 50 && healthScore < 65 && 'Attention needed. Review high-risk suppliers and consider diversifying your portfolio.'}
                {healthScore < 50 && 'Immediate action required. Multiple suppliers show critical risk levels. Review and implement mitigation strategies.'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

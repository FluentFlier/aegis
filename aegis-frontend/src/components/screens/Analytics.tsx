import React, { useState } from 'react';
import { Supplier } from '../../types';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ExecutiveAnalytics } from '../ExecutiveAnalytics';
import { ArrowLeft } from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface AnalyticsProps {
  suppliers: Supplier[];
  onBack: () => void;
}

export function Analytics({ suppliers, onBack }: AnalyticsProps) {
  // Risk distribution data
  const riskDistribution = [
    { range: '0-20', count: suppliers.filter(s => s.riskScore <= 20).length },
    { range: '21-40', count: suppliers.filter(s => s.riskScore > 20 && s.riskScore <= 40).length },
    { range: '41-60', count: suppliers.filter(s => s.riskScore > 40 && s.riskScore <= 60).length },
    { range: '61-80', count: suppliers.filter(s => s.riskScore > 60 && s.riskScore <= 80).length },
    { range: '81-100', count: suppliers.filter(s => s.riskScore > 80).length },
  ];

  // Region risk averages
  const regionData = Object.entries(
    suppliers.reduce((acc, s) => {
      if (!acc[s.region]) acc[s.region] = { total: 0, count: 0 };
      acc[s.region].total += s.riskScore;
      acc[s.region].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>)
  ).map(([region, data]) => ({
    region: region.split(' ')[0], // Shorten for display
    avgRisk: Math.round(data.total / data.count),
  }));

  // Risk vs Cost scatter
  const scatterData = suppliers.map(s => ({
    risk: s.riskScore,
    cost: s.annualVolume ? s.annualVolume / 10000 : 0,
    name: s.name,
  }));

  // ESG compliance
  const esgData = suppliers.map(s => ({
    name: s.name.split(' ')[0],
    esg: s.dimensions.esg,
  }));

  // Status distribution
  const statusData = [
    { name: 'Active', value: suppliers.filter(s => s.status === 'Active').length, color: '#2EB8A9' },
    { name: 'Critical', value: suppliers.filter(s => s.status === 'Critical').length, color: '#E63946' },
    { name: 'Under Review', value: suppliers.filter(s => s.status === 'Under Review').length, color: '#F4B400' },
    { name: 'Pending', value: suppliers.filter(s => s.status === 'Pending').length, color: '#8B5CF6' },
  ];

  // Time series (average risk by month)
  const monthlyTrend = Array.from({ length: 12 }, (_, i) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
    avgRisk: Math.round(
      suppliers.reduce((sum, s) => sum + (s.trendData?.[i] || 0), 0) / suppliers.length
    ),
  }));

  return (
    <div className="min-h-screen bg-[#F7F9FB] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>

        <div>
          <h1 className="text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Advanced supplier risk intelligence & benchmarking</p>
        </div>

        <Tabs defaultValue="executive" className="w-full">
          <TabsList>
            <TabsTrigger value="executive">Executive Dashboard</TabsTrigger>
            <TabsTrigger value="detailed">Detailed Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="executive" className="mt-6">
            <ExecutiveAnalytics suppliers={suppliers} />
          </TabsContent>

          <TabsContent value="detailed" className="mt-6 space-y-6">

        {/* Top Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Risk Distribution */}
          <Card className="p-6 bg-white">
            <h2 className="text-gray-900 mb-4">Risk Distribution</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={riskDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="range" tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                  }}
                />
                <Bar dataKey="count" fill="#2EB8A9" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Regional Risk */}
          <Card className="p-6 bg-white">
            <h2 className="text-gray-900 mb-4">Average Risk by Region</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={regionData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 12 }} domain={[0, 100]} />
                <YAxis type="category" dataKey="region" tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                  }}
                />
                <Bar dataKey="avgRisk" fill="#F4B400" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Middle Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Risk vs Cost Correlation */}
          <Card className="p-6 bg-white">
            <h2 className="text-gray-900 mb-4">Risk vs Annual Volume</h2>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  type="number"
                  dataKey="risk"
                  name="Risk Score"
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  label={{ value: 'Risk Score', position: 'bottom', fill: '#6B7280', fontSize: 12 }}
                />
                <YAxis
                  type="number"
                  dataKey="cost"
                  name="Annual Volume ($10K)"
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  label={{ value: 'Volume ($10K)', angle: -90, position: 'left', fill: '#6B7280', fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                  }}
                />
                <Scatter name="Suppliers" data={scatterData} fill="#8B5CF6" />
              </ScatterChart>
            </ResponsiveContainer>
          </Card>

          {/* Status Distribution */}
          <Card className="p-6 bg-white">
            <h2 className="text-gray-900 mb-4">Supplier Status Distribution</h2>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trend */}
          <Card className="p-6 bg-white">
            <h2 className="text-gray-900 mb-4">Average Risk - 12 Month Trend</h2>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="avgRisk"
                  stroke="#2EB8A9"
                  strokeWidth={2}
                  dot={{ fill: '#2EB8A9', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* ESG Compliance */}
          <Card className="p-6 bg-white">
            <h2 className="text-gray-900 mb-4">ESG Performance by Supplier</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={esgData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                  }}
                />
                <Bar dataKey="esg" fill="#10B981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

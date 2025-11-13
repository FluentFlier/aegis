import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Supplier } from '../types';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Scale,
  Leaf,
  Users,
  Clock,
  Award,
  Download,
  Calendar,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

interface ExecutiveAnalyticsProps {
  suppliers: Supplier[];
}

export function ExecutiveAnalytics({ suppliers }: ExecutiveAnalyticsProps) {
  const [timeRange, setTimeRange] = useState<'30' | '90' | '180'>('90');

  // Generate trend data (mock historical data)
  const generateTrendData = (days: number) => {
    const data = [];
    for (let i = days; i >= 0; i -= Math.floor(days / 12)) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        avgRisk: Math.round(45 + Math.random() * 10),
        critical: Math.round(1 + Math.random() * 3),
        esgScore: Math.round(70 + Math.random() * 10),
        onTime: Math.round(90 + Math.random() * 8),
      });
    }
    return data;
  };

  const trendData = generateTrendData(parseInt(timeRange));

  // Top risk drivers
  const riskDrivers = [
    { category: 'Legal', count: 12, trend: 8, severity: 'high' },
    { category: 'Financial', count: 8, trend: -2, severity: 'medium' },
    { category: 'ESG', count: 5, trend: -5, severity: 'low' },
    { category: 'Operational', count: 7, trend: 3, severity: 'medium' },
    { category: 'Geo-Political', count: 9, trend: 12, severity: 'high' },
  ];

  // Supplier turnover
  const turnoverData = [
    { month: 'Jun', added: 2, removed: 1, replaced: 0 },
    { month: 'Jul', added: 1, removed: 0, replaced: 1 },
    { month: 'Aug', added: 3, removed: 2, replaced: 1 },
    { month: 'Sep', added: 1, removed: 1, replaced: 0 },
    { month: 'Oct', added: 2, removed: 0, replaced: 0 },
    { month: 'Nov', added: 0, removed: 1, replaced: 1 },
  ];

  // Category performance radar
  const categoryPerformance = [
    { category: 'Risk Mgmt', score: 85 },
    { category: 'Cost Efficiency', score: 78 },
    { category: 'Quality', score: 92 },
    { category: 'Delivery', score: 88 },
    { category: 'ESG', score: 76 },
    { category: 'Innovation', score: 82 },
  ];

  // Legal case trends
  const legalTrends = [
    { month: 'Jun', cases: 3, resolved: 2, pending: 4 },
    { month: 'Jul', cases: 2, resolved: 3, pending: 3 },
    { month: 'Aug', cases: 5, resolved: 2, pending: 6 },
    { month: 'Sep', cases: 1, resolved: 4, pending: 3 },
    { month: 'Oct', cases: 4, resolved: 2, pending: 5 },
    { month: 'Nov', cases: 2, resolved: 3, pending: 4 },
  ];

  // Negotiation savings
  const savingsData = [
    { quarter: 'Q1 2024', savings: 320, avg: 8.5 },
    { quarter: 'Q2 2024', savings: 450, avg: 12.3 },
    { quarter: 'Q3 2024', savings: 380, avg: 9.8 },
    { quarter: 'Q4 2024', savings: 520, avg: 14.2 },
  ];

  const totalSavings = savingsData.reduce((sum, q) => sum + q.savings, 0);

  const exportToPDF = () => {
    // Mock export functionality
    alert('Exporting analytics to PDF...\n\nThis would generate a board-ready PDF report with all charts and insights.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl text-gray-900 mb-1">Executive Analytics Dashboard</h2>
          <p className="text-gray-600">Comprehensive procurement intelligence and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {(['30', '90', '180'] as const).map((days) => (
              <Button
                key={days}
                variant={timeRange === days ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(days)}
                className={timeRange === days ? 'bg-[#2EB8A9] hover:bg-[#2EB8A9]/90' : ''}
              >
                {days} Days
              </Button>
            ))}
          </div>
          <Button onClick={exportToPDF} className="bg-[#2EB8A9] hover:bg-[#2EB8A9]/90">
            <Download className="w-4 h-4 mr-2" />
            Export to PDF
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-[#2EB8A9]/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-[#2EB8A9]" />
                </div>
                <Badge variant="outline" className="text-[#34D399] border-[#34D399]">
                  <TrendingDown className="w-3 h-3 mr-1" />
                  -3%
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-1">Avg Portfolio Risk</p>
              <p className="text-3xl text-gray-900">42</p>
              <p className="text-xs text-gray-500 mt-2">vs. 45 last period</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-[#F4B400]/10 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-[#F4B400]" />
                </div>
                <Badge variant="outline" className="text-[#34D399] border-[#34D399]">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12%
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-1">Total Savings (YTD)</p>
              <p className="text-3xl text-gray-900">${totalSavings}K</p>
              <p className="text-xs text-gray-500 mt-2">Negotiation impact</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-[#E63946]/10 flex items-center justify-center">
                  <Scale className="w-6 h-6 text-[#E63946]" />
                </div>
                <Badge variant="outline" className="text-[#E63946] border-[#E63946]">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +2
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-1">Active Legal Cases</p>
              <p className="text-3xl text-gray-900">4</p>
              <p className="text-xs text-gray-500 mt-2">2 high priority</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-[#34D399]/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-[#34D399]" />
                </div>
                <Badge variant="outline" className="text-[#34D399] border-[#34D399]">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +2%
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-1">On-Time Delivery</p>
              <p className="text-3xl text-gray-900">94%</p>
              <p className="text-xs text-gray-500 mt-2">vs. 92% target</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio Risk Trend */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#2EB8A9]" />
              Portfolio Risk Trend
            </CardTitle>
            <CardDescription>Average risk score over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2EB8A9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2EB8A9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#6B7280" />
                <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="avgRisk"
                  stroke="#2EB8A9"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#riskGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Critical Incidents */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-[#E63946]" />
              Critical Incidents
            </CardTitle>
            <CardDescription>High-priority events tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#6B7280" />
                <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="critical"
                  stroke="#E63946"
                  strokeWidth={3}
                  dot={{ fill: '#E63946', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Risk Drivers */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[#F4B400]" />
              Top Risk Drivers by Category
            </CardTitle>
            <CardDescription>Issues identified in last {timeRange} days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {riskDrivers.map((driver, index) => (
                <div key={driver.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{driver.category}</span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          driver.severity === 'high'
                            ? 'border-[#E63946] text-[#E63946]'
                            : driver.severity === 'medium'
                            ? 'border-[#F4B400] text-[#F4B400]'
                            : 'border-[#2EB8A9] text-[#2EB8A9]'
                        }`}
                      >
                        {driver.severity}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{driver.count}</span>
                      <span
                        className={`text-xs flex items-center gap-1 ${
                          driver.trend > 0 ? 'text-[#E63946]' : 'text-[#34D399]'
                        }`}
                      >
                        {driver.trend > 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {Math.abs(driver.trend)}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${
                        driver.severity === 'high'
                          ? 'bg-[#E63946]'
                          : driver.severity === 'medium'
                          ? 'bg-[#F4B400]'
                          : 'bg-[#2EB8A9]'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${(driver.count / 12) * 100}%` }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Performance Radar */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Leaf className="w-5 h-5 text-[#34D399]" />
              Category Performance
            </CardTitle>
            <CardDescription>Multi-dimensional assessment</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={categoryPerformance}>
                <PolarGrid stroke="#E5E7EB" />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 11 }} stroke="#6B7280" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#6B7280" />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#2EB8A9"
                  fill="#2EB8A9"
                  fillOpacity={0.5}
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Supplier Turnover */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#60A5FA]" />
              Supplier Turnover & Replacement
            </CardTitle>
            <CardDescription>Monthly changes in supplier base</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={turnoverData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#6B7280" />
                <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="added" fill="#34D399" name="Added" />
                <Bar dataKey="removed" fill="#E63946" name="Removed" />
                <Bar dataKey="replaced" fill="#F4B400" name="Replaced" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Legal Case Trends */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-[#8B5CF6]" />
              Legal Case Trends
            </CardTitle>
            <CardDescription>New vs. resolved cases over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={legalTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#6B7280" />
                <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="cases"
                  stroke="#E63946"
                  strokeWidth={2}
                  dot={{ fill: '#E63946', r: 4 }}
                  name="New Cases"
                />
                <Line
                  type="monotone"
                  dataKey="resolved"
                  stroke="#34D399"
                  strokeWidth={2}
                  dot={{ fill: '#34D399', r: 4 }}
                  name="Resolved"
                />
                <Line
                  type="monotone"
                  dataKey="pending"
                  stroke="#F4B400"
                  strokeWidth={2}
                  dot={{ fill: '#F4B400', r: 4 }}
                  name="Pending"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Negotiation Savings */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#F4B400]" />
            Negotiation Savings Impact
          </CardTitle>
          <CardDescription>Quarterly savings from AI-assisted negotiations</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={savingsData}>
              <defs>
                <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F4B400" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#F4B400" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="quarter" tick={{ fontSize: 12 }} stroke="#6B7280" />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#6B7280" label={{ value: 'Savings ($K)', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="#6B7280" label={{ value: 'Avg % Saved', angle: 90, position: 'insideRight' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="savings" fill="url(#savingsGradient)" name="Total Savings ($K)" />
              <Line yAxisId="right" type="monotone" dataKey="avg" stroke="#2EB8A9" strokeWidth={3} name="Avg % Saved" dot={{ fill: '#2EB8A9', r: 5 }} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Insights Summary */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-[#2EB8A9]/10 to-[#2EB8A9]/5 border-2 border-[#2EB8A9]/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#2EB8A9]" />
            Key Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-[#34D399] mt-2"></div>
              <div>
                <p className="font-medium text-sm">Portfolio health improving</p>
                <p className="text-sm text-gray-600">
                  Average risk decreased 3% over the last {timeRange} days. ESG compliance is up 5%.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-[#F4B400] mt-2"></div>
              <div>
                <p className="font-medium text-sm">Legal exposure requires attention</p>
                <p className="text-sm text-gray-600">
                  4 active cases, 2 high priority. Recommend quarterly legal review with top 3 suppliers.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-[#2EB8A9] mt-2"></div>
              <div>
                <p className="font-medium text-sm">Negotiation strategy is working</p>
                <p className="text-sm text-gray-600">
                  ${totalSavings}K saved YTD through AI-assisted negotiations, 14.2% average savings in Q4.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

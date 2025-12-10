import React, { useState, useEffect } from 'react';
import { Supplier, ChatMessage, AgentActivity, Event } from '../../types';
import { RiskArrow } from '../RiskArrow';
import { SupplierCard } from '../SupplierCard';
import { ChatInterface } from '../ChatInterface';
import { AgentActivityFeed } from '../AgentActivityFeed';
import { AlertTicker } from '../AlertTicker';
import { ProcurementHealth } from '../ProcurementHealth';
import { GeoMapView } from '../GeoMapView';
import { AddSupplierModal } from '../AddSupplierModal';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { motion } from 'motion/react';
import {
  Building2,
  TrendingUp,
  AlertTriangle,
  FileText,
  MessageSquare,
  X,
  Shield,
  Search,
  Filter,
  RefreshCw,
  Clock,
  Plus,
} from 'lucide-react';

interface DashboardProps {
  suppliers: Supplier[];
  onSupplierClick: (supplierId: string) => void;
  chatMessages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onQuickReply: (reply: string) => void;
  agentActivities: AgentActivity[];
  onActivityClick: (activity: AgentActivity) => void;
  events: Event[];
  onAlertTickerClick: () => void;
  isChatLoading?: boolean;
  onRefresh?: () => void;
}

export function Dashboard({
  suppliers,
  onSupplierClick,
  chatMessages,
  onSendMessage,
  onQuickReply,
  agentActivities,
  onActivityClick,
  events,
  onAlertTickerClick,
  isChatLoading,
  onRefresh,
}: DashboardProps) {
  const [showChat, setShowChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [currentView, setCurrentView] = useState<'grid' | 'map'>('grid');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Removed fake sync timer logic

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const userName = 'Executive'; // Could be from user profile

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsSyncing(true);
      await onRefresh();
      setIsSyncing(false);
    }
  };

  // Calculate portfolio metrics
  const activeSuppliers = suppliers.filter((s) => s.status === 'Active').length;
  const avgRiskScore = Math.round(
    suppliers.reduce((sum, s) => sum + s.riskScore, 0) / suppliers.length
  );
  const avgRiskTrend = Math.round(
    suppliers.reduce((sum, s) => sum + (s.riskTrend || 0), 0) / suppliers.length
  );
  const highRiskSuppliers = suppliers.filter((s) => s.riskScore > 60).length;
  const criticalSuppliers = suppliers.filter((s) => s.status === 'Critical').length;
  const pendingContracts = suppliers.filter((s) => s.contractStatus?.includes('Pending')).length;
  const avgConfidence = Math.round(
    suppliers.reduce((sum, s) => sum + (s.confidence || 0), 0) / suppliers.length
  );
  const esgCompliance = Math.round(
    (suppliers.filter((s) => s.dimensions.esg < 50).length / suppliers.length) * 100
  );
  const openAlerts = events.filter(e => e.type === 'critical' || e.type === 'warning').length;

  // Count unread messages (agent messages that don't have a user reply after them)
  const unreadCount = chatMessages.filter((msg) => msg.sender === 'agent').length;

  // Filter suppliers
  const filteredSuppliers = suppliers.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = riskFilter === 'all' ||
      (riskFilter === 'low' && s.riskScore <= 40) ||
      (riskFilter === 'moderate' && s.riskScore > 40 && s.riskScore <= 60) ||
      (riskFilter === 'elevated' && s.riskScore > 60 && s.riskScore <= 80) ||
      (riskFilter === 'high' && s.riskScore > 80);
    const matchesRegion = regionFilter === 'all' || s.region === regionFilter;
    return matchesSearch && matchesRisk && matchesRegion;
  });

  const regions = Array.from(new Set(suppliers.map(s => s.region)));

  return (
    <div className="min-h-screen bg-transparent">
      {/* Alert Ticker */}
      <AlertTicker events={events} onAlertClick={onAlertTickerClick} />

      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#2EB8A9] to-[#1F2D3D] flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-gray-900">
                    {getGreeting()}, {userName}.
                  </h1>
                  <p className="text-sm text-gray-500">
                    Here's your supply ecosystem at a glance
                    {avgRiskTrend < 0 && ` • Portfolio risk dropped ${Math.abs(avgRiskTrend)}% since last week`}
                    {avgRiskTrend > 0 && ` • Portfolio risk increased ${avgRiskTrend}% this week`}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="default"
                onClick={() => setIsAddModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Supplier
              </Button>

              <motion.div
                animate={{}}
                transition={{ duration: 1 }}
              >
                <Badge
                  variant="outline"
                  className={`px-3 py-1.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors`}
                  onClick={handleRefresh}
                >
                  <RefreshCw className={`w-3 h-3 mr-2 text-gray-500 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </Badge>
              </motion.div>
              <Badge variant="outline" className="px-3 py-1.5">
                <div className="w-2 h-2 rounded-full bg-[#2EB8A9] animate-pulse mr-2"></div>
                Live • {new Date().toLocaleTimeString()}
              </Badge>
              <Button
                onClick={() => setShowChat(!showChat)}
                className="bg-[#2EB8A9] hover:bg-[#2EB8A9]/90 relative"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Aegis Agent
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#E63946] text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </div>
          </motion.div>

          {/* Portfolio Risk Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 bg-white dark:bg-[#1F2D3D]/80 dark:border-white/10 glass-card shadow-lg hover:shadow-xl transition-shadow">
              <h2 className="text-gray-900 dark:text-white mb-4">Portfolio Risk Score</h2>
              <RiskArrow
                score={avgRiskScore}
                size="large"
                showLabel={true}
                trend={avgRiskTrend}
                drivers={['Legal exposure (Apex)', 'Geo-political risks', 'Price volatility']}
              />
            </Card>
          </motion.div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="p-4 bg-white dark:bg-[#1F2D3D]/80 dark:border-white/10 glass-card hover:shadow-lg hover:scale-105 transition-all cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#2EB8A9]/10 dark:bg-[#2EB8A9]/20 flex items-center justify-center group-hover:bg-[#2EB8A9]/20 transition-colors">
                    <Building2 className="w-5 h-5 text-[#2EB8A9]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Active Suppliers</p>
                    <p className="text-2xl text-gray-900 dark:text-white animate-count-up">{activeSuppliers}</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-4 bg-white dark:bg-[#1F2D3D]/80 dark:border-white/10 glass-card hover:shadow-lg hover:scale-105 transition-all cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#F4B400]/10 dark:bg-[#F4B400]/20 flex items-center justify-center group-hover:bg-[#F4B400]/20 transition-colors">
                    <TrendingUp className="w-5 h-5 text-[#F4B400]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Avg Risk Score</p>
                    <p className="text-2xl text-gray-900 dark:text-white animate-count-up">{avgRiskScore}</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card className="p-4 bg-white dark:bg-[#1F2D3D]/80 dark:border-white/10 glass-card hover:shadow-lg hover:scale-105 transition-all cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#E63946]/10 dark:bg-[#E63946]/20 flex items-center justify-center group-hover:bg-[#E63946]/20 transition-colors">
                    <AlertTriangle className="w-5 h-5 text-[#E63946]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">High Risk</p>
                    <p className="text-2xl text-gray-900 dark:text-white animate-count-up">
                      {highRiskSuppliers}/{suppliers.length}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-4 bg-white dark:bg-[#1F2D3D]/80 dark:border-white/10 glass-card hover:shadow-lg hover:scale-105 transition-all cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#E63946]/10 dark:bg-[#E63946]/20 flex items-center justify-center group-hover:bg-[#E63946]/20 transition-colors">
                    <AlertTriangle className="w-5 h-5 text-[#E63946]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Critical Status</p>
                    <p className="text-2xl text-gray-900 dark:text-white animate-count-up">{criticalSuppliers}</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <Card className="p-4 bg-white dark:bg-[#1F2D3D]/80 dark:border-white/10 glass-card hover:shadow-lg hover:scale-105 transition-all cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#F4B400]/10 dark:bg-[#F4B400]/20 flex items-center justify-center group-hover:bg-[#F4B400]/20 transition-colors">
                    <FileText className="w-5 h-5 text-[#F4B400]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Pending Approval</p>
                    <p className="text-2xl text-gray-900 dark:text-white animate-count-up">{pendingContracts}</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="p-4 bg-white dark:bg-[#1F2D3D]/80 dark:border-white/10 glass-card hover:shadow-lg hover:scale-105 transition-all cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#2EB8A9]/10 dark:bg-[#2EB8A9]/20 flex items-center justify-center group-hover:bg-[#2EB8A9]/20 transition-colors">
                    <Shield className="w-5 h-5 text-[#2EB8A9]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Avg Confidence</p>
                    <p className="text-2xl text-gray-900 dark:text-white animate-count-up">{avgConfidence}%</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <Card className="p-4 bg-white dark:bg-[#1F2D3D]/80 dark:border-white/10 glass-card hover:shadow-lg hover:scale-105 transition-all cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#10B981]/10 dark:bg-[#10B981]/20 flex items-center justify-center group-hover:bg-[#10B981]/20 transition-colors">
                    <TrendingUp className="w-5 h-5 text-[#10B981]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">ESG Compliant</p>
                    <p className="text-2xl text-gray-900 dark:text-white animate-count-up">{esgCompliance}%</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="p-4 bg-white dark:bg-[#1F2D3D]/80 dark:border-white/10 glass-card hover:shadow-lg hover:scale-105 transition-all cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#E63946]/10 dark:bg-[#E63946]/20 flex items-center justify-center group-hover:bg-[#E63946]/20 transition-colors">
                    <AlertTriangle className="w-5 h-5 text-[#E63946]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Open Alerts</p>
                    <p className="text-2xl text-gray-900 dark:text-white animate-count-up">{openAlerts}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Filters and Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
          >
            <Card className="p-4 bg-white dark:bg-[#1F2D3D]/80 dark:border-white/10 glass-card">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search suppliers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap items-center">
                  <Filter className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600">Risk:</span>
                  {['all', 'low', 'moderate', 'elevated', 'high'].map((filter) => (
                    <Button
                      key={filter}
                      variant={riskFilter === filter ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setRiskFilter(filter)}
                      className={riskFilter === filter ? 'bg-[#2EB8A9] hover:bg-[#2EB8A9]/90' : ''}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </Button>
                  ))}
                  <span className="text-sm text-gray-600 ml-2">Region:</span>
                  <Button
                    variant={regionFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRegionFilter('all')}
                    className={regionFilter === 'all' ? 'bg-[#2EB8A9] hover:bg-[#2EB8A9]/90' : ''}
                  >
                    All
                  </Button>
                  {regions.map((region) => (
                    <Button
                      key={region}
                      variant={regionFilter === region ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setRegionFilter(region)}
                      className={regionFilter === region ? 'bg-[#2EB8A9] hover:bg-[#2EB8A9]/90' : ''}
                    >
                      {region.split(' ')[0]}
                    </Button>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="health">Health Index</TabsTrigger>
              <TabsTrigger value="map">Global Map</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Supplier Grid - Takes 2 columns */}
                <div className="lg:col-span-2">
                  <h2 className="text-gray-900 mb-4">
                    Supplier Portfolio
                    <span className="text-gray-500 ml-2">
                      ({filteredSuppliers.length} of {suppliers.length})
                    </span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredSuppliers.map((supplier) => (
                      <SupplierCard
                        key={supplier.id}
                        supplier={supplier}
                        onClick={() => onSupplierClick(supplier.id)}
                      />
                    ))}
                  </div>
                  {filteredSuppliers.length === 0 && (
                    <Card className="p-12 bg-white text-center">
                      <p className="text-gray-500">No suppliers match the selected filters</p>
                    </Card>
                  )}
                </div>

                {/* Agent Activity Feed - Takes 1 column */}
                <div className="lg:col-span-1">
                  <AgentActivityFeed
                    activities={agentActivities}
                    onActivityClick={onActivityClick}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="health" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <ProcurementHealth suppliers={suppliers} />
                </div>
                <div className="lg:col-span-1">
                  <AgentActivityFeed
                    activities={agentActivities}
                    onActivityClick={onActivityClick}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="map" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <GeoMapView suppliers={suppliers} onSupplierClick={onSupplierClick} />
                </div>
                <div className="lg:col-span-1">
                  <AgentActivityFeed
                    activities={agentActivities}
                    onActivityClick={onActivityClick}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Chat Overlay */}
      {showChat && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] z-50 shadow-2xl rounded-lg overflow-hidden">
          <ChatInterface
            messages={chatMessages}
            onClose={() => setShowChat(false)}
            onSendMessage={onSendMessage}
            onQuickReply={onQuickReply}
            isLoading={isChatLoading}
          />
        </div>
      )}

      {/* Add Supplier Modal */}
      <AddSupplierModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSupplierAdded={handleRefresh}
      />
    </div>
  );
}

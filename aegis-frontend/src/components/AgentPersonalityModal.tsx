import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Scale, Shield, Leaf, TrendingUp, DollarSign, FileText, BarChart3, Users } from 'lucide-react';

interface AgentPersonalityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const agents = [
  {
    name: 'Legal Agent',
    icon: Scale,
    color: '#E63946',
    role: 'Contract Guardian',
    description: "I track all contracts and lawsuits so you don't have to.",
    capabilities: ['Contract analysis', 'Legal risk detection', 'Compliance monitoring', 'Clause extraction'],
    personality: 'Meticulous, detail-oriented, and protective',
  },
  {
    name: 'Risk Agent',
    icon: Shield,
    color: '#F4B400',
    role: 'Risk Monitor',
    description: "I monitor comprehensive risk across all dimensions in real-time.",
    capabilities: ['Multi-dimensional risk scoring', 'Predictive analytics', 'Alert management', 'Trend detection'],
    personality: 'Vigilant, analytical, and proactive',
  },
  {
    name: 'ESG Agent',
    icon: Leaf,
    color: '#34D399',
    role: 'Sustainability Champion',
    description: "I ensure your suppliers meet sustainability and governance standards.",
    capabilities: ['ESG scoring', 'Carbon footprint tracking', 'Ethics monitoring', 'Sustainability reporting'],
    personality: 'Conscientious, forward-thinking, and ethical',
  },
  {
    name: 'Negotiation Agent',
    icon: TrendingUp,
    color: '#60A5FA',
    role: 'Deal Optimizer',
    description: "I help you secure the best terms and pricing for your contracts.",
    capabilities: ['Price benchmarking', 'Term optimization', 'Market intelligence', 'Savings identification'],
    personality: 'Strategic, confident, and results-driven',
  },
  {
    name: 'Finance Agent',
    icon: DollarSign,
    color: '#8B5CF6',
    role: 'Financial Analyst',
    description: "I analyze supplier financial health and payment patterns.",
    capabilities: ['Financial health scoring', 'Payment analysis', 'Budget tracking', 'Cost forecasting'],
    personality: 'Precise, data-driven, and insightful',
  },
  {
    name: 'Operations Agent',
    icon: BarChart3,
    color: '#2EB8A9',
    role: 'Performance Tracker',
    description: "I monitor supplier performance and operational metrics.",
    capabilities: ['Performance monitoring', 'SLA tracking', 'Quality analysis', 'Delivery optimization'],
    personality: 'Efficient, systematic, and dependable',
  },
];

export function AgentPersonalityModal({ isOpen, onClose }: AgentPersonalityModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto dark:bg-[#1F2D3D] dark:border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Users className="w-6 h-6 text-[#2EB8A9]" />
            Meet Your Aegis Agents
          </DialogTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Your autonomous procurement team working 24/7 to protect your supply chain
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {agents.map((agent, index) => {
            const Icon = agent.icon;
            return (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 bg-white dark:bg-[#1F2D3D]/50 dark:border-white/10 glass-card hover:shadow-xl transition-all group">
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center animate-pulse-glow"
                      style={{ backgroundColor: `${agent.color}20` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: agent.color }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-gray-900 dark:text-white mb-1">{agent.name}</h3>
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{ borderColor: agent.color, color: agent.color }}
                      >
                        {agent.role}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 italic">
                    "{agent.description}"
                  </p>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">Key Capabilities:</p>
                      <div className="flex flex-wrap gap-1">
                        {agent.capabilities.map((cap) => (
                          <Badge
                            key={cap}
                            variant="secondary"
                            className="text-xs dark:bg-[#0F1419] dark:text-gray-300"
                          >
                            {cap}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-200 dark:border-white/10">
                      <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">Personality:</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{agent.personality}</p>
                    </div>
                  </div>

                  {/* Animated gradient border on hover */}
                  <div
                    className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    style={{
                      background: `linear-gradient(135deg, ${agent.color}10, transparent)`,
                    }}
                  />
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-[#2EB8A9]/10 to-[#2EB8A9]/5 rounded-lg border border-[#2EB8A9]/20">
          <p className="text-sm text-gray-700 dark:text-gray-300 text-center">
            All agents work collaboratively, sharing insights and coordinating actions to give you the most comprehensive
            procurement intelligence available.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

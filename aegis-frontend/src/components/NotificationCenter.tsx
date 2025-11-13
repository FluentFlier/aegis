import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import {
  Bell,
  X,
  AlertTriangle,
  CheckCircle2,
  Info,
  TrendingUp,
  Clock,
  Scale,
  Leaf,
  DollarSign,
} from 'lucide-react';
import { Event, AgentType } from '../types';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  events: Event[];
  onEventClick?: (event: Event) => void;
}

const agentColors: Record<AgentType, string> = {
  Legal: '#2EB8A9',
  ESG: '#34D399',
  Financial: '#F4B400',
  Pricing: '#60A5FA',
  Performance: '#8B5CF6',
  Operational: '#F59E0B',
  Geo: '#EF4444',
  Social: '#EC4899',
};

const agentIcons: Record<AgentType, any> = {
  Legal: Scale,
  ESG: Leaf,
  Financial: DollarSign,
  Pricing: TrendingUp,
  Performance: CheckCircle2,
  Operational: Info,
  Geo: AlertTriangle,
  Social: Info,
};

export function NotificationCenter({ isOpen, onClose, events, onEventClick }: NotificationCenterProps) {
  const groupedEvents = events.reduce((acc, event) => {
    const agent = event.agent || 'Other';
    if (!acc[agent]) acc[agent] = [];
    acc[agent].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-[#E63946]" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-[#F4B400]" />;
      default:
        return <Info className="w-4 h-4 text-[#2EB8A9]" />;
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);
    
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-[400px] bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#2EB8A9] to-[#27A99A] flex items-center justify-center">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl">Notifications</h2>
                    <p className="text-sm text-[#1F2D3D]/60">{events.length} updates</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-6">
                {Object.entries(groupedEvents).map(([agent, agentEvents]) => {
                  const AgentIcon = agentIcons[agent as AgentType] || Info;
                  const agentColor = agentColors[agent as AgentType] || '#2EB8A9';

                  return (
                    <div key={agent}>
                      <div className="flex items-center gap-2 mb-3">
                        <div
                          className="w-6 h-6 rounded flex items-center justify-center"
                          style={{ backgroundColor: `${agentColor}20` }}
                        >
                          <AgentIcon className="w-4 h-4" style={{ color: agentColor }} />
                        </div>
                        <h3 className="font-medium text-sm">{agent} Updates</h3>
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {agentEvents.length}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        {agentEvents.map((event) => (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ scale: 1.02 }}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                              event.type === 'critical'
                                ? 'border-[#E63946]/20 bg-[#E63946]/5 hover:border-[#E63946]/40'
                                : event.type === 'warning'
                                ? 'border-[#F4B400]/20 bg-[#F4B400]/5 hover:border-[#F4B400]/40'
                                : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                            }`}
                            onClick={() => onEventClick?.(event)}
                          >
                            <div className="flex items-start gap-3">
                              {getEventIcon(event.type)}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm mb-1">{event.title}</p>
                                <p className="text-xs text-[#1F2D3D]/60 mb-2 line-clamp-2">
                                  {event.description}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-[#1F2D3D]/40">
                                  <Clock className="w-3 h-3" />
                                  {getTimeAgo(event.timestamp)}
                                  {event.supplierName && (
                                    <>
                                      <span>•</span>
                                      <span className="truncate">{event.supplierName}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {events.length === 0 && (
                  <div className="text-center py-12">
                    <Bell className="w-12 h-12 mx-auto mb-3 text-[#1F2D3D]/20" />
                    <p className="text-[#1F2D3D]/40">No notifications</p>
                    <p className="text-sm text-[#1F2D3D]/30">You're all caught up!</p>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200">
              <Button variant="outline" className="w-full" onClick={onClose}>
                Mark All as Read
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

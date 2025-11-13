import React from 'react';
import { AgentActivity, AgentType } from '../types';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface AgentActivityFeedProps {
  activities: AgentActivity[];
  onActivityClick?: (activity: AgentActivity) => void;
}

const agentColors: Record<AgentType, string> = {
  Financial: '#3B82F6',
  Legal: '#EF4444',
  ESG: '#10B981',
  Geo: '#F59E0B',
  Operational: '#8B5CF6',
  Pricing: '#EC4899',
  Social: '#14B8A6',
  Performance: '#6366F1',
};

export function AgentActivityFeed({ activities, onActivityClick }: AgentActivityFeedProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="text-gray-900">Agent Activity Feed</h3>
        <p className="text-sm text-gray-600">Real-time intelligence updates</p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {activities.map((activity) => (
            <div
              key={activity.id}
              onClick={() => onActivityClick?.(activity)}
              className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-[#2EB8A9] hover:bg-[#2EB8A9]/5 transition-all cursor-pointer group"
            >
              <div
                className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                style={{ backgroundColor: agentColors[activity.agentType] }}
              ></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <Badge
                    variant="outline"
                    className="text-xs"
                    style={{
                      borderColor: agentColors[activity.agentType],
                      color: agentColors[activity.agentType],
                    }}
                  >
                    {activity.agentType}
                  </Badge>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {formatTime(activity.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-gray-900 mb-1">{activity.action}</p>
                {activity.supplierName && (
                  <p className="text-xs text-gray-600 mb-2">{activity.supplierName}</p>
                )}
                {activity.delta !== undefined && (
                  <div className="flex items-center gap-1">
                    {activity.delta > 0 ? (
                      <TrendingUp className="w-3 h-3 text-[#E63946]" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-[#2EB8A9]" />
                    )}
                    <span
                      className={`text-xs ${
                        activity.delta > 0 ? 'text-[#E63946]' : 'text-[#2EB8A9]'
                      }`}
                    >
                      {activity.delta > 0 ? '+' : ''}
                      {activity.delta}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

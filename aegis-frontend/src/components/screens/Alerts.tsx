import React, { useState } from 'react';
import { Event } from '../../types';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { ArrowLeft, AlertTriangle, Info, Filter } from 'lucide-react';

interface AlertsProps {
  events: Event[];
  onBack: () => void;
  onEventClick: (supplierId?: string) => void;
}

export function Alerts({ events, onBack, onEventClick }: AlertsProps) {
  const [filter, setFilter] = useState<'All' | 'Critical' | 'Warning' | 'Info'>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const filteredEvents = events.filter((event) => {
    const matchesType = filter === 'All' || event.type === filter.toLowerCase();
    const matchesCategory = categoryFilter === 'All' || event.category === categoryFilter;
    return matchesType && matchesCategory;
  });

  const getEventColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'bg-[#E63946] text-white';
      case 'warning':
        return 'bg-[#F4B400] text-white';
      default:
        return 'bg-[#2EB8A9] text-white';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const categories = ['All', ...Array.from(new Set(events.map((e) => e.category)))];

  return (
    <div className="min-h-screen bg-[#F7F9FB] p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={onBack} className="gap-2 mb-2 -ml-4">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-gray-900">Alerts & Events</h1>
            <p className="text-gray-600">Monitor critical supplier events and changes</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4 bg-white">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">Severity:</span>
              {['All', 'Critical', 'Warning', 'Info'].map((type) => (
                <Button
                  key={type}
                  variant={filter === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(type as any)}
                  className={
                    filter === type ? 'bg-[#2EB8A9] hover:bg-[#2EB8A9]/90' : ''
                  }
                >
                  {type}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Category:</span>
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={categoryFilter === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCategoryFilter(cat)}
                  className={
                    categoryFilter === cat ? 'bg-[#2EB8A9] hover:bg-[#2EB8A9]/90' : ''
                  }
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical Alerts</p>
                <p className="text-2xl text-gray-900">
                  {events.filter((e) => e.type === 'critical').length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-[#E63946]/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-[#E63946]" />
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Warning Alerts</p>
                <p className="text-2xl text-gray-900">
                  {events.filter((e) => e.type === 'warning').length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-[#F4B400]/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-[#F4B400]" />
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Info Updates</p>
                <p className="text-2xl text-gray-900">
                  {events.filter((e) => e.type === 'info').length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-[#2EB8A9]/10 flex items-center justify-center">
                <Info className="w-6 h-6 text-[#2EB8A9]" />
              </div>
            </div>
          </Card>
        </div>

        {/* Events List */}
        <Card className="bg-white">
          <ScrollArea className="h-[600px]">
            <div className="p-6 space-y-4">
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => onEventClick(event.supplierId)}
                    className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:border-[#2EB8A9] hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div
                      className={`w-10 h-10 rounded-full ${getEventColor(
                        event.type
                      )} flex items-center justify-center flex-shrink-0`}
                    >
                      {getEventIcon(event.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="text-gray-900 group-hover:text-[#2EB8A9] transition-colors">
                          {event.title}
                        </h3>
                        <span className="text-sm text-gray-500 whitespace-nowrap">
                          {formatTimestamp(event.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                      <div className="flex items-center gap-2">
                        {event.supplierName && (
                          <Badge variant="outline" className="text-xs">
                            {event.supplierName}
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            event.type === 'critical'
                              ? 'border-[#E63946] text-[#E63946]'
                              : event.type === 'warning'
                              ? 'border-[#F4B400] text-[#F4B400]'
                              : 'border-[#2EB8A9] text-[#2EB8A9]'
                          }`}
                        >
                          {event.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No alerts match the selected filters</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { Event } from '../types';
import { AlertTriangle, Info } from 'lucide-react';

interface AlertTickerProps {
  events: Event[];
  onAlertClick?: () => void;
}

export function AlertTicker({ events, onAlertClick }: AlertTickerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Only show critical and warning events
  const criticalEvents = events.filter(e => e.type === 'critical' || e.type === 'warning');
  
  useEffect(() => {
    if (criticalEvents.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % criticalEvents.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [criticalEvents.length]);
  
  if (criticalEvents.length === 0) return null;
  
  const currentEvent = criticalEvents[currentIndex];
  
  return (
    <div
      onClick={onAlertClick}
      className="bg-gradient-to-r from-[#1F2D3D] to-[#2C4255] border-b border-white/10 cursor-pointer hover:from-[#2C4255] hover:to-[#1F2D3D] transition-all"
    >
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {currentEvent.type === 'critical' ? (
              <AlertTriangle className="w-4 h-4 text-[#E63946] flex-shrink-0 animate-pulse" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-[#F4B400] flex-shrink-0" />
            )}
            <span className="text-white text-sm truncate">
              <span className="opacity-70">{currentEvent.supplierName}:</span> {currentEvent.title}
            </span>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-white/70 text-xs">
              {currentIndex + 1} of {criticalEvents.length}
            </span>
            <span className="text-white/50 text-xs">Click to view all alerts</span>
          </div>
        </div>
      </div>
    </div>
  );
}

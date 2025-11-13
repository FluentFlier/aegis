import React, { useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface RiskArrowProps {
  score: number;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  trend?: number;
  drivers?: string[];
}

export function RiskArrow({ score, size = 'large', showLabel = true, trend, drivers }: RiskArrowProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const height = size === 'large' ? 80 : size === 'medium' ? 50 : 30;
  const showSegments = size !== 'small';
  
  // Position calculation (0-100 scale)
  const position = Math.min(100, Math.max(0, score));
  
  const getColor = (score: number) => {
    if (score <= 40) return '#2EB8A9';
    if (score <= 60) return '#7BC96F';
    if (score <= 80) return '#F4B400';
    if (score <= 90) return '#FF9B42';
    return '#E63946';
  };
  
  const getRiskLabel = (score: number) => {
    if (score <= 40) return 'Low Risk';
    if (score <= 60) return 'Moderate Risk';
    if (score <= 80) return 'Elevated Risk';
    if (score <= 90) return 'High Risk';
    return 'Critical Risk';
  };

  const hasTooltip = drivers && drivers.length > 0;

  const arrowComponent = (
    <div className="w-full">
      <div className="relative" style={{ height: `${height}px` }}>
        {/* Background gradient bar */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <div className="h-full w-full flex">
            <div className="h-full bg-[#2EB8A9]" style={{ width: '40%' }}></div>
            <div className="h-full bg-[#7BC96F]" style={{ width: '20%' }}></div>
            <div className="h-full bg-[#F4B400]" style={{ width: '20%' }}></div>
            <div className="h-full bg-[#FF9B42]" style={{ width: '10%' }}></div>
            <div className="h-full bg-[#E63946]" style={{ width: '10%' }}></div>
          </div>
        </div>
        
        {/* Segment dividers */}
        {showSegments && (
          <>
            <div className="absolute top-0 bottom-0 w-px bg-white/30" style={{ left: '40%' }}></div>
            <div className="absolute top-0 bottom-0 w-px bg-white/30" style={{ left: '60%' }}></div>
            <div className="absolute top-0 bottom-0 w-px bg-white/30" style={{ left: '80%' }}></div>
            <div className="absolute top-0 bottom-0 w-px bg-white/30" style={{ left: '90%' }}></div>
          </>
        )}
        
        {/* Pointer */}
        <div
          className="absolute top-0 bottom-0 transition-all duration-700 ease-out"
          style={{ left: `${position}%` }}
        >
          <div className="relative h-full" style={{ marginLeft: '-2px' }}>
            {/* Vertical line */}
            <div className="absolute top-0 bottom-0 w-1 bg-white shadow-lg rounded-full"></div>
            {/* Arrow head */}
            <div
              className="absolute w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] border-t-white shadow-lg"
              style={{
                top: size === 'large' ? '-14px' : '-10px',
                left: '50%',
                transform: 'translateX(-50%)',
              }}
            ></div>
            {/* Score bubble */}
            {size !== 'small' && (
              <div
                className="absolute left-1/2 transform -translate-x-1/2 bg-white text-[#1F2D3D] px-3 py-1 rounded-full shadow-lg"
                style={{ top: size === 'large' ? '-42px' : '-36px' }}
              >
                <span className="tabular-nums">{Math.round(score)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Labels */}
      {showSegments && (
        <div className="flex justify-between mt-2 text-xs text-gray-600">
          <span>0</span>
          <span className="ml-auto">100</span>
        </div>
      )}
      
      {showLabel && size !== 'small' && (
        <div className="text-center mt-3">
          <div className="flex items-center justify-center gap-2">
            <span
              className="inline-block px-4 py-1 rounded-full text-white"
              style={{ backgroundColor: getColor(score) }}
            >
              {getRiskLabel(score)}
            </span>
            {trend !== undefined && (
              <span
                className={`text-sm ${
                  trend > 0 ? 'text-[#E63946]' : trend < 0 ? 'text-[#2EB8A9]' : 'text-gray-600'
                }`}
              >
                {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (hasTooltip && size !== 'small') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cursor-help">{arrowComponent}</div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-2">
              <p className="text-sm">Top Risk Drivers:</p>
              <ul className="text-xs space-y-1">
                {drivers?.map((driver, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-current"></div>
                    {driver}
                  </li>
                ))}
              </ul>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return arrowComponent;
}

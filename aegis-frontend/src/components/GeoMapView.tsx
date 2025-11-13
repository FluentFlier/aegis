import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Supplier } from '../types';
import { MapPin, Globe2, ZoomIn, ZoomOut } from 'lucide-react';

interface GeoMapViewProps {
  suppliers: Supplier[];
  onSupplierClick: (supplierId: string) => void;
}

// Mock geo coordinates for regions
const regionCoords: Record<string, { x: number; y: number; label: string }> = {
  'North America': { x: 20, y: 30, label: 'NA' },
  'South America': { x: 30, y: 60, label: 'SA' },
  'Europe': { x: 50, y: 25, label: 'EU' },
  'Asia Pacific': { x: 75, y: 35, label: 'AP' },
  'Africa': { x: 52, y: 55, label: 'AF' },
  'Middle East': { x: 58, y: 40, label: 'ME' },
};

export function GeoMapView({ suppliers, onSupplierClick }: GeoMapViewProps) {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  const getRiskColor = (score: number) => {
    if (score >= 70) return '#E63946';
    if (score >= 50) return '#F4B400';
    if (score >= 30) return '#2EB8A9';
    return '#34D399';
  };

  const regionSuppliers = suppliers.reduce((acc, supplier) => {
    if (!acc[supplier.region]) acc[supplier.region] = [];
    acc[supplier.region].push(supplier);
    return acc;
  }, {} as Record<string, Supplier[]>);

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-[#2EB8A9]" />
            <CardTitle>Global Supplier Network</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(Math.min(2, zoom + 0.2))}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(Math.max(1, zoom - 0.2))}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* World Map (Simplified) */}
        <div className="relative bg-gradient-to-br from-[#1F2D3D]/5 to-[#2EB8A9]/5 rounded-xl p-8 overflow-hidden">
          <div
            className="relative w-full aspect-[2/1] transition-transform duration-300"
            style={{ transform: `scale(${zoom})` }}
          >
            {/* SVG World Map Placeholder */}
            <svg
              className="w-full h-full opacity-10"
              viewBox="0 0 800 400"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Simplified continents */}
              <path
                d="M100 120 L180 100 L220 130 L190 180 L120 170 Z"
                fill="#1F2D3D"
                opacity="0.3"
              />
              <path
                d="M140 240 L200 220 L230 280 L180 320 L140 300 Z"
                fill="#1F2D3D"
                opacity="0.3"
              />
              <path
                d="M380 90 L480 80 L520 100 L510 150 L450 160 L400 140 Z"
                fill="#1F2D3D"
                opacity="0.3"
              />
              <path
                d="M560 120 L680 100 L720 140 L700 200 L620 180 Z"
                fill="#1F2D3D"
                opacity="0.3"
              />
            </svg>

            {/* Supplier Markers */}
            {Object.entries(regionSuppliers).map(([region, regionSupps]) => {
              const coords = regionCoords[region];
              if (!coords) return null;

              const avgRisk = regionSupps.reduce((sum, s) => sum + s.riskScore, 0) / regionSupps.length;
              const color = getRiskColor(avgRisk);

              return (
                <motion.div
                  key={region}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                  style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: Math.random() * 0.3 }}
                  whileHover={{ scale: 1.2 }}
                  onClick={() => setSelectedRegion(selectedRegion === region ? null : region)}
                >
                  {/* Pulse Effect */}
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ backgroundColor: color }}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 0, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                  />

                  {/* Marker */}
                  <div
                    className="relative w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-2 border-white transition-all"
                    style={{ backgroundColor: color }}
                  >
                    <MapPin className="w-6 h-6 text-white" />
                  </div>

                  {/* Count Badge */}
                  <Badge
                    className="absolute -top-2 -right-2 min-w-[24px] h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: color, color: 'white' }}
                  >
                    {regionSupps.length}
                  </Badge>

                  {/* Tooltip */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <div className="bg-white rounded-lg shadow-xl p-3 min-w-[200px] border-2" style={{ borderColor: color }}>
                      <p className="font-medium mb-2">{region}</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-[#1F2D3D]/60">Suppliers:</span>
                          <span className="font-medium">{regionSupps.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#1F2D3D]/60">Avg Risk:</span>
                          <span className="font-medium" style={{ color }}>{Math.round(avgRisk)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Region Details */}
        {selectedRegion && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-6 bg-gradient-to-br from-[#2EB8A9]/10 to-[#2EB8A9]/5 rounded-lg border border-[#2EB8A9]/20"
          >
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#2EB8A9]" />
              {selectedRegion} ({regionSuppliers[selectedRegion].length} suppliers)
            </h3>
            <div className="space-y-2">
              {regionSuppliers[selectedRegion].map((supplier) => (
                <div
                  key={supplier.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onSupplierClick(supplier.id)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getRiskColor(supplier.riskScore) }}
                    />
                    <div>
                      <p className="font-medium text-sm">{supplier.name}</p>
                      <p className="text-xs text-[#1F2D3D]/60">{supplier.category}</p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    style={{
                      borderColor: getRiskColor(supplier.riskScore),
                      color: getRiskColor(supplier.riskScore),
                    }}
                  >
                    Risk: {supplier.riskScore}
                  </Badge>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#34D399]" />
            <span className="text-[#1F2D3D]/60">Low Risk {'(<30)'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#2EB8A9]" />
            <span className="text-[#1F2D3D]/60">Medium (30-50)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#F4B400]" />
            <span className="text-[#1F2D3D]/60">High (50-70)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#E63946]" />
            <span className="text-[#1F2D3D]/60">Critical {`(>70)`}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

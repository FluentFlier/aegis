import React, { useState } from 'react';
import { Supplier, ScenarioParams } from '../types';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { RiskArrow } from './RiskArrow';
import { Badge } from './ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ScenarioSimulatorProps {
  supplier: Supplier;
}

export function ScenarioSimulator({ supplier }: ScenarioSimulatorProps) {
  const [params, setParams] = useState<ScenarioParams>({
    contractTermMonths: supplier.contractTermMonths || 24,
    annualVolume: supplier.annualVolume || 1000000,
    priceAdjustment: 0,
    region: supplier.region,
  });

  // Simulate risk calculation based on parameters
  const calculateProjectedRisk = () => {
    let risk = supplier.riskScore;
    
    // Shorter terms reduce risk
    if (params.contractTermMonths < 18) risk -= 5;
    else if (params.contractTermMonths > 36) risk += 8;
    
    // Volume impact
    const volumeChange = ((params.annualVolume - (supplier.annualVolume || 1000000)) / (supplier.annualVolume || 1000000)) * 100;
    if (volumeChange > 50) risk += 10;
    else if (volumeChange > 20) risk += 5;
    else if (volumeChange < -20) risk -= 3;
    
    // Price adjustment impact
    if (params.priceAdjustment > 10) risk += 8;
    else if (params.priceAdjustment > 5) risk += 4;
    else if (params.priceAdjustment < -5) risk -= 2;
    
    // Region impact
    if (params.region !== supplier.region) risk += 12;
    
    return Math.min(100, Math.max(0, Math.round(risk)));
  };

  const calculateCostImpact = () => {
    const volumeChange = ((params.annualVolume - (supplier.annualVolume || 1000000)) / (supplier.annualVolume || 1000000)) * 100;
    const baseCost = volumeChange + params.priceAdjustment;
    if (params.region !== supplier.region) return baseCost + 8;
    return baseCost;
  };

  const projectedRisk = calculateProjectedRisk();
  const riskChange = projectedRisk - supplier.riskScore;
  const costImpact = calculateCostImpact();

  const keyChanges: string[] = [];
  if (params.contractTermMonths !== supplier.contractTermMonths) {
    keyChanges.push(`Contract term: ${params.contractTermMonths} months`);
  }
  if (params.annualVolume !== supplier.annualVolume) {
    const change = ((params.annualVolume - (supplier.annualVolume || 0)) / (supplier.annualVolume || 1)) * 100;
    keyChanges.push(`Volume: ${change > 0 ? '+' : ''}${change.toFixed(0)}%`);
  }
  if (params.priceAdjustment !== 0) {
    keyChanges.push(`Price: ${params.priceAdjustment > 0 ? '+' : ''}${params.priceAdjustment}%`);
  }
  if (params.region !== supplier.region) {
    keyChanges.push(`Region: ${params.region}`);
  }

  return (
    <Card className="p-6 bg-white">
      <h2 className="text-gray-900 mb-6">Scenario Simulator</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Contract Term</Label>
              <span className="text-sm text-gray-600">{params.contractTermMonths} months</span>
            </div>
            <Slider
              value={[params.contractTermMonths]}
              onValueChange={([value]) => setParams({ ...params, contractTermMonths: value })}
              min={6}
              max={60}
              step={6}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>6mo</span>
              <span>60mo</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Annual Volume</Label>
              <span className="text-sm text-gray-600">
                ${(params.annualVolume / 1000000).toFixed(2)}M
              </span>
            </div>
            <Slider
              value={[params.annualVolume]}
              onValueChange={([value]) => setParams({ ...params, annualVolume: value })}
              min={100000}
              max={2000000}
              step={50000}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>$100K</span>
              <span>$2M</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Price Adjustment</Label>
              <span className="text-sm text-gray-600">{params.priceAdjustment}%</span>
            </div>
            <Slider
              value={[params.priceAdjustment]}
              onValueChange={([value]) => setParams({ ...params, priceAdjustment: value })}
              min={-20}
              max={30}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>-20%</span>
              <span>+30%</span>
            </div>
          </div>

          <div>
            <Label>Region</Label>
            <Select
              value={params.region}
              onValueChange={(value) => setParams({ ...params, region: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="North America">North America</SelectItem>
                <SelectItem value="Europe">Europe</SelectItem>
                <SelectItem value="Asia Pacific">Asia Pacific</SelectItem>
                <SelectItem value="South America">South America</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-6">
          <div>
            <h3 className="text-sm text-gray-700 mb-3">Projected Risk Score</h3>
            <RiskArrow score={projectedRisk} size="medium" showLabel={false} />
            <div className="flex items-center justify-center gap-2 mt-4">
              {riskChange > 0 ? (
                <TrendingUp className="w-4 h-4 text-[#E63946]" />
              ) : riskChange < 0 ? (
                <TrendingDown className="w-4 h-4 text-[#2EB8A9]" />
              ) : (
                <Minus className="w-4 h-4 text-gray-400" />
              )}
              <span
                className={`${
                  riskChange > 0
                    ? 'text-[#E63946]'
                    : riskChange < 0
                    ? 'text-[#2EB8A9]'
                    : 'text-gray-600'
                }`}
              >
                {riskChange > 0 ? '+' : ''}
                {riskChange} from current
              </span>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm text-gray-700 mb-3">Impact Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Cost Impact</span>
                <Badge
                  variant="outline"
                  className={
                    costImpact > 0
                      ? 'border-[#E63946] text-[#E63946]'
                      : costImpact < 0
                      ? 'border-[#2EB8A9] text-[#2EB8A9]'
                      : 'border-gray-400 text-gray-600'
                  }
                >
                  {costImpact > 0 ? '+' : ''}
                  {costImpact.toFixed(1)}%
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Confidence</span>
                <Badge variant="outline" className="border-[#2EB8A9] text-[#2EB8A9]">
                  {supplier.confidence}%
                </Badge>
              </div>
            </div>
          </div>

          {keyChanges.length > 0 && (
            <div>
              <h3 className="text-sm text-gray-700 mb-2">Scenario Changes</h3>
              <ul className="space-y-1">
                {keyChanges.map((change, idx) => (
                  <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#2EB8A9]"></div>
                    {change}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

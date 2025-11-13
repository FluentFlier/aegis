import React, { useState } from 'react';
import { Supplier } from '../../types';
import { RiskArrow } from '../RiskArrow';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

interface SourcingFlowProps {
  suppliers: Supplier[];
  onBack: () => void;
  onComplete: () => void;
}

export function SourcingFlow({ suppliers, onBack, onComplete }: SourcingFlowProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    category: '',
    volume: '',
    region: '',
    riskAppetite: '',
  });
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [finalSelection, setFinalSelection] = useState<string | null>(null);

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handlePrevious = () => {
    if (step > 1) setStep(step - 1);
  };

  const toggleSupplier = (id: string) => {
    setSelectedSuppliers((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const candidateSuppliers = suppliers.filter(
    (s) => selectedSuppliers.length === 0 || selectedSuppliers.includes(s.id)
  );

  const topThree = candidateSuppliers
    .slice()
    .sort((a, b) => a.riskScore - b.riskScore)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-[#F7F9FB] p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>

        <div>
          <h1 className="text-gray-900 mb-2">New Sourcing Request</h1>
          <p className="text-gray-600">AI-guided supplier selection process</p>
        </div>

        {/* Progress Stepper */}
        <Card className="p-6 bg-white">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((s, idx) => (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      step >= s
                        ? 'bg-[#2EB8A9] text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step > s ? <CheckCircle2 className="w-6 h-6" /> : s}
                  </div>
                  <span className="text-sm text-gray-600">
                    {s === 1 ? 'Define Need' : s === 2 ? 'Select Suppliers' : 'Analyze & Choose'}
                  </span>
                </div>
                {idx < 2 && (
                  <div
                    className={`flex-1 h-1 mx-4 ${
                      step > s ? 'bg-[#2EB8A9]' : 'bg-gray-200'
                    }`}
                  ></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </Card>

        {/* Step 1: Define Need */}
        {step === 1 && (
          <Card className="p-6 bg-white">
            <h2 className="text-gray-900 mb-6">Define Your Sourcing Need</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electronics">Electronics Components</SelectItem>
                    <SelectItem value="raw-materials">Raw Materials</SelectItem>
                    <SelectItem value="packaging">Packaging</SelectItem>
                    <SelectItem value="metals">Steel & Metals</SelectItem>
                    <SelectItem value="logistics">Transportation Services</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="volume">Estimated Annual Volume</Label>
                <Input
                  id="volume"
                  placeholder="e.g., $500,000"
                  value={formData.volume}
                  onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="region">Preferred Region</Label>
                <Select
                  value={formData.region}
                  onValueChange={(value) => setFormData({ ...formData, region: value })}
                >
                  <SelectTrigger id="region">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="north-america">North America</SelectItem>
                    <SelectItem value="europe">Europe</SelectItem>
                    <SelectItem value="asia-pacific">Asia Pacific</SelectItem>
                    <SelectItem value="south-america">South America</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="risk">Risk Appetite</Label>
                <Select
                  value={formData.riskAppetite}
                  onValueChange={(value) => setFormData({ ...formData, riskAppetite: value })}
                >
                  <SelectTrigger id="risk">
                    <SelectValue placeholder="Select risk appetite" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (0-40)</SelectItem>
                    <SelectItem value="moderate">Moderate (41-60)</SelectItem>
                    <SelectItem value="elevated">Elevated (61-80)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        )}

        {/* Step 2: Select Suppliers */}
        {step === 2 && (
          <Card className="p-6 bg-white">
            <h2 className="text-gray-900 mb-6">Select Candidate Suppliers</h2>
            <p className="text-sm text-gray-600 mb-4">
              Based on your criteria, we recommend these suppliers. Select all that you'd like to evaluate.
            </p>
            <div className="space-y-3">
              {suppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-[#2EB8A9] transition-colors"
                >
                  <Checkbox
                    id={supplier.id}
                    checked={selectedSuppliers.includes(supplier.id)}
                    onCheckedChange={() => toggleSupplier(supplier.id)}
                  />
                  <div className="flex-1">
                    <Label htmlFor={supplier.id} className="cursor-pointer">
                      <h3 className="text-gray-900">{supplier.name}</h3>
                      <p className="text-sm text-gray-600">
                        {supplier.category} • {supplier.region}
                      </p>
                    </Label>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Risk Score</p>
                    <p className="text-xl tabular-nums text-gray-900">{supplier.riskScore}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Step 3: Analyze & Choose */}
        {step === 3 && (
          <Card className="p-6 bg-white">
            <h2 className="text-gray-900 mb-6">Top Recommendations</h2>
            <p className="text-sm text-gray-600 mb-6">
              Here are your top 3 suppliers ranked by risk score. Select one to proceed.
            </p>
            <div className="space-y-6">
              {topThree.map((supplier, idx) => (
                <div
                  key={supplier.id}
                  onClick={() => setFinalSelection(supplier.id)}
                  className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                    finalSelection === supplier.id
                      ? 'border-[#2EB8A9] bg-[#2EB8A9]/5'
                      : 'border-gray-200 hover:border-[#2EB8A9]/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-[#2EB8A9] text-white flex items-center justify-center">
                          {idx + 1}
                        </div>
                        <h3 className="text-gray-900">{supplier.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        {supplier.category} • {supplier.region}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <RiskArrow score={supplier.riskScore} size="medium" showLabel={false} />
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Estimated Cost</p>
                      <p className="text-gray-900">Competitive</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Lead Time</p>
                      <p className="text-gray-900">4-6 weeks</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Capacity</p>
                      <p className="text-gray-900">High</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={step === 1}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>
          {step < 3 ? (
            <Button onClick={handleNext} className="bg-[#2EB8A9] hover:bg-[#2EB8A9]/90 gap-2">
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={onComplete}
              disabled={!finalSelection}
              className="bg-[#2EB8A9] hover:bg-[#2EB8A9]/90 gap-2"
            >
              Submit Request
              <CheckCircle2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

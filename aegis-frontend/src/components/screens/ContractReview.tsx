import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import {
  ArrowLeft,
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  Download,
} from 'lucide-react';

interface ContractReviewProps {
  onBack: () => void;
  onAskAgent: (question: string) => void;
}

interface Clause {
  id: string;
  title: string;
  content: string;
  risk: 'safe' | 'moderate' | 'warning';
  section: string;
}

const mockClauses: Clause[] = [
  {
    id: '1',
    title: 'Contract Term',
    content: 'This agreement shall be valid for a period of three (3) years from the effective date.',
    risk: 'warning',
    section: 'Term & Termination',
  },
  {
    id: '2',
    title: 'Liability Cap',
    content: 'Supplier\'s total liability under this agreement shall not exceed the total contract value.',
    risk: 'moderate',
    section: 'Liability',
  },
  {
    id: '3',
    title: 'Price Adjustment',
    content: 'Prices may be adjusted annually based on CPI index changes, not to exceed 5% per year.',
    risk: 'safe',
    section: 'Pricing',
  },
  {
    id: '4',
    title: 'Force Majeure',
    content: 'Neither party shall be liable for delays or failures due to circumstances beyond their reasonable control.',
    risk: 'moderate',
    section: 'Force Majeure',
  },
  {
    id: '5',
    title: 'Termination Rights',
    content: 'Either party may terminate with 90 days written notice. Immediate termination allowed for material breach.',
    risk: 'safe',
    section: 'Term & Termination',
  },
  {
    id: '6',
    title: 'Indemnification',
    content: 'Supplier shall indemnify buyer against all claims arising from supplier\'s negligence or breach of contract.',
    risk: 'moderate',
    section: 'Indemnification',
  },
];

const suggestions = [
  {
    id: '1',
    title: 'Shorten contract term',
    description: 'Reduce from 3 years to 1 year with option to extend',
    impact: 'Reduces long-term risk exposure',
  },
  {
    id: '2',
    title: 'Add liability cap increase',
    description: 'Request liability cap of 2x contract value for critical failures',
    impact: 'Better protection for major incidents',
  },
  {
    id: '3',
    title: 'Include alternative supplier clause',
    description: 'Add provision for secondary supplier in case of sustained underperformance',
    impact: 'Improves supply chain resilience',
  },
];

export function ContractReview({ onBack, onAskAgent }: ContractReviewProps) {
  const [selectedClause, setSelectedClause] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState(false);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'safe':
        return 'text-[#2EB8A9] border-[#2EB8A9]';
      case 'moderate':
        return 'text-[#F4B400] border-[#F4B400]';
      case 'warning':
        return 'text-[#E63946] border-[#E63946]';
      default:
        return 'text-gray-400 border-gray-400';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'safe':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const handleFileUpload = () => {
    setUploadedFile(true);
  };

  return (
    <div className="min-h-screen bg-[#F7F9FB] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>

        <div>
          <h1 className="text-gray-900 mb-2">Contract Review & Analysis</h1>
          <p className="text-gray-600">AI-powered contract risk assessment</p>
        </div>

        {/* Upload Section */}
        {!uploadedFile ? (
          <Card className="p-12 bg-white">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#2EB8A9]/10 flex items-center justify-center">
                <Upload className="w-10 h-10 text-[#2EB8A9]" />
              </div>
              <h2 className="text-gray-900 mb-2">Upload Contract Document</h2>
              <p className="text-gray-600 mb-6">
                Drag and drop your contract file or click to browse
              </p>
              <Button
                onClick={handleFileUpload}
                className="bg-[#2EB8A9] hover:bg-[#2EB8A9]/90"
              >
                Select File
              </Button>
              <p className="text-sm text-gray-500 mt-4">
                Supported formats: PDF, DOCX, TXT (Max 10MB)
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Document Preview & Clauses */}
            <div className="lg:col-span-2 space-y-6">
              {/* Document Info */}
              <Card className="p-4 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-[#2EB8A9]/10 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-[#2EB8A9]" />
                    </div>
                    <div>
                      <h3 className="text-gray-900">Supplier_Agreement_2025.pdf</h3>
                      <p className="text-sm text-gray-600">Uploaded just now • 156 KB</p>
                    </div>
                  </div>
                  <Button variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>
              </Card>

              {/* Risk Summary */}
              <Card className="p-6 bg-white">
                <h2 className="text-gray-900 mb-4">Risk Analysis Summary</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-[#2EB8A9]/5">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-[#2EB8A9]" />
                      <span className="text-2xl text-gray-900">3</span>
                    </div>
                    <p className="text-sm text-gray-600">Safe Clauses</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-[#F4B400]/5">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-[#F4B400]" />
                      <span className="text-2xl text-gray-900">2</span>
                    </div>
                    <p className="text-sm text-gray-600">Moderate Risk</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-[#E63946]/5">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-[#E63946]" />
                      <span className="text-2xl text-gray-900">1</span>
                    </div>
                    <p className="text-sm text-gray-600">Warning</p>
                  </div>
                </div>
              </Card>

              {/* Flagged Clauses */}
              <Card className="bg-white">
                <div className="p-6 border-b">
                  <h2 className="text-gray-900">Flagged Clauses</h2>
                </div>
                <ScrollArea className="h-[500px]">
                  <div className="p-6 space-y-3">
                    {mockClauses.map((clause) => (
                      <div
                        key={clause.id}
                        onClick={() => setSelectedClause(clause.id)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedClause === clause.id
                            ? 'border-[#2EB8A9] bg-[#2EB8A9]/5'
                            : 'border-gray-200 hover:border-[#2EB8A9]/50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-gray-900">{clause.title}</h3>
                          <Badge variant="outline" className={getRiskColor(clause.risk)}>
                            <div className="flex items-center gap-1">
                              {getRiskIcon(clause.risk)}
                              <span className="capitalize">{clause.risk}</span>
                            </div>
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{clause.content}</p>
                        <Badge variant="outline" className="text-xs">
                          {clause.section}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            </div>

            {/* Right: Suggestions & Actions */}
            <div className="space-y-6">
              {/* AI Suggestions */}
              <Card className="p-6 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-gray-900">AI Suggestions</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAskAgent('Explain the contract term risks')}
                    className="gap-2"
                  >
                    <MessageSquare className="w-3 h-3" />
                    Ask
                  </Button>
                </div>
                <div className="space-y-3">
                  {suggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className="p-3 rounded-lg border border-gray-200 hover:border-[#2EB8A9] transition-colors"
                    >
                      <h3 className="text-sm text-gray-900 mb-1">{suggestion.title}</h3>
                      <p className="text-xs text-gray-600 mb-2">{suggestion.description}</p>
                      <div className="flex items-center gap-1 text-xs text-[#2EB8A9]">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{suggestion.impact}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Quick Actions */}
              <Card className="p-6 bg-white">
                <h2 className="text-gray-900 mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <Button
                    className="w-full bg-[#2EB8A9] hover:bg-[#2EB8A9]/90"
                    onClick={() => onAskAgent('Generate negotiation points')}
                  >
                    Generate Negotiation Points
                  </Button>
                  <Button variant="outline" className="w-full">
                    Export Analysis Report
                  </Button>
                  <Button variant="outline" className="w-full">
                    Schedule Legal Review
                  </Button>
                  <Separator className="my-2" />
                  <Button variant="outline" className="w-full gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Ask Aegis About Clause
                  </Button>
                </div>
              </Card>

              {/* Overall Score */}
              <Card className="p-6 bg-gradient-to-br from-[#1F2D3D] to-[#2EB8A9] text-white">
                <p className="text-white/80 mb-2">Overall Contract Risk</p>
                <div className="flex items-end gap-2 mb-4">
                  <span className="text-4xl">52</span>
                  <span className="text-white/80 mb-1">/100</span>
                </div>
                <p className="text-sm text-white/90">
                  Moderate risk level. Consider implementing suggested modifications before approval.
                </p>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

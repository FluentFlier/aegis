import React, { useState, useCallback } from 'react';
import { suppliersAPI } from '../services/api';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { toast } from 'sonner';
import {
  Upload,
  FileText,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  TrendingUp,
  AlertCircle,
  Shield,
  Scale,
  Leaf,
  Globe,
} from 'lucide-react';

interface ContractAnalysis {
  file_name: string;
  supplier_name: string;
  text_length: number;
  processed_at: string;
  analysis: {
    summary: {
      overall_risk_score: number;
      recommendation: string;
      key_findings: string[];
      key_recommendations: string[];
    };
    contract_analysis?: {
      overall_risk_score: number;
      perspective: string;
      terms_identified: number;
      high_risk_terms: Array<{
        term: string;
        category: string;
        risk_score: number;
        description: string;
        rationale: string;
      }>;
      category_analysis: {
        [key: string]: {
          average_risk: number;
          term_count: number;
          terms: string[];
        };
      };
      recommendations: string[];
      coverage: number;
    };
    agent_results: {
      financial?: { risk_score: number; findings: string[]; recommendations: string[] };
      legal?: { risk_score: number; findings: string[]; recommendations: string[] };
      esg?: { risk_score: number; findings: string[]; recommendations: string[] };
      geopolitical?: { risk_score: number; findings: string[]; recommendations: string[] };
    };
  };
}

interface DocumentUploadProps {
  supplierId: string;
  supplierName: string;
  onAnalysisComplete?: (analysis: ContractAnalysis) => void;
}

export function DocumentUpload({ supplierId, supplierName, onAnalysisComplete }: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analysis, setAnalysis] = useState<ContractAnalysis | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf' || droppedFile.type === 'text/plain') {
        setFile(droppedFile);
      } else {
        toast.error('Please upload a PDF or TXT file');
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf' || selectedFile.type === 'text/plain') {
        setFile(selectedFile);
      } else {
        toast.error('Please upload a PDF or TXT file');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const result = await suppliersAPI.uploadDocument(Number(supplierId), file);

      setAnalysis(result);
      toast.success('Document analyzed successfully!');
      onAnalysisComplete?.(result);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to analyze document');
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setAnalysis(null);
  };

  const getRiskColor = (score: number) => {
    if (score < 40) return 'text-green-600 bg-green-50';
    if (score < 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getRiskBadgeColor = (score: number) => {
    if (score < 40) return 'bg-green-500';
    if (score < 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'financial':
      case 'pricing':
        return <TrendingUp className="w-4 h-4" />;
      case 'legal':
      case 'compliance':
        return <Scale className="w-4 h-4" />;
      case 'esg':
        return <Leaf className="w-4 h-4" />;
      case 'geopolitical':
        return <Globe className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      {!analysis && (
        <Card className="p-6 bg-white">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Contract for Analysis</h3>
              <p className="text-sm text-gray-600">
                Upload a supplier contract (PDF or TXT) to get AI-powered risk analysis
              </p>
            </div>

            {/* Drag and Drop Area */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive
                ? 'border-[#2EB8A9] bg-[#2EB8A9]/5'
                : 'border-gray-300 hover:border-gray-400'
                }`}
            >
              {file ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="w-8 h-8 text-[#2EB8A9]" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClear}
                      disabled={uploading}
                      className="ml-auto"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="bg-[#2EB8A9] hover:bg-[#2EB8A9]/90 text-white"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing Contract...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Analyze Contract
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="w-12 h-12 mx-auto text-gray-400" />
                  <div>
                    <p className="text-gray-900 font-medium mb-1">
                      Drop your contract here or click to browse
                    </p>
                    <p className="text-sm text-gray-500">Supports PDF and TXT files</p>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button asChild className="bg-[#2EB8A9] hover:bg-[#2EB8A9]/90 text-white">
                      <span>
                        <FileText className="w-4 h-4 mr-2" />
                        Choose File
                      </span>
                    </Button>
                  </label>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Overall Summary */}
          <Card className="p-6 bg-white">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Analysis Complete</h3>
                <p className="text-sm text-gray-600">{analysis.file_name}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleClear}>
                <X className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Overall Risk Score</p>
                <p
                  className={`text-3xl font-bold ${getRiskColor(
                    analysis.analysis.summary.overall_risk_score
                  )}`}
                >
                  {analysis.analysis.summary.overall_risk_score.toFixed(1)}
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Terms Identified</p>
                <p className="text-3xl font-bold text-gray-900">
                  {analysis.analysis.contract_analysis?.terms_identified || 0}
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Coverage</p>
                <p className="text-3xl font-bold text-gray-900">
                  {analysis.analysis.contract_analysis?.coverage.toFixed(0) || 0}%
                </p>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 mb-1">Recommendation</p>
                  <p className="text-sm text-blue-700">{analysis.analysis.summary.recommendation}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* High Risk Terms */}
          {analysis.analysis.contract_analysis &&
            analysis.analysis.contract_analysis.high_risk_terms.length > 0 && (
              <Card className="p-6 bg-white">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  High Risk Contract Terms
                </h3>
                <div className="space-y-3">
                  {analysis.analysis.contract_analysis.high_risk_terms.map((term, idx) => (
                    <div key={idx} className="p-4 border border-red-200 bg-red-50 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getRiskBadgeColor(term.risk_score * 10)}>
                            Risk: {term.risk_score}/10
                          </Badge>
                          <Badge variant="outline">{term.category}</Badge>
                        </div>
                      </div>
                      <p className="font-medium text-gray-900 mb-1">{term.term}</p>
                      <p className="text-sm text-gray-600 mb-2">{term.description}</p>
                      <p className="text-xs text-gray-500 italic">{term.rationale}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

          {/* Category Breakdown */}
          {analysis.analysis.contract_analysis && (
            <Card className="p-6 bg-white">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk by Category</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(analysis.analysis.contract_analysis.category_analysis).map(
                  ([category, data]) => (
                    <div key={category} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(category)}
                          <span className="font-medium text-gray-900">{category}</span>
                        </div>
                        <Badge className={getRiskBadgeColor(data.average_risk * 10)}>
                          {data.average_risk.toFixed(1)}/10
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{data.term_count} terms identified</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {data.terms.slice(0, 3).map((term, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {term}
                          </Badge>
                        ))}
                        {data.terms.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{data.terms.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </Card>
          )}

          {/* Key Findings */}
          <Card className="p-6 bg-white">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Findings</h3>
            <div className="space-y-2">
              {analysis.analysis.summary.key_findings.slice(0, 5).map((finding, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-[#2EB8A9] mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">{finding}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Recommendations */}
          <Card className="p-6 bg-white">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
            <div className="space-y-2">
              {analysis.analysis.summary.key_recommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-900">{rec}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* AI Agent Analysis */}
          {analysis.analysis.agent_results && (
            <Card className="p-6 bg-white">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Agent Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(analysis.analysis.agent_results).map(([agent, result]) => {
                  if (!result || 'error' in result) return null;
                  return (
                    <div key={agent} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-gray-900 capitalize">{agent} Agent</span>
                        <Badge className={getRiskBadgeColor(result.risk_score)}>
                          {result.risk_score.toFixed(0)}/100
                        </Badge>
                      </div>
                      {result.findings && result.findings.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs text-gray-600 mb-1">Top Finding:</p>
                          <p className="text-sm text-gray-700">{result.findings[0]}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

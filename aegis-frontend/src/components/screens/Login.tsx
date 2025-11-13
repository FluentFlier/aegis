import React from 'react';
import { Button } from '../ui/button';
import { Shield, TrendingDown, AlertTriangle, FileText } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export function Login({ onLogin }: LoginProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1F2D3D] via-[#2C4255] to-[#2EB8A9] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#2EB8A9] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#F4B400] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-white rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2EB8A9] to-white shadow-2xl flex items-center justify-center">
              <Shield className="w-10 h-10 text-[#1F2D3D]" />
            </div>
            <h1 className="text-6xl text-white tracking-tight">Aegis</h1>
          </div>
          <p className="text-xl text-white/90">AI Procurement Office</p>
          <p className="text-white/70 mt-2">Intelligent risk management for enterprise procurement</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20">
          <h2 className="text-3xl text-white mb-8">Welcome, COO</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Button
              onClick={onLogin}
              className="h-24 bg-white/20 hover:bg-white/30 border border-white/30 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-white"
            >
              <TrendingDown className="w-6 h-6" />
              <span>Start New Sourcing</span>
            </Button>
            <Button
              onClick={onLogin}
              className="h-24 bg-white/20 hover:bg-white/30 border border-white/30 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-white"
            >
              <AlertTriangle className="w-6 h-6" />
              <span>Review Supplier Risks</span>
            </Button>
            <Button
              onClick={onLogin}
              className="h-24 bg-white/20 hover:bg-white/30 border border-white/30 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-white"
            >
              <FileText className="w-6 h-6" />
              <span>Alerts Feed</span>
            </Button>
          </div>

          <Button
            onClick={onLogin}
            className="w-full h-14 bg-[#2EB8A9] hover:bg-[#2EB8A9]/90 text-white text-lg shadow-xl"
          >
            Access Dashboard
          </Button>
        </div>

        <div className="text-center mt-8 text-white/60 text-sm">
          Trusted by leading enterprises • ISO 27001 Certified • SOC 2 Type II Compliant
        </div>
      </div>
    </div>
  );
}

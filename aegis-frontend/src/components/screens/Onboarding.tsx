import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { Checkbox } from '../ui/checkbox';
import { Progress } from '../ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import {
  Shield,
  Building2,
  Database,
  Users,
  Brain,
  Loader2,
  CheckCircle2,
  Scale,
  Leaf,
  TrendingUp,
  FileText,
  DollarSign,
  BarChart3,
  Globe2,
  Upload,
  Link2,
  FileSpreadsheet,
  ArrowRight,
} from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: OnboardingProfile) => void;
}

export interface OnboardingProfile {
  companyName: string;
  industry: string;
  headquarters: string;
  companySize: string;
  spendRange: number;
  riskAppetite: string;
  esgPriorities: string[];
  dataSources: string[];
  teamMembers: TeamMember[];
  agentPersonality: string;
}

interface TeamMember {
  name: string;
  email: string;
  role: string;
}

const industries = [
  'Technology',
  'Manufacturing',
  'Healthcare',
  'Financial Services',
  'Retail',
  'Energy',
  'Transportation',
  'Construction',
];

const companySize = ['1-50', '51-200', '201-1000', '1001-5000', '5000+'];

const agents = [
  { name: 'Legal Agent', icon: Scale, color: '#2EB8A9', description: "I'll track all contracts and lawsuits so you don't have to." },
  { name: 'Risk Agent', icon: Shield, color: '#F4B400', description: "I'll monitor comprehensive risk across all dimensions in real-time." },
  { name: 'ESG Agent', icon: Leaf, color: '#34D399', description: "I'll ensure your suppliers meet sustainability and governance standards." },
  { name: 'Negotiation Agent', icon: TrendingUp, color: '#60A5FA', description: "I'll help you secure the best terms and pricing for your contracts." },
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [isInitializing, setIsInitializing] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  const [profile, setProfile] = useState<OnboardingProfile>({
    companyName: '',
    industry: '',
    headquarters: '',
    companySize: '',
    spendRange: 50,
    riskAppetite: '',
    esgPriorities: [],
    dataSources: [],
    teamMembers: [],
    agentPersonality: '',
  });

  const [newMember, setNewMember] = useState({ name: '', email: '', role: '' });

  const totalSteps = 5;
  const progress = ((step + 1) / totalSteps) * 100;

  const handleAddTeamMember = () => {
    if (newMember.name && newMember.email && newMember.role) {
      setProfile({
        ...profile,
        teamMembers: [...profile.teamMembers, newMember],
      });
      setNewMember({ name: '', email: '', role: '' });
    }
  };

  const handleComplete = () => {
    setIsInitializing(true);
    // Simulate initialization
    setTimeout(() => {
      onComplete(profile);
    }, 3000);
  };

  if (showWelcome) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1F2D3D] via-[#2C4255] to-[#1F2D3D] flex items-center justify-center relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <motion.div
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#2EB8A9] rounded-full blur-3xl opacity-20"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#F4B400] rounded-full blur-3xl opacity-20"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.25, 0.2],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center max-w-3xl px-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="flex justify-center mb-8"
          >
            <div className="relative">
              <motion.div
                className="w-32 h-32 rounded-3xl bg-gradient-to-br from-[#2EB8A9] to-white shadow-2xl flex items-center justify-center"
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(46, 184, 169, 0.3)',
                    '0 0 60px rgba(46, 184, 169, 0.6)',
                    '0 0 20px rgba(46, 184, 169, 0.3)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Shield className="w-16 h-16 text-[#1F2D3D]" />
              </motion.div>
              <motion.div
                className="absolute -inset-4 rounded-3xl border-2 border-[#2EB8A9]/30"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-6xl text-white mb-4"
          >
            Welcome to <span className="bg-gradient-to-r from-[#2EB8A9] to-white bg-clip-text text-transparent">Aegis</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-2xl text-white/80 mb-3"
          >
            Your autonomous procurement intelligence
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="text-lg text-white/60 mb-12"
          >
            Let's calibrate your AI office
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
          >
            <Button
              onClick={() => setShowWelcome(false)}
              size="lg"
              className="bg-gradient-to-r from-[#2EB8A9] to-[#27A99A] hover:from-[#27A99A] hover:to-[#2EB8A9] text-white px-12 py-6 text-lg shadow-lg shadow-[#2EB8A9]/30"
            >
              Begin Setup
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1F2D3D] via-[#2C4255] to-[#1F2D3D] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-24 h-24 rounded-full border-4 border-[#2EB8A9]/30 border-t-[#2EB8A9] mx-auto mb-8"
          />
          <motion.div
            key={Math.random()}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <h2 className="text-2xl text-white mb-4">Initializing Aegis data vault...</h2>
            <p className="text-white/60 mb-2">Connecting to financial data...</p>
            <p className="text-white/60">Deploying agents...</p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F9FB] to-[#E8EDF2] py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#1F2D3D]/60">Step {step + 1} of {totalSteps}</span>
            <span className="text-sm text-[#1F2D3D]/60">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Step 1: Company Profile */}
            {step === 0 && (
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#2EB8A9] to-[#27A99A] flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">Company Profile</CardTitle>
                      <CardDescription>Tell us about your organization</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Company Name</Label>
                      <Input
                        placeholder="Acme Corporation"
                        value={profile.companyName}
                        onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Industry</Label>
                      <Select value={profile.industry} onValueChange={(v) => setProfile({ ...profile, industry: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {industries.map((ind) => (
                            <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Headquarters</Label>
                      <Input
                        placeholder="San Francisco, CA"
                        value={profile.headquarters}
                        onChange={(e) => setProfile({ ...profile, headquarters: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Company Size</Label>
                      <Select value={profile.companySize} onValueChange={(v) => setProfile({ ...profile, companySize: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          {companySize.map((size) => (
                            <SelectItem key={size} value={size}>{size} employees</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Annual Procurement Spend (USD)</Label>
                    <div className="pt-2">
                      <Slider
                        value={[profile.spendRange]}
                        onValueChange={([v]) => setProfile({ ...profile, spendRange: v })}
                        min={1}
                        max={100}
                        step={1}
                      />
                      <div className="flex justify-between mt-2 text-sm text-[#1F2D3D]/60">
                        <span>$1M</span>
                        <span className="text-[#2EB8A9]">${profile.spendRange}M</span>
                        <span>$100M+</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Risk Appetite</Label>
                    <Select value={profile.riskAppetite} onValueChange={(v) => setProfile({ ...profile, riskAppetite: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select risk appetite" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low - Prioritize safety and compliance</SelectItem>
                        <SelectItem value="moderate">Moderate - Balance risk and opportunity</SelectItem>
                        <SelectItem value="aggressive">Aggressive - Optimize for cost and innovation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>ESG Priorities (select all that apply)</Label>
                    <div className="space-y-2">
                      {['Environment', 'Social', 'Governance'].map((priority) => (
                        <div key={priority} className="flex items-center gap-2">
                          <Checkbox
                            id={priority}
                            checked={profile.esgPriorities.includes(priority)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setProfile({ ...profile, esgPriorities: [...profile.esgPriorities, priority] });
                              } else {
                                setProfile({ ...profile, esgPriorities: profile.esgPriorities.filter((p) => p !== priority) });
                              }
                            }}
                          />
                          <Label htmlFor={priority} className="cursor-pointer">{priority}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Data Sources */}
            {step === 1 && (
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#2EB8A9] to-[#27A99A] flex items-center justify-center">
                      <Database className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">Data Source Setup</CardTitle>
                      <CardDescription>Connect your data sources for AI analysis</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { id: 'financial', label: 'Financial Data', icon: DollarSign, description: 'Upload CSV / Connect ERP / Use sample data' },
                    { id: 'legal', label: 'Legal Feed', icon: Scale, description: 'CourtListener, Gov DB integrations' },
                    { id: 'esg', label: 'ESG API', icon: Leaf, description: 'Refinitiv, Sustainability.gov' },
                    { id: 'news', label: 'News/Social Listening', icon: BarChart3, description: 'NewsAPI, Twitter monitoring' },
                    { id: 'performance', label: 'Performance Data', icon: FileSpreadsheet, description: 'Internal CSV upload' },
                  ].map((source) => (
                    <div
                      key={source.id}
                      className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                        profile.dataSources.includes(source.id)
                          ? 'border-[#2EB8A9] bg-[#2EB8A9]/5'
                          : 'border-gray-200 hover:border-[#2EB8A9]/50'
                      }`}
                      onClick={() => {
                        if (profile.dataSources.includes(source.id)) {
                          setProfile({ ...profile, dataSources: profile.dataSources.filter((s) => s !== source.id) });
                        } else {
                          setProfile({ ...profile, dataSources: [...profile.dataSources, source.id] });
                        }
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <Checkbox checked={profile.dataSources.includes(source.id)} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <source.icon className="w-5 h-5 text-[#2EB8A9]" />
                            <h3 className="font-medium">{source.label}</h3>
                          </div>
                          <p className="text-sm text-[#1F2D3D]/60">{source.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Step 3: Team & Access */}
            {step === 2 && (
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#2EB8A9] to-[#27A99A] flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">Team & Access</CardTitle>
                      <CardDescription>Invite your team members</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        placeholder="John Doe"
                        value={newMember.name}
                        onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        placeholder="john@company.com"
                        value={newMember.email}
                        onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select value={newMember.role} onValueChange={(v) => setNewMember({ ...newMember, role: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="COO">COO - Full Control</SelectItem>
                          <SelectItem value="Analyst">Analyst - View & Recommend</SelectItem>
                          <SelectItem value="Legal">Legal - Legal Data Only</SelectItem>
                          <SelectItem value="Finance">Finance - Financial Data Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button onClick={handleAddTeamMember} variant="outline" className="w-full">
                    Add Team Member
                  </Button>

                  {profile.teamMembers.length > 0 && (
                    <div className="space-y-2">
                      <Label>Team Members ({profile.teamMembers.length})</Label>
                      <div className="space-y-2">
                        {profile.teamMembers.map((member, index) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                            <div>
                              <p className="font-medium">{member.name}</p>
                              <p className="text-sm text-[#1F2D3D]/60">{member.email} • {member.role}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setProfile({
                                ...profile,
                                teamMembers: profile.teamMembers.filter((_, i) => i !== index),
                              })}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.teamMembers.length === 0 && (
                    <div className="text-center py-8 text-[#1F2D3D]/40">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p>No team members added yet</p>
                      <p className="text-sm">You can add them later from settings</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 4: AI Calibration */}
            {step === 3 && (
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#2EB8A9] to-[#27A99A] flex items-center justify-center">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">AI Calibration</CardTitle>
                      <CardDescription>Meet your intelligent agents</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    {agents.map((agent) => (
                      <motion.div
                        key={agent.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.02 }}
                        className="p-6 rounded-xl border-2 border-gray-200 hover:border-[#2EB8A9]/50 transition-all"
                      >
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                          style={{ backgroundColor: `${agent.color}20` }}
                        >
                          <agent.icon className="w-6 h-6" style={{ color: agent.color }} />
                        </div>
                        <h3 className="font-medium mb-2">{agent.name}</h3>
                        <p className="text-sm text-[#1F2D3D]/60 italic">"{agent.description}"</p>
                      </motion.div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <Label>Agent Personality Tone</Label>
                    <p className="text-sm text-[#1F2D3D]/60 mb-3">
                      This affects how agents communicate with you in chat and notifications
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {['Professional', 'Friendly', 'Analytical', 'Minimal'].map((tone) => (
                        <div
                          key={tone}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            profile.agentPersonality === tone
                              ? 'border-[#2EB8A9] bg-[#2EB8A9]/5'
                              : 'border-gray-200 hover:border-[#2EB8A9]/50'
                          }`}
                          onClick={() => setProfile({ ...profile, agentPersonality: tone })}
                        >
                          <p className="font-medium text-center">{tone}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 5: Review & Launch */}
            {step === 4 && (
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#2EB8A9] to-[#27A99A] flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">Review & Launch</CardTitle>
                      <CardDescription>Confirm your setup and launch Aegis</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Company Profile</h4>
                      <div className="text-sm space-y-1 text-[#1F2D3D]/60">
                        <p>Company: {profile.companyName || 'Not specified'}</p>
                        <p>Industry: {profile.industry || 'Not specified'}</p>
                        <p>Spend: ${profile.spendRange}M/year</p>
                        <p>Risk Appetite: {profile.riskAppetite || 'Not specified'}</p>
                        <p>ESG: {profile.esgPriorities.join(', ') || 'None selected'}</p>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Data Sources</h4>
                      <p className="text-sm text-[#1F2D3D]/60">
                        {profile.dataSources.length} source{profile.dataSources.length !== 1 ? 's' : ''} connected
                      </p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Team</h4>
                      <p className="text-sm text-[#1F2D3D]/60">
                        {profile.teamMembers.length} team member{profile.teamMembers.length !== 1 ? 's' : ''} invited
                      </p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">AI Configuration</h4>
                      <p className="text-sm text-[#1F2D3D]/60">
                        Personality: {profile.agentPersonality || 'Not specified'}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-[#2EB8A9]/10 to-[#2EB8A9]/5 rounded-lg border-2 border-[#2EB8A9]/20">
                    <div className="flex items-start gap-3">
                      <Shield className="w-6 h-6 text-[#2EB8A9] flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-medium text-[#1F2D3D] mb-2">Ready to Launch</h4>
                        <p className="text-sm text-[#1F2D3D]/60">
                          Aegis will initialize your data vault, deploy AI agents, and create your command center.
                          This process takes about 30 seconds.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => setStep(step - 1)}
            disabled={step === 0}
          >
            Back
          </Button>

          {step < totalSteps - 1 ? (
            <Button
              onClick={() => setStep(step + 1)}
              className="bg-gradient-to-r from-[#2EB8A9] to-[#27A99A] hover:from-[#27A99A] hover:to-[#2EB8A9] text-white"
            >
              Continue
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              className="bg-gradient-to-r from-[#2EB8A9] to-[#27A99A] hover:from-[#27A99A] hover:to-[#2EB8A9] text-white px-8"
            >
              Launch Aegis
              <CheckCircle2 className="ml-2 w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

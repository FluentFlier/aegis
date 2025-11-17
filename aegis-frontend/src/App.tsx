import React, { useState, useEffect } from 'react';
import { Screen, ChatMessage, AgentActivity, Supplier } from './types';
import { allEvents, recommendations, initialChatMessages } from './data/mockData';
import { suppliersAPI, alertsAPI, agentsAPI } from './services/api';
import { Onboarding, OnboardingProfile } from './components/screens/Onboarding';
import { Login } from './components/screens/Login';
import { Dashboard } from './components/screens/Dashboard';
import { SupplierDetail } from './components/screens/SupplierDetail';
import { Alerts } from './components/screens/Alerts';
import { SourcingFlow } from './components/screens/SourcingFlow';
import { ContractReview } from './components/screens/ContractReview';
import { Analytics } from './components/screens/Analytics';
import { NotificationCenter } from './components/NotificationCenter';
import { Button } from './components/ui/button';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner@2.0.3';
import {
  Shield,
  LayoutDashboard,
  AlertTriangle,
  TrendingDown,
  FileText,
  LogOut,
  BarChart3,
  Bell,
  Moon,
  Sun,
} from 'lucide-react';

type AppScreen = Screen | 'onboarding';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('onboarding');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialChatMessages);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [userProfile, setUserProfile] = useState<OnboardingProfile | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  // Real data from backend
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [agentActivities, setAgentActivities] = useState<AgentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Fetch data from backend
  useEffect(() => {
    const fetchData = async () => {
      if (currentScreen === 'login' || currentScreen === 'onboarding') {
        return; // Don't fetch data on login/onboarding screens
      }

      // Load mock data first as fallback
      const { suppliers: mockSuppliers, agentActivities: mockActivities } = await import('./data/mockData');

      try {
        setIsLoading(true);
        setError(null);

        // Try to fetch from backend with timeout
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Backend request timeout')), 5000)
        );

        const fetchPromise = (async () => {
          // Fetch suppliers with risk scores
          const suppliersData = await suppliersAPI.getAll();

          // Transform backend data to match frontend Supplier type
          const transformedSuppliers: Supplier[] = suppliersData.map((s: any) => ({
            id: String(s.id),
            name: s.name,
            riskScore: s.latest_risk_score || 0,
            status: s.status.toLowerCase() as any,
            region: s.region || 'Unknown',
            category: s.category || 'Uncategorized',
            trends: {
              riskScore: s.risk_trend || 0,
              delivery: 0,
              quality: 0,
            },
            contracts: s.total_contracts || 0,
            lastActivity: s.updated_at || s.created_at,
          }));

          // Fetch agent activities (limit to recent 10)
          const activitiesData = await agentsAPI.getActivity({ limit: 10 });

          // Transform backend data to match frontend AgentActivity type
          const transformedActivities: AgentActivity[] = activitiesData.map((a: any) => ({
            id: String(a.id),
            agent: a.agent_type,
            action: a.activity_type,
            supplierId: String(a.supplier_id),
            supplierName: a.supplier_name || 'Unknown Supplier',
            timestamp: a.created_at,
            status: a.status,
            confidence: a.confidence_score,
          }));

          return { suppliers: transformedSuppliers, activities: transformedActivities };
        })();

        const result = await Promise.race([fetchPromise, timeoutPromise]) as any;

        setSuppliers(result.suppliers);
        setAgentActivities(result.activities);
        toast.success('Connected to backend');
      } catch (err: any) {
        console.error('Backend unavailable, using demo data:', err);
        setError(err.message || 'Backend unavailable');

        // Use mock data on error
        setSuppliers(mockSuppliers);
        setAgentActivities(mockActivities);
        toast.info('Running in demo mode - backend unavailable');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentScreen]);

  const handleOnboardingComplete = (profile: OnboardingProfile) => {
    setUserProfile(profile);
    setHasCompletedOnboarding(true);
    setCurrentScreen('dashboard');
    toast.success(`Welcome to Aegis, ${profile.companyName}!`);
  };

  const handleLogin = () => {
    if (hasCompletedOnboarding) {
      setCurrentScreen('dashboard');
      toast.success('Welcome back to Aegis AI Procurement Office');
    } else {
      setCurrentScreen('onboarding');
    }
  };

  const handleLogout = () => {
    setCurrentScreen('login');
    toast.info('Logged out successfully');
  };

  const handleSupplierClick = (supplierId: string) => {
    setSelectedSupplierId(supplierId);
    setCurrentScreen('supplier-detail');
  };

  const handleSendMessage = (message: string) => {
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      message,
      timestamp: new Date().toISOString(),
    };
    setChatMessages([...chatMessages, newMessage]);

    // Simulate agent response
    setTimeout(() => {
      const agentMessage: ChatMessage = {
        id: `msg-${Date.now()}-agent`,
        sender: 'agent',
        message: 'I understand your request. Let me analyze that for you...',
        timestamp: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, agentMessage]);
    }, 1000);
  };

  const handleQuickReply = (reply: string) => {
    handleSendMessage(reply);
    
    if (reply === 'Yes - show details' || reply === 'Show MetalWorks details') {
      setTimeout(() => {
        const supplierId = reply.includes('MetalWorks') ? '4' : '2';
        handleSupplierClick(supplierId);
      }, 1500);
    }
  };

  const handleActivityClick = (activity: AgentActivity) => {
    if (activity.supplierId) {
      handleSupplierClick(activity.supplierId);
    }
  };

  const handleAlertTickerClick = () => {
    setCurrentScreen('alerts');
  };

  const handleApprove = (recommendationId: string) => {
    const rec = recommendations.find((r) => r.id === recommendationId);
    if (rec) {
      toast.success(`Recommendation approved: ${rec.title}`);
      setTimeout(() => {
        setCurrentScreen('dashboard');
      }, 1500);
    }
  };

  const handleAskAgent = () => {
    toast.info('Opening Aegis Agent chat...');
    const agentMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'agent',
      message: 'How can I help you with this supplier?',
      timestamp: new Date().toISOString(),
      quickReplies: ['Analyze contract terms', 'Compare alternatives', 'Risk mitigation plan'],
    };
    setChatMessages([...chatMessages, agentMessage]);
  };

  const handleSourcingComplete = () => {
    toast.success('Sourcing request submitted successfully!');
    setTimeout(() => {
      setCurrentScreen('dashboard');
    }, 1500);
  };

  const selectedSupplier = suppliers.find((s) => s.id === selectedSupplierId);

  // Show loading screen
  if (isLoading && currentScreen !== 'login' && currentScreen !== 'onboarding') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F9FBFC] to-[#FFFFFF] dark:from-[#0F1419] dark:to-[#1F2D3D] flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-[#2EB8A9] mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-semibold text-[#1F2D3D] dark:text-white mb-2">Loading Aegis</h2>
          <p className="text-gray-600 dark:text-gray-400">Fetching supplier data...</p>
        </div>
      </div>
    );
  }

  const handleEventClick = (supplierId?: string) => {
    if (supplierId) {
      handleSupplierClick(supplierId);
    }
  };

  const handleNotificationEventClick = (event: any) => {
    setShowNotifications(false);
    if (event.supplierId) {
      handleSupplierClick(event.supplierId);
    }
  };

  // Render navigation only when logged in
  const renderNavigation = () => {
    if (currentScreen === 'login' || currentScreen === 'onboarding') return null;

    return (
      <nav className="bg-gradient-to-r from-[#1F2D3D] to-[#2C4255] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#2EB8A9] to-white shadow-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-[#1F2D3D]" />
                </div>
                <h1 className="text-2xl text-white">Aegis</h1>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setCurrentScreen('dashboard')}
                  className={`text-white hover:bg-white/10 gap-2 ${
                    currentScreen === 'dashboard' ? 'bg-white/20' : ''
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setCurrentScreen('alerts')}
                  className={`text-white hover:bg-white/10 gap-2 ${
                    currentScreen === 'alerts' ? 'bg-white/20' : ''
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  Alerts
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setCurrentScreen('sourcing')}
                  className={`text-white hover:bg-white/10 gap-2 ${
                    currentScreen === 'sourcing' ? 'bg-white/20' : ''
                  }`}
                >
                  <TrendingDown className="w-4 h-4" />
                  Sourcing
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setCurrentScreen('contract')}
                  className={`text-white hover:bg-white/10 gap-2 ${
                    currentScreen === 'contract' ? 'bg-white/20' : ''
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Contracts
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setCurrentScreen('analytics')}
                  className={`text-white hover:bg-white/10 gap-2 ${
                    currentScreen === 'analytics' ? 'bg-white/20' : ''
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Analytics
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => setDarkMode(!darkMode)}
                className="text-white hover:bg-white/10 gap-2"
                title="Toggle dark mode"
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowNotifications(!showNotifications)}
                className="text-white hover:bg-white/10 gap-2 relative"
              >
                <Bell className="w-4 h-4" />
                {allEvents.filter(e => e.type === 'critical' || e.type === 'warning').length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#E63946] rounded-full"></span>
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="text-white hover:bg-white/10 gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9FBFC] to-[#FFFFFF] dark:from-[#0F1419] dark:to-[#1F2D3D] transition-colors duration-300">
      {renderNavigation()}
      
      {currentScreen === 'onboarding' && (
        <Onboarding onComplete={handleOnboardingComplete} />
      )}
      
      {currentScreen === 'login' && <Login onLogin={handleLogin} />}
      
      {currentScreen === 'dashboard' && (
        <Dashboard
          suppliers={suppliers}
          onSupplierClick={handleSupplierClick}
          chatMessages={chatMessages}
          onSendMessage={handleSendMessage}
          onQuickReply={handleQuickReply}
          agentActivities={agentActivities}
          onActivityClick={handleActivityClick}
          events={allEvents}
          onAlertTickerClick={handleAlertTickerClick}
        />
      )}
      
      {currentScreen === 'supplier-detail' && selectedSupplier && (
        <SupplierDetail
          supplier={selectedSupplier}
          recommendations={recommendations}
          onBack={() => setCurrentScreen('dashboard')}
          onApprove={handleApprove}
          onAskAgent={handleAskAgent}
        />
      )}
      
      {currentScreen === 'alerts' && (
        <Alerts
          events={allEvents}
          onBack={() => setCurrentScreen('dashboard')}
          onEventClick={handleEventClick}
        />
      )}
      
      {currentScreen === 'sourcing' && (
        <SourcingFlow
          suppliers={suppliers}
          onBack={() => setCurrentScreen('dashboard')}
          onComplete={handleSourcingComplete}
        />
      )}
      
      {currentScreen === 'contract' && (
        <ContractReview
          onBack={() => setCurrentScreen('dashboard')}
          onAskAgent={handleAskAgent}
        />
      )}

      {currentScreen === 'analytics' && (
        <Analytics
          suppliers={suppliers}
          onBack={() => setCurrentScreen('dashboard')}
        />
      )}
      
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        events={allEvents}
        onEventClick={handleNotificationEventClick}
      />
      
      <Toaster position="top-right" />
    </div>
  );
}

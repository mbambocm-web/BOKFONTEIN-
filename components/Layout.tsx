
import React, { useState, useEffect } from 'react';
import { Home, Compass, Users, User, Wallet, Bell, X, Check, MapPin, ShieldAlert, Zap, RefreshCcw, WifiOff, Map as MapIcon, Shield } from 'lucide-react';
import { AppTab, AppNotification } from '../types';
import { native } from '../services/nativeService';
import { db } from '../services/db';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  userName?: string;
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  isAdmin?: boolean;
  hideUI?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  onTabChange, 
  userName = "Thabo", 
  notifications,
  onMarkRead,
  isAdmin = false,
  hideUI = false
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [userLocation, setUserLocation] = useState<string>("Detecting Location...");

  useEffect(() => {
    // Detect Location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          // Simple heuristic for demo: If near Brisbane, say Brisbane. 
          // Otherwise, show "Nearby Area". In a real app, use reverse geocoding.
          const isNearBrisbane = Math.abs(latitude + 27.46) < 0.5 && Math.abs(longitude - 153.02) < 0.5;
          if (isNearBrisbane) {
            setUserLocation("Brisbane, AU");
          } else {
            // Simulate reverse geocoding based on coordinates
            setUserLocation(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
            // Attempt to get a friendly name from Gemini later if needed
          }
        },
        (error) => {
          console.warn("Location error:", error);
          setUserLocation("Global Diaspora");
        }
      );
    } else {
      setUserLocation("Global Diaspora");
    }
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleTabClick = (tab: AppTab) => {
    native.hapticImpact();
    onTabChange(tab);
  };

  const getHeaderText = () => {
    const isBrisbane = userLocation.includes("Brisbane");
    switch (activeTab) {
      case AppTab.HOME: 
        if (isAdmin) return "Admin Dashboard";
        return isBrisbane ? "RWC 2027 Dashboard" : "Global Fan Hub";
      case AppTab.EXPERIENCES: return "Elite Experiences";
      case AppTab.GREEN_MILE: return isBrisbane ? "The Green Mile" : "Local Pulse";
      case AppTab.COMMUNITY: return "Fan Vibe";
      case AppTab.WALLET: return "Bok Wallet";
      case AppTab.PROFILE: return "Fan Profile";
      case AppTab.ADMIN: return "Command Center";
      default: return activeTab;
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-[#f8fafc] border-x border-slate-100 overflow-hidden relative" role="application" aria-label="BOKFONTEIN App">
      
      {!isOnline && !hideUI && (
        <div className="fixed top-0 left-0 right-0 w-full bg-red-600 text-white py-2 px-4 z-[110] flex items-center justify-center space-x-2 animate-fadeIn shadow-lg h-10" role="alert">
          <WifiOff size={12} />
          <span className="text-[10px] font-black uppercase tracking-widest">Signal Patchy - Working Offline</span>
        </div>
      )}

      {!hideUI && (
        <header className={`fixed ${!isOnline ? 'top-12' : 'top-4'} left-4 right-4 z-[100] glass-premium rounded-[32px] px-6 py-4 shadow-luxury flex items-center justify-between transition-all duration-300 border border-white/50`}>
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="animate-fadeIn overflow-hidden">
              <div className="flex items-center space-x-2">
                <p className="text-[8px] font-black text-[#fdb913] uppercase tracking-widest flex items-center">
                  <MapPin size={10} className="mr-1" strokeWidth={3} />
                  {userLocation}
                </p>
                {isAdmin && (
                  <span className="bg-[#004d3d] text-[#fdb913] text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest border border-[#fdb913]/20">ADMIN ACCESS</span>
                )}
              </div>
              <h1 className="text-sm font-black text-[#004d3d] uppercase tracking-tight flex items-center truncate">
                {getHeaderText()}
              </h1>
            </div>
          </div>

          <button 
            onClick={() => { native.hapticImpact(); setShowNotifications(true); }}
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-[#004d3d]/5 text-[#004d3d] active:scale-90 transition-all relative border border-[#004d3d]/10 shrink-0"
          >
            <Bell size={18} strokeWidth={2.5} />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-3 h-3 bg-[#fdb913] rounded-full border-2 border-white shadow-sm"></span>
            )}
          </button>
        </header>
      )}

      <main className={`flex-1 overflow-y-auto ${hideUI ? 'pt-0 pb-0' : 'pt-36 pb-36'} no-scrollbar`} role="main">
        {children}
      </main>

      {!hideUI && (
        <nav className="fixed bottom-[calc(var(--safe-area-bottom)+1.5rem)] left-4 right-4 glass-premium border border-white/40 flex justify-around items-center py-3 px-3 rounded-[32px] shadow-luxury z-40">
          <NavButton icon={<Home size={20} />} active={activeTab === AppTab.HOME} onClick={() => handleTabClick(AppTab.HOME)} label="Home" />
          <NavButton icon={<MapIcon size={20} />} active={activeTab === AppTab.GREEN_MILE} onClick={() => handleTabClick(AppTab.GREEN_MILE)} label="Pulse" />
          <NavButton icon={<Compass size={20} />} active={activeTab === AppTab.EXPERIENCES} onClick={() => handleTabClick(AppTab.EXPERIENCES)} label="Events" />
          <NavButton icon={<Wallet size={20} />} active={activeTab === AppTab.WALLET} onClick={() => handleTabClick(AppTab.WALLET)} label="Wallet" />
          {isAdmin ? (
             <NavButton icon={<Shield size={20} />} active={activeTab === AppTab.ADMIN} onClick={() => handleTabClick(AppTab.ADMIN)} label="Admin" />
          ) : (
             <NavButton icon={<User size={20} />} active={activeTab === AppTab.PROFILE} onClick={() => handleTabClick(AppTab.PROFILE)} label="Profile" />
          )}
        </nav>
      )}
    </div>
  );
};

const NavButton: React.FC<{ icon: React.ReactNode, active: boolean, onClick: () => void, label: string }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-12 h-12 rounded-[20px] transition-all duration-500 relative ${active ? 'bg-[#004d3d] text-white shadow-xl scale-110' : 'text-slate-400 hover:text-[#004d3d] active:scale-90'}`}
    aria-label={label}
  >
    {icon}
    {active && (
      <span className="absolute -bottom-1 w-1 h-1 bg-[#fdb913] rounded-full"></span>
    )}
  </button>
);

export default Layout;

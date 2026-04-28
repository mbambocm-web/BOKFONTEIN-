
import React, { useState, useEffect } from 'react';
import { Home, Compass, User, Wallet, Bell, X, Check, MapPin, ShieldAlert, Zap, RefreshCcw, WifiOff, Map as MapIcon, Shield } from 'lucide-react';
import { AppTab, AppNotification } from '../types';
import { native } from '../services/nativeService';
import { motion, AnimatePresence } from 'framer-motion';

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
          const isNearBrisbane = Math.abs(latitude + 27.46) < 0.5 && Math.abs(longitude - 153.02) < 0.5;
          if (isNearBrisbane) {
            setUserLocation("Brisbane, AU");
          } else {
            setUserLocation(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
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
        <motion.div 
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          className="fixed top-0 left-0 right-0 w-full bg-red-600 text-white py-2 px-4 z-[110] flex items-center justify-center space-x-2 shadow-lg h-10" 
          role="alert"
        >
          <WifiOff size={14} strokeWidth={1.5} />
          <span className="text-[10px] font-black uppercase tracking-widest">Signal Patchy - Working Offline</span>
        </motion.div>
      )}

      {!hideUI && (
        <header className={`fixed ${!isOnline ? 'top-12' : 'top-4'} left-4 right-4 z-[100] glass-premium rounded-[32px] px-6 py-4 shadow-luxury flex items-center justify-between transition-all duration-300 border border-white/50`}>
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="animate-fadeIn overflow-hidden">
              <div className="flex items-center space-x-2">
                <p className="text-[8px] font-black text-[#fdb913] uppercase tracking-widest flex items-center">
                  <MapPin size={10} className="mr-1" strokeWidth={2} />
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

          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => { native.hapticImpact(); setShowNotifications(true); }}
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-[#004d3d]/5 text-[#004d3d] transition-all relative border border-[#004d3d]/10 shrink-0 hover:bg-[#004d3d]/10 active:bg-[#004d3d]/20"
          >
            <Bell size={18} strokeWidth={1.75} />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-3 h-3 bg-[#fdb913] rounded-full border-2 border-white shadow-sm ring-2 ring-[#fdb913]/20"></span>
            )}
          </motion.button>
        </header>
      )}

      <main className={`flex-1 overflow-y-auto ${hideUI ? 'pt-0 pb-0' : 'pt-36 pb-36'} no-scrollbar`} role="main">
        {children}
      </main>

      {!hideUI && (
        <nav className="fixed bottom-[calc(var(--safe-area-bottom)+1.5rem)] left-4 right-4 glass-premium border border-white/40 flex justify-around items-center py-2 px-2 rounded-[32px] shadow-luxury z-40">
          <NavButton icon={<Home />} active={activeTab === AppTab.HOME} onClick={() => handleTabClick(AppTab.HOME)} label="Home" />
          <NavButton icon={<MapIcon />} active={activeTab === AppTab.GREEN_MILE} onClick={() => handleTabClick(AppTab.GREEN_MILE)} label="Pulse" />
          <NavButton icon={<Compass />} active={activeTab === AppTab.EXPERIENCES} onClick={() => handleTabClick(AppTab.EXPERIENCES)} label="Events" />
          <NavButton icon={<Wallet />} active={activeTab === AppTab.WALLET} onClick={() => handleTabClick(AppTab.WALLET)} label="Wallet" />
          {isAdmin ? (
             <NavButton icon={<Shield />} active={activeTab === AppTab.ADMIN} onClick={() => handleTabClick(AppTab.ADMIN)} label="Admin" />
          ) : (
             <NavButton icon={<User />} active={activeTab === AppTab.PROFILE} onClick={() => handleTabClick(AppTab.PROFILE)} label="Profile" />
          )}
        </nav>
      )}
    </div>
  );
};

const NavButton: React.FC<{ icon: React.ReactElement, active: boolean, onClick: () => void, label: string }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-12 h-12 rounded-[24px] transition-all duration-300 relative group overflow-hidden ${active ? 'text-white' : 'text-slate-400 hover:text-[#004d3d]'}`}
    aria-label={label}
  >
    {active && (
      <motion.div 
        layoutId="nav-bg"
        className="absolute inset-0 bg-[#004d3d] shadow-[0_8px_16px_rgba(0,77,61,0.25)]"
        initial={false}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      />
    )}
    <span className="relative z-10 transition-transform duration-300 group-active:scale-90">
      {React.cloneElement(icon, { 
        size: 20, 
        strokeWidth: active ? 2 : 1.5,
        className: active ? 'drop-shadow-[0_0_8px_rgba(253,185,19,0.5)]' : ''
      })}
    </span>
    {active && (
      <motion.span 
        layoutId="nav-dot"
        className="absolute bottom-1 w-1 h-1 bg-[#fdb913] rounded-full z-10"
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      />
    )}
  </button>
);

export default Layout;


import React, { useState, useEffect } from 'react';
import { Home, Compass, Users, User, Wallet, Bell, X, Check, MapPin, ShieldAlert, Zap, RefreshCcw, WifiOff, Loader2 } from 'lucide-react';
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
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  onTabChange, 
  userName = "Thabo", 
  notifications,
  onMarkRead,
  isAdmin = false
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [userLocation, setUserLocation] = useState<string>("Detecting...");
  const [isLocating, setIsLocating] = useState(true);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Attempt to detect location
    detectLocation();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const detectLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            // Use OpenStreetMap Nominatim for free reverse geocoding
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`, {
              headers: { 'Accept-Language': 'en' }
            });
            const data = await response.json();
            
            const city = data.address.city || data.address.town || data.address.village || data.address.suburb || "Unknown City";
            const countryCode = data.address.country_code?.toUpperCase() || "ZA";
            
            setUserLocation(`${city}, ${countryCode}`);
          } catch (error) {
            console.error("Location lookup failed", error);
            setUserLocation("Mzansi, ZA"); // Authentic fallback
          } finally {
            setIsLocating(false);
          }
        },
        (error) => {
          console.error("Geolocation error", error);
          setUserLocation("Cape Town, ZA"); // Premium fallback
          setIsLocating(false);
        },
        { timeout: 10000 }
      );
    } else {
      setUserLocation("Global Hub");
      setIsLocating(false);
    }
  };

  useEffect(() => {
    setIsSyncing(true);
    const timer = setTimeout(() => setIsSyncing(false), 800);
    return () => clearTimeout(timer);
  }, [db.getLastSync()]);

  const handleTabClick = (tab: AppTab) => {
    native.hapticImpact();
    onTabChange(tab);
  };

  const getHeaderText = () => {
    switch (activeTab) {
      case AppTab.HOME: return "Home neighborhood";
      case AppTab.EXPERIENCES: return "Fan Tours";
      case AppTab.COMMUNITY: return "Braai Talk";
      case AppTab.WALLET: return "Bok Wallet";
      case AppTab.PROFILE: return "Jou Plek";
      case AppTab.ADMIN: return "Command Center";
      default: return activeTab;
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-[#f8fafc] border-x border-slate-100 overflow-hidden relative" role="application" aria-label="BOKFONTEIN App">
      
      {/* 1. STATUS BANNER - Fixed Height, Top Priority Layer 110 */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 w-full bg-red-600 text-white py-2 px-4 z-[110] flex items-center justify-center space-x-2 animate-fadeIn shadow-lg h-10" role="alert">
          <WifiOff size={12} />
          <span className="text-[10px] font-black uppercase tracking-widest">Signal is patchy - Working Offline</span>
        </div>
      )}

      {/* 2. GLOBAL HEADER - Fixed Position, Layer 100 */}
      <header className={`fixed ${!isOnline ? 'top-12' : 'top-4'} left-4 right-4 z-[100] glass-premium rounded-[32px] px-6 py-4 shadow-luxury flex items-center justify-between transition-all duration-300 border border-white/50`}>
        <div className="flex items-center space-x-3 overflow-hidden">
          {activeTab === AppTab.HOME ? (
            <div className="flex flex-col animate-fadeIn">
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-logo text-[#004d3d]">
                  BOK<span className="text-[#fdb913]">FONTEIN</span>
                </h1>
                <div className={`transition-opacity duration-300 ${isSyncing ? 'opacity-100' : 'opacity-0'}`}>
                   <RefreshCcw size={10} className="text-geen-500 animate-spin" />
                </div>
              </div>
              <div className="flex items-center space-x-1 ml-0.5">
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.4em]">AWEH, {userName.split(' ')[0]}</p>
                <Zap size={6} className="text-[#fdb913] fill-[#fdb913]" />
              </div>
            </div>
          ) : (
            <div className="animate-fadeIn overflow-hidden">
              <div className="flex items-center space-x-2">
                <p className="text-[8px] font-black text-[#fdb913] uppercase tracking-widest flex items-center">
                  {isLocating ? (
                    <RefreshCcw size={10} className="mr-1 animate-spin" />
                  ) : (
                    <MapPin size={10} className="mr-1" strokeWidth={3} />
                  )}
                  {userLocation}
                </p>
              </div>
              <h1 className="text-sm font-black text-[#004d3d] uppercase tracking-tight flex items-center truncate">
                {getHeaderText()}
              </h1>
            </div>
          )}
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

      {/* 3. NOTIFICATION DRAWER - Highest Priority Layer 10000 */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[10000] flex justify-end animate-fadeIn">
          <div className="w-[88%] h-full bg-white shadow-luxury flex flex-col animate-slideUp">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-[#004d3d] text-white pt-[calc(var(--safe-area-top)+2.5rem)]">
              <h3 className="font-black text-2xl font-heading">Updates</h3>
              <button onClick={() => setShowNotifications(false)} className="p-2 bg-white/10 rounded-xl">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar pb-[calc(var(--safe-area-bottom)+4rem)]">
              {notifications.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300">
                  <Bell size={48} strokeWidth={1} className="mb-4 opacity-20" />
                  <p className="text-sm font-bold uppercase tracking-widest">No updates yet!</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className={`p-6 rounded-[32px] transition-all border ${n.read ? 'bg-slate-50/50 border-slate-100 opacity-60' : 'bg-white border-[#004d3d]/10 shadow-soft'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-sm font-black text-[#004d3d] uppercase tracking-tight">{n.title}</h4>
                      {!n.read && (
                        <button onClick={() => onMarkRead(n.id)} className="text-[#fdb913] p-1 bg-[#fdb913]/10 rounded-lg">
                          <Check size={16} strokeWidth={4} />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">{n.message}</p>
                    <p className="text-[9px] text-slate-300 font-black mt-4 uppercase tracking-[0.2em]">{n.time}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. MAIN CONTENT - Standard Stacking */}
      <main className="flex-1 overflow-y-auto pt-36 pb-36 no-scrollbar" role="main">
        {children}
      </main>

      {/* 5. BOTTOM NAVIGATION - Fixed Position, Layer 40 (Below Page Modals at 10000+) */}
      <nav className="fixed bottom-[calc(var(--safe-area-bottom)+1.5rem)] left-4 right-4 glass-premium border border-white/40 flex justify-around items-center py-3 px-3 rounded-[32px] shadow-luxury z-40">
        <NavButton icon={<Home size={20} />} active={activeTab === AppTab.HOME} onClick={() => handleTabClick(AppTab.HOME)} label="Home" />
        <NavButton icon={<Compass size={20} />} active={activeTab === AppTab.EXPERIENCES} onClick={() => handleTabClick(AppTab.EXPERIENCES)} label="Tours" />
        <NavButton icon={<Users size={20} />} active={activeTab === AppTab.COMMUNITY} onClick={() => handleTabClick(AppTab.COMMUNITY)} label="Community" />
        <NavButton icon={<Wallet size={20} />} active={activeTab === AppTab.WALLET} onClick={() => handleTabClick(AppTab.WALLET)} label="Wallet" />
        <NavButton icon={<User size={20} />} active={activeTab === AppTab.PROFILE} onClick={() => handleTabClick(AppTab.PROFILE)} label="Profile" />
        {isAdmin && (
          <NavButton icon={<ShieldAlert size={20} />} active={activeTab === AppTab.ADMIN} onClick={() => handleTabClick(AppTab.ADMIN)} label="Admin" />
        )}
      </nav>
    </div>
  );
};

const NavButton: React.FC<{ icon: React.ReactNode, active: boolean, onClick: () => void, label: string }> = ({ icon, active, onClick, label }) => (
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

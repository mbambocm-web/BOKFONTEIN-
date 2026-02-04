
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Home from './pages/Home';
import Experiences from './pages/Experiences';
import Community from './pages/Community';
import Profile from './pages/Profile';
import Wallet from './pages/Wallet';
import Admin from './pages/Admin';
import GreenMile from './pages/GreenMile';
import Landing from './pages/Landing';
import BokBotLive from './components/BokBotLive';
import BokConciergeChat from './components/BokConciergeChat';
import { AppTab, AppNotification, Experience, Member, ContentReport, FanZoneHub } from './types';
import { db } from './services/db';
import { authService } from './services/authService';
import { isFirebaseConfigured } from './services/firebase';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.HOME);
  
  const [balance, setBalance] = useState<number>(0);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [hubs, setHubs] = useState<FanZoneHub[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  // Promo Mode & AI Assistants State
  const [isPromoMode, setIsPromoMode] = useState(false);
  const [isLiveBotOpen, setIsLiveBotOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      if (!isFirebaseConfigured) {
        const savedUser = db.getCurrentUser();
        if (savedUser) {
          setCurrentUser(savedUser);
          setBalance(savedUser.balance);
          setIsLoggedIn(true);
        }
        setIsInitializing(false);
        return;
      }

      const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
        if (firebaseUser) {
          const member = await db.getMemberById(firebaseUser.uid);
          if (member) {
            setCurrentUser(member);
            db.setCurrentUser(member);
            setBalance(member.balance);
            setIsLoggedIn(true);
          }
        }
        setIsInitializing(false);
      });

      return () => unsubscribe();
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const exps = await db.getExperiences();
      setExperiences(exps);
      const hbList = await db.getHubs();
      setHubs(hbList);
    };
    loadData();
  }, []);

  const addNotification = (title: string, message: string, type: 'match' | 'system' | 'wallet') => {
    const newNotif: AppNotification = {
      id: Date.now().toString(),
      title,
      message,
      time: 'Just now',
      read: false,
      type
    };
    db.addNotification(newNotif);
    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleAuth = async (role: 'admin' | 'member') => {
    if (!isFirebaseConfigured) {
      const guestUser: Member = {
        id: 'guest-fan',
        name: role === 'admin' ? "Bok Admin" : "Thabo Mokoena",
        email: role === 'admin' ? "admin@bokfontein.com" : "thabo@bokfontein.com",
        phone: "+27 82 000 0000",
        status: 'active',
        joinDate: new Date().toISOString(),
        balance: 15200,
        geesLevel: 7,
        geesXP: 3400,
        rank: 142,
        rankTier: 'Springbok',
        avatar: role === 'admin' 
          ? "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200" 
          : "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200",
        role: role,
        blockedUsers: [],
        checkIns: []
      };
      
      setCurrentUser(guestUser);
      db.setCurrentUser(guestUser);
      setBalance(guestUser.balance);
      setIsLoggedIn(true);
      return;
    }

    const user = await authService.loginWithGoogle();
    if (user) {
      setCurrentUser(user);
      setBalance(user.balance);
      setIsLoggedIn(true);
    }
  };

  const handleLogout = async () => {
    if (isFirebaseConfigured) {
      await authService.logout();
    }
    setIsLoggedIn(false);
    setCurrentUser(null);
    db.setCurrentUser(null);
    setActiveTab(AppTab.HOME);
  };

  const renderContent = () => {
    if (!currentUser) return null;
    switch (activeTab) {
      case AppTab.HOME:
        return <Home 
          onAddNotification={addNotification} 
          userName={currentUser.name} 
          onNavigateToTab={setActiveTab} 
          onOpenChat={() => setIsChatOpen(true)}
        />;
      case AppTab.GREEN_MILE:
        return <GreenMile />;
      case AppTab.EXPERIENCES:
        return <Experiences 
          experiences={experiences} 
          onAddNotification={addNotification} 
          onNavigateToTab={setActiveTab}
        />;
      case AppTab.COMMUNITY:
        return <Community 
          onAddNotification={addNotification} 
          blockedUsers={currentUser.blockedUsers}
          onBlockUser={() => {}}
          onSubmitReport={() => {}}
          balance={currentUser.balance}
          onUpdateBalance={(amt) => {
            db.updateMemberBalance(currentUser.id, amt);
            setBalance(prev => prev + amt);
          }}
        />;
      case AppTab.PROFILE:
        return <Profile 
          currentUser={currentUser}
          onLogout={handleLogout}
          onUpdateBalance={(amt) => {
            db.updateMemberBalance(currentUser.id, amt);
            setBalance(prev => prev + amt);
          }}
          isAdmin={currentUser.role === 'admin'}
          onGoToAdmin={() => setActiveTab(AppTab.ADMIN)}
          onNavigateToExperiences={() => setActiveTab(AppTab.EXPERIENCES)}
          onToggleAdmin={() => {
            const newRole = currentUser.role === 'admin' ? 'member' : 'admin';
            const updated = { ...currentUser, role: newRole as any };
            setCurrentUser(updated);
            db.setCurrentUser(updated);
          }}
          reports={reports}
        />;
      case AppTab.WALLET:
        return <Wallet 
          balance={currentUser.balance} 
          onUpdateBalance={(amt) => {
            db.updateMemberBalance(currentUser.id, amt);
            setBalance(prev => prev + amt);
          }} 
          onAddNotification={addNotification} 
        />;
      case AppTab.ADMIN:
        return <Admin 
          members={members} setMembers={setMembers}
          experiences={experiences} setExperiences={setExperiences}
          hubs={hubs} setHubs={setHubs}
          onAddNotification={addNotification}
          reports={reports} setReports={setReports}
          onStartPromo={() => {}}
        />;
      default:
        return <Home 
          onAddNotification={addNotification} 
          userName={currentUser.name} 
          onOpenChat={() => setIsChatOpen(true)}
        />;
    }
  };

  if (isInitializing) {
    return (
      <div className="h-screen w-full bg-[#004d3d] flex flex-col items-center justify-center space-y-6 animate-fadeIn">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[#fdb913]/20 rounded-full"></div>
          <div className="absolute top-0 w-16 h-16 border-4 border-[#fdb913] border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div className="text-center">
          <h1 className="text-white font-logo text-xl tracking-[0.4em] mb-1">BOK<span className="text-[#fdb913]">FONTEIN</span></h1>
          <p className="text-[#fdb913]/40 text-[8px] font-black uppercase tracking-[0.6em] animate-pulse">Initializing Fan Hub...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Landing onAuth={handleAuth} />;
  }

  return (
    <>
      <Layout 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        notifications={notifications}
        onMarkRead={() => {}}
        isAdmin={currentUser?.role === 'admin'}
        userName={currentUser?.name}
        hideUI={isPromoMode}
      >
        {renderContent()}
      </Layout>
      <BokBotLive isOpen={isLiveBotOpen} onClose={() => setIsLiveBotOpen(false)} />
      <BokConciergeChat 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        onOpenLive={() => setIsLiveBotOpen(true)}
        userName={currentUser?.name}
      />
    </>
  );
};

export default App;

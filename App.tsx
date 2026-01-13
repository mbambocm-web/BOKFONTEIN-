import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Home from './pages/Home';
import Experiences from './pages/Experiences';
import Community from './pages/Community';
import Profile from './pages/Profile';
import Wallet from './pages/Wallet';
import Admin from './pages/Admin';
import Landing from './pages/Landing';
import { AppTab, AppNotification, Experience, Member, ContentReport } from './types';
import { db } from './services/db';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return !!db.getCurrentUser();
  });
  
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.HOME);
  const [currentUser, setCurrentUser] = useState<Member | null>(db.getCurrentUser());
  const [balance, setBalance] = useState<number>(db.getCurrentUser()?.balance || 0);
  const [experiences, setExperiences] = useState<Experience[]>(db.getExperiences());
  const [members, setMembers] = useState<Member[]>(db.getMembers());
  const [notifications, setNotifications] = useState<AppNotification[]>(db.getNotifications());
  const [reports, setReports] = useState<ContentReport[]>(db.getReports());

  // Keep local state synced with DB atomic updates
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
    setNotifications(db.getNotifications());
  };

  const markAsRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    db.setNotifications(updated);
    setNotifications(updated);
  };

  const handleUpdateBalance = (amount: number) => {
    if (!currentUser) return;
    db.updateMemberBalance(currentUser.id, amount);
    setBalance(db.getCurrentUser()?.balance || 0);
    setCurrentUser(db.getCurrentUser());
    setMembers(db.getMembers());
  };

  const handleBlockUser = (targetUserId: string) => {
    if (!currentUser) return;
    const updatedUser = { 
      ...currentUser, 
      blockedUsers: [...new Set([...currentUser.blockedUsers, targetUserId])]
    };
    db.setCurrentUser(updatedUser);
    db.setMembers(db.getMembers().map(m => m.id === updatedUser.id ? updatedUser : m));
    
    setCurrentUser(updatedUser);
    setMembers(db.getMembers());
    addNotification("User Blocked", "They will no longer appear in your feed.", "system");
  };

  const handleSubmitReport = (postId: string, postContent: string, reportedUserId: string, reason: string) => {
    if (!currentUser) return;
    const newReport: ContentReport = {
      id: `rep-${Date.now()}`,
      postId,
      postContent,
      reportedUserId,
      reporterUserId: currentUser.id,
      reason,
      timestamp: new Date().toLocaleString(),
      status: 'pending'
    };
    const updatedReports = [newReport, ...reports];
    db.setReports(updatedReports);
    setReports(updatedReports);
    addNotification("Report Received", "Thank you for keeping Mzansi safe. We'll review this shortly.", "system");
  };

  const handleAuth = (role: 'admin' | 'member') => {
    const allMembers = db.getMembers();
    const user = role === 'admin' ? allMembers[0] : allMembers[1];
    db.setCurrentUser(user);
    setCurrentUser(user);
    setBalance(user.balance);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    db.setCurrentUser(null);
    setIsLoggedIn(false);
    setCurrentUser(null);
    setActiveTab(AppTab.HOME);
  };

  if (!isLoggedIn || !currentUser) {
    return <Landing onAuth={handleAuth} />;
  }

  const isAdmin = currentUser.role === 'admin';

  const renderContent = () => {
    if (activeTab === AppTab.ADMIN && !isAdmin) {
      setActiveTab(AppTab.HOME);
      return <Home onAddNotification={addNotification} userName={currentUser.name} />;
    }

    switch (activeTab) {
      case AppTab.HOME:
        return <Home onAddNotification={addNotification} userName={currentUser.name} />;
      case AppTab.EXPERIENCES:
        return <Experiences experiences={experiences} onAddNotification={addNotification} />;
      case AppTab.COMMUNITY:
        return <Community 
          onAddNotification={addNotification} 
          blockedUsers={currentUser.blockedUsers}
          onBlockUser={handleBlockUser}
          onSubmitReport={handleSubmitReport}
          balance={balance}
          onUpdateBalance={handleUpdateBalance}
        />;
      case AppTab.PROFILE:
        return <Profile 
          onNavigateToExperiences={() => setActiveTab(AppTab.EXPERIENCES)} 
          onLogout={handleLogout}
          onAddNotification={addNotification}
          onUpdateBalance={handleUpdateBalance}
          isAdmin={isAdmin}
          onGoToAdmin={() => setActiveTab(AppTab.ADMIN)}
          currentUser={currentUser}
        />;
      case AppTab.WALLET:
        return <Wallet balance={balance} onUpdateBalance={handleUpdateBalance} onAddNotification={addNotification} />;
      case AppTab.ADMIN:
        const setMembs = (m: any) => { db.setMembers(typeof m === 'function' ? m(members) : m); setMembers(db.getMembers()); };
        const setExps = (e: any) => { db.setExperiences(typeof e === 'function' ? e(experiences) : e); setExperiences(db.getExperiences()); };
        const setReps = (r: any) => { db.setReports(typeof r === 'function' ? r(reports) : r); setReports(db.getReports()); };
        
        return <Admin 
          members={members} setMembers={setMembs as any}
          experiences={experiences} setExperiences={setExps as any}
          onAddNotification={addNotification}
          reports={reports} setReports={setReps as any}
        />;
      default:
        return <Home onAddNotification={addNotification} userName={currentUser.name} />;
    }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      notifications={notifications}
      onMarkRead={markAsRead}
      isAdmin={isAdmin}
      userName={currentUser.name}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
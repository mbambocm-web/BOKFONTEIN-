import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Send, Sparkles, MessageCircle, Users, UserPlus, CheckCheck, X, 
  Utensils, ShoppingBag, Flag, Info, MapPin, Zap, Flame, Beer, Music,
  Loader2, UserCheck, Clock, Navigation, Trophy, Quote, Heart, TrendingUp,
  PlusCircle, Activity, MoreVertical, ShieldAlert, UserX, AlertTriangle, 
  ShoppingBasket, ArrowRight, ShieldCheck, Star, Gift, Package, Award,
  RefreshCw
} from 'lucide-react';
import { gemini } from '../services/geminiService';
import { native } from '../services/nativeService';
import { db } from '../services/db';
import { Member, VibePost } from '../types';

type CommunityView = 'chat' | 'finder' | 'vibe' | 'store' | 'leaderboard';

interface Message {
  role: 'user' | 'bot';
  text: string;
  timestamp: string;
}

interface CommunityProps {
  onAddNotification?: (title: string, message: string, type: 'match' | 'system' | 'wallet') => void;
  blockedUsers: string[];
  onBlockUser: (id: string) => void;
  onSubmitReport: (postId: string, postContent: string, reportedUserId: string, reason: string) => void;
  balance: number;
  onUpdateBalance: (amount: number) => void;
}

const POSTS_PER_PAGE = 5;

const Community: React.FC<CommunityProps> = ({ onAddNotification, blockedUsers, onBlockUser, onSubmitReport, balance, onUpdateBalance }) => {
  const [view, setView] = useState<CommunityView>('vibe');
  const [vibeInput, setVibeInput] = useState('');
  const [vibePosts, setVibePosts] = useState<VibePost[]>(db.getVibePosts());
  const [allMembers, setAllMembers] = useState<Member[]>(db.getMembers());
  const currentUser = db.getCurrentUser();

  // Infinite Scroll State
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAllMembers(db.getMembers().sort((a, b) => b.geesXP - a.geesXP));
    setVibePosts(db.getVibePosts());
  }, [view]);

  const handlePostVibe = () => {
    if (!vibeInput.trim() || !currentUser) return;

    const newPost: VibePost = {
      id: `post-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      content: vibeInput.trim(),
      timestamp: 'Just now',
      likes: []
    };

    db.addVibePost(newPost);
    db.processActivity(currentUser.id, 'post');
    native.hapticImpact();
    
    onAddNotification?.("XP Earned!", "Lekker! +50 Gees Points for sharing the vibe.", "system");
    setVibeInput('');
    setVibePosts(db.getVibePosts());
  };

  const handleLike = (postId: string) => {
    if (!currentUser) return;
    db.toggleLikePost(postId, currentUser.id);
    setVibePosts(db.getVibePosts());
    native.hapticImpact();
  };

  const handleReport = (post: VibePost) => {
    const reason = window.prompt("Why are you reporting this post? (e.g., Harassment, Obscene, etc.)");
    if (reason && reason.trim()) {
      onSubmitReport(post.id, post.content, post.userId, reason);
      native.hapticImpact();
    }
  };

  const filteredPosts = vibePosts.filter(p => !blockedUsers.includes(p.userId));
  const pagedPosts = filteredPosts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPosts.length;

  const loadMorePosts = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    // Simulate network delay for that "lekker" feel
    setTimeout(() => {
      setVisibleCount(prev => prev + POSTS_PER_PAGE);
      setIsLoadingMore(false);
      native.hapticImpact();
    }, 800);
  }, [isLoadingMore, hasMore]);

  // Intersection Observer for Infinite Scroll
  useEffect(() => {
    if (view !== 'vibe') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMorePosts();
        }
      },
      { threshold: 1.0 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [view, hasMore, isLoadingMore, loadMorePosts]);

  return (
    <div className="flex flex-col h-full animate-fadeIn overflow-hidden">
      <div className="px-6 mb-4 mt-2 shrink-0">
        <div className="flex items-center bg-white border border-slate-100 p-1.5 rounded-[24px] shadow-sm overflow-x-auto no-scrollbar">
          <button onClick={() => setView('vibe')} className={`flex-1 min-w-[70px] py-3 rounded-[20px] text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-1 ${view === 'vibe' ? 'bg-[#004d3d] text-white shadow-lg' : 'text-slate-400'}`}>
            <TrendingUp size={12} /> <span>Vibe</span>
          </button>
          <button onClick={() => setView('leaderboard')} className={`flex-1 min-w-[70px] py-3 rounded-[20px] text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-1 ${view === 'leaderboard' ? 'bg-[#004d3d] text-white shadow-lg' : 'text-slate-400'}`}>
            <Trophy size={12} /> <span>Ranks</span>
          </button>
          <button onClick={() => setView('store')} className={`flex-1 min-w-[70px] py-3 rounded-[20px] text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-1 ${view === 'store' ? 'bg-[#004d3d] text-white shadow-lg' : 'text-slate-400'}`}>
            <ShoppingBasket size={12} /> <span>Store</span>
          </button>
        </div>
      </div>

      {view === 'vibe' && (
        <div className="flex-1 overflow-y-auto px-6 space-y-6 pb-24 no-scrollbar">
          {/* Create Post Card */}
          <div className="bg-white rounded-[32px] p-5 border border-slate-100 shadow-sm animate-scaleIn">
             <div className="flex items-center space-x-3">
               <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-50 shrink-0">
                  <img src={currentUser?.avatar} className="w-full h-full object-cover" alt="" />
               </div>
               <input 
                  type="text" 
                  placeholder="What's the vibe, boet?" 
                  className="flex-1 bg-slate-50 border-none rounded-2xl px-4 py-2.5 text-sm outline-none font-medium text-slate-700" 
                  value={vibeInput} 
                  onChange={e => setVibeInput(e.target.value)} 
                  onKeyPress={e => e.key === 'Enter' && handlePostVibe()} 
                />
               <button 
                  onClick={handlePostVibe} 
                  disabled={!vibeInput.trim()}
                  className={`p-2.5 rounded-xl transition-all ${vibeInput.trim() ? 'bg-[#fdb913] text-[#004d3d] shadow-md active:scale-90' : 'bg-slate-100 text-slate-300'}`}
                >
                  <Send size={18} />
                </button>
             </div>
          </div>

          {/* Vibe Feed */}
          <div className="space-y-4">
            {filteredPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                  <Activity size={32} />
                </div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Neighborhood is quiet... start the vibe!</p>
              </div>
            ) : (
              <>
                {pagedPosts.map(post => (
                  <div key={post.id} className="bg-white rounded-[32px] p-5 border border-slate-100 shadow-soft animate-scaleIn">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#fdb913]/20">
                          <img src={post.userAvatar} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-[#004d3d] leading-none mb-1">{post.userName}</h4>
                          <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{post.timestamp}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleReport(post)}
                        className="p-2 text-slate-200 hover:text-red-400 transition-colors"
                      >
                        <Flag size={14} />
                      </button>
                    </div>

                    <p className="text-sm text-slate-600 font-medium leading-relaxed px-1">
                      {post.content}
                    </p>

                    <div className="flex items-center space-x-4 mt-5 pt-4 border-t border-slate-50">
                      <button 
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl transition-all ${currentUser && post.likes.includes(currentUser.id) ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-400'}`}
                      >
                        <Heart size={14} fill={currentUser && post.likes.includes(currentUser.id) ? 'currentColor' : 'none'} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{post.likes.length}</span>
                      </button>
                      
                      <button className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-50 text-slate-400 active:scale-95">
                        <MessageCircle size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Chat</span>
                      </button>
                    </div>
                  </div>
                ))}
                
                {/* Scroll Sentinel / Loader */}
                <div ref={loaderRef} className="py-10 flex justify-center items-center">
                  {isLoadingMore ? (
                    <div className="flex flex-col items-center space-y-2">
                      <RefreshCw className="animate-spin text-[#004d3d]" size={24} />
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-300">Loading more Gees...</span>
                    </div>
                  ) : hasMore ? (
                    <div className="h-4" />
                  ) : (
                    <div className="flex flex-col items-center space-y-2 opacity-30">
                      <CheckCheck size={20} className="text-[#004d3d]" />
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">You've reached the start of the vibe</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {view === 'leaderboard' && (
        <div className="flex-1 overflow-y-auto px-6 space-y-6 pb-24 no-scrollbar">
          <div className="bg-[#004d3d] rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl">
             <div className="absolute top-0 right-0 w-32 h-32 bg-[#fdb913]/10 rounded-full blur-2xl"></div>
             <h3 className="text-xl font-black font-heading mb-1">Gees Ranks</h3>
             <p className="text-white/60 text-[10px] uppercase tracking-widest font-black">Brisbane Fan Hub Leaderboard</p>
          </div>
          <div className="space-y-4">
            {allMembers.map((member, idx) => (
              <div key={member.id} className="bg-white p-5 rounded-[32px] border border-slate-100 flex items-center justify-between shadow-soft animate-scaleIn">
                 <div className="flex items-center space-x-4">
                    <span className={`text-sm font-black ${idx < 3 ? 'text-[#fdb913]' : 'text-slate-300'}`}>#{idx + 1}</span>
                    <img src={member.avatar} className="w-10 h-10 rounded-full border-2 border-slate-50" alt="" />
                    <div>
                      <h4 className="text-sm font-black text-[#004d3d]">{member.name}</h4>
                      <p className="text-[8px] font-black uppercase tracking-widest text-[#fdb913]">{member.rankTier}</p>
                    </div>
                 </div>
                 <div className="text-right">
                    <p className="text-sm font-black text-[#004d3d]">{member.geesXP.toLocaleString()} XP</p>
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Lv. {member.geesLevel}</p>
                 </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'store' && (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-300 space-y-4">
           <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
             <ShoppingBasket size={32} />
           </div>
           <p className="text-[10px] font-black uppercase tracking-widest">Store catalog loading from BokBase...</p>
        </div>
      )}
    </div>
  );
};

export default Community;
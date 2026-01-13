import React, { useState, useRef, useMemo } from 'react';
import { 
  Settings, Shield, Award, HelpCircle, LogOut, ChevronRight, Share2, 
  Bell, Camera, Edit3, Check, X, AlertCircle, Compass, Ticket, 
  User, Mail, Phone, Globe, CreditCard, ChevronLeft, Heart, CheckCircle2, ArrowRight, ShieldCheck,
  MapPin, LifeBuoy, MessageSquare, Headphones, FileText, Info, ShieldAlert,
  Flame, Trophy, Zap, TrendingUp, Clock, ShoppingBag, Plus, Minus, BellRing, Languages, Coins, Fingerprint, Star, Gift, ExternalLink
} from 'lucide-react';
import { Member, Experience, Reward } from '../types';
import { native } from '../services/nativeService';

interface ExperienceItem {
  id: string;
  title: string;
  location: string;
  status: 'Purchased' | 'Wishlisted';
  type: string;
  pricePPS: number;
  priceSingle: number;
  image: string;
  date: string;
}

interface ProfileProps {
  onNavigateToExperiences?: () => void;
  onLogout?: () => void;
  onAddNotification?: (title: string, message: string, type: 'match' | 'system' | 'wallet') => void;
  onUpdateBalance?: (amount: number) => void;
  isAdmin?: boolean;
  onGoToAdmin?: () => void;
  currentUser: Member;
}

const REWARDS: Reward[] = [
  { id: 'r1', title: 'Braai Yard Feast', cost: 1500, description: 'VIP Platter at the Hub.', icon: 'Flame', category: 'Braai' },
  { id: 'r2', title: 'Official Bok Jersey', cost: 12000, description: '2025 Match Jersey.', icon: 'ShoppingBag', category: 'Merch' },
  { id: 'r3', title: 'Legends Meet & Greet', cost: 5000, description: 'Private photo & chat.', icon: 'Trophy', category: 'Experience' },
];

const Profile: React.FC<ProfileProps> = ({ 
  onNavigateToExperiences, 
  onLogout, 
  onAddNotification, 
  onUpdateBalance,
  isAdmin, 
  onGoToAdmin, 
  currentUser
}) => {
  const [coverPhoto, setCoverPhoto] = useState("https://images.unsplash.com/photo-1541252260730-0412e8e2108e?q=80&w=800&auto=format&fit=crop");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    name: currentUser.name,
    email: currentUser.email,
    phone: currentUser.phone,
    bio: "Die-hard Springbok fan since '95. Braai master. Brisbane bound! 🏉🇿🇦"
  });

  // Redemption State
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);

  // Safety State
  const [showSafetyModal, setShowSafetyModal] = useState(false);

  // Preferences State
  const [prefs, setPrefs] = useState({
    matchAlerts: true,
    communityPing: false,
    language: 'English',
    currency: 'ZAR'
  });

  const [myExperiences, setMyExperiences] = useState<ExperienceItem[]>([
    {
      id: 'e1',
      title: 'Finals Weekend Experience',
      location: 'Suncorp Stadium, Brisbane',
      status: 'Purchased',
      type: 'Two Match',
      pricePPS: 4999,
      priceSingle: 6500,
      image: 'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?q=80&w=200&auto=format&fit=crop',
      date: 'Oct 2027'
    },
    {
      id: 'e2',
      title: 'Cape Town Sevens Gold Pass',
      location: 'DHL Stadium, Cape Town',
      status: 'Wishlisted',
      type: 'Two Match',
      pricePPS: 3250,
      priceSingle: 4800,
      image: 'https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?q=80&w=200&auto=format&fit=crop',
      date: 'Dec 2026'
    }
  ]);

  const [selectedForPurchase, setSelectedForPurchase] = useState<ExperienceItem | null>(null);
  const [bookingType, setBookingType] = useState<'pps' | 'single'>('pps');
  const [quantity, setQuantity] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);

  const currentMultiplier = useMemo(() => {
    if (currentUser.geesLevel > 15) return 3.0;
    if (currentUser.geesLevel > 10) return 2.0;
    if (currentUser.geesLevel > 5) return 1.5;
    return 1.0;
  }, [currentUser.geesLevel]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPhoto(reader.result as string);
        native.hapticImpact();
        if (onAddNotification) {
          onAddNotification("Profile Updated", "Lekker! Your new cover photo is set.", "system");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRedeem = (reward: Reward) => {
    if (currentUser.balance < reward.cost) {
      onAddNotification?.("Not Enough BokBucks", "Eish! Keep engaging to earn more gees.", "system");
      return;
    }

    setIsRedeeming(true);
    setTimeout(() => {
      onUpdateBalance?.(-reward.cost);
      setIsRedeeming(false);
      setShowRewardsModal(false);
      onAddNotification?.("Reward Claimed!", `Check your wallet for your ${reward.title} voucher.`, "wallet");
      native.hapticSuccess();
    }, 1500);
  };

  const totalCost = useMemo(() => {
    if (!selectedForPurchase) return 0;
    const base = bookingType === 'pps' ? selectedForPurchase.pricePPS : selectedForPurchase.priceSingle;
    return base * quantity;
  }, [selectedForPurchase, bookingType, quantity]);

  const handleConfirmPurchase = () => {
    if (!selectedForPurchase || !onUpdateBalance) return;
    
    if (currentUser.balance < totalCost) {
      onAddNotification?.("Insufficient Funds", "Eish! Please top up your wallet to complete this purchase.", "wallet");
      return;
    }

    onUpdateBalance(-totalCost);
    setMyExperiences(prev => prev.map(exp => 
      exp.id === selectedForPurchase.id ? { ...exp, status: 'Purchased' } : exp
    ));
    
    setIsSuccess(true);
    onAddNotification?.("Booking Confirmed", `Lekker! ${quantity}x ${selectedForPurchase.title} is now in your active tours.`, "wallet");
    native.hapticSuccess();
    
    setTimeout(() => {
      setSelectedForPurchase(null);
      setIsSuccess(false);
      setQuantity(1);
    }, 2000);
  };

  return (
    <div className="p-4 space-y-6 animate-fadeIn pb-32 relative h-full overflow-y-auto no-scrollbar">
      {/* Profile Header Card */}
      <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-100 relative">
        <div className="h-32 w-full relative">
          <img src={coverPhoto} alt="Cover" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/20"></div>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          <button onClick={() => { fileInputRef.current?.click(); native.hapticImpact(); }} className="absolute top-3 right-3 p-2.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30 text-white active-scale transition-all">
            <Camera size={16} />
          </button>
        </div>
        <div className="px-6 pb-6 text-center -mt-12 relative z-10">
          <div className="w-24 h-24 rounded-full border-4 border-white bg-white p-1 mx-auto shadow-md">
            <img src={currentUser.avatar} alt="User" className="w-full h-full rounded-full object-cover" />
          </div>
          <div className="mt-3 flex items-center justify-center space-x-2">
            <h2 className="text-xl font-bold font-heading">{profileData.name}</h2>
            <button onClick={() => { setIsEditModalOpen(true); native.hapticImpact(); }} className="p-1.5 bg-slate-50 text-slate-400 rounded-lg">
              <Edit3 size={14} />
            </button>
          </div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mt-1">{isAdmin ? "BOKFONTEIN ADMIN" : "Springbok Fan"}</p>
          <p className="mt-3 text-xs text-slate-500 font-medium italic max-w-[200px] mx-auto">{profileData.bio}</p>
        </div>
      </div>

      {/* Fan Stats Section */}
      <div className="grid grid-cols-3 gap-3 px-1">
        <div className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-soft flex flex-col items-center justify-between text-center min-h-[110px] relative overflow-hidden">
          <div className="absolute top-0 left-0 h-1 bg-orange-100 w-full">
            <div className="h-full bg-orange-400" style={{ width: `${(currentUser.geesXP % 500) / 5}%` }}></div>
          </div>
          <div className="p-2 bg-orange-50 text-orange-500 rounded-xl mb-1 relative">
            <Flame size={18} fill="currentColor" />
            {currentMultiplier > 1 && (
              <span className="absolute -top-1 -right-4 bg-orange-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full animate-pulse whitespace-nowrap">
                {currentMultiplier}x BOOST
              </span>
            )}
          </div>
          <div className="space-y-0.5">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Gees</p>
            <p className="text-sm font-black text-[#004d3d]">LV. {currentUser.geesLevel}</p>
          </div>
        </div>
        <div className="bg-[#fdb913] p-4 rounded-[24px] shadow-lg flex flex-col items-center justify-between text-center min-h-[110px] text-[#004d3d]">
          <div className="p-2 bg-white/20 rounded-xl mb-1">
            <Zap size={18} fill="currentColor" />
          </div>
          <div className="space-y-0.5">
            <p className="text-[8px] font-black uppercase tracking-widest opacity-60">BokBucks</p>
            <p className="text-sm font-black">{currentUser.balance.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-soft flex flex-col items-center justify-between text-center min-h-[110px]">
          <div className="p-2 bg-blue-50 text-blue-500 rounded-xl mb-1">
            <Award size={18} />
          </div>
          <div className="space-y-0.5">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{currentUser.rankTier}</p>
            <p className="text-sm font-black text-[#004d3d]">#{currentUser.rank}</p>
          </div>
        </div>
      </div>

      {/* Redemption Quick Access */}
      <button 
        onClick={() => { setShowRewardsModal(true); native.hapticImpact(); }}
        className="w-full bg-[#004d3d] rounded-[32px] p-6 text-white flex items-center justify-between shadow-xl relative overflow-hidden group active:scale-98 transition-all"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
        <div className="flex items-center space-x-4 relative z-10">
           <div className="w-12 h-12 bg-[#fdb913] rounded-2xl flex items-center justify-center text-[#004d3d] group-hover:rotate-12 transition-transform">
              <Gift size={24} />
           </div>
           <div className="text-left">
              <h4 className="font-black text-sm uppercase tracking-widest">Redeem Perks</h4>
              <p className="text-[10px] text-white/60 font-medium">Use your {currentMultiplier > 1 ? `boosted ` : ''}BokBucks</p>
           </div>
        </div>
        <ChevronRight size={20} className="text-[#fdb913] relative z-10" />
      </button>

      {/* Fan Preferences Section */}
      <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 space-y-6">
        <h3 className="font-black text-lg font-heading text-[#004d3d]">Fan Preferences</h3>
        <div className="space-y-4">
          <PreferenceItem 
            icon={<BellRing size={18} className="text-[#fdb913]" />}
            label="Match Alerts"
            desc="Score & try updates"
            action={<Toggle checked={prefs.matchAlerts} onChange={() => { setPrefs({...prefs, matchAlerts: !prefs.matchAlerts}); native.hapticImpact(); }} />}
          />
          <PreferenceItem 
            icon={<ShieldAlert size={18} className="text-red-500" />}
            label="Safety & Compliance"
            desc="UGC Guidelines & Reports"
            action={<button onClick={() => { setShowSafetyModal(true); native.hapticImpact(); }} className="p-2 bg-red-50 text-red-500 rounded-xl active:scale-90 transition-all"><Info size={16} /></button>}
          />
        </div>
      </div>

      {/* Experiences Section */}
      <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 space-y-6">
        <h3 className="font-black text-lg font-heading text-[#004d3d]">My Experiences</h3>
        <div className="space-y-4">
          {myExperiences.map((exp) => (
            <div key={exp.id} className="flex items-center p-3 rounded-[28px] bg-white border border-slate-100">
              <img src={exp.image} className="w-16 h-16 rounded-2xl object-cover shrink-0 shadow-sm" alt="" />
              <div className="ml-4 flex-1">
                <span className={`text-[8px] font-black uppercase tracking-widest ${exp.status === 'Purchased' ? 'text-green-600' : 'text-amber-500'}`}>{exp.status}</span>
                <p className="text-sm font-bold text-[#004d3d] leading-tight">{exp.title}</p>
                {exp.status === 'Wishlisted' && (
                  <button onClick={() => { setSelectedForPurchase(exp); native.hapticImpact(); }} className="mt-1 flex items-center space-x-1 bg-[#004d3d] text-white px-3 py-1 rounded-full text-[9px] font-black uppercase shadow-md active:scale-95 transition-all">
                    <ShoppingBag size={10} /> <span>Buy Now</span>
                  </button>
                )}
              </div>
              {exp.status === 'Purchased' && <CheckCircle2 size={20} className="text-green-500 p-2" />}
            </div>
          ))}
        </div>
      </div>

      {/* Legal & Compliance Section */}
      <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 space-y-6">
        <h3 className="font-black text-lg font-heading text-[#004d3d]">Legal & Compliance</h3>
        <div className="space-y-4">
          <a href="/privacy" className="flex items-center justify-between group py-1">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 text-slate-400 group-hover:text-[#004d3d] transition-colors"><FileText size={18} /></div>
              <div>
                <p className="text-sm font-black text-[#004d3d] leading-none mb-1">Privacy Policy</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">How we handle your data</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
          </a>
          <a href="/terms" className="flex items-center justify-between group py-1">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 text-slate-400 group-hover:text-[#004d3d] transition-colors"><Shield size={18} /></div>
              <div>
                <p className="text-sm font-black text-[#004d3d] leading-none mb-1">Terms of Service</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Rules of the neighborhood</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>

      <button onClick={() => { onLogout?.(); native.hapticImpact(); }} className="w-full px-6 py-4 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center space-x-3 active:scale-95 transition-all border border-red-100">
        <LogOut size={20} /> <span className="font-black text-xs uppercase tracking-[0.2em]">Sign Out</span>
      </button>

      {/* Safety Modal */}
      {showSafetyModal && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-[40px] p-8 animate-scaleIn relative shadow-luxury overflow-y-auto max-h-[85vh]">
            <button onClick={() => { setShowSafetyModal(false); native.hapticImpact(); }} className="absolute top-6 right-6 text-slate-300 p-2"><X size={24} /></button>
            <div className="flex items-center space-x-3 mb-6">
               <ShieldCheck size={24} className="text-[#004d3d]" />
               <h3 className="text-2xl font-black font-heading text-[#004d3d]">UGC Compliance</h3>
            </div>
            <div className="space-y-6 text-sm text-slate-600 font-medium">
               <p>BOKFONTEIN maintains a zero-tolerance policy for objectionable content or abusive behavior.</p>
               <section className="space-y-2">
                 <h4 className="text-[10px] font-black uppercase text-[#004d3d] tracking-widest">1. Community Guidelines</h4>
                 <p className="text-xs">Fans must respect one another. Hate speech, harassment, nudity, and illegal content are strictly prohibited and will result in an immediate permanent ban.</p>
               </section>
               <section className="space-y-2">
                 <h4 className="text-[10px] font-black uppercase text-[#004d3d] tracking-widest">2. Reporting Content</h4>
                 <p className="text-xs">Use the "Report" feature on any post to flag content for admin review. Our team reviews all reports within 24 hours.</p>
               </section>
               <section className="space-y-2">
                 <h4 className="text-[10px] font-black uppercase text-[#004d3d] tracking-widest">3. Blocking Users</h4>
                 <p className="text-xs">If you encounter a user you wish to avoid, use the "Block" feature. You will no longer see their content, and they will not see yours.</p>
               </section>
               <button 
                onClick={() => { setShowSafetyModal(false); native.hapticImpact(); }}
                className="w-full py-4 bg-[#004d3d] text-[#fdb913] rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg mb-8"
               >
                 I Understand
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Rewards Modal */}
      {showRewardsModal && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
           <div className="bg-white w-full max-w-sm rounded-[40px] p-8 animate-scaleIn relative shadow-luxury overflow-y-auto max-h-[85vh]">
              <button onClick={() => { setShowRewardsModal(false); native.hapticImpact(); }} className="absolute top-6 right-6 text-slate-300 p-2"><X size={24} /></button>
              <h3 className="text-2xl font-black font-heading text-[#004d3d] mb-2">Rewards Store</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center">
                 <Zap size={10} className="mr-1 text-[#fdb913]" /> Your Balance: {currentUser.balance.toLocaleString()} BokBucks
              </p>
              <div className="space-y-4 pb-12">
                 {REWARDS.map(reward => (
                   <div key={reward.id} className="p-5 border border-slate-100 rounded-[32px] bg-slate-50 space-y-4">
                      <div className="flex items-center space-x-4">
                         <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#004d3d] shadow-sm border border-slate-100">
                            {reward.icon === 'Flame' && <Flame size={24} />}
                            {reward.icon === 'ShoppingBag' && <ShoppingBag size={24} />}
                            {reward.icon === 'Trophy' && <Trophy size={24} />}
                         </div>
                         <div className="flex-1">
                            <h4 className="text-sm font-black text-[#004d3d] uppercase tracking-tight">{reward.title}</h4>
                            <p className="text-[10px] text-slate-500 font-medium">{reward.description}</p>
                         </div>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                         <div className="flex items-center space-x-1 text-[#fdb913]">
                            <Zap size={14} fill="currentColor" />
                            <span className="text-sm font-black">{reward.cost.toLocaleString()}</span>
                         </div>
                         <button 
                            onClick={() => handleRedeem(reward)}
                            disabled={currentUser.balance < reward.cost || isRedeeming}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md transition-all ${currentUser.balance >= reward.cost ? 'bg-[#004d3d] text-[#fdb913] active:scale-95' : 'bg-slate-200 text-slate-400 opacity-50 cursor-not-allowed'}`}
                         >
                            {isRedeeming ? 'Claiming...' : 'Redeem'}
                         </button>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-[40px] p-8 animate-scaleIn relative shadow-luxury">
            <button onClick={() => { setIsEditModalOpen(false); native.hapticImpact(); }} className="absolute top-6 right-6 text-slate-300 p-2"><X size={24} /></button>
            <h3 className="text-2xl font-black font-heading text-[#004d3d] mb-6">Edit Profile</h3>
            <form onSubmit={e => { e.preventDefault(); setIsEditModalOpen(false); native.hapticImpact(); }} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Name</label>
                <input type="text" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-semibold outline-none focus:ring-2 focus:ring-[#004d3d]/5" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fan Bio</label>
                <textarea value={profileData.bio} onChange={e => setProfileData({...profileData, bio: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-semibold min-h-[100px] resize-none outline-none" />
              </div>
              <button type="submit" className="w-full bg-[#004d3d] text-[#fdb913] py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg mb-8">
                <ShieldCheck size={18} /> <span>Save Changes</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Booking Confirmations - Redesigned for obstruction-free checkout */}
      {selectedForPurchase && (
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-[48px] shadow-luxury animate-scaleIn relative overflow-hidden flex flex-col max-h-[85vh]">
            
            <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-black font-heading text-[#004d3d]">Checkout</h3>
                 <button onClick={() => { setSelectedForPurchase(null); native.hapticImpact(); }} className="text-slate-300 p-2"><X size={24} /></button>
              </div>

              <div className="flex items-center space-x-4 mb-8 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                <img src={selectedForPurchase.image} className="w-14 h-14 rounded-2xl object-cover" alt="" />
                <div>
                    <h3 className="text-sm font-black text-[#004d3d] leading-tight mb-1">{selectedForPurchase.title}</h3>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{selectedForPurchase.date}</p>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                <button onClick={() => { setBookingType('pps'); native.hapticImpact(); }} className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${bookingType === 'pps' ? 'border-[#004d3d] bg-[#004d3d]/5' : 'border-slate-100 bg-white opacity-60'}`}>
                  <span className="text-xs font-black uppercase tracking-widest">Sharing</span>
                  <span className="text-sm font-black text-[#004d3d]">R {selectedForPurchase.pricePPS.toLocaleString()}</span>
                </button>
                <button onClick={() => { setBookingType('single'); native.hapticImpact(); }} className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${bookingType === 'single' ? 'border-[#004d3d] bg-[#004d3d]/5' : 'border-slate-100 bg-white opacity-60'}`}>
                  <span className="text-xs font-black uppercase tracking-widest">Single</span>
                  <span className="text-sm font-black text-[#004d3d]">R {selectedForPurchase.priceSingle.toLocaleString()}</span>
                </button>
              </div>

              <div className="p-6 bg-slate-50 rounded-3xl mb-4 border border-slate-100 flex justify-between items-center">
                 <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Amount</span>
                 <span className="text-xl font-black text-[#004d3d]">R {totalCost.toLocaleString()}</span>
              </div>
            </div>

            {/* Action Area with safe-zone padding */}
            <div className="p-8 pt-2 pb-14 bg-white border-t border-slate-100">
              <button 
                onClick={handleConfirmPurchase} 
                className="w-full bg-[#004d3d] text-[#fdb913] py-5 rounded-3xl font-black uppercase text-xs tracking-[0.1em] shadow-luxury flex items-center justify-center space-x-3 active:scale-95 transition-all"
              >
                <ShieldCheck size={20} /> <span>Pay & Confirm</span>
              </button>
            </div>
          </div>

          {isSuccess && (
            <div className="absolute inset-0 z-[10001] bg-white/95 flex flex-col items-center justify-center space-y-4 animate-fadeIn rounded-[40px]">
               <ShieldCheck size={56} className="text-green-500 animate-scaleIn" strokeWidth={3} />
               <p className="text-xl font-black text-[#004d3d] uppercase tracking-tight">Booking Secured!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const PreferenceItem: React.FC<{ icon: React.ReactNode, label: string, desc: string, action: React.ReactNode }> = ({ icon, label, desc, action }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center space-x-4">
      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">{icon}</div>
      <div>
        <p className="text-sm font-black text-[#004d3d] leading-none mb-1">{label}</p>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{desc}</p>
      </div>
    </div>
    {action}
  </div>
);

const Toggle: React.FC<{ checked: boolean, onChange: () => void }> = ({ checked, onChange }) => (
  <button onClick={onChange} className={`w-11 h-6 rounded-full relative transition-all duration-300 ${checked ? 'bg-[#004d3d]' : 'bg-slate-200'}`}>
    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${checked ? 'left-6 shadow-sm' : 'left-1'}`} />
  </button>
);

export default Profile;

import React, { useState, useMemo } from 'react';
import { 
  Search, MapPin, CheckCircle2, ArrowRight, X, ShieldCheck, 
  Ticket, Bed, Bus, Flame, Award, SlidersHorizontal,
  Users as UsersIcon, Star, CalendarDays, Clock, Shield, Plus, Minus,
  Copy, Share, FileText, Calendar, QrCode, Download, Share2, Heart,
  Settings, Edit3, Compass
} from 'lucide-react';
import { Experience, AppTab, Booking } from '../types';
import { native } from '../services/nativeService';
import { db } from '../services/db';

interface ExperiencesProps {
  experiences: Experience[];
  onAddNotification?: (title: string, message: string, type: 'match' | 'system' | 'wallet') => void;
  onNavigateToTab?: (tab: any) => void;
}

const Experiences: React.FC<ExperiencesProps> = ({ experiences, onAddNotification, onNavigateToTab }) => {
  const [search, setSearch] = useState('');
  const [selectedTier, setSelectedTier] = useState<Experience | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [bookingType, setBookingType] = useState<'pps' | 'single'>('pps');
  const [quantity, setQuantity] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingRef, setBookingRef] = useState('');
  const [wishlist, setWishlist] = useState<string[]>([]);
  
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<number>(150000);

  const currentUser = db.getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  const toggleWishlist = (id: string) => {
    native.hapticImpact();
    setWishlist(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const getFeatureIcon = (feature: string) => {
    const f = feature.toLowerCase();
    if (f.includes('accommodation') || f.includes('hotel') || f.includes('suite') || f.includes('villa') || f.includes('tent')) return <Bed size={12} />;
    if (f.includes('transport') || f.includes('shuttle') || f.includes('transfer') || f.includes('airport')) return <Bus size={12} />;
    if (f.includes('braai') || f.includes('gala') || f.includes('event') || f.includes('brunch') || f.includes('feast')) return <Flame size={12} />;
    if (f.includes('ticket') || f.includes('entry') || f.includes('pass')) return <Ticket size={12} />;
    if (f.includes('access') || f.includes('vip') || f.includes('gold') || f.includes('deck')) return <Award size={12} />;
    if (f.includes('safari') || f.includes('tour')) return <MapPin size={12} />;
    if (f.includes('meet') || f.includes('legends')) return <UsersIcon size={12} />;
    return <CheckCircle2 size={12} />;
  };

  const parseDate = (dateStr: string) => {
    const parts = dateStr.split(' ');
    if (parts.length < 2) return { day: dateStr, month: 'BOK' };
    return { day: parts[0], month: parts[1].toUpperCase() };
  };

  const filteredTiers = useMemo(() => {
    return experiences.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || 
                            t.location.toLowerCase().includes(search.toLowerCase());
      const matchesPrice = t.pricePPS <= priceRange;
      return matchesSearch && matchesPrice;
    });
  }, [experiences, search, priceRange]);

  const totalPrice = useMemo(() => {
    if (!selectedTier) return 0;
    const basePrice = bookingType === 'pps' ? selectedTier.pricePPS : selectedTier.priceSingle;
    return basePrice * quantity;
  }, [selectedTier, bookingType, quantity]);

  const handleConfirmPurchase = async () => {
    const ref = `BOK-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    setBookingRef(ref);
    
    if (currentUser && selectedTier) {
      const newBooking: Booking = {
        id: `book-${Date.now()}`,
        userId: currentUser.id,
        experienceId: selectedTier.id,
        experienceTitle: selectedTier.title,
        experienceImage: selectedTier.image,
        location: selectedTier.location,
        date: selectedTier.startDate,
        bookingRef: ref,
        status: 'Purchased',
        amount: totalPrice
      };
      await db.addBooking(newBooking);
      db.processActivity(currentUser.id, 'purchase');
    }

    setIsSuccess(true);
    native.hapticSuccess();
    if (onAddNotification) {
      onAddNotification("Booking Confirmed", `Lekker! Tour ${ref} is now active in your profile.`, "wallet");
    }
  };

  const resetModals = () => {
    setIsConfirming(false);
    setIsSuccess(false);
    setSelectedTier(null);
    setBookingRef('');
    setQuantity(1);
  };

  return (
    <div className="px-6 space-y-6 animate-fadeIn pt-4 pb-24">
      <div className="flex items-center space-x-3">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#004d3d] transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search tours or cities..."
            className="w-full bg-white border border-slate-100 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-medium focus:ring-4 focus:ring-[#004d3d]/5 focus:border-[#004d3d]/20 shadow-sm transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setIsFilterDrawerOpen(true)}
          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-slate-100 text-[#004d3d] shadow-sm active:scale-95 transition-all"
        >
          <SlidersHorizontal size={20} />
        </button>
      </div>

      <div className="flex items-center justify-between px-1">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{filteredTiers.length} Experiences Found</p>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => { native.hapticImpact(); onNavigateToTab?.(AppTab.PROFILE); }}
            className="text-[9px] font-black text-[#004d3d] bg-[#fdb913] px-3 py-1 rounded-full uppercase tracking-widest flex items-center space-x-1.5 shadow-sm active:scale-95 transition-all"
          >
            <Compass size={11} /> <span>My Bookings</span>
          </button>
          {isAdmin && (
            <button 
              onClick={() => onNavigateToTab?.(AppTab.ADMIN)}
              className="text-[9px] font-black text-[#fdb913] bg-[#004d3d] px-3 py-1 rounded-full uppercase tracking-widest flex items-center space-x-1.5 shadow-sm active:scale-95 transition-all"
            >
              <Settings size={11} /> <span>Manage All</span>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {filteredTiers.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center opacity-40">
            <MapPin size={48} className="mb-4 text-slate-300" />
            <p className="text-xs font-black uppercase tracking-widest">No matching tours, bru.</p>
          </div>
        ) : (
          filteredTiers.map((tier) => {
            const dateInfo = parseDate(tier.startDate);
            const isWishlisted = wishlist.includes(tier.id);
            return (
              <div key={tier.id} className="bg-white rounded-[40px] overflow-hidden shadow-soft border border-slate-100 flex flex-col animate-scaleIn relative group">
                
                {isAdmin && (
                  <button 
                    onClick={() => { native.hapticImpact(); onNavigateToTab?.(AppTab.ADMIN); }}
                    className="absolute top-4 right-16 w-10 h-10 rounded-full backdrop-blur-md bg-[#fdb913] text-[#004d3d] flex items-center justify-center transition-all z-20 shadow-lg"
                  >
                    <Edit3 size={18} />
                  </button>
                )}

                <div className="h-60 relative bg-slate-200">
                  <img src={tier.image} alt={tier.title} className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"></div>
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md rounded-2xl px-3 py-2 flex flex-col items-center shadow-lg min-w-[50px]">
                    <p className="text-[8px] font-black text-[#004d3d] uppercase tracking-widest">{dateInfo.month}</p>
                    <p className="text-lg font-black text-[#004d3d] leading-none">{dateInfo.day}</p>
                  </div>
                  <button 
                    onClick={() => toggleWishlist(tier.id)}
                    className={`absolute top-4 right-4 w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all z-10 ${isWishlisted ? 'bg-red-500 text-white' : 'bg-black/20 text-white'}`}
                  >
                    <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
                  </button>
                  <div className="absolute bottom-4 left-5 flex items-center space-x-2">
                    <div className="bg-[#fdb913] text-[#004d3d] px-2.5 py-1 rounded-lg shadow-md">
                      <span className="text-[9px] font-black uppercase tracking-wider">{tier.type}</span>
                    </div>
                    <div className="bg-white/20 backdrop-blur-md border border-white/30 px-3 py-1 rounded-lg">
                      <span className="text-[9px] font-black text-white uppercase tracking-wider">{tier.location}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="font-black text-xl font-heading text-[#004d3d] leading-tight tracking-tight mb-1 line-clamp-2 min-h-[2.4rem]">{tier.title}</h3>
                    <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <CalendarDays size={12} className="mr-1.5 text-[#fdb913]" />
                      {tier.startDate} — {tier.endDate}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tier.features.slice(0, 4).map((feature, idx) => (
                      <div key={idx} className="flex items-center space-x-1.5 bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl">
                        <div className="text-[#fdb913]">{getFeatureIcon(feature)}</div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight whitespace-nowrap">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Package Starts</p>
                      <div className="flex items-baseline space-x-1">
                        <span className="text-lg font-black text-[#004d3d]">R {tier.pricePPS.toLocaleString()}</span>
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">PPS</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => { setSelectedTier(tier); setBookingType('pps'); setQuantity(1); setIsConfirming(true); native.hapticImpact(); }}
                      className="h-14 px-6 bg-[#004d3d] text-[#fdb913] rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg flex items-center justify-center space-x-3 active:scale-95 transition-all"
                    >
                      <span>Explore</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {isConfirming && selectedTier && (
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#f8fafc] w-full max-w-sm rounded-[48px] shadow-luxury animate-scaleIn relative overflow-hidden flex flex-col h-[85vh] border border-white/50">
            <div className="flex-1 overflow-y-auto no-scrollbar">
              {!isSuccess ? (
                <div className="p-8">
                  <div className="flex justify-between items-center mb-8">
                     <h3 className="text-2xl font-black font-heading text-[#004d3d]">Booking Details</h3>
                     <button onClick={resetModals} className="text-slate-300 p-2"><X size={28} /></button>
                  </div>
                  <div className="flex items-center space-x-5 mb-8 bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm">
                    <img src={selectedTier.image} className="w-16 h-16 rounded-2xl object-cover shrink-0" alt="" />
                    <div className="min-w-0">
                        <h3 className="text-sm font-black text-[#004d3d] leading-tight mb-1 truncate">{selectedTier.title}</h3>
                        <div className="flex items-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          <MapPin size={10} className="mr-1 text-[#fdb913]" /> {selectedTier.location}
                        </div>
                    </div>
                  </div>
                  <div className="space-y-6 mb-8">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Stay Tier</p>
                    <div className="grid grid-cols-1 gap-3">
                      <button onClick={() => setBookingType('pps')} className={`p-5 rounded-3xl border-2 flex items-center justify-between transition-all ${bookingType === 'pps' ? 'border-[#004d3d] bg-white' : 'border-white bg-white/50 opacity-60'}`}>
                        <div className="flex flex-col items-start">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">PPS</span>
                          <span className="text-xs font-black text-[#004d3d]">Person Sharing</span>
                        </div>
                        <span className="text-sm font-black text-[#004d3d]">R {selectedTier.pricePPS.toLocaleString()}</span>
                      </button>
                      <button onClick={() => setBookingType('single')} className={`p-5 rounded-3xl border-2 flex items-center justify-between transition-all ${bookingType === 'single' ? 'border-[#004d3d] bg-white' : 'border-white bg-white/50 opacity-60'}`}>
                        <div className="flex flex-col items-start">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Solo</span>
                          <span className="text-xs font-black text-[#004d3d]">Single Stay</span>
                        </div>
                        <span className="text-sm font-black text-[#004d3d]">R {selectedTier.priceSingle.toLocaleString()}</span>
                      </button>
                    </div>
                  </div>
                  <div className="p-7 bg-[#004d3d] rounded-[40px] text-white flex items-center justify-between shadow-luxury">
                    <div>
                       <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Final Investment</p>
                       <p className="text-2xl font-black text-[#fdb913]">R {totalPrice.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[9px] font-black text-[#fdb913] uppercase tracking-[0.2em]">{quantity} {quantity === 1 ? 'FAN' : 'FANS'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="animate-fadeIn p-6 space-y-8">
                  <div className="flex flex-col items-center text-center pt-8">
                    <div className="w-24 h-24 bg-[#004d3d] rounded-full flex items-center justify-center text-[#fdb913] mb-6 shadow-2xl animate-float">
                      <ShieldCheck size={56} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-3xl font-black font-heading text-[#004d3d]">Gees Secured!</h3>
                  </div>
                  <div className="bg-white rounded-[48px] shadow-luxury border border-slate-100 overflow-hidden relative p-8">
                    <div className="text-center">
                       <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] mb-2">Heritage Ref</p>
                       <span className="text-xl font-black text-[#004d3d] tracking-[0.3em]">{bookingRef}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-8 pt-4 pb-24 bg-white border-t border-slate-100 shrink-0">
              {!isSuccess ? (
                <button 
                  onClick={handleConfirmPurchase}
                  className="w-full bg-[#004d3d] text-[#fdb913] py-5 rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-luxury flex items-center justify-center space-x-3 active:scale-95 transition-all"
                >
                  <ShieldCheck size={22} />
                  <span>Reserve Pass</span>
                </button>
              ) : (
                <button 
                  onClick={resetModals}
                  className="w-full bg-[#004d3d] text-[#fdb913] py-5 rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-xl active:scale-95 transition-all"
                >
                  <CheckCircle2 size={18} className="inline mr-2" /> Done
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Experiences;

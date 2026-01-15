
import React, { useState, useMemo } from 'react';
import { 
  Search, MapPin, CheckCircle2, ArrowRight, X, ShieldCheck, 
  Ticket, Bed, Bus, Flame, Award, SlidersHorizontal,
  Users as UsersIcon, Star, CalendarDays, Clock, Shield, Plus, Minus,
  Copy, Share, FileText, Calendar, QrCode, Download, Share2
} from 'lucide-react';
import { Experience } from '../types';
import { native } from '../services/nativeService';
import { db } from '../services/db';

interface ExperiencesProps {
  experiences: Experience[];
  onAddNotification?: (title: string, message: string, type: 'match' | 'system' | 'wallet') => void;
}

const Experiences: React.FC<ExperiencesProps> = ({ experiences, onAddNotification }) => {
  const [search, setSearch] = useState('');
  const [selectedTier, setSelectedTier] = useState<Experience | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [bookingType, setBookingType] = useState<'pps' | 'single'>('pps');
  const [quantity, setQuantity] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingRef, setBookingRef] = useState('');
  
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<number>(50000);

  const getFeatureIcon = (feature: string) => {
    const f = feature.toLowerCase();
    if (f.includes('accommodation') || f.includes('hotel') || f.includes('suite') || f.includes('villa') || f.includes('tent')) return <Bed size={14} />;
    if (f.includes('transport') || f.includes('shuttle') || f.includes('transfer') || f.includes('airport')) return <Bus size={14} />;
    if (f.includes('braai') || f.includes('gala') || f.includes('event') || f.includes('brunch') || f.includes('feast')) return <Flame size={14} />;
    if (f.includes('ticket') || f.includes('entry') || f.includes('pass')) return <Ticket size={14} />;
    if (f.includes('access') || f.includes('vip') || f.includes('gold') || f.includes('deck')) return <Award size={14} />;
    if (f.includes('safari') || f.includes('tour')) return <MapPin size={14} />;
    if (f.includes('meet') || f.includes('legends')) return <UsersIcon size={14} />;
    return <CheckCircle2 size={14} />;
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

  const handleConfirmPurchase = () => {
    const ref = `BOK-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    setBookingRef(ref);
    setIsSuccess(true);
    
    // Process reward activity
    const currentUser = db.getCurrentUser();
    if (currentUser) {
      db.processActivity(currentUser.id, 'purchase');
    }

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
    <div className="px-6 space-y-8 animate-fadeIn pt-2 pb-12">
      {/* Search Bar */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
          <input 
            type="text" 
            placeholder="Search tours..."
            className="w-full bg-white border border-slate-100 rounded-2xl py-3 pl-11 pr-4 text-xs font-semibold focus:ring-4 focus:ring-[#004d3d]/5 shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setIsFilterDrawerOpen(true)}
          className="w-11 h-11 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-[#004d3d]"
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>

      <div className="space-y-8">
        {filteredTiers.map((tier) => {
          const dateInfo = parseDate(tier.startDate);
          return (
            <div key={tier.id} className="bg-white rounded-[32px] overflow-hidden shadow-soft border border-slate-100 flex flex-col group transition-transform duration-500 active:scale-[0.99]">
              <div className="h-52 relative bg-slate-100">
                <img src={tier.image} alt={tier.title} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute top-4 left-4 bg-white rounded-2xl p-2.5 flex flex-col items-center min-w-[56px] shadow-lg">
                  <p className="text-[8px] font-black text-[#004d3d] uppercase tracking-widest">{dateInfo.month}</p>
                  <p className="text-xl font-black text-[#004d3d] leading-none mt-1">{dateInfo.day}</p>
                </div>
                <div className="absolute bottom-4 left-4 flex items-center space-x-1.5 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                  <MapPin size={10} className="text-[#fdb913]" />
                  <span className="text-[8px] font-black text-white uppercase tracking-wider">{tier.location}</span>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-black text-lg font-heading text-[#004d3d] leading-snug tracking-tight pr-4">{tier.title}</h3>
                    <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{tier.startDate} — {tier.endDate}</p>
                  </div>
                  <div className="bg-[#fdb913]/10 text-[#004d3d] px-2 py-1 rounded-lg border border-[#fdb913]/20 shrink-0">
                    <span className="text-[8px] font-black uppercase tracking-tighter">{tier.type}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-2">
                  {tier.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center space-x-1.5 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl shrink-0">
                      <div className="text-[#fdb913]">{getFeatureIcon(feature)}</div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Pricing From</p>
                    <p className="text-xl font-black text-[#004d3d] tracking-tighter">
                      R {tier.pricePPS.toLocaleString()} <span className="text-[10px] text-slate-300 ml-1">PPS</span>
                    </p>
                  </div>
                  <button 
                    onClick={() => { setSelectedTier(tier); setBookingType('pps'); setQuantity(1); setIsConfirming(true); }}
                    className="h-12 px-6 bg-[#004d3d] text-[#fdb913] rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center space-x-2 active:scale-95 transition-all"
                  >
                    <span>Reserve</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Overlay */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-md flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-[40px] p-8 animate-scaleIn relative shadow-luxury">
            <button onClick={() => setIsFilterDrawerOpen(false)} className="absolute top-6 right-6 text-slate-300 p-2"><X size={24} /></button>
            <h3 className="text-xl font-black font-heading text-[#004d3d] mb-6">Filter Tours</h3>
            <div className="space-y-6">
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Budget (R)</p>
                <input 
                  type="range" min="2000" max="25000" step="1000"
                  value={priceRange}
                  onChange={(e) => setPriceRange(parseInt(e.target.value))}
                  className="w-full accent-[#004d3d]"
                />
                <div className="flex justify-between text-[10px] font-black text-[#004d3d]">
                  <span>R 2k</span>
                  <span>R {priceRange.toLocaleString()}</span>
                </div>
              </div>
              <button onClick={() => setIsFilterDrawerOpen(false)} className="w-full bg-[#004d3d] text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg">Apply Filters</button>
            </div>
          </div>
        </div>
      )}

      {/* Review & Purchase Modal */}
      {isConfirming && selectedTier && (
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-[48px] shadow-luxury animate-scaleIn relative overflow-hidden flex flex-col h-[85vh]">
            
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
              {!isSuccess ? (
                /* REVIEW SCREEN */
                <div className="p-8">
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="text-xl font-black font-heading text-[#004d3d]">Review Tour</h3>
                     <button onClick={resetModals} className="text-slate-300 p-2"><X size={24} /></button>
                  </div>

                  <div className="flex items-center space-x-4 mb-8 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-sm shrink-0">
                      <img src={selectedTier.image} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-[#004d3d] leading-tight mb-1">{selectedTier.title}</h3>
                        <div className="flex items-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          <MapPin size={10} className="mr-1 text-[#fdb913]" /> {selectedTier.location}
                        </div>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Package Type</p>
                    <div className="space-y-3">
                      <button onClick={() => setBookingType('pps')} className={`w-full p-5 rounded-3xl border-2 flex items-center justify-between transition-all ${bookingType === 'pps' ? 'border-[#004d3d] bg-[#004d3d]/5' : 'border-slate-100 bg-white opacity-60'}`}>
                        <span className="text-xs font-black uppercase tracking-widest">Person Sharing</span>
                        <span className="text-sm font-black text-[#004d3d]">R {selectedTier.pricePPS.toLocaleString()}</span>
                      </button>
                      <button onClick={() => setBookingType('single')} className={`w-full p-5 rounded-3xl border-2 flex items-center justify-between transition-all ${bookingType === 'single' ? 'border-[#004d3d] bg-[#004d3d]/5' : 'border-slate-100 bg-white opacity-60'}`}>
                        <span className="text-xs font-black uppercase tracking-widest">Single Stay</span>
                        <span className="text-sm font-black text-[#004d3d]">R {selectedTier.priceSingle.toLocaleString()}</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Guest Count</p>
                    <div className="flex items-center justify-between bg-slate-50 p-4 rounded-3xl border border-slate-100">
                      <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#004d3d] shadow-sm active:scale-90 border border-slate-100"><Minus size={20} /></button>
                      <span className="text-2xl font-black text-[#004d3d]">{quantity}</span>
                      <button onClick={() => setQuantity(q => Math.min(10, q + 1))} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#004d3d] shadow-sm active:scale-90 border border-slate-100"><Plus size={20} /></button>
                    </div>
                  </div>

                  <div className="p-6 bg-[#004d3d] rounded-[32px] text-white flex items-center justify-between shadow-xl mb-12">
                    <div>
                       <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Total Due</p>
                       <p className="text-2xl font-black text-[#fdb913]">R {totalPrice.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-white uppercase tracking-widest">{quantity} {quantity === 1 ? 'FAN' : 'FANS'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                /* DETAILED BOOKING CONFIRMATION SCREEN */
                <div className="animate-fadeIn p-6 space-y-8 bg-slate-50/50">
                  <div className="flex flex-col items-center text-center pt-4">
                    <div className="w-20 h-20 bg-[#004d3d] rounded-full flex items-center justify-center text-[#fdb913] mb-4 shadow-xl">
                      <ShieldCheck size={48} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-2xl font-black font-heading text-[#004d3d]">Booking Secured!</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Lekker! See you at the hub.</p>
                  </div>

                  {/* Digital Ticket Layout */}
                  <div className="bg-white rounded-[40px] shadow-luxury border border-slate-100 overflow-hidden relative">
                    {/* Ticket Header */}
                    <div className="bg-[#004d3d] p-6 text-white">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center space-x-2">
                           <Award size={16} className="text-[#fdb913]" />
                           <span className="text-[8px] font-black uppercase tracking-widest text-[#fdb913]">Heritage Tour Pass</span>
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Verified Order</span>
                      </div>
                      <h4 className="text-xl font-black font-heading leading-tight">{selectedTier.title}</h4>
                      <p className="text-[10px] font-bold opacity-60 mt-1 uppercase tracking-widest">{selectedTier.location}</p>
                    </div>

                    {/* Perforated Line Simulation */}
                    <div className="relative flex items-center py-2 px-6">
                       <div className="absolute left-0 w-4 h-8 bg-slate-100 -ml-2 rounded-full shadow-inner"></div>
                       <div className="absolute right-0 w-4 h-8 bg-slate-100 -mr-2 rounded-full shadow-inner"></div>
                       <div className="w-full border-t-2 border-dashed border-slate-100"></div>
                    </div>

                    {/* Ticket Body */}
                    <div className="p-8 space-y-8">
                       <div className="grid grid-cols-2 gap-8">
                         <div>
                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Travel Dates</p>
                            <p className="text-xs font-black text-[#004d3d] uppercase tracking-tight">{selectedTier.startDate} — {selectedTier.endDate}</p>
                         </div>
                         <div>
                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Fan Count</p>
                            <p className="text-xs font-black text-[#004d3d] uppercase tracking-tight">{quantity} People</p>
                         </div>
                         <div>
                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Stay Tier</p>
                            <p className="text-xs font-black text-[#004d3d] uppercase tracking-tight">{bookingType === 'pps' ? 'Sharing' : 'Single'}</p>
                         </div>
                         <div>
                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Total Paid</p>
                            <p className="text-xs font-black text-[#004d3d] uppercase tracking-tight">R {totalPrice.toLocaleString()}</p>
                         </div>
                       </div>

                       <div className="pt-6 border-t border-slate-50 space-y-3">
                          <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Included Heritage Features</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedTier.features.map((f, i) => (
                              <div key={i} className="flex items-center space-x-1.5 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
                                <div className="text-[#fdb913]">{getFeatureIcon(f)}</div>
                                <span className="text-[9px] font-bold text-slate-500 uppercase">{f}</span>
                              </div>
                            ))}
                          </div>
                       </div>

                       {/* QR Code Section */}
                       <div className="pt-8 flex flex-col items-center border-t border-slate-50">
                          <div className="p-4 bg-slate-50 rounded-3xl mb-4 shadow-inner">
                            <QrCode size={120} className="text-[#004d3d] opacity-90" />
                          </div>
                          <div className="text-center">
                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em] mb-1">Heritage Ref</p>
                            <div className="flex items-center space-x-2">
                               <span className="text-lg font-black text-[#004d3d] tracking-[0.2em]">{bookingRef}</span>
                               <button onClick={() => { navigator.clipboard.writeText(bookingRef); native.hapticImpact(); }} className="text-slate-300"><Copy size={14} /></button>
                            </div>
                          </div>
                       </div>
                    </div>

                    {/* Decorative Footer */}
                    <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
                       <p className="text-[7px] font-black text-slate-300 uppercase tracking-[0.5em]">BOKFONTEIN EXPERIENCES 2026 • MZANSI OWNED</p>
                    </div>
                  </div>
                  
                  <div className="h-10"></div>
                </div>
              )}
            </div>

            {/* Sticky Action Bar */}
            <div className="p-8 pt-4 pb-24 bg-white border-t border-slate-100 shrink-0">
              {!isSuccess ? (
                <button 
                  onClick={handleConfirmPurchase}
                  className="w-full bg-[#004d3d] text-[#fdb913] py-5 rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-luxury flex items-center justify-center space-x-3 active:scale-95 transition-all"
                >
                  <ShieldCheck size={20} />
                  <span>Confirm Booking</span>
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex space-x-3">
                    <button 
                      onClick={resetModals}
                      className="flex-1 bg-[#004d3d] text-[#fdb913] py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center space-x-2"
                    >
                      <CheckCircle2 size={16} /> <span>Done</span>
                    </button>
                    <button className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center border border-slate-100 active:scale-90 transition-all">
                      <Share2 size={20} />
                    </button>
                  </div>
                  <button className="w-full py-4 bg-white border border-slate-100 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center space-x-2 active:scale-95">
                    <Download size={16} /> <span>Save as PDF</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Experiences;


import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Navigation, Flame, Beer, ShoppingBag, Music, Users, Sparkles, ChevronRight, CheckCircle2, Trophy, Search, Locate, RefreshCw, Info, Calendar, X } from 'lucide-react';
import { FanZoneHub } from '../types';
import { native } from '../services/nativeService';
import { gemini } from '../services/geminiService';
import { db } from '../services/db';

const GreenMile: React.FC = () => {
  const [selectedHub, setSelectedHub] = useState<FanZoneHub | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [gamePlan, setGamePlan] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [hubs, setHubs] = useState<FanZoneHub[]>([]);

  useEffect(() => {
    loadData();
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setIsLoadingLocation(false);
          native.hapticSuccess();
        },
        (err) => {
          console.error("Location error:", err);
          // Fallback to a default center (e.g., Brisbane) if location is denied
          setUserCoords({ lat: -27.4698, lng: 153.0251 });
          setIsLoadingLocation(false);
        }
      );
    } else {
      setUserCoords({ lat: -27.4698, lng: 153.0251 });
      setIsLoadingLocation(false);
    }
  }, []);

  const loadData = async () => {
    const data = await db.getHubs();
    setHubs(data.filter(h => h.status !== 'paused'));
  };

  const handleGeneratePlan = async () => {
    setIsGeneratingPlan(true);
    native.hapticImpact();
    
    const lat = userCoords?.lat || -27.4698;
    const lng = userCoords?.lng || 153.0251;
    
    const prompt = `Generate a Springbok fan game plan for my current area. Include where to watch, what to eat, and where to find the best gees. My coordinates are ${lat}, ${lng}.`;

    try {
      const result = await gemini.findNearbyBokSpots(lat, lng, prompt);
      setGamePlan(result.text || "Eish bru, I couldn't find a spot right now. Keep an eye on the pulse!");
      setIsGeneratingPlan(false);
      native.hapticSuccess();
    } catch (e) {
      setIsGeneratingPlan(false);
    }
  };

  // Logic to project lat/lng to screen coordinates for the stylized radar
  const markers = useMemo(() => {
    if (!userCoords || hubs.length === 0) return [];
    
    return hubs.map(hub => {
      // Stylized projection relative to user position
      // Using a slightly more map-like scaling factor
      const scale = 3500; 
      const dLat = (hub.lat - userCoords.lat) * scale;
      const dLng = (hub.lng - userCoords.lng) * scale;
      
      const top = 50 - dLat;
      const left = 50 + dLng;
      
      return {
        ...hub,
        pos: { 
          top: Math.max(5, Math.min(95, top)), 
          left: Math.max(5, Math.min(95, left)) 
        }
      };
    });
  }, [userCoords, hubs]);

  if (isLoadingLocation) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 animate-fadeIn">
        <RefreshCw size={40} className="text-[#004d3d] animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#004d3d]">Detecting Gees Location...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-fadeIn bg-slate-50 relative overflow-hidden">
      {/* Greyscale Stylized Map Radar */}
      <div className="flex-1 relative bg-[#1a1a1a] overflow-hidden">
        {/* Gridded background for map feel */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
        
        {/* Radar concentric circles */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[120vw] h-[120vw] border border-white/5 rounded-full"></div>
          <div className="w-[80vw] h-[80vw] border border-white/10 rounded-full"></div>
          <div className="w-[40vw] h-[40vw] border border-[#fdb913]/10 rounded-full"></div>
        </div>

        {/* User Marker (Center) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="w-12 h-12 bg-[#004d3d] rounded-full border-4 border-white flex items-center justify-center shadow-[0_0_30px_rgba(0,77,61,0.5)] relative">
             <Locate size={18} className="text-[#fdb913]" />
             <div className="absolute inset-0 bg-[#004d3d] rounded-full animate-ping opacity-20"></div>
          </div>
        </div>

        {/* Greyscale Map Texture Overlay */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1200')] bg-cover opacity-10 grayscale pointer-events-none mix-blend-luminosity"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-[#1a1a1a]/40 pointer-events-none"></div>

        {/* Dynamic Activity/Venue Markers */}
        {markers.map(marker => (
          <button 
            key={marker.id}
            onClick={() => { setSelectedHub(marker); native.hapticImpact(); }}
            className="absolute transition-transform active:scale-90 z-10 hover:z-30"
            style={{ 
              top: `${marker.pos.top}%`, 
              left: `${marker.pos.left}%` 
            }}
          >
            <div className="relative group flex items-center justify-center">
              {/* Ping based on density/Gees level */}
              <div className={`absolute w-12 h-12 rounded-full animate-pulse opacity-40 ${marker.density > 80 ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-red-400'}`}></div>
              
              {/* Actual Marker - Red per user request */}
              <div className={`w-10 h-10 rounded-full border-2 border-white shadow-luxury flex items-center justify-center text-white transition-all transform group-hover:scale-125 ${marker.density > 80 ? 'bg-red-600' : 'bg-red-500'}`}>
                {marker.type === 'activity' ? <Flame size={18} /> : <Beer size={18} />}
              </div>

              {/* Minimal Label */}
              <div className="absolute top-full mt-3 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-[8px] font-black text-white uppercase whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 shadow-lg border border-white/10">
                {marker.name}
              </div>
            </div>
          </button>
        ))}

        {/* Empty State / Search Trigger */}
        {markers.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center p-12 text-center">
            <div className="bg-slate-900/80 backdrop-blur-md p-10 rounded-[48px] shadow-luxury border border-white/10 space-y-6 max-w-xs">
              <div className="w-16 h-16 bg-[#004d3d] rounded-3xl mx-auto flex items-center justify-center shadow-lg border border-[#fdb913]/20">
                <Search size={32} className="text-[#fdb913]" />
              </div>
              <h3 className="text-xl font-black font-heading text-white">Fan Radar Empty</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed tracking-widest">No tribe activity detected in this sector yet, boet.</p>
              <button 
                onClick={handleGeneratePlan}
                className="w-full bg-[#fdb913] text-[#004d3d] py-4 rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 transition-all shadow-lg shadow-black/40"
              >
                Find Remote Hubs
              </button>
            </div>
          </div>
        )}

        {/* Floating Detailed Selection Card */}
        <div className="absolute bottom-6 left-6 right-6 z-40">
          {!selectedHub ? (
            <button 
              onClick={handleGeneratePlan}
              className="w-full bg-[#004d3d] text-[#fdb913] p-5 rounded-[28px] shadow-luxury flex items-center justify-between group overflow-hidden border border-white/10 backdrop-blur-md bg-opacity-95"
            >
              <div className="flex items-center space-x-3">
                <Sparkles size={20} className="animate-pulse" />
                <div className="text-left">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">BOK-CONCIERGE</p>
                  <p className="text-[11px] font-black uppercase tracking-tight">Draft my Local Game Plan</p>
                </div>
              </div>
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <div className="bg-white rounded-[40px] p-8 shadow-luxury border border-slate-100 animate-slideUp relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
              
              <div className="flex justify-between items-start mb-6">
                <div className="min-w-0 pr-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${selectedHub.density > 80 ? 'bg-red-600 text-white' : 'bg-red-100 text-red-600'}`}>
                      {selectedHub.density}% Capacity
                    </span>
                    <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest">{selectedHub.vibe}</span>
                  </div>
                  <h4 className="text-2xl font-black text-[#004d3d] font-heading tracking-tight leading-tight">{selectedHub.name}</h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 flex items-center">
                    <Flame size={12} className="mr-1.5 text-red-500" />
                    {selectedHub.activity}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedHub(null)} 
                  className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 active:scale-90 transition-all border border-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3 mb-8">
                {selectedHub.deals.map((deal, idx) => (
                  <div key={idx} className="flex items-center space-x-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                    <div className="w-2 h-2 rounded-full bg-[#fdb913] shadow-[0_0_8px_rgba(253,185,19,0.5)]"></div>
                    <span className="text-[10px] font-black uppercase tracking-tight text-[#004d3d]">{deal}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button className="bg-[#004d3d] text-[#fdb913] py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center justify-center space-x-2 active:scale-95 transition-all border border-white/10">
                  <Navigation size={14} className="rotate-45" /> <span>Get Gees Directions</span>
                </button>
                <button className="bg-slate-100 text-[#004d3d] py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all border border-slate-200">
                  <span>Hub Check-In</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Strategy Results */}
      {gamePlan && (
        <div className="fixed inset-0 z-[10002] bg-black/90 backdrop-blur-xl flex items-center justify-center p-8 animate-fadeIn">
          <div className="bg-white rounded-[48px] p-10 max-w-sm w-full animate-scaleIn shadow-luxury relative overflow-hidden border border-white/20">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#fdb913]/20 rounded-full blur-3xl -mr-24 -mt-24"></div>
            <button onClick={() => setGamePlan(null)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-500 transition-colors p-2"><X size={28} /></button>
            
            <div className="w-20 h-20 bg-[#004d3d] rounded-[30px] flex items-center justify-center text-[#fdb913] mb-8 shadow-2xl animate-float border-2 border-[#fdb913]/30">
              <Trophy size={40} />
            </div>
            
            <h3 className="text-2xl font-black font-heading text-[#004d3d] mb-4">Radar Strategy</h3>
            <div className="max-h-[40vh] overflow-y-auto no-scrollbar mb-10">
              <p className="text-slate-600 text-sm leading-relaxed italic pr-4 border-l-4 border-[#fdb913] pl-4">"{gamePlan}"</p>
            </div>
            
            <button 
              onClick={() => setGamePlan(null)} 
              className="w-full bg-[#004d3d] text-[#fdb913] py-5 rounded-[28px] font-black uppercase text-xs tracking-[0.2em] shadow-luxury active:scale-95 transition-all"
            >
              Lekker, I'm Moving!
            </button>
          </div>
        </div>
      )}

      {/* Loading State Overlay */}
      {isGeneratingPlan && (
        <div className="fixed inset-0 z-[10003] bg-black/60 backdrop-blur-md flex items-center justify-center">
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <div className="w-24 h-24 border-4 border-[#fdb913] border-t-transparent rounded-full animate-spin shadow-[0_0_30px_rgba(253,185,19,0.3)]"></div>
              <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#fdb913]" size={32} />
            </div>
            <p className="text-white text-[10px] font-black uppercase tracking-[0.4em] text-center max-w-[240px] leading-relaxed">Scouting local Mzansi gees hubs...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GreenMile;

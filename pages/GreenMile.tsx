
import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Flame, Beer, ShoppingBag, Music, Users, Sparkles, ChevronRight, CheckCircle2, Trophy, Search } from 'lucide-react';
import { FanZoneHub } from '../types';
import { native } from '../services/nativeService';
import { gemini } from '../services/geminiService';

const MOCK_HUBS: FanZoneHub[] = [
  { id: 'h1', name: 'The Braai Master Yard', density: 85, vibe: 'High Gees', deals: ['R150 Platter'], lat: -27.4698, lng: 153.0251 },
  { id: 'h2', name: 'Green & Gold Terrace', density: 40, vibe: 'Chill', deals: ['2-for-1 Castle'], lat: -27.4705, lng: 153.0235 },
  { id: 'h3', name: 'Brisbane Bok Bar', density: 95, vibe: 'Singing', deals: ['Bok Shot on Try'], lat: -27.4715, lng: 153.0210 },
  { id: 'h4', name: 'OLD School Pop-up', density: 60, vibe: 'Family', deals: ['Free Sticker with Jersey'], lat: -27.4680, lng: 153.0240 },
];

const GreenMile: React.FC = () => {
  const [selectedHub, setSelectedHub] = useState<FanZoneHub | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [gamePlan, setGamePlan] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [isBrisbane, setIsBrisbane] = useState(false);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);
        const inBrisbane = Math.abs(coords.lat + 27.46) < 0.5 && Math.abs(coords.lng - 153.02) < 0.5;
        setIsBrisbane(inBrisbane);
      });
    }
  }, []);

  const handleGeneratePlan = async () => {
    setIsGeneratingPlan(true);
    native.hapticImpact();
    
    const lat = userCoords?.lat || -27.4698;
    const lng = userCoords?.lng || 153.0251;
    
    const prompt = isBrisbane 
      ? "Generate a Springbok fan game plan for the Green Mile in Brisbane. Include a starting spot for lunch and a high-gees spot for singing."
      : "I'm a Springbok fan looking for a lekker spot to watch rugby and eat a braai platter near my location. Generate a game plan.";

    try {
      const result = await gemini.findNearbyBokSpots(lat, lng, prompt);
      setGamePlan(result.text || "Eish bru, I couldn't find a spot right now. Keep an eye on the pulse!");
      setIsGeneratingPlan(false);
      native.hapticSuccess();
    } catch (e) {
      setIsGeneratingPlan(false);
    }
  };

  return (
    <div className="flex flex-col h-full animate-fadeIn bg-slate-50">
      {/* Map View Area */}
      <div className="flex-1 relative bg-slate-200 overflow-hidden">
        <div className={`absolute inset-0 bg-cover opacity-50 grayscale ${isBrisbane ? "bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1200')]" : "bg-[url('https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?q=80&w=1200')]"}`}></div>
        
        {/* Animated Hub Pins (Visible if in Brisbane) */}
        {isBrisbane && MOCK_HUBS.map(hub => (
          <button 
            key={hub.id}
            onClick={() => { setSelectedHub(hub); native.hapticImpact(); }}
            className="absolute transition-transform active:scale-90"
            style={{ 
              top: `${(hub.lat + 27.472) * 10000}%`, 
              left: `${(hub.lng - 153.020) * 8000}%` 
            }}
          >
            <div className={`relative flex items-center justify-center`}>
              <div className={`absolute w-12 h-12 rounded-full animate-ping opacity-20 ${hub.density > 80 ? 'bg-red-500' : hub.density > 50 ? 'bg-orange-400' : 'bg-green-500'}`}></div>
              <div className={`w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white ${hub.density > 80 ? 'bg-red-500' : hub.density > 50 ? 'bg-orange-400' : 'bg-green-500'}`}>
                {hub.vibe === 'Singing' ? <Music size={14} /> : hub.vibe === 'High Gees' ? <Flame size={14} /> : <Beer size={14} />}
              </div>
            </div>
          </button>
        ))}

        {!isBrisbane && (
          <div className="absolute inset-0 flex items-center justify-center p-12 text-center">
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-[40px] shadow-luxury border border-white/50 space-y-4">
              <Search size={48} className="mx-auto text-[#004d3d] opacity-20" />
              <h3 className="text-xl font-black font-heading text-[#004d3d]">Global Fan Radar</h3>
              <p className="text-xs font-medium text-slate-500 italic leading-relaxed">"You're not in Brisbane, bru! Use BOK-CONCIERGE to find the nearest Bok hub in your current city."</p>
            </div>
          </div>
        )}

        {/* Floating Controls */}
        <div className="absolute bottom-6 left-6 right-6 space-y-3">
          {!selectedHub && (
            <button 
              onClick={handleGeneratePlan}
              className="w-full bg-[#004d3d] text-[#fdb913] p-5 rounded-[28px] shadow-luxury flex items-center justify-between group overflow-hidden"
            >
              <div className="flex items-center space-x-3">
                <Sparkles size={20} className="animate-pulse" />
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">AI Concierge</p>
                  <p className="text-xs font-black uppercase tracking-tight">{isBrisbane ? "Draft my Braai-to-Bar Plan" : "Locate Local Fan Hubs"}</p>
                </div>
              </div>
              <ChevronRight size={20} />
            </button>
          )}

          {selectedHub && (
            <div className="bg-white rounded-[32px] p-6 shadow-luxury border border-slate-100 animate-slideUp">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase ${selectedHub.density > 80 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                      {selectedHub.density}% Density
                    </span>
                    <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md text-[8px] font-black uppercase">{selectedHub.vibe}</span>
                  </div>
                  <h4 className="text-lg font-black text-[#004d3d] font-heading">{selectedHub.name}</h4>
                </div>
                <button onClick={() => setSelectedHub(null)} className="text-slate-300"><Navigation size={20} className="rotate-45" /></button>
              </div>
              <div className="space-y-3">
                {selectedHub.deals.map((deal, idx) => (
                  <div key={idx} className="flex items-center space-x-2 text-[10px] font-bold text-slate-600">
                    <CheckCircle2 size={12} className="text-[#fdb913]" />
                    <span>{deal}</span>
                  </div>
                ))}
              </div>
              <div className="flex space-x-2 mt-6">
                <button className="flex-1 bg-[#004d3d] text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md">Show the Way</button>
                <button className="flex-1 bg-slate-50 text-[#004d3d] py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-100">I'm Here!</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Plan Modal */}
      {gamePlan && (
        <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white rounded-[40px] p-8 max-w-sm w-full animate-scaleIn shadow-luxury relative">
            <button onClick={() => setGamePlan(null)} className="absolute top-6 right-6 text-slate-300"><CheckCircle2 size={24} /></button>
            <div className="w-16 h-16 bg-[#fdb913] rounded-3xl flex items-center justify-center text-[#004d3d] mb-6">
              <Trophy size={32} />
            </div>
            <h3 className="text-2xl font-black font-heading text-[#004d3d] mb-2">{isBrisbane ? "The Braai-to-Bar Plan" : "Local Fan Intel"}</h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-8 italic">"{gamePlan}"</p>
            <button onClick={() => setGamePlan(null)} className="w-full bg-[#004d3d] text-[#fdb913] py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-lg">Lekker, let's go!</button>
          </div>
        </div>
      )}

      {isGeneratingPlan && (
        <div className="fixed inset-0 z-[2000] bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-[#fdb913] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white text-[10px] font-black uppercase tracking-widest">BOK-CONCIERGE is scouting the vibe, my bru...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GreenMile;

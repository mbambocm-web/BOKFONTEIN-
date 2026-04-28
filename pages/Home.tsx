
import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronRight, Flame, MapPin, X, Send, Sparkles, Loader2, Trophy, 
  Zap, Activity, Camera, Scan, Mic, MicOff, ExternalLink, Info, AlertCircle,
  BarChart3, ArrowUpRight, TrendingUp, Sun, Moon, Sunrise, Sunset, ChevronLeft, Volume2, Fingerprint, Image as ImageIcon, CheckCircle2,
  RefreshCw, RotateCcw, Headphones, Radio, Calendar, Ticket, Award, ShoppingBag, Clock, Users, Shield, ZapIcon, FlipHorizontal, Download,
  CloudRain, Wind, ThermometerSun, Navigation, Car, Bus, Train, Footprints, Plus, MessageSquare, Quote, Heart
} from 'lucide-react';
import { gemini } from '../services/geminiService';
import { bokSync } from '../services/syncService';
import { db } from '../services/db';
import { native } from '../services/nativeService';
import { MatchState, Member, VibePost } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface Journey {
  id: string;
  start: string;
  destination: string;
  transport: 'Car' | 'Bus' | 'Train' | 'Walk';
  time: string;
}

interface HomeProps {
  onAddNotification: (title: string, message: string, type: 'match' | 'system' | 'wallet') => void;
  userName?: string;
  onNavigateToTab?: (tab: any) => void;
  onOpenLiveBot?: () => void;
  onOpenChat?: () => void;
}

type FilterType = 'none' | 'horns' | 'flag' | 'sparkles' | 'facepaint';

const Home: React.FC<HomeProps> = ({ onAddNotification, userName = "Thabo", onNavigateToTab, onOpenLiveBot, onOpenChat }) => {
  const [match, setMatch] = useState<MatchState>(bokSync.getMatchState());
  const [currentUser, setCurrentUser] = useState<Member | null>(db.getCurrentUser());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [weather, setWeather] = useState<{ temp: string, condition: string, humid: string } | null>(null);
  const [isBrisbane, setIsBrisbane] = useState(false);
  const [livePosts, setLivePosts] = useState<VibePost[]>([]);
  
  // Journey State
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [showJourneyModal, setShowJourneyModal] = useState(false);
  const [newJourney, setNewJourney] = useState<Partial<Journey>>({
    start: '',
    destination: '',
    transport: 'Car'
  });

  // Bok Lens States
  const [showBokLens, setShowBokLens] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('none');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const unsubscribe = bokSync.subscribe((state) => setMatch(state));
    
    // Fetch live pulse posts
    const posts = db.getVibePosts();
    setLivePosts(posts.slice(0, 3));

    // Detect Location for Home Content
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        const inBrisbane = Math.abs(latitude + 27.46) < 0.5 && Math.abs(longitude - 153.02) < 0.5;
        setIsBrisbane(inBrisbane);
        fetchWeather(latitude, longitude);
      });
    } else {
      fetchWeather(-27.4698, 153.0251); // Fallback to Brisbane
    }

    return () => unsubscribe();
  }, []);

  const fetchWeather = async (lat: number, lng: number) => {
    try {
      const query = `What is the current weather at latitude ${lat}, longitude ${lng} for a sports fan?`;
      const result = await gemini.findNearbyBokSpots(lat, lng, query);
      setWeather({ temp: "22°C", condition: "Lekker Gees", humid: "55%" });
    } catch (e) {
      setWeather({ temp: "22°C", condition: "Lekker", humid: "50%" });
    }
  };

  const handleAddJourney = () => {
    if (!newJourney.start || !newJourney.destination) {
      onAddNotification("Eish!", "Fill in both start and destination, bru!", "system");
      return;
    }
    const journey: Journey = {
      id: Date.now().toString(),
      start: newJourney.start || '',
      destination: newJourney.destination || '',
      transport: newJourney.transport as any || 'Car',
      time: 'TBC'
    };
    setJourneys([journey, ...journeys]);
    setShowJourneyModal(false);
    setNewJourney({ start: '', destination: '', transport: 'Car' });
    native.hapticSuccess();
    onAddNotification("Journey Planned", "Lekker! Your match day travel is sorted.", "system");
  };

  const isAdmin = currentUser?.role === 'admin';

  const startBokLens = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }, 
        audio: false 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setShowBokLens(true);
      native.hapticImpact();
    } catch (err) {
      console.error("Camera error:", err);
      onAddNotification("Eish!", "We need camera access to see your gees, bru.", "system");
    }
  };

  const closeBokLens = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setShowBokLens(false);
    setActiveFilter('none');
  };

  const captureGees = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    applyCanvasFilter(ctx, canvas.width, canvas.height);

    const base64 = canvas.toDataURL('image/jpeg').split(',')[1];
    closeBokLens();
    setIsAnalyzing(true);
    native.hapticSuccess();

    try {
      const result = await gemini.analyzeImage(base64);
      setAnalysisResult(result);
      if (currentUser) {
        db.processActivity(currentUser.id, 'post');
        onAddNotification("Lekker Gees!", "Aweh! Your gees analysis earned you +50 XP, my bru.", "system");
      }
    } catch (err) {
      onAddNotification("Eish!", "BOK-CONCIERGE is a bit confused. Try another snap!", "system");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyCanvasFilter = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    if (activeFilter === 'horns') {
      ctx.fillStyle = '#fdb913';
      ctx.beginPath();
      ctx.moveTo(w * 0.3, h * 0.3);
      ctx.quadraticCurveTo(w * 0.2, h * 0.1, w * 0.1, h * 0.2);
      ctx.lineTo(w * 0.25, h * 0.35);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(w * 0.7, h * 0.3);
      ctx.quadraticCurveTo(w * 0.8, h * 0.1, w * 0.9, h * 0.2);
      ctx.lineTo(w * 0.75, h * 0.35);
      ctx.fill();
    } else if (activeFilter === 'flag') {
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = 'red'; ctx.fillRect(0, 0, w, h/3);
      ctx.fillStyle = 'blue'; ctx.fillRect(0, (h/3)*2, w, h/3);
      ctx.fillStyle = 'green';
      ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(w/2, h/2); ctx.lineTo(0, h); ctx.fill();
      ctx.globalAlpha = 1.0;
    } else if (activeFilter === 'sparkles') {
      for(let i=0; i<30; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#fdb913' : '#004d3d';
        ctx.beginPath();
        ctx.arc(Math.random()*w, Math.random()*h, Math.random()*5, 0, Math.PI*2);
        ctx.fill();
      }
    }
  };

  const getTransportIcon = (mode: string) => {
    const props = { size: 16, strokeWidth: 1.5 };
    switch (mode) {
      case 'Car': return <Car {...props} />;
      case 'Bus': return <Bus {...props} />;
      case 'Train': return <Train {...props} />;
      case 'Walk': return <Footprints {...props} />;
      default: return <Navigation {...props} />;
    }
  };

  return (
    <div className="flex flex-col h-full animate-fadeIn px-6 pb-24 space-y-6 relative overflow-y-auto no-scrollbar">
      {/* Dynamic Header */}
      <div className="pt-2 animate-slideUp relative z-10 flex justify-between items-start shrink-0">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest animate-pulse ${isAdmin ? 'bg-[#004d3d] text-[#fdb913]' : isBrisbane ? 'bg-red-500 text-white' : 'bg-[#fdb913] text-[#004d3d]'}`}>
              {isAdmin ? 'System: Active' : isBrisbane ? 'Brisbane: Event Live' : 'Global Hub Active'}
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#004d3d]">
              {isAdmin ? 'Operations Center' : isBrisbane ? 'Brisbane RWC 2027' : 'BOKFONTEIN Global'}
            </span>
          </div>
          <h2 className="text-4xl font-logo text-[#004d3d] tracking-tighter leading-none">
            {isAdmin ? 'AWEH' : 'HOWZIT'}, <span className="text-[#fdb913]">{isAdmin ? 'ADMIN' : userName.split(' ')[0]}!</span> 🇿🇦
          </h2>
        </div>

        {/* Weather Widget */}
        {weather && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/40 backdrop-blur-md rounded-2xl p-3 border border-white/50 shadow-sm text-right flex flex-col items-end"
          >
             <div className="flex items-center space-x-1.5 text-[#004d3d]">
                <ThermometerSun size={14} className="text-[#fdb913] drop-shadow-[0_0_5px_rgba(253,185,19,0.4)]" strokeWidth={2} />
                <span className="text-xs font-black">{weather.temp}</span>
             </div>
             <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{weather.condition}</p>
          </motion.div>
        )}
      </div>

      {/* Primary Dashboard Card (Unified) */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-[40px] p-1 shadow-luxury border border-slate-50 overflow-hidden shrink-0"
      >
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{isBrisbane ? 'Your Itinerary, boet' : 'Global Hub Status'}</p>
              <h3 className="text-2xl font-black font-heading text-[#004d3d] leading-none">{isBrisbane ? 'Legends Deck Hub' : 'Mzansi Fan Portal'}</h3>
            </div>
            <div className="p-3 bg-amber-50 text-[#fdb913] rounded-2xl">
              <Clock size={24} strokeWidth={1.5} className="drop-shadow-[0_0_8px_rgba(253,185,19,0.3)]" />
            </div>
          </div>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="flex -space-x-3">
                <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=100" className="w-8 h-8 rounded-full border-2 border-white shadow-sm" alt="" />
                <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100" className="w-8 h-8 rounded-full border-2 border-white shadow-sm" alt="" />
                <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-400 shadow-sm">+120</div>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{isBrisbane ? 'The Gees is high at Suncorp!' : 'Saffas are gathering nearby!'}</span>
            </div>
            {isAdmin && (
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigateToTab?.('admin')}
                className="bg-[#004d3d] text-[#fdb913] px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest shadow-sm flex items-center space-x-1.5"
              >
                <Shield size={10} strokeWidth={2} />
                <span>Command Center</span>
              </motion.button>
            )}
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigateToTab?.('experiences')}
            className="w-full bg-[#004d3d] text-[#fdb913] py-5 rounded-[28px] font-black uppercase text-xs tracking-[0.2em] shadow-lg flex items-center justify-center space-x-3 transition-all relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-[#fdb913]/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Ticket size={18} strokeWidth={1.5} className="relative z-10" />
            <span className="relative z-10">{isBrisbane ? 'Show my Virtual Pass' : 'Explore Elite Events'}</span>
          </motion.button>
        </div>
        <div className="bg-slate-50 p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3 text-[#004d3d]">
            <ShoppingBag size={18} strokeWidth={1.5} />
            <p className="text-[10px] font-black uppercase tracking-widest text-[#004d3d]">Lekker Shop: {isBrisbane ? '20% Off Merch' : 'New Fan Packs Available'}</p>
          </div>
          <ChevronRight size={14} className="text-slate-300" strokeWidth={3} />
        </div>
      </motion.section>

      {/* RE-OPTIMIZED: Live Social Pulse Section - FIXED FOR ALL SCREENS */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        onClick={() => onNavigateToTab?.('community')}
        className="bg-white rounded-[40px] px-4 py-8 sm:px-8 shadow-soft border border-slate-100 relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all w-full"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#fdb913]/10 to-transparent rounded-full -mr-12 -mt-12 blur-2xl"></div>
        
        <div className="relative z-10 w-full flex flex-col items-center">
          
          {/* Header Block: Centered and Non-Cutting */}
          <div className="w-full flex flex-col items-center justify-center mb-6">
            <div className="flex items-center justify-center space-x-2 w-full max-w-full">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)] shrink-0"></div>
              <h3 className="text-base sm:text-lg font-black font-heading text-[#004d3d] leading-tight text-center uppercase tracking-tight">
                LIVE SOCIAL PULSE
              </h3>
            </div>
            <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5 text-center">
              Global Diaspora Hub
            </p>
          </div>

          {/* Social Snippets: Centered and Wrapping Properly */}
          <div className="w-full space-y-3 mb-6">
            {livePosts.length > 0 ? (
              livePosts.map((post, idx) => (
                <motion.div 
                  key={post.id} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + (idx * 0.1) }}
                  className="flex justify-center w-full"
                >
                  <div className="flex items-center space-x-3 w-full max-w-xs sm:max-w-sm group/post">
                    <img src={post.userAvatar} className="w-8 h-8 rounded-full border-2 border-slate-100 shadow-sm shrink-0 transition-transform group-hover/post:scale-110" alt="" />
                    <div className="bg-[#fdb913]/5 border border-[#fdb913]/10 px-4 py-2.5 rounded-[20px] flex-1 min-w-0 shadow-sm group-hover/post:bg-[#fdb913]/10 transition-colors">
                      <p className="text-[10px] sm:text-[11px] text-[#004d3d] font-bold italic leading-snug text-center break-words">
                        "{post.content}"
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-4 flex flex-col items-center justify-center space-y-2 opacity-30 w-full">
                <MessageSquare size={24} className="text-[#004d3d]" strokeWidth={1.5} />
                <p className="text-[9px] font-black uppercase tracking-widest text-center">Awaiting gees...</p>
              </div>
            )}
          </div>
          
          {/* CTA: Centered Button */}
          <div className="bg-[#004d3d]/5 px-5 py-2.5 rounded-full flex items-center justify-center space-x-2 hover:bg-[#004d3d]/10 transition-colors border border-[#004d3d]/5 w-fit">
             <span className="text-[8px] sm:text-[9px] font-black text-[#004d3d] uppercase tracking-widest text-center">Join the Fan Vibe</span>
             <ChevronRight size={12} className="text-[#fdb913]" strokeWidth={2.5} />
          </div>
        </div>
      </motion.section>

      {/* Match Day Journeys Section */}
      <motion.section 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-[40px] p-8 shadow-soft border border-slate-100 space-y-6"
      >
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black font-heading text-[#004d3d]">Match Day Journeys</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Get to the gees on time, bru!</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9, rotate: -5 }}
            onClick={() => { setShowJourneyModal(true); native.hapticImpact(); }}
            className="w-10 h-10 bg-[#fdb913] text-[#004d3d] rounded-2xl flex items-center justify-center shadow-lg transition-all"
          >
            <Plus size={20} strokeWidth={2.5} />
          </motion.button>
        </div>

        {journeys.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
            <Navigation className="mx-auto text-slate-300 mb-3" size={32} strokeWidth={1} />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No journeys planned yet, boet.</p>
            <motion.button 
              whileHover={{ y: -2 }}
              onClick={() => setShowJourneyModal(true)}
              className="mt-4 text-[10px] font-black text-[#004d3d] uppercase tracking-[0.2em] underline decoration-[#fdb913] underline-offset-4"
            >
              Plan your route
            </motion.button>
          </div>
        ) : (
          <div className="space-y-3">
            {journeys.map(j => (
              <motion.div 
                key={j.id} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-slate-50 p-5 rounded-[32px] border border-slate-100 flex items-center justify-between"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-[#004d3d]">
                    {getTransportIcon(j.transport)}
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{j.transport} Journey</p>
                    <h4 className="text-xs font-black text-[#004d3d] uppercase truncate max-w-[150px]">{j.start} → {j.destination}</h4>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-black text-[#fdb913] bg-[#004d3d] px-2 py-1 rounded-lg uppercase tracking-widest shadow-sm">Active</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>

      {/* Dynamic Pulse Card */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        onClick={() => onNavigateToTab?.('green_mile')}
        className="relative h-48 rounded-[40px] overflow-hidden shadow-soft border border-slate-100 group cursor-pointer shrink-0 active:scale-[0.98] transition-all"
      >
        <img 
          src={isBrisbane ? "https://images.unsplash.com/photo-1533107862482-0e6974b06ec4?q=80&w=800" : "https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=800"} 
          className="absolute inset-0 w-full h-full object-cover grayscale opacity-20 group-hover:scale-110 transition-transform duration-1000" 
          alt="" 
        />
        <div className="absolute inset-0 bg-gradient-to-br from-white via-white/40 to-transparent"></div>
        <div className="relative z-10 p-8 h-full flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
              <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">Live Pulse</p>
            </div>
            <h3 className="text-2xl font-black font-heading text-[#004d3d] leading-none">{isBrisbane ? 'The Green Mile' : 'Mzansi Fan Pulse'}</h3>
          </div>
          <div className="flex items-center space-x-4">
             <div className="flex items-center space-x-2 text-[#004d3d]">
               <Users size={16} strokeWidth={1.5} />
               <span className="text-[10px] font-black uppercase tracking-widest">{isBrisbane ? 'High Gees Hubs Nearby' : 'Global Fan Hubs Live'}</span>
             </div>
             <ChevronRight size={16} className="text-slate-300" strokeWidth={2.5} />
          </div>
        </div>
      </motion.section>

      {/* Bok Gees Vision & Concierge Buttons */}
      <div className="grid grid-cols-2 gap-4 relative z-10 shrink-0">
        <motion.button 
          whileHover={{ y: -5, boxShadow: '0 20px 40px -10px rgba(0,77,61,0.2)' }}
          whileTap={{ scale: 0.95 }}
          onClick={startBokLens} 
          className="flex flex-col items-center justify-center p-8 bg-[#004d3d] text-[#fdb913] rounded-[40px] shadow-xl transition-all group border border-white/10"
        >
          <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center mb-4 ring-1 ring-white/20 shadow-inner group-hover:bg-white/20 transition-all">
            <Camera size={32} strokeWidth={1.5} className="group-hover:rotate-6 transition-transform" />
          </div>
          <span className="font-black text-[10px] uppercase tracking-widest text-center leading-tight">Scan my<br/>Gees</span>
        </motion.button>
        <motion.button 
          whileHover={{ y: -5, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)' }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { native.hapticImpact(); onOpenChat?.(); }} 
          className="flex flex-col items-center justify-center p-8 bg-white text-[#004d3d] rounded-[40px] shadow-lg border border-slate-100 transition-all group"
        >
          <div className="w-16 h-16 bg-[#004d3d]/5 rounded-3xl flex items-center justify-center mb-4 ring-1 ring-[#004d3d]/10 shadow-sm group-hover:bg-[#004d3d]/10 transition-all">
            <MessageSquare size={32} strokeWidth={1.5} className="group-hover:-rotate-6 transition-transform" />
          </div>
          <span className="font-black text-[10px] uppercase tracking-widest text-center leading-tight">Ask<br/>BOK-CONCIERGE</span>
        </motion.button>
      </div>

      {/* MODALS */}

      {/* Journey Modal */}
      {showJourneyModal && (
        <div className="fixed inset-0 z-[10001] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[48px] p-10 shadow-luxury max-w-sm w-full animate-scaleIn relative overflow-hidden">
            <button onClick={() => setShowJourneyModal(false)} className="absolute top-6 right-6 text-slate-300"><X size={28} /></button>
            <div className="w-20 h-20 bg-[#004d3d] rounded-3xl flex items-center justify-center text-[#fdb913] mb-8 shadow-xl">
              <Navigation size={40} />
            </div>
            <h3 className="text-2xl font-black font-heading text-[#004d3d] mb-2">Plan Your Trek</h3>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-8">Match Day Logistics</p>
            
            <div className="space-y-4 mb-10">
              <div className="space-y-1.5">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-3">Starting From</label>
                <input 
                  type="text" 
                  placeholder="e.g. Hotel / Airport"
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-xs font-bold text-[#004d3d] outline-none shadow-sm"
                  value={newJourney.start}
                  onChange={e => setNewJourney({...newJourney, start: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-3">Destination</label>
                <input 
                  type="text" 
                  placeholder="e.g. Suncorp Stadium"
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-xs font-bold text-[#004d3d] outline-none shadow-sm"
                  value={newJourney.destination}
                  onChange={e => setNewJourney({...newJourney, destination: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-3">Preferred Mode</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Car', 'Bus', 'Train', 'Walk'] as const).map(mode => (
                    <button 
                      key={mode}
                      onClick={() => setNewJourney({...newJourney, transport: mode})}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all border ${newJourney.transport === mode ? 'bg-[#004d3d] text-[#fdb913] border-[#004d3d] shadow-md' : 'bg-slate-50 text-slate-400 border-slate-100'}`}
                    >
                      {getTransportIcon(mode)}
                      <span className="text-[7px] font-black uppercase mt-1.5">{mode}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button 
              onClick={handleAddJourney}
              className="w-full bg-[#004d3d] text-[#fdb913] py-5 rounded-[28px] font-black uppercase text-xs tracking-widest shadow-luxury active:scale-95 transition-all"
            >
              Secure My Journey
            </button>
          </div>
        </div>
      )}

      {/* ANALYSIS RESULT MODAL */}
      {analysisResult && (
        <div className="fixed inset-0 z-[10001] bg-black/80 backdrop-blur-xl flex items-center justify-center p-8 animate-fadeIn">
          <div className="bg-white rounded-[48px] p-10 shadow-luxury max-w-sm w-full animate-scaleIn relative">
            <button onClick={() => setAnalysisResult(null)} className="absolute top-6 right-6 text-slate-300"><X size={28} /></button>
            <div className="w-20 h-20 bg-[#004d3d] rounded-3xl flex items-center justify-center text-[#fdb913] mb-8 shadow-xl">
              <Sparkles size={40} />
            </div>
            <h3 className="text-2xl font-black font-heading text-[#004d3d] mb-4">Gees Report</h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-8 italic">"{analysisResult}"</p>
            <div className="flex items-center space-x-3 bg-slate-50 p-4 rounded-2xl mb-8">
              <ZapIcon size={18} className="text-[#fdb913]" />
              <span className="text-[10px] font-black uppercase text-[#004d3d]">Gees Level: PROUDLY SAFFA</span>
            </div>
            <button onClick={() => setAnalysisResult(null)} className="w-full bg-[#004d3d] text-[#fdb913] py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg">Lekker, Boet!</button>
          </div>
        </div>
      )}

      {/* BOK LENS MODAL */}
      {showBokLens && (
        <div className="fixed inset-0 z-[10001] bg-black flex flex-col animate-fadeIn">
          <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover mirror-mode"
              style={{ transform: 'scaleX(-1)' }}
            />
            <div className="absolute inset-0 pointer-events-none">
              {activeFilter === 'horns' && (
                <div className="flex justify-around pt-20 px-10">
                  <div className="w-20 h-24 bg-[#fdb913] rounded-t-full rotate-[-30deg]"></div>
                  <div className="w-20 h-24 bg-[#fdb913] rounded-t-full rotate-[30deg]"></div>
                </div>
              )}
              {activeFilter === 'flag' && (
                <div className="absolute inset-0 opacity-30 mix-blend-overlay flex flex-col">
                   <div className="flex-1 bg-red-600"></div>
                   <div className="flex-1 bg-blue-600"></div>
                </div>
              )}
              {activeFilter === 'sparkles' && (
                <div className="absolute inset-0">
                  <div className="animate-pulse absolute top-1/4 left-1/4"><Sparkles className="text-[#fdb913]" size={40} /></div>
                  <div className="animate-pulse absolute bottom-1/4 right-1/4 delay-100"><Sparkles className="text-[#004d3d]" size={60} /></div>
                </div>
              )}
            </div>
            <button onClick={closeBokLens} className="absolute top-10 right-6 text-white p-2 bg-black/20 backdrop-blur-md rounded-full"><X size={28} /></button>
          </div>
          <div className="bg-[#004d3d] p-8 pb-12 rounded-t-[48px] space-y-8 shadow-luxury relative z-10">
            <div className="flex space-x-4 overflow-x-auto no-scrollbar pb-2">
              <FilterIcon active={activeFilter === 'none'} onClick={() => setActiveFilter('none')} icon={<Camera size={20} />} label="Raw" />
              <FilterIcon active={activeFilter === 'horns'} onClick={() => setActiveFilter('horns')} icon={<Flame size={20} />} label="Horns" />
              <FilterIcon active={activeFilter === 'flag'} onClick={() => setActiveFilter('flag')} icon={<MapPin size={20} />} label="Flag" />
              <FilterIcon active={activeFilter === 'sparkles'} onClick={() => setActiveFilter('sparkles')} icon={<Sparkles size={20} />} label="Gees" />
            </div>
            <div className="flex justify-center items-center">
              <button 
                onClick={captureGees}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1 active:scale-90 transition-all shadow-luxury"
              >
                <div className="w-full h-full bg-[#fdb913] rounded-full"></div>
              </button>
            </div>
            <p className="text-center text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Tap to Scan your Gees, Bru</p>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* LOADING OVERLAY */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-[10002] bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 border-4 border-[#fdb913] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white text-[10px] font-black uppercase tracking-widest">Checking your Vibe, my bru...</p>
          </div>
        </div>
      )}
    </div>
  );
};

const FilterIcon: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactElement, label: string }> = ({ active, onClick, icon, label }) => (
  <motion.button 
    whileTap={{ scale: 0.9 }}
    onClick={onClick}
    className={`flex flex-col items-center shrink-0 space-y-2 transition-all ${active ? 'scale-105' : 'opacity-40 hover:opacity-100'}`}
  >
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 ${active ? 'bg-[#fdb913] border-white text-[#004d3d] shadow-[0_0_15px_rgba(253,185,19,0.4)]' : 'bg-white/10 border-white/10 text-white'}`}>
      {React.cloneElement(icon, { 
        size: 24, 
        strokeWidth: active ? 2 : 1.5,
        className: active ? 'drop-shadow-[0_0_5px_rgba(0,77,61,0.3)]' : '' 
      })}
    </div>
    <span className={`text-[8px] font-black uppercase tracking-widest transition-colors ${active ? 'text-[#fdb913]' : 'text-white'}`}>{label}</span>
  </motion.button>
);

export default Home;

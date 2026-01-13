import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronRight, Flame, MapPin, X, Send, Sparkles, Loader2, Trophy, 
  Zap, Activity, Camera, Scan, Mic, MicOff, ExternalLink, Info, AlertCircle,
  BarChart3, ArrowUpRight, TrendingUp, Sun, Moon, Sunrise, Sunset, ChevronLeft, Volume2, Fingerprint, Image as ImageIcon, CheckCircle2,
  RefreshCw, RotateCcw
} from 'lucide-react';
import { gemini } from '../services/geminiService';
import { bokSync } from '../services/syncService';
import { db } from '../services/db';
import { mediaService } from '../services/mediaService';
import { native } from '../services/nativeService';
import { MatchState } from '../types';

interface HomeProps {
  onAddNotification: (title: string, message: string, type: 'match' | 'system' | 'wallet') => void;
  userName?: string;
}

interface Message {
  role: 'user' | 'bot';
  text: string;
  grounding?: any[];
}

interface ARFilter {
  id: string;
  name: string;
  filterClass: string;
  overlay?: React.ReactNode;
}

const AR_FILTERS: ARFilter[] = [
  { id: 'none', name: 'Clean', filterClass: '' },
  { id: 'green', name: 'Bok Green', filterClass: 'sepia(0.6) hue-rotate(80deg) saturate(3) brightness(0.8)' },
  { id: 'gold', name: 'Gold Glory', filterClass: 'sepia(0.8) hue-rotate(10deg) saturate(4) brightness(1.1)' },
  { 
    id: 'paint', 
    name: 'Face Paint', 
    filterClass: 'contrast(1.1) saturate(1.2)',
    overlay: (
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-70">
        <div className="w-full h-full relative">
          <div className="absolute top-[30%] left-[20%] w-[20%] h-[10%] bg-[#004d3d] -rotate-12 rounded-full blur-[2px]"></div>
          <div className="absolute top-[35%] left-[25%] w-[20%] h-[10%] bg-[#fdb913] -rotate-12 rounded-full blur-[2px]"></div>
          <div className="absolute top-[30%] right-[20%] w-[20%] h-[10%] bg-[#004d3d] rotate-12 rounded-full blur-[2px]"></div>
          <div className="absolute top-[35%] right-[25%] w-[20%] h-[10%] bg-[#fdb913] rotate-12 rounded-full blur-[2px]"></div>
        </div>
      </div>
    )
  },
  { id: 'stadium', name: 'Stadium', filterClass: 'grayscale(0.2) contrast(1.4) brightness(0.9) saturate(1.5)' }
];

const ATMOSPHERE_IMAGES = [
  "https://images.unsplash.com/photo-1541252260730-0412e8e2108e?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1506701908217-0a05d9f52151?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1533107862482-0e6974b06ec4?q=80&w=1200&auto=format&fit=crop"
];

const Home: React.FC<HomeProps> = ({ onAddNotification, userName = "Thabo" }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: `Howzit ${userName}! Welcome back to the neighborhood. Ready to spot some Bok Gees today?` }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisionOpen, setIsVisionOpen] = useState(false);
  const [visionImage, setVisionImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [visionFeedback, setVisionFeedback] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<ARFilter>(AR_FILTERS[0]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const [match, setMatch] = useState<MatchState>(bokSync.getMatchState());

  useEffect(() => {
    return bokSync.subscribe((state) => {
      setMatch(state);
    });
  }, []);

  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    const bgTimer = setInterval(() => {
      setBgIndex(prev => (prev + 1) % ATMOSPHERE_IMAGES.length);
    }, 12000);
    return () => clearInterval(bgTimer);
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return { text: "Goeiemôre, boet", icon: <Sunrise size={16} className="text-amber-400" />, colorClass: "text-amber-500", subtext: "Early morning braai prep?" };
    }
    if (hour >= 12 && hour < 17) {
      return { text: "Howzit, my bru", icon: <Sun size={16} className="text-[#fdb913]" />, colorClass: "text-[#fdb913]", subtext: "Lekker afternoon for some rugby!" };
    }
    if (hour >= 17 && hour < 21) {
      return { text: "Lekker evening, hey", icon: <Sunset size={16} className="text-orange-400" />, colorClass: "text-orange-500", subtext: "The gees is high tonight!" };
    }
    return { text: "Aweh, late night vibe", icon: <Moon size={16} className="text-indigo-400" />, colorClass: "text-indigo-500", subtext: "Keep the green and gold shining." };
  };

  const greeting = getGreeting();

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Camera access denied", err);
      onAddNotification("Camera Error", "Please enable camera access for Bok Gees Vision.", "system");
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.filter = selectedFilter.filterClass;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setVisionImage(dataUrl);
        stopCamera();
        analyzeGees(dataUrl);
      }
    }
  };

  const handleVisionCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setVisionImage(reader.result as string);
        analyzeGees(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeGees = async (base64: string) => {
    setIsAnalyzing(true);
    native.hapticImpact();
    
    try {
      const imageUrl = await mediaService.uploadImage(base64);
      const dataOnly = imageUrl.split(',')[1];
      const result = await gemini.analyzeImage(dataOnly, `Analyze this fan's Springbok gees! Filter used: ${selectedFilter.name}. Look for jerseys, flags, and passion.`);
      setVisionFeedback(result);
      
      const currentUser = db.getCurrentUser();
      if (currentUser) {
        db.processActivity(currentUser.id, 'checkin');
        onAddNotification("Gees Rewarded!", "Aweh! +100 Gees XP for the snap.", "system");
        native.hapticSuccess();
      }
    } catch (e) {
      setVisionFeedback("Eish, the lens is a bit blurry. Try again, boet?");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const msg = chatInput;
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setIsLoading(true);
    native.hapticImpact();

    try {
      let fullText = '';
      const stream = gemini.chatStream(msg);
      for await (const chunk of stream) {
        fullText += chunk.text;
        setMessages(prev => {
          const next = [...prev];
          if (next[next.length - 1].role === 'bot' && next.length > messages.length + 1) {
            next[next.length - 1] = { role: 'bot', text: fullText, grounding: chunk.grounding };
            return next;
          } else {
            return [...next, { role: 'bot', text: fullText, grounding: chunk.grounding }];
          }
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full animate-fadeIn px-6 pb-24 space-y-6 relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        {ATMOSPHERE_IMAGES.map((img, idx) => (
          <div key={idx} className={`absolute inset-0 transition-opacity duration-[3000ms] ease-in-out ${idx === bgIndex ? 'opacity-20 scale-110' : 'opacity-0 scale-100'}`}>
            <img src={img} className="w-full h-full object-cover" alt="" aria-hidden="true" />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-[#f8fafc]/50 via-transparent to-[#f8fafc]"></div>
      </div>

      <div className="pt-2 animate-slideUp relative z-10">
        <div className="flex items-center space-x-2 mb-1">
          {greeting.icon}
          <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${greeting.colorClass}`}>
            {greeting.text}, {userName.split(' ')[0]}
          </span>
        </div>
        <h2 className="text-4xl font-logo text-[#004d3d] tracking-tighter leading-none">
          {greeting.text.split(',')[0].toUpperCase()}, <span className="text-[#fdb913]">{userName.split(' ')[0]}!</span> 🇿🇦
        </h2>
        <p className="text-[10px] font-bold text-slate-500 mt-2 flex items-center">
          <MapPin size={10} className="mr-1 text-[#fdb913]" /> {greeting.subtext}
        </p>
      </div>

      <div className="relative z-10 bg-white rounded-[32px] p-6 shadow-soft border border-slate-100 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#004d3d]/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Trophy size={16} className="text-[#fdb913]" />
            <span className="text-[10px] font-black text-[#004d3d] uppercase tracking-widest">{match.isLive ? 'Live: Heritage Test' : 'Match Finished'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 ${match.isLive ? 'bg-red-500 animate-pulse' : 'bg-slate-300'} rounded-full`}></span>
            <span className={`text-[10px] font-black ${match.isLive ? 'text-red-500' : 'text-slate-400'} uppercase tracking-widest`}>{match.time}'</span>
          </div>
        </div>

        <div className="flex items-center justify-between px-2">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm overflow-hidden">
               <img src="https://flagcdn.com/w160/za.png" className="w-full h-full object-cover opacity-80" alt="SA" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Springboks</span>
            <span className="text-3xl font-black text-[#004d3d]">{match.score.sa}</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em] mb-4">VS</div>
            <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
               <div className="h-full bg-[#004d3d] transition-all duration-1000" style={{ width: `${match.momentum}%` }}></div>
            </div>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm overflow-hidden">
               <img src="https://flagcdn.com/w160/nz.png" className="w-full h-full object-cover opacity-80" alt="NZ" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">All Blacks</span>
            <span className="text-3xl font-black text-[#004d3d]">{match.score.nz}</span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-50">
          <div className="flex items-start space-x-3">
             <div className="p-2 bg-slate-50 rounded-xl text-[#004d3d]">
               <Activity size={16} />
             </div>
             <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{match.isLive ? `${match.time}' LIVE UPDATE` : 'RESULT'}</p>
                <p className="text-xs font-bold text-slate-700 leading-relaxed">{match.lastEvent}</p>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 relative z-10">
        <button onClick={() => { setIsVisionOpen(true); native.hapticImpact(); }} className="flex flex-col items-center justify-center p-8 bg-[#004d3d] text-[#fdb913] rounded-[40px] shadow-xl active:scale-95 transition-all group border border-white/10">
          <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Camera size={32} /></div>
          <span className="font-black text-xs uppercase tracking-widest">Bok Gees Vision</span>
        </button>
        <button onClick={() => { setIsChatOpen(true); native.hapticImpact(); }} className="flex flex-col items-center justify-center p-8 bg-white text-[#004d3d] rounded-[40px] shadow-lg border border-slate-100 active:scale-95 transition-all group">
          <div className="w-16 h-16 bg-[#004d3d]/5 rounded-3xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Sparkles size={32} /></div>
          <span className="font-black text-xs uppercase tracking-widest">Elite Concierge</span>
        </button>
      </div>

      {/* MODAL: BOK GEES VISION - FLOAT LAYER 2000 */}
      {isVisionOpen && (
        <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-[48px] p-8 shadow-luxury animate-scaleIn relative overflow-hidden flex flex-col max-h-[85vh]">
            <button 
              onClick={() => { 
                setIsVisionOpen(false); 
                setVisionImage(null); 
                setVisionFeedback(null); 
                stopCamera();
              }} 
              className="absolute top-6 right-6 text-slate-300 p-2 z-20"
            >
              <X size={24} />
            </button>
            
            <div className="mb-6 shrink-0">
              <h3 className="text-2xl font-black font-heading text-[#004d3d] mb-1">Bok Gees Vision</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI AR Analyzer</p>
            </div>
            
            <div className="w-full aspect-square bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center relative overflow-hidden group mb-6 shrink-0">
               {isCameraActive ? (
                 <div className="relative w-full h-full">
                   <video 
                     ref={videoRef} 
                     autoPlay 
                     playsInline 
                     className="w-full h-full object-cover scale-x-[-1]" 
                     style={{ filter: selectedFilter.filterClass }}
                   />
                   {selectedFilter.overlay}
                   <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center space-x-6">
                      <button 
                        onClick={capturePhoto}
                        className="w-16 h-16 bg-white rounded-full border-4 border-[#004d3d] shadow-lg flex items-center justify-center active:scale-90 transition-all"
                      >
                        <div className="w-12 h-12 bg-[#004d3d] rounded-full"></div>
                      </button>
                   </div>
                 </div>
               ) : visionImage ? (
                 <div className="relative w-full h-full">
                    <img src={visionImage} className="w-full h-full object-cover" alt="Gees Capture" />
                    <button 
                      onClick={() => { setVisionImage(null); setVisionFeedback(null); startCamera(); }}
                      className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-xl text-white"
                    >
                      <RotateCcw size={18} />
                    </button>
                 </div>
               ) : (
                 <div className="flex flex-col items-center space-y-6">
                    <div className="w-20 h-20 bg-white rounded-[24px] shadow-sm flex items-center justify-center text-[#004d3d] group-hover:scale-110 transition-transform">
                      <Camera size={36} />
                    </div>
                    <div className="flex flex-col space-y-3 w-full px-8">
                      <button 
                        onClick={startCamera}
                        className="w-full py-3 bg-[#004d3d] text-[#fdb913] rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center justify-center space-x-2"
                      >
                        <Camera size={16} />
                        <span>Open Live Camera</span>
                      </button>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-3 bg-white border border-slate-200 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center space-x-2"
                      >
                        <ImageIcon size={16} />
                        <span>Upload Photo</span>
                      </button>
                    </div>
                 </div>
               )}
               <input type="file" ref={fileInputRef} onChange={handleVisionCapture} className="hidden" accept="image/*" />
               <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
              {isAnalyzing && (
                <div className="py-8 flex flex-col items-center space-y-3 animate-fadeIn">
                  <Loader2 size={32} className="text-[#004d3d] animate-spin" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">BokBot is assessing...</p>
                </div>
              )}
              {visionFeedback && (
                <div className="p-6 bg-[#004d3d]/5 rounded-[24px] border border-[#004d3d]/10 animate-slideUp">
                   <div className="flex items-center space-x-2 mb-3">
                     <CheckCircle2 size={16} className="text-[#004d3d]" />
                     <p className="text-[10px] font-black text-[#004d3d] uppercase tracking-widest">Gees Report</p>
                   </div>
                   <p className="text-xs font-medium text-slate-600 leading-relaxed italic">"{visionFeedback}"</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ELITE CONCIERGE - FLOATING MIDDLE POSITION, LAYER 9999 */}
      {isChatOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#f8fafc] w-full max-w-sm rounded-[48px] shadow-luxury animate-scaleIn relative overflow-hidden flex flex-col h-[75vh] border border-white/50">
            {/* Modal Header */}
            <header className="p-6 bg-[#004d3d] text-white flex items-center justify-between rounded-b-[40px] shadow-lg shrink-0">
               <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10"><Sparkles className="text-[#fdb913]" size={20} /></div>
                  <div className="flex flex-col">
                    <h3 className="font-black text-base font-heading leading-tight">Elite Concierge</h3>
                    <p className="text-[8px] font-black text-[#fdb913] uppercase tracking-widest">Always Active</p>
                  </div>
               </div>
               <button 
                  onClick={() => setIsChatOpen(false)} 
                  className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center active:scale-90 transition-all"
                  aria-label="Close Chat"
               >
                 <X size={20} />
               </button>
            </header>
            
            {/* Chat History Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar bg-slate-50/50">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-scaleIn`}>
                  <div className={`max-w-[85%] p-4 rounded-[28px] ${m.role === 'user' ? 'bg-[#004d3d] text-white rounded-tr-none shadow-md' : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none shadow-soft'}`}>
                    <p className="text-xs font-medium leading-relaxed">{m.text}</p>
                    {m.grounding && m.grounding.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-50 space-y-1.5">
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Grounded Info:</p>
                         {m.grounding.map((chunk, idx) => (
                           <a key={idx} href={chunk.web?.uri || chunk.maps?.uri} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-[#004d3d] hover:underline bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                              <ExternalLink size={8} className="shrink-0" />
                              <span className="text-[8px] font-bold truncate">{chunk.web?.title || chunk.maps?.title || "Visit Source"}</span>
                           </a>
                         ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                   <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-50">
                      <Loader2 className="animate-spin text-[#004d3d]" size={16} />
                   </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* FLOATING INPUT BOX - FIRMLY ATTACHED TO MODAL BASE */}
            <div className="p-5 bg-white border-t border-slate-100 shrink-0">
              <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-[24px] border border-slate-100 focus-within:ring-2 focus-within:ring-[#004d3d]/5 transition-all">
                <input 
                  type="text" 
                  value={chatInput} 
                  onChange={e => setChatInput(e.target.value)} 
                  onKeyPress={e => e.key === 'Enter' && handleSendMessage()} 
                  placeholder="Ask BokBot anything..." 
                  className="flex-1 bg-transparent px-4 py-2 text-xs outline-none font-medium text-slate-800"
                  autoFocus
                />
                <button 
                  onClick={handleSendMessage} 
                  disabled={!chatInput.trim() || isLoading} 
                  className="w-10 h-10 bg-[#004d3d] text-[#fdb913] rounded-xl flex items-center justify-center shadow-md active:scale-95 transition-all disabled:opacity-50"
                >
                  {isLoading ? <RefreshCw className="animate-spin" size={16} /> : <Send size={16} />}
                </button>
              </div>
              <p className="text-[7px] text-center text-slate-300 font-black uppercase tracking-widest mt-2">Powered by Gemini AI 🇿🇦</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
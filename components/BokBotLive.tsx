
import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, X, Sparkles, Volume2, Radio, Zap } from 'lucide-react';
import { gemini } from '../services/geminiService';
import { native } from '../services/nativeService';

interface BokBotLiveProps {
  isOpen: boolean;
  onClose: () => void;
}

const BokBotLive: React.FC<BokBotLiveProps> = ({ isOpen, onClose }) => {
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionPromiseRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen && !isActive) {
      startSession();
    }
    return () => {
      stopSession();
    };
  }, [isOpen]);

  const startSession = async () => {
    try {
      setIsActive(true);
      native.hapticImpact();
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      sessionPromiseRef.current = gemini.connectLive({
        onopen: () => {
          setIsListening(true);
          const source = inputCtx.createMediaStreamSource(stream);
          const processor = inputCtx.createScriptProcessor(4096, 1, 1);
          processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmBlob = gemini.createPcmBlob(inputData);
            sessionPromiseRef.current?.then((session: any) => {
              session.sendRealtimeInput({ media: pcmBlob });
            });
          };
          source.connect(processor);
          processor.connect(inputCtx.destination);
        },
        onmessage: async (message: any) => {
          const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (base64Audio && audioContextRef.current) {
            const ctx = audioContextRef.current;
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
            const audioData = gemini.decodeAudio(base64Audio);
            const buffer = await gemini.decodeAudioData(audioData, ctx, 24000, 1);
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += buffer.duration;
            sourcesRef.current.add(source);
            source.onended = () => sourcesRef.current.delete(source);
          }

          if (message.serverContent?.interrupted) {
            sourcesRef.current.forEach(s => s.stop());
            sourcesRef.current.clear();
            nextStartTimeRef.current = 0;
          }
        },
        onerror: (e: any) => console.error("Live Error:", e),
        onclose: () => setIsActive(false),
      });
    } catch (err) {
      console.error("Failed to start live session:", err);
      setIsActive(false);
    }
  };

  const stopSession = () => {
    setIsActive(false);
    setIsListening(false);
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[11000] bg-black/90 backdrop-blur-2xl flex flex-col animate-fadeIn">
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-12">
        <button 
          onClick={onClose}
          className="absolute top-12 right-8 text-white/40 hover:text-white transition-colors p-2"
        >
          <X size={32} />
        </button>

        <div className="relative">
          <div className={`w-48 h-48 rounded-full flex items-center justify-center border-4 border-[#fdb913]/20 transition-all duration-500 ${isListening ? 'scale-110' : 'scale-100'}`}>
            <div className={`w-40 h-40 rounded-full bg-gradient-to-br from-[#004d3d] to-[#006b55] flex items-center justify-center shadow-2xl relative overflow-hidden ${isListening ? 'animate-pulse' : ''}`}>
               <Sparkles size={64} className="text-[#fdb913] animate-float" />
               <div className="absolute inset-0 bg-[#fdb913]/5 animate-pulse"></div>
            </div>
          </div>
          {isListening && (
            <div className="absolute -inset-8">
              <div className="w-full h-full border border-[#fdb913]/30 rounded-full animate-ping"></div>
            </div>
          )}
        </div>

        <div className="text-center space-y-4">
          <h2 className="text-3xl font-black font-logo text-white tracking-widest uppercase">BOK-CONCIERGE <span className="text-[#fdb913]">LIVE</span></h2>
          <p className="text-[#fdb913] text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Ready to Help...</p>
          <p className="text-white/40 text-xs font-medium max-w-[280px] leading-relaxed mx-auto italic">
            "Howzit bru! I'm BOK-CONCIERGE. I'm here to help you with ANY information you need—from stats to travel tips. Just speak up!"
          </p>
        </div>

        <div className="flex items-center space-x-6">
           <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-white flex flex-col items-center space-y-1 min-w-[80px]">
             <Volume2 size={20} className="text-[#fdb913]" />
             <span className="text-[8px] font-black uppercase tracking-widest">Help Mode</span>
           </div>
           <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-white flex flex-col items-center space-y-1 min-w-[80px]">
             <Radio size={20} className="text-[#fdb913]" />
             <span className="text-[8px] font-black uppercase tracking-widest">Realtime</span>
           </div>
           <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-white flex flex-col items-center space-y-1 min-w-[80px]">
             <Zap size={20} className="text-[#fdb913]" />
             <span className="text-[8px] font-black uppercase tracking-widest">Global</span>
           </div>
        </div>
      </div>

      <div className="p-12 bg-white/5 border-t border-white/10 flex flex-col items-center space-y-6">
        <button 
          onClick={isActive ? stopSession : startSession}
          className={`w-24 h-24 rounded-full flex items-center justify-center shadow-luxury transition-all active:scale-90 ${isActive ? 'bg-red-500 text-white' : 'bg-[#fdb913] text-[#004d3d]'}`}
        >
          {isActive ? <MicOff size={32} /> : <Mic size={32} />}
        </button>
        <p className="text-white/40 text-[8px] font-black uppercase tracking-[0.3em]">
          {isActive ? "Tap to Mute" : "Tap to Speak"}
        </p>
      </div>
    </div>
  );
};

export default BokBotLive;

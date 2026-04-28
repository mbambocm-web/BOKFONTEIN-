
import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, X, Sparkles, Volume2, Radio, Zap } from 'lucide-react';
import { gemini } from '../services/geminiService';
import { native } from '../services/nativeService';
import { motion, AnimatePresence } from 'framer-motion';

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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[11000] bg-black/90 backdrop-blur-2xl flex flex-col"
        >
          <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-12">
            <motion.button 
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="absolute top-12 right-8 text-white/40 hover:text-white transition-colors p-2"
            >
              <X size={32} strokeWidth={1.5} />
            </motion.button>

            <div className="relative">
              <motion.div 
                animate={{ 
                  scale: isListening ? [1, 1.05, 1] : 1,
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className={`w-48 h-48 rounded-full flex items-center justify-center border-4 border-[#fdb913]/20 transition-all duration-500`}
              >
                <div className={`w-40 h-40 rounded-full bg-gradient-to-br from-[#004d3d] to-[#006b55] flex items-center justify-center shadow-[0_0_50px_rgba(0,77,61,0.5)] relative overflow-hidden`}>
                   <motion.div
                     animate={{ 
                       rotate: [0, 360],
                     }}
                     transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                     className="absolute inset-0 opacity-20 bg-[conic-gradient(from_0deg,#fdb913_0%,transparent_20%,#fdb913_50%,transparent_70%,#fdb913_100%)]"
                   />
                   <Sparkles size={64} className="text-[#fdb913] animate-float relative z-10 drop-shadow-[0_0_15px_rgba(253,185,19,0.5)]" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
              </motion.div>
              {isListening && (
                <div className="absolute -inset-8">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 1 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-full h-full border border-[#fdb913]/30 rounded-full"
                  />
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
               <NavIcon icon={<Volume2 />} label="Help Mode" />
               <NavIcon icon={<Radio />} label="Realtime" />
               <NavIcon icon={<Zap />} label="Global" />
            </div>
          </div>

          <div className="p-12 bg-white/5 border-t border-white/10 flex flex-col items-center space-y-6">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              onClick={isActive ? stopSession : startSession}
              className={`w-24 h-24 rounded-full flex items-center justify-center shadow-luxury transition-all ${isActive ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'bg-[#fdb913] text-[#004d3d] shadow-[0_0_20px_rgba(253,185,19,0.4)]'}`}
            >
              {isActive ? <MicOff size={32} strokeWidth={1.5} /> : <Mic size={32} strokeWidth={1.5} />}
            </motion.button>
            <p className="text-white/40 text-[8px] font-black uppercase tracking-[0.3em]">
              {isActive ? "Tap to Mute" : "Tap to Speak"}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const NavIcon: React.FC<{ icon: React.ReactElement, label: string }> = ({ icon, label }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="p-4 bg-white/5 rounded-2xl border border-white/10 text-white flex flex-col items-center space-y-1 min-w-[80px] group transition-colors hover:border-[#fdb913]/30"
  >
    {React.cloneElement(icon, { 
      size: 20, 
      strokeWidth: 1.5,
      className: "text-[#fdb913] group-hover:drop-shadow-[0_0_8px_rgba(253,185,19,0.5)] transition-all" 
    })}
    <span className="text-[8px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">{label}</span>
  </motion.div>
);

export default BokBotLive;

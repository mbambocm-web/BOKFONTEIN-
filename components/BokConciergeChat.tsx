
import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Sparkles, Mic, Loader2, ExternalLink, MessageSquare } from 'lucide-react';
import { gemini } from '../services/geminiService';
import { native } from '../services/nativeService';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'concierge';
  timestamp: Date;
  grounding?: any[];
}

interface BokConciergeChatProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLive: () => void;
  userName?: string;
}

const BokConciergeChat: React.FC<BokConciergeChatProps> = ({ isOpen, onClose, onOpenLive, userName = "Thabo" }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: `Howzit ${userName.split(' ')[0]}! I'm BOK-CONCIERGE. I'm here to help you with anything BOKFONTEIN related. You can ask me about tours, match stats, or even where to find the best braai nearby! What's on your mind, bru?`,
      sender: 'concierge',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    native.hapticImpact();

    const conciergeMessageId = (Date.now() + 1).toString();
    let conciergeText = '';
    let grounding: any[] = [];

    try {
      const stream = gemini.chatStream(userMessage.text);
      
      setMessages(prev => [...prev, {
        id: conciergeMessageId,
        text: '',
        sender: 'concierge',
        timestamp: new Date()
      }]);

      for await (const chunk of stream) {
        conciergeText += chunk.text;
        if (chunk.grounding) {
            grounding = [...grounding, ...chunk.grounding];
        }
        
        setMessages(prev => prev.map(msg => 
          msg.id === conciergeMessageId ? { ...msg, text: conciergeText, grounding } : msg
        ));
      }
    } catch (err) {
      console.error("Chat Error:", err);
    } finally {
      setIsTyping(false);
      native.hapticSuccess();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-[11000] bg-white flex flex-col"
        >
          {/* Header */}
          <header className="px-6 pt-12 pb-6 bg-[#004d3d] text-white shrink-0 shadow-luxury flex items-center justify-between">
            <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-[#fdb913] rounded-2xl flex items-center justify-center text-[#004d3d] shadow-[0_0_20px_rgba(253,185,19,0.3)] animate-float">
                    <Sparkles size={20} fill="currentColor" strokeWidth={1.5} />
                </div>
                <div>
                    <h2 className="text-lg font-black font-logo tracking-widest uppercase">BOK-CONCIERGE</h2>
                    <div className="flex items-center space-x-1.5">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_5px_rgba(74,222,128,0.5)]"></div>
                        <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Online & Ready</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center space-x-2">
                <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { native.hapticImpact(); onOpenLive(); onClose(); }}
                    className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center text-[#fdb913] hover:bg-white/20 transition-all border border-white/10 shadow-sm"
                    title="Go Live Voice"
                >
                    <Mic size={18} strokeWidth={1.5} />
                </motion.button>
                <motion.button 
                  whileHover={{ rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose} 
                  className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-white transition-all focus:outline-none"
                >
                    <X size={24} strokeWidth={1.5} />
                </motion.button>
            </div>
          </header>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 no-scrollbar bg-[#f8fafc]">
            {messages.map((msg) => (
              <motion.div 
                key={msg.id} 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className={`max-w-[85%] px-5 py-4 rounded-[28px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] text-sm leading-relaxed ${
                  msg.sender === 'user' 
                    ? 'bg-[#fdb913] text-[#004d3d] rounded-tr-lg font-bold' 
                    : 'bg-white text-slate-700 rounded-tl-lg border border-slate-100'
                }`}>
                  {msg.text || (isTyping && msg.sender === 'concierge' && <Loader2 size={16} className="animate-spin text-[#004d3d]" />)}
                  
                  {msg.grounding && msg.grounding.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sources & Links:</p>
                      {msg.grounding.map((chunk, idx) => (
                        chunk.web && (
                            <a 
                                key={idx} 
                                href={chunk.web.uri} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center space-x-2 text-[9px] font-bold text-[#004d3d] hover:underline transition-all"
                            >
                                <ExternalLink size={10} strokeWidth={2} />
                                <span className="truncate">{chunk.web.title || chunk.web.uri}</span>
                            </a>
                        )
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-2 px-2">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-6 py-8 bg-white border-t border-slate-100 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
            <div className="flex items-center space-x-3 bg-slate-50 p-2 rounded-[32px] border border-slate-100 shadow-inner group focus-within:border-[#004d3d]/20 transition-all">
              <input 
                type="text"
                placeholder="Type your question, bru..."
                className="flex-1 bg-transparent border-none px-4 py-3 text-sm font-medium text-[#004d3d] outline-none"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              />
              <motion.button 
                whileHover={input.trim() && !isTyping ? { scale: 1.05 } : {}}
                whileTap={input.trim() && !isTyping ? { scale: 0.95 } : {}}
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className={`w-12 h-12 rounded-[20px] flex items-center justify-center transition-all ${
                  input.trim() && !isTyping ? 'bg-[#004d3d] text-[#fdb913] shadow-lg active:scale-95' : 'bg-slate-200 text-slate-400'
                }`}
              >
                <Send size={20} strokeWidth={1.5} className={input.trim() && !isTyping ? 'drop-shadow-[0_0_5px_rgba(253,185,19,0.5)]' : ''} />
              </motion.button>
            </div>
            <div className="mt-4 flex justify-center">
                <motion.button 
                    whileHover={{ y: -2 }}
                    onClick={() => { native.hapticImpact(); onOpenLive(); onClose(); }}
                    className="flex items-center space-x-2 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-[#004d3d] transition-colors"
                >
                    <Mic size={12} strokeWidth={2} />
                    <span>Switch to Live Voice</span>
                </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BokConciergeChat;

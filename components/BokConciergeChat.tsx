
import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Sparkles, Mic, Loader2, ExternalLink, MessageSquare } from 'lucide-react';
import { gemini } from '../services/geminiService';
import { native } from '../services/nativeService';

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[11000] bg-white flex flex-col animate-fadeIn">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 bg-[#004d3d] text-white shrink-0 shadow-luxury flex items-center justify-between">
        <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-[#fdb913] rounded-2xl flex items-center justify-center text-[#004d3d] shadow-lg animate-float">
                <Sparkles size={20} fill="currentColor" />
            </div>
            <div>
                <h2 className="text-lg font-black font-logo tracking-widest uppercase">BOK-CONCIERGE</h2>
                <div className="flex items-center space-x-1.5">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Online & Ready</span>
                </div>
            </div>
        </div>
        <div className="flex items-center space-x-2">
            <button 
                onClick={() => { native.hapticImpact(); onOpenLive(); onClose(); }}
                className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center text-[#fdb913] hover:bg-white/20 transition-all border border-white/10"
                title="Go Live Voice"
            >
                <Mic size={18} />
            </button>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-white transition-all">
                <X size={24} />
            </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 no-scrollbar bg-[#f8fafc]">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-scaleIn`}>
            <div className={`max-w-[85%] px-5 py-4 rounded-[28px] shadow-sm text-sm leading-relaxed ${
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
                            className="flex items-center space-x-2 text-[9px] font-bold text-[#004d3d] hover:underline"
                        >
                            <ExternalLink size={10} />
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
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-8 bg-white border-t border-slate-100 shrink-0">
        <div className="flex items-center space-x-3 bg-slate-50 p-2 rounded-[32px] border border-slate-100 shadow-inner">
          <input 
            type="text"
            placeholder="Type your question, bru..."
            className="flex-1 bg-transparent border-none px-4 py-3 text-sm font-medium text-[#004d3d] outline-none"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className={`w-12 h-12 rounded-[20px] flex items-center justify-center transition-all ${
              input.trim() && !isTyping ? 'bg-[#004d3d] text-[#fdb913] shadow-lg active:scale-90' : 'bg-slate-200 text-slate-400'
            }`}
          >
            <Send size={20} />
          </button>
        </div>
        <div className="mt-4 flex justify-center">
            <button 
                onClick={() => { native.hapticImpact(); onOpenLive(); onClose(); }}
                className="flex items-center space-x-2 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-[#004d3d] transition-colors"
            >
                <Mic size={12} />
                <span>Switch to Live Voice</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default BokConciergeChat;

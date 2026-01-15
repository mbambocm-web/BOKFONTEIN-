
import React, { useState, useRef, useEffect } from 'react';
import { 
  Eye, Plus, Grid, Utensils, ShoppingBag, History, Award, ChevronRight, 
  Send, QrCode, X, Camera, ShieldCheck, RefreshCw, Ticket, Zap, 
  AlertCircle, CreditCard, Banknote, CheckCircle2, ArrowRight, Lock, 
  Edit3, Coins
} from 'lucide-react';
import { native } from '../services/nativeService';
import { paymentService } from '../services/paymentService';
import { db } from '../services/db';

interface WalletProps {
  balance: number;
  onUpdateBalance: (amount: number) => void;
  onAddNotification: (title: string, message: string, type: 'match' | 'system' | 'wallet') => void;
}

const Wallet: React.FC<WalletProps> = ({ balance, onUpdateBalance, onAddNotification }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [topUpStep, setTopUpStep] = useState<'none' | 'amount' | 'card' | 'verify' | 'success'>('none');
  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error' | 'invalid'>('idle');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const [transactions, setTransactions] = useState([
    { id: '1', title: 'Braai Yard Court', date: 'Today, 11:14', amount: -245.00, category: 'FOOD' },
    { id: '2', title: 'Official Merch Store', date: 'Today, 08:14', amount: -1200.00, category: 'MERCH' },
    { id: '3', title: 'Top-up (Account)', date: 'Yesterday, 19:45', amount: 5000.00, category: 'EXPERIENCE' },
    { id: '4', title: 'Green & Gold Bar', date: '2 days ago', amount: -890.00, category: 'FOOD' }
  ]);

  const handleStartTopUp = () => {
    native.hapticImpact();
    setTopUpStep('amount');
  };

  const handleSelectAmount = (amt: number) => {
    native.hapticImpact();
    setSelectedAmount(amt);
    setTopUpStep('card');
  };

  const handleCustomAmountContinue = () => {
    const amt = parseFloat(customAmount);
    if (isNaN(amt) || amt <= 0) {
      onAddNotification("Invalid Amount", "Please enter a valid amount to top up.", "system");
      return;
    }
    handleSelectAmount(amt);
  };

  const handleProcessPayment = async () => {
    native.hapticImpact();
    setTopUpStep('verify');
    setIsVerifying(true);
    
    try {
      const session = await paymentService.createTopUpSession(selectedAmount);
      const verified = await paymentService.verifyTransaction(session.id);
      
      if (verified) {
        setIsVerifying(false);
        setTopUpStep('success');
        onUpdateBalance(selectedAmount);
        
        // Process reward activity
        const currentUser = db.getCurrentUser();
        if (currentUser) {
          db.processActivity(currentUser.id, 'topup');
        }

        native.hapticSuccess();
        
        const newTx = {
          id: Date.now().toString(),
          title: 'Wallet Top-up',
          date: 'Just now',
          amount: selectedAmount,
          category: 'EXPERIENCE'
        };
        setTransactions([newTx, ...transactions]);
        
        onAddNotification(
          "Funds Loaded!", 
          `Lekker! R${selectedAmount.toLocaleString()} successfully added to your BOKFONTEIN wallet.`, 
          'wallet'
        );
      }
    } catch (e) {
      setIsVerifying(false);
      setTopUpStep('none');
      onAddNotification("Payment Error", "Eish! Gateway is busy. Try again later.", "wallet");
    }
  };

  const closeTopUp = () => {
    native.hapticImpact();
    setTopUpStep('none');
    setSelectedAmount(0);
    setCustomAmount('');
    setIsVerifying(false);
  };

  const startScanner = async () => {
    native.hapticImpact();
    setIsScanning(true);
    setScanStatus('idle');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err) { setIsScanning(false); }
  };

  const stopScanner = () => {
    native.hapticImpact();
    if (stream) stream.getTracks().forEach(track => track.stop());
    setStream(null);
    setIsScanning(false);
  };

  return (
    <div className="px-6 space-y-10 animate-fadeIn pt-2 relative">
      {/* Premium Balance Card */}
      <section className="relative h-64 w-full bg-[#004d3d] rounded-[48px] overflow-hidden shadow-2xl p-8 flex flex-col justify-between group cursor-pointer border border-white/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#fdb913]/10 rounded-full -ml-24 -mb-24 blur-3xl"></div>
        
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Member Wallet</p>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-xl font-bold text-[#fdb913]">R</span>
              <h2 className="text-4xl font-extrabold font-heading text-white tracking-tighter">
                {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).split('.')[0]}
                <span className="text-white/40">.{balance.toFixed(2).split('.')[1]}</span>
              </h2>
            </div>
          </div>
          <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-white">
            <Lock size={18} className="opacity-40" />
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#fdb913] rounded-xl flex items-center justify-center text-[#004d3d]">
              <Award size={20} strokeWidth={3} />
            </div>
            <div>
              <p className="text-white text-xs font-black uppercase tracking-widest">Gold Status</p>
              <p className="text-white/50 text-[10px] font-bold">8,500 Bok Points</p>
            </div>
          </div>
          <button onClick={handleStartTopUp} className="bg-[#fdb913] text-[#004d3d] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">
            Top Up
          </button>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="grid grid-cols-5 gap-2">
        <QuickAction icon={<Plus size={20} />} label="Add" onClick={handleStartTopUp} />
        <QuickAction icon={<Send size={20} />} label="Send" />
        <QuickAction icon={<Grid size={20} />} label="Pay" />
        <QuickAction icon={<Ticket size={20} />} label="Scan" onClick={startScanner} highlight />
        <QuickAction icon={<History size={20} />} label="Bills" />
      </section>

      {/* Transactions */}
      <section className="pb-12">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-extrabold font-heading text-[#004d3d]">Recent Activity</h3>
        </div>
        <div className="space-y-4">
          {transactions.map(tx => (
            <div key={tx.id} className="flex items-center justify-between p-2 hover:bg-white rounded-3xl transition-all group">
              <div className="flex items-center space-x-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${tx.amount < 0 ? 'bg-slate-50 text-slate-400' : 'bg-green-50 text-green-600'}`}>
                  {tx.amount < 0 ? <ShoppingBag size={24} /> : <Plus size={24} />}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">{tx.title}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{tx.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-black text-sm ${tx.amount < 0 ? 'text-slate-800' : 'text-green-600'}`}>
                  {tx.amount < 0 ? '' : '+'}{tx.amount.toFixed(2)}
                </p>
                <p className="text-[9px] text-slate-300 font-black uppercase mt-0.5">ZAR</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Overlays */}
      {topUpStep !== 'none' && (
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white w-full max-sm rounded-[48px] p-10 animate-scaleIn relative shadow-luxury overflow-y-auto max-h-[90vh] no-scrollbar">
            <button onClick={closeTopUp} className="absolute top-8 right-8 text-slate-400 p-2"><X size={24} /></button>
            
            {topUpStep === 'amount' && (
              <div className="space-y-8 pb-20">
                <div>
                  <h3 className="text-2xl font-black font-heading text-[#004d3d] mb-2">Load Funds</h3>
                  <p className="text-slate-400 text-xs font-medium">Select or enter top up amount.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[500, 1000, 2500, 5000].map(amt => (
                    <button key={amt} onClick={() => handleSelectAmount(amt)} className="p-6 bg-slate-50 border border-slate-100 rounded-[24px] text-center hover:border-[#fdb913] hover:bg-amber-50 transition-all active:scale-95 shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Bok Credits</p>
                      <p className="text-xl font-black text-[#004d3d]">R {amt}</p>
                    </button>
                  ))}
                </div>

                <div className="space-y-4 pt-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Or Enter Custom Amount</p>
                  <div className="relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[#004d3d] font-black text-lg">R</div>
                    <input 
                      type="number" 
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-50 border border-slate-100 rounded-[24px] py-5 pl-12 pr-6 text-xl font-black text-[#004d3d] outline-none focus:ring-2 focus:ring-[#fdb913]/20 transition-all"
                    />
                  </div>
                  <button 
                    onClick={handleCustomAmountContinue}
                    disabled={!customAmount || parseFloat(customAmount) <= 0}
                    className="w-full bg-[#004d3d] text-[#fdb913] py-5 rounded-[24px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center space-x-2 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <span>Continue</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {topUpStep === 'card' && (
              <div className="space-y-8 pb-24">
                <div>
                  <h3 className="text-2xl font-black font-heading text-[#004d3d] mb-2">Secure Payment</h3>
                  <p className="text-slate-400 text-xs font-medium">Adding R {selectedAmount.toLocaleString()} to wallet.</p>
                </div>
                <div className="p-6 bg-[#004d3d] rounded-[24px] text-white shadow-xl">
                  <div className="flex justify-between items-center mb-6">
                    <CreditCard size={32} className="text-[#fdb913]" />
                    <span className="text-[10px] font-black tracking-widest">VISA</span>
                  </div>
                  <p className="text-lg font-mono tracking-widest mb-4">**** **** **** 4242</p>
                  <p className="text-xs font-bold uppercase">Thabo Mokoena</p>
                </div>
                <button onClick={handleProcessPayment} className="w-full bg-[#004d3d] text-[#fdb913] py-5 rounded-[24px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center space-x-3 active:scale-95 transition-all">
                  <Lock size={18} />
                  <span>Pay R {selectedAmount.toLocaleString()}</span>
                </button>
              </div>
            )}

            {topUpStep === 'verify' && (
              <div className="h-80 flex flex-col items-center justify-center space-y-6 text-center pb-20">
                <RefreshCw size={64} className="text-[#004d3d] animate-spin" />
                <h4 className="text-xl font-black text-[#004d3d]">Gateway Redirect...</h4>
              </div>
            )}

            {topUpStep === 'success' && (
              <div className="h-80 flex flex-col items-center justify-center space-y-6 text-center pb-24">
                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center text-green-500 shadow-lg shadow-green-100">
                  <span className="animate-scaleIn inline-block">
                    <CheckCircle2 size={48} strokeWidth={3} />
                  </span>
                </div>
                <h4 className="text-2xl font-black text-[#004d3d]">Lekker! Top Up Successful.</h4>
                <button onClick={closeTopUp} className="px-12 py-4 bg-[#004d3d] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg">Done</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scanner Overlay */}
      {isScanning && (
        <div className="fixed inset-0 z-[10000] bg-black flex flex-col animate-fadeIn">
          <div className="p-6 flex justify-between items-center z-10 relative pt-[calc(var(--safe-area-top)+2.5rem)]">
            <h3 className="text-white font-heading font-extrabold text-xl">Bok Scanner</h3>
            <button onClick={stopScanner} className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white"><X size={20} /></button>
          </div>
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
             <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover opacity-60" />
             <div className="relative w-72 h-48 z-10">
                <div className="absolute inset-0 border-2 border-white/20 rounded-3xl"></div>
                <div className="absolute -top-1 -left-1 w-12 h-12 border-t-4 border-l-4 border-[#fdb913] rounded-tl-2xl"></div>
                <div className="absolute -top-1 -right-1 w-12 h-12 border-t-4 border-r-4 border-[#fdb913] rounded-tr-2xl"></div>
                <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-4 border-l-4 border-[#fdb913] rounded-bl-2xl"></div>
                <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-4 border-r-4 border-[#fdb913] rounded-br-2xl"></div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const QuickAction: React.FC<{ icon: React.ReactNode, label: string, onClick?: () => void, highlight?: boolean }> = ({ icon, label, onClick, highlight }) => (
  <button onClick={onClick} className="flex flex-col items-center space-y-2 active:scale-95 transition-all group">
    <div className={`w-14 h-14 rounded-2xl shadow-sm flex items-center justify-center transition-all ${highlight ? 'bg-[#004d3d] text-[#fdb913] border-[#fdb913]/20' : 'bg-white border border-slate-50 text-[#004d3d] hover:bg-slate-50'}`}>
      {icon}
    </div>
    <span className={`text-[8px] font-black uppercase tracking-widest text-center px-1 ${highlight ? 'text-[#004d3d]' : 'text-slate-400'}`}>{label}</span>
  </button>
);

export default Wallet;


import React, { useState, useEffect } from 'react';
import { 
  Wallet as WalletIcon, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  CreditCard, 
  ShieldCheck, 
  Zap, 
  Flame, 
  ChevronRight,
  TrendingUp,
  Award,
  RefreshCcw,
  PlusCircle,
  Terminal,
  ZapIcon
} from 'lucide-react';
import { Transaction, Member } from '../types';
import { db } from '../services/db';
import { native } from '../services/nativeService';

interface WalletProps {
  balance: number;
  onUpdateBalance: (amount: number) => void;
  onAddNotification: (title: string, message: string, type: 'match' | 'system' | 'wallet') => void;
}

const Wallet: React.FC<WalletProps> = ({ balance, onUpdateBalance, onAddNotification }) => {
  const [currentUser, setCurrentUser] = useState<Member | null>(db.getCurrentUser());
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<string>('');
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: 't1', title: 'Brisbane Finals Deposit', amount: -15000, date: '2 hours ago', category: 'Tour' },
    { id: 't2', title: 'Community Vibe Bonus', amount: 250, date: 'Yesterday', category: 'Reward' },
    { id: 't3', title: 'Wallet Top-up', amount: 5000, date: '3 days ago', category: 'Payment' },
    { id: 't4', title: 'Old School Cap Purchase', amount: -450, date: '4 days ago', category: 'Store' },
  ]);

  const isAdmin = currentUser?.role === 'admin';

  const handleTopUp = () => {
    const amt = parseFloat(topUpAmount);
    if (isNaN(amt) || amt <= 0) return;

    native.hapticSuccess();
    onUpdateBalance(amt);
    
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      title: 'Manual Top-up',
      amount: amt,
      date: 'Just now',
      category: 'Payment'
    };
    
    setTransactions([newTx, ...transactions]);
    setIsTopUpOpen(false);
    setTopUpAmount('');
    onAddNotification("Moolah Added!", `Lekker! R ${amt.toLocaleString()} added to your Bok Wallet, my bru.`, "wallet");
  };

  const handleAdminInjection = () => {
    if (!isAdmin) return;
    const injectionAmount = 10000;
    native.hapticSuccess();
    onUpdateBalance(injectionAmount);
    
    const newTx: Transaction = {
      id: `tx-admin-${Date.now()}`,
      title: 'Admin Credit Injection',
      amount: injectionAmount,
      date: 'Just now',
      category: 'System'
    };
    
    setTransactions([newTx, ...transactions]);
    onAddNotification("Admin: Moolah Injected", `System added R ${injectionAmount.toLocaleString()} for testing, boet.`, "system");
  };

  return (
    <div className="flex flex-col h-full animate-fadeIn px-6 pb-24 space-y-6 overflow-y-auto no-scrollbar">
      
      {/* Wallet Balance Card */}
      <section className="bg-[#004d3d] rounded-[40px] p-8 text-white relative overflow-hidden shadow-luxury mt-4 shrink-0">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#fdb913]/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-10">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
              <WalletIcon size={24} className="text-[#fdb913]" />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">BokBucks Account</p>
              <p className="text-xs font-bold text-[#fdb913]">BOK-2027-VIBE</p>
            </div>
          </div>
          
          <div className="mb-8">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 mb-1">Your Stash</p>
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl font-black font-heading tracking-tighter">R {balance.toLocaleString()}</span>
              <span className="text-[#fdb913] font-bold text-xs uppercase">BokBucks</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => { setIsTopUpOpen(true); native.hapticImpact(); }}
              className="bg-[#fdb913] text-[#004d3d] py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center space-x-2 active:scale-95 transition-all shadow-lg shadow-black/20"
            >
              <Plus size={16} />
              <span>Add Moolah</span>
            </button>
            <button className="bg-white/10 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center space-x-2 backdrop-blur-md border border-white/10 active:scale-95 transition-all">
              <ArrowUpRight size={16} />
              <span>Send Funds</span>
            </button>
          </div>
        </div>
      </section>

      {/* Admin Panel (Conditional) */}
      {isAdmin && (
        <section className="bg-slate-900 rounded-[32px] p-6 border border-slate-800 animate-slideUp">
          <div className="flex items-center space-x-2 mb-4 text-[#fdb913]">
            <Terminal size={16} />
            <h3 className="text-[10px] font-black uppercase tracking-widest">Admin Power Tools</h3>
          </div>
          <button 
            onClick={handleAdminInjection}
            className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 active:bg-white/10 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <ZapIcon size={20} className="text-[#fdb913]" />
              <div className="text-left">
                <p className="text-xs font-black text-white uppercase tracking-tight">Inject Moolah</p>
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Add R 10,000 instantly</p>
              </div>
            </div>
            <PlusCircle size={18} className="text-slate-600" />
          </button>
        </section>
      )}

      {/* Gees Multiplier Status */}
      <section className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-soft">
        <div className="flex items-center justify-between mb-6">
           <div className="flex items-center space-x-3">
             <div className="p-2 bg-amber-50 rounded-xl text-amber-500">
                <TrendingUp size={20} />
             </div>
             <div>
                <h4 className="text-sm font-black text-[#004d3d] uppercase tracking-tight">Gees Multiplier</h4>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Your Power Level, Boet</p>
             </div>
           </div>
           <div className="bg-[#004d3d] text-[#fdb913] px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
              2.0x Active
           </div>
        </div>
        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">
          Lekker! Your current level (LV.{currentUser?.geesLevel}) means you get <span className="text-[#004d3d] font-black">Double BokBucks</span> on all check-ins. Sharp!
        </p>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
           <div className="h-full bg-[#fdb913]" style={{ width: '65%' }}></div>
        </div>
      </section>

      {/* Transaction History */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
            <History size={12} className="mr-2" /> Moolah Movements
          </h3>
          <button className="text-[10px] font-black text-[#004d3d] uppercase tracking-widest">View All</button>
        </div>
        
        <div className="space-y-2">
          {transactions.map(tx => (
            <div key={tx.id} className="bg-white p-4 rounded-3xl border border-slate-50 flex items-center justify-between shadow-sm animate-slideUp">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-2xl ${tx.amount > 0 ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-[#004d3d]'}`}>
                  {tx.amount > 0 ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#004d3d] uppercase tracking-tight">{tx.title}</h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{tx.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-black ${tx.amount > 0 ? 'text-green-600' : 'text-[#004d3d]'}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                </p>
                <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{tx.category}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Top Up Modal */}
      {isTopUpOpen && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[40px] p-8 w-full max-w-sm shadow-luxury animate-scaleIn relative">
            <button onClick={() => setIsTopUpOpen(false)} className="absolute top-6 right-6 text-slate-300"><ChevronRight className="rotate-90" /></button>
            <div className="flex flex-col items-center text-center space-y-4 mb-8">
              <div className="w-16 h-16 bg-[#fdb913] rounded-3xl flex items-center justify-center text-[#004d3d] shadow-lg">
                <CreditCard size={32} />
              </div>
              <h3 className="text-2xl font-black font-heading text-[#004d3d]">Add Moolah</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secure Mzansi Gateway</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-4">How much, boet? (ZAR)</label>
                <input 
                  type="number" 
                  placeholder="R 0.00" 
                  value={topUpAmount}
                  onChange={e => setTopUpAmount(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-xl font-black text-[#004d3d] outline-none placeholder:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {['500', '1000', '5000'].map(val => (
                  <button 
                    key={val} 
                    onClick={() => { setTopUpAmount(val); native.hapticImpact(); }}
                    className="py-3 rounded-xl border border-slate-100 text-[10px] font-black text-[#004d3d] active:bg-slate-50 transition-colors"
                  >
                    R {val}
                  </button>
                ))}
              </div>

              <button 
                onClick={handleTopUp}
                disabled={!topUpAmount}
                className={`w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all ${topUpAmount ? 'bg-[#004d3d] text-[#fdb913]' : 'bg-slate-100 text-slate-300'}`}
              >
                Top up now, my bru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;

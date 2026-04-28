
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Users, ShieldCheck, Mail, MessageSquare, Plus, 
  Edit3, Trash2, ChevronRight, X, Search, 
  PieChart, Save, Send, Sparkles, Download, 
  RefreshCw, Flag, ShieldAlert, Check, Palette, 
  Image as ImageIcon, Camera, Layout, Eye,
  Type, Home, Compass, Wallet, User,
  Calendar, MapPin, Ticket, Bed, Bus, Flame, Play, PauseCircle, Award, Star,
  Map as MapIcon, Phone, UserPlus, PlayCircle, AlertCircle, Upload,
  Activity, Zap, TrendingUp, Globe, Info, Sliders, Map as MapIcon2, Navigation,
  Beer
} from 'lucide-react';
import { Member, Experience, ContentReport, AppTab, FanZoneHub } from '../types';
import { native } from '../services/nativeService';
import { gemini } from '../services/geminiService';
import { db } from '../services/db';

interface AdminProps {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  experiences: Experience[];
  setExperiences: React.Dispatch<React.SetStateAction<Experience[]>>;
  hubs: FanZoneHub[];
  setHubs: React.Dispatch<React.SetStateAction<FanZoneHub[]>>;
  onAddNotification: (title: string, message: string, type: 'match' | 'system' | 'wallet') => void;
  reports: ContentReport[];
  setReports: React.Dispatch<React.SetStateAction<ContentReport[]>>;
  onStartPromo?: (tab: AppTab) => void;
}

const Admin: React.FC<AdminProps> = ({ 
  members, setMembers, 
  experiences, setExperiences, 
  hubs, setHubs,
  onAddNotification, 
  reports, setReports, 
  onStartPromo 
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'status' | 'crm' | 'experiences' | 'moderation' | 'partners'>('partners');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Experience Modal State
  const [showExpModal, setShowExpModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingExp, setEditingExp] = useState<Experience | null>(null);
  const [expForm, setExpForm] = useState<Partial<Experience>>({
    title: '', type: 'One Match', pricePPS: 0, priceSingle: 0, location: '',
    startDate: '', endDate: '', image: '', features: [], status: 'active'
  });
  
  const tourImageInputRef = useRef<HTMLInputElement>(null);

  // Radar Spot / Partner Modal State
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<FanZoneHub | null>(null);
  const [partnerForm, setPartnerForm] = useState<Partial<FanZoneHub>>({
    name: '', activity: '', vibe: 'High Gees', deals: [], lat: 0, lng: 0, 
    status: 'active', contactPerson: '', description: '', density: 50, type: 'venue'
  });

  const handleOpenAddExpModal = () => {
    setEditingExp(null);
    setExpForm({
      title: '', type: 'One Match', pricePPS: 0, priceSingle: 0, location: '',
      startDate: '', endDate: '', image: 'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?q=80&w=800',
      features: ['Match Ticket'], status: 'active'
    });
    setShowExpModal(true);
    native.hapticImpact();
  };

  const handleOpenEditExpModal = (exp: Experience) => {
    setEditingExp(exp);
    setExpForm({ ...exp });
    setShowExpModal(true);
    native.hapticImpact();
  };

  const handleTourImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setExpForm(prev => ({ ...prev, image: base64 }));
        setIsUploading(false);
        native.hapticSuccess();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveExperience = async () => {
    if (!expForm.title || !expForm.location || !expForm.startDate) {
      onAddNotification("Missing Details", "Eish! Please fill in Name, Location and Dates.", "system");
      native.hapticError();
      return;
    }
    const experienceToSave = { ...expForm, id: editingExp ? editingExp.id : `exp-${Date.now()}` } as Experience;
    await db.saveExperience(experienceToSave);
    
    setExperiences(prev => {
      const exists = prev.find(e => e.id === experienceToSave.id);
      if (exists) {
        return prev.map(e => e.id === experienceToSave.id ? experienceToSave : e);
      }
      return [experienceToSave, ...prev];
    });

    onAddNotification(editingExp ? "Tour Updated" : "New Tour Created", "Lekker!", "system");
    setShowExpModal(false);
    native.hapticSuccess();
  };

  const handleDeleteExperience = async (id: string) => {
    if (window.confirm("Remove this tour permanently, bru?")) {
      await db.deleteExperience(id);
      setExperiences(prev => prev.filter(e => e.id !== id));
      onAddNotification("Tour Deleted", "Removed from catalog.", "system");
      native.hapticError();
    }
  };

  const handleToggleExperienceStatus = async (exp: Experience) => {
    const newStatus = exp.status === 'active' ? 'paused' : 'active';
    const updated = { ...exp, status: newStatus as any };
    await db.saveExperience(updated);
    setExperiences(prev => prev.map(e => e.id === exp.id ? updated : e));
    onAddNotification(newStatus === 'active' ? "Tour Resumed" : "Tour Paused", `Tour is now ${newStatus}.`, "system");
    native.hapticImpact();
  };

  // RADAR MANAGEMENT
  const handleOpenAddPartnerModal = () => {
    setEditingPartner(null);
    setPartnerForm({ 
      name: '', 
      activity: '', 
      vibe: 'High Gees', 
      deals: [], 
      lat: -27.46, 
      lng: 153.02, 
      status: 'active', 
      contactPerson: '', 
      description: '', 
      density: 50,
      type: 'venue'
    });
    setShowPartnerModal(true);
    native.hapticImpact();
  };

  const handleOpenEditPartnerModal = (p: FanZoneHub) => {
    setEditingPartner(p);
    setPartnerForm({ ...p });
    setShowPartnerModal(true);
    native.hapticImpact();
  };

  const handleSavePartner = async () => {
    if (!partnerForm.name || !partnerForm.activity || !partnerForm.lat || !partnerForm.lng) {
      onAddNotification("Missing Details", "Name, Activity and Coordinates are required, boet.", "system");
      native.hapticError();
      return;
    }
    const partnerToSave = { ...partnerForm, id: editingPartner ? editingPartner.id : `hub-${Date.now()}` } as FanZoneHub;
    await db.saveHub(partnerToSave);
    setHubs(prev => {
      const exists = prev.find(h => h.id === partnerToSave.id);
      if (exists) {
        return prev.map(h => h.id === partnerToSave.id ? partnerToSave : h);
      }
      return [partnerToSave, ...prev];
    });
    onAddNotification(editingPartner ? "Radar Updated" : "New Spot Live", "Global Radar Synchronized!", "system");
    setShowPartnerModal(false);
    native.hapticSuccess();
  };

  const handleDeletePartner = async (id: string) => {
    if (window.confirm("Delete this spot from the Global Fan Radar?")) {
      await db.deleteHub(id);
      setHubs(prev => prev.filter(h => h.id !== id));
      onAddNotification("Spot Removed", "Radar data deleted.", "system");
      native.hapticError();
    }
  };

  const handleTogglePartnerStatus = async (p: FanZoneHub) => {
    const newStatus = p.status === 'active' ? 'paused' : 'active';
    const updated = { ...p, status: newStatus as any };
    await db.saveHub(updated);
    setHubs(prev => prev.map(h => h.id === p.id ? updated : h));
    onAddNotification(newStatus === 'active' ? "Spot Active" : "Spot Paused", `Radar marker is now ${newStatus}.`, "system");
    native.hapticImpact();
  };

  const filteredExperiences = useMemo(() => experiences.filter(e => e.title.toLowerCase().includes(searchQuery.toLowerCase())), [experiences, searchQuery]);
  const filteredHubs = useMemo(() => hubs.filter(h => h.name.toLowerCase().includes(searchQuery.toLowerCase())), [hubs, searchQuery]);

  return (
    <div className="flex flex-col h-full animate-fadeIn bg-slate-50">
      {/* Sub Navigation */}
      <div className="px-6 py-4 flex space-x-2 overflow-x-auto no-scrollbar bg-white border-b border-slate-100 shrink-0">
        <SubNavButton icon={<Activity size={16} />} label="Status" active={activeSubTab === 'status'} onClick={() => setActiveSubTab('status')} />
        <SubNavButton icon={<Layout size={16} />} label="Tours" active={activeSubTab === 'experiences'} onClick={() => setActiveSubTab('experiences')} />
        <SubNavButton icon={<MapIcon size={16} />} label="Radar" active={activeSubTab === 'partners'} onClick={() => setActiveSubTab('partners')} />
        <SubNavButton icon={<Users size={16} />} label="CRM" active={activeSubTab === 'crm'} onClick={() => setActiveSubTab('crm')} />
        <SubNavButton icon={<Flag size={16} />} label="Moderation" active={activeSubTab === 'moderation'} onClick={() => setActiveSubTab('moderation')} />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 pb-32">
        {/* Radar Management View */}
        {activeSubTab === 'partners' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center px-1">
              <div>
                <h3 className="text-2xl font-black font-heading text-[#004d3d]">Fan Radar Sync</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Manage Global Hotspots</p>
              </div>
              <button 
                onClick={handleOpenAddPartnerModal} 
                className="bg-[#004d3d] text-[#fdb913] px-5 py-3.5 rounded-[20px] flex items-center space-x-2 shadow-lg active:scale-95 transition-all border border-white/10"
              >
                <Plus size={18} strokeWidth={3} />
                <span className="text-[10px] font-black uppercase tracking-widest">New Spot</span>
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <input 
                type="text" 
                placeholder="Search hubs or activities..." 
                className="w-full bg-white border border-slate-100 rounded-3xl pl-12 pr-6 py-4 text-xs font-bold text-[#004d3d] outline-none shadow-sm focus:ring-2 focus:ring-[#fdb913]/20 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              {filteredHubs.map(hub => (
                <div key={hub.id} className={`bg-white rounded-[32px] p-5 border border-slate-100 shadow-sm flex items-center justify-between transition-all group hover:border-[#fdb913]/30 ${hub.status === 'paused' ? 'opacity-50' : ''}`}>
                  <div className="flex items-center space-x-4 min-w-0">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 ${hub.type === 'activity' ? 'bg-orange-500' : 'bg-[#004d3d]'}`}>
                      {hub.type === 'activity' ? <Flame size={24} /> : <Beer size={24} />}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-black text-[#004d3d] text-sm truncate uppercase tracking-tight">{hub.name}</h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em] mt-0.5">{hub.activity}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className={`text-[7px] font-black px-2 py-0.5 rounded-lg uppercase tracking-tighter ${hub.density > 80 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                           {hub.density}% Cap
                        </span>
                        <span className="text-[7px] font-black bg-slate-50 text-slate-400 px-2 py-0.5 rounded-lg uppercase">
                           {hub.lat.toFixed(2)}, {hub.lng.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => handleTogglePartnerStatus(hub)} className={`p-3 rounded-xl active:scale-90 transition-all ${hub.status === 'paused' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-500'}`}>
                      {hub.status === 'paused' ? <Play size={18} fill="currentColor" /> : <PauseCircle size={18} fill="currentColor" />}
                    </button>
                    <button onClick={() => handleOpenEditPartnerModal(hub)} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-[#004d3d] hover:text-[#fdb913] transition-all active:scale-90 shadow-sm"><Edit3 size={18} /></button>
                    <button onClick={() => handleDeletePartner(hub.id)} className="p-3 bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-90 shadow-sm"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
              {filteredHubs.length === 0 && (
                <div className="py-20 text-center opacity-30">
                  <MapPin size={48} className="mx-auto mb-4" />
                  <p className="text-xs font-black uppercase tracking-widest">No spots found, bru.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status Dashboard View */}
        {activeSubTab === 'status' && (
          <div className="flex flex-col items-center justify-center space-y-12 py-10 animate-scaleIn">
             <div className="text-center space-y-4">
                <div className="flex items-center justify-center mb-6">
                  <div className="p-8 bg-[#004d3d] rounded-[48px] shadow-luxury border-4 border-[#fdb913]/30 relative group overflow-hidden">
                    <Activity size={48} className="text-[#fdb913] animate-pulse relative z-10" />
                    <div className="absolute inset-0 bg-[#fdb913]/5 rounded-full animate-ping opacity-20"></div>
                  </div>
                </div>
                <div>
                   <p className="text-[12px] font-black text-[#fdb913] uppercase tracking-[0.5em] mb-2">System Pulse</p>
                   <h3 className="text-4xl font-black font-heading text-[#004d3d] tracking-tighter">BOKFONTEIN CORE</h3>
                   <p className="text-xs font-bold text-slate-400 mt-3 uppercase tracking-widest italic opacity-60">Operations Nominal • 12 Active Hubs</p>
                </div>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-lg">
                <StatusCard icon={<Users size={24} />} label="Active Fans" value="12,402" trend="+12%" trendColor="text-green-500" />
                <StatusCard icon={<TrendingUp size={24} />} label="Hub Gees" value="8.4/10" trend="Peak Alert" trendColor="text-orange-500" />
             </div>
          </div>
        )}

        {/* Other tabs remain similar but could be expanded... */}
      </div>

      {/* RADAR SPOT / PARTNER MODAL */}
      {showPartnerModal && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-xl flex items-end sm:items-center justify-center animate-fadeIn p-0 sm:p-4">
          <div className="bg-[#f8fafc] w-full sm:max-w-md h-[95vh] sm:h-auto sm:max-h-[90vh] rounded-t-[48px] sm:rounded-[48px] shadow-luxury animate-slideUp overflow-hidden flex flex-col border border-white/40">
            <div className="p-8 pb-4 flex justify-between items-center bg-white border-b border-slate-50 shrink-0">
              <h3 className="text-2xl font-black font-heading text-[#004d3d]">{editingPartner ? 'Edit Radar Spot' : 'Deploy Radar Spot'}</h3>
              <button onClick={() => setShowPartnerModal(false)} className="text-slate-300 p-2 active:scale-90 transition-all"><X size={32} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 no-scrollbar">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-3">Hub Classification</label>
                    <select 
                      value={partnerForm.type}
                      onChange={e => setPartnerForm({...partnerForm, type: e.target.value as any})}
                      className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-4 text-xs font-bold text-[#004d3d] outline-none shadow-sm focus:ring-2 focus:ring-[#fdb913]/30"
                    >
                      <option value="venue">Venue (Permanent)</option>
                      <option value="activity">Activity (Dynamic)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-3">Fan Vibe</label>
                    <select 
                      value={partnerForm.vibe}
                      onChange={e => setPartnerForm({...partnerForm, vibe: e.target.value as any})}
                      className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-4 text-xs font-bold text-[#004d3d] outline-none shadow-sm focus:ring-2 focus:ring-[#fdb913]/30"
                    >
                      <option value="High Gees">High Gees</option>
                      <option value="Chill">Chill</option>
                      <option value="Singing">Singing</option>
                      <option value="Family">Family</option>
                    </select>
                  </div>
               </div>

               <AdminInput label="Spot Name" value={partnerForm.name} onChange={v => setPartnerForm({...partnerForm, name: v})} icon={<Home size={14} />} placeholder="e.g. Suncorp Fan Park" />
               <AdminInput label="Primary Activity" value={partnerForm.activity} onChange={v => setPartnerForm({...partnerForm, activity: v})} icon={<Flame size={14} />} placeholder="e.g. Mass Anthem March" />
               
               <div className="grid grid-cols-2 gap-4">
                 <AdminInput label="Latitude" value={partnerForm.lat?.toString()} onChange={v => setPartnerForm({...partnerForm, lat: parseFloat(v) || 0})} icon={<Navigation size={14} />} type="number" placeholder="-27.4698" />
                 <AdminInput label="Longitude" value={partnerForm.lng?.toString()} onChange={v => setPartnerForm({...partnerForm, lng: parseFloat(v) || 0})} icon={<Navigation size={14} />} type="number" placeholder="153.0251" />
               </div>

               <div className="space-y-3 bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm">
                 <div className="flex justify-between items-center mb-1">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Gees Density Factor</label>
                   <span className="text-xs font-black text-[#004d3d] bg-slate-50 px-2 py-1 rounded-lg">{partnerForm.density}%</span>
                 </div>
                 <input 
                   type="range" 
                   min="0" max="100" 
                   value={partnerForm.density} 
                   onChange={e => setPartnerForm({...partnerForm, density: parseInt(e.target.value)})}
                   className="w-full h-1.5 bg-slate-100 rounded-full appearance-none accent-[#004d3d] cursor-pointer"
                 />
                 <div className="flex justify-between text-[7px] font-black text-slate-300 uppercase tracking-widest">
                    <span>Low Pulse</span>
                    <span>Max Gees</span>
                 </div>
               </div>

               <AdminInput label="Hub Manager (Contact)" value={partnerForm.contactPerson} onChange={v => setPartnerForm({...partnerForm, contactPerson: v})} icon={<User size={14} />} placeholder="Name of point person" />
            </div>

            <div className="p-8 bg-white border-t border-slate-100 shrink-0">
               <button 
                 onClick={handleSavePartner} 
                 className="w-full bg-[#004d3d] text-[#fdb913] py-5 rounded-[28px] font-black uppercase text-sm tracking-[0.2em] shadow-luxury flex items-center justify-center space-x-4 active:scale-95 transition-all border border-white/10"
               >
                  <Save size={24} /> <span>{editingPartner ? 'RE-SYNC RADAR' : 'DEPLOY TO RADAR'}</span>
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatusCard: React.FC<{ icon: React.ReactNode, label: string, value: string, trend: string, trendColor: string }> = ({ icon, label, value, trend, trendColor }) => (
  <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-soft flex flex-col items-center justify-center text-center space-y-3 group hover:border-[#fdb913] transition-colors cursor-default">
    <div className="p-4 bg-slate-50 text-slate-400 rounded-3xl mb-1 group-hover:bg-[#004d3d] group-hover:text-[#fdb913] transition-all">
      {icon}
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
    <p className="text-3xl font-black text-[#004d3d] font-heading tracking-tighter">{value}</p>
    <p className={`text-[9px] font-bold ${trendColor} uppercase tracking-tighter`}>{trend}</p>
  </div>
);

const AdminInput: React.FC<{ label: string, value?: string, onChange: (v: string) => void, icon?: React.ReactNode, type?: string, placeholder?: string }> = ({ label, value, onChange, icon, type = "text", placeholder }) => (
  <div className="space-y-2">
    <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-3">{label}</label>
    <div className="relative group">
      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#004d3d] transition-colors">{icon}</div>
      <input 
        type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-white border border-slate-100 rounded-3xl pl-12 pr-6 py-4 text-xs font-bold text-[#004d3d] outline-none shadow-sm focus:ring-2 focus:ring-[#fdb913]/30 transition-all placeholder:text-slate-200"
      />
    </div>
  </div>
);

const SubNavButton: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void, badge?: number }> = ({ icon, label, active, onClick, badge }) => (
  <button onClick={onClick} className={`px-6 py-3 rounded-[20px] flex items-center space-x-2.5 border transition-all shrink-0 ${active ? 'bg-[#004d3d] text-[#fdb913] border-[#004d3d] shadow-lg scale-105 z-10' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
    {icon}
    <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

export default Admin;

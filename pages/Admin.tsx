
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
  Activity, Zap, TrendingUp, Globe
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
  const [activeSubTab, setActiveSubTab] = useState<'status' | 'crm' | 'experiences' | 'moderation' | 'partners'>('status');
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

  // Partner Modal State
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<FanZoneHub | null>(null);
  const [partnerForm, setPartnerForm] = useState<Partial<FanZoneHub>>({
    name: '', vibe: 'High Gees', deals: [], lat: 0, lng: 0, 
    status: 'active', contactPerson: '', description: '', density: 0
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
      onAddNotification("Missing Details", "Eish! Please fill in the Name, Location and Dates, bru.", "system");
      native.hapticError();
      return;
    }
    const experienceToSave = { ...expForm, id: editingExp ? editingExp.id : `exp-${Date.now()}` } as Experience;
    await db.saveExperience(experienceToSave);
    
    // Update local state
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
    if (window.confirm("Are you sure you want to delete this tour, bru? This can't be undone!")) {
      await db.deleteExperience(id);
      setExperiences(prev => prev.filter(e => e.id !== id));
      onAddNotification("Tour Deleted", "The tour has been removed from the catalog.", "system");
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

  const handleOpenAddPartnerModal = () => {
    setEditingPartner(null);
    setPartnerForm({ name: '', vibe: 'High Gees', deals: [], lat: -27.46, lng: 153.02, status: 'active', contactPerson: '', description: '', density: 0 });
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
    if (!partnerForm.name || !partnerForm.vibe) {
      onAddNotification("Missing Details", "Venue name and vibe are required, boet.", "system");
      return;
    }
    const partnerToSave = { ...partnerForm, id: editingPartner ? editingPartner.id : `hub-${Date.now()}` } as FanZoneHub;
    await db.saveHub(partnerToSave);
    setHubs(prev => editingPartner ? prev.map(h => h.id === editingPartner.id ? partnerToSave : h) : [partnerToSave, ...prev]);
    onAddNotification(editingPartner ? "Partner Updated" : "New Partner Registered", "Lekker!", "system");
    setShowPartnerModal(false);
    native.hapticSuccess();
  };

  const filteredExperiences = useMemo(() => experiences.filter(e => e.title.toLowerCase().includes(searchQuery.toLowerCase())), [experiences, searchQuery]);
  const filteredHubs = useMemo(() => hubs.filter(h => h.name.toLowerCase().includes(searchQuery.toLowerCase())), [hubs, searchQuery]);

  return (
    <div className="flex flex-col h-full animate-fadeIn bg-slate-50">
      <div className="px-6 py-4 flex space-x-2 overflow-x-auto no-scrollbar bg-white border-b border-slate-100 shrink-0">
        <SubNavButton icon={<Activity size={16} />} label="Status" active={activeSubTab === 'status'} onClick={() => setActiveSubTab('status')} />
        <SubNavButton icon={<Layout size={16} />} label="Tours" active={activeSubTab === 'experiences'} onClick={() => setActiveSubTab('experiences')} />
        <SubNavButton icon={<MapIcon size={16} />} label="Partners" active={activeSubTab === 'partners'} onClick={() => setActiveSubTab('partners')} />
        <SubNavButton icon={<Users size={16} />} label="CRM" active={activeSubTab === 'crm'} onClick={() => setActiveSubTab('crm')} />
        <SubNavButton icon={<Flag size={16} />} label="Safety" active={activeSubTab === 'moderation'} onClick={() => setActiveSubTab('moderation')} />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 pb-32">
        {activeSubTab === 'status' && (
          <div className="flex flex-col items-center justify-center space-y-12 py-10 animate-scaleIn">
             <div className="text-center space-y-4">
                <div className="flex items-center justify-center mb-6">
                  <div className="p-6 bg-[#004d3d] rounded-[40px] shadow-luxury border-4 border-[#fdb913]/20 relative group">
                    <Activity size={48} className="text-[#fdb913] animate-pulse" />
                    <div className="absolute inset-0 bg-[#fdb913]/5 rounded-[40px] animate-ping opacity-20"></div>
                  </div>
                </div>
                <div>
                   <p className="text-[12px] font-black text-[#fdb913] uppercase tracking-[0.5em] mb-2">Global Status</p>
                   <h3 className="text-4xl font-black font-heading text-[#004d3d] tracking-tight">Hub Operations</h3>
                   <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest italic opacity-60">System Synchronized & Active</p>
                </div>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-lg">
                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-soft flex flex-col items-center justify-center text-center space-y-3 group hover:border-[#fdb913] transition-colors">
                   <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl mb-1">
                      <Users size={24} />
                   </div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Fans</p>
                   <p className="text-3xl font-black text-[#004d3d] font-heading tracking-tight">12,402</p>
                   <p className="text-[9px] font-bold text-green-500 uppercase tracking-tighter">+12% vs last tour</p>
                </div>

                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-soft flex flex-col items-center justify-center text-center space-y-3 group hover:border-[#fdb913] transition-colors">
                   <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl mb-1">
                      <TrendingUp size={24} />
                   </div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Hub Gees</p>
                   <p className="text-3xl font-black text-[#004d3d] font-heading tracking-tight">8.4<span className="text-sm opacity-30 ml-1">/10</span></p>
                   <p className="text-[9px] font-bold text-orange-500 uppercase tracking-tighter">Peak Intensity Detected</p>
                </div>
             </div>

             <div className="w-full max-w-lg bg-[#004d3d] p-8 rounded-[48px] shadow-luxury text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#fdb913]/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <div className="flex items-center space-x-6">
                   <div className="p-4 bg-white/10 rounded-3xl border border-white/10">
                      <Globe size={32} className="text-[#fdb913]" />
                   </div>
                   <div>
                      <h4 className="text-lg font-black font-heading mb-1 text-white">Brisbane RWC 2027</h4>
                      <p className="text-[10px] font-black text-[#fdb913] uppercase tracking-widest">Main Hub Readiness: 98%</p>
                   </div>
                </div>
                <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
                   <div className="flex items-center space-x-2">
                      <Zap size={14} className="text-[#fdb913] fill-[#fdb913]" />
                      <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Real-time Sync Active</span>
                   </div>
                   <button className="text-[10px] font-black uppercase tracking-widest border border-white/20 px-4 py-2 rounded-full hover:bg-white/10 transition-colors">View Details</button>
                </div>
             </div>
          </div>
        )}

        {activeSubTab === 'experiences' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black font-heading text-[#004d3d]">Tour Hub</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manage Fan Journeys</p>
              </div>
              <button onClick={handleOpenAddExpModal} className="bg-[#004d3d] text-[#fdb913] px-5 py-3 rounded-2xl flex items-center space-x-2 shadow-lg active:scale-95 transition-all">
                <Plus size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">Add Tour</span>
              </button>
            </div>
            
            <div className="relative mb-2">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <input 
                type="text" 
                placeholder="Search tours..." 
                className="w-full bg-white border border-slate-100 rounded-2xl pl-11 pr-4 py-3.5 text-xs font-bold text-[#004d3d] outline-none shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredExperiences.map(exp => (
                <div key={exp.id} className="bg-white rounded-[32px] p-5 border border-slate-100 shadow-sm flex items-center justify-between">
                  <div className="flex items-center space-x-4 min-w-0">
                    <div className="relative">
                      <img src={exp.image} className={`w-16 h-16 rounded-2xl object-cover ${exp.status === 'paused' ? 'grayscale opacity-50' : ''}`} alt="" />
                      <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${exp.status === 'paused' ? 'bg-amber-500' : 'bg-green-500'}`}></div>
                    </div>
                    <div className="min-w-0">
                      <h4 className={`font-black text-[#004d3d] text-sm truncate ${exp.status === 'paused' ? 'opacity-50' : ''}`}>{exp.title}</h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{exp.location}</p>
                      <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded ${exp.status === 'paused' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
                        {exp.status || 'active'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => handleToggleExperienceStatus(exp)} 
                      className={`p-3 rounded-xl transition-all ${exp.status === 'paused' ? 'bg-green-50 text-green-500' : 'bg-amber-50 text-amber-500'}`}
                      title={exp.status === 'paused' ? 'Resume' : 'Pause'}
                    >
                      {exp.status === 'paused' ? <PlayCircle size={18} /> : <PauseCircle size={18} />}
                    </button>
                    <button 
                      onClick={() => handleOpenEditExpModal(exp)} 
                      className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-[#004d3d] hover:text-[#fdb913] transition-all"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDeleteExperience(exp.id)} 
                      className="p-3 bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSubTab === 'partners' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black font-heading text-[#004d3d]">Partner Venues</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manage Local Hubs</p>
              </div>
              <button onClick={handleOpenAddPartnerModal} className="bg-[#004d3d] text-[#fdb913] px-5 py-3 rounded-2xl flex items-center space-x-2 shadow-lg active:scale-95 transition-all">
                <UserPlus size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">Register Partner</span>
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {filteredHubs.map(hub => (
                <div key={hub.id} className="bg-white rounded-[32px] p-5 border border-slate-100 shadow-sm flex items-center justify-between">
                  <div className="flex items-center space-x-4 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-[#004d3d]"><MapIcon size={24} /></div>
                    <div className="min-w-0">
                      <h4 className="font-black text-[#004d3d] text-sm truncate">{hub.name}</h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{hub.vibe} • {hub.contactPerson || 'No Contact'}</p>
                    </div>
                  </div>
                  <button onClick={() => handleOpenEditPartnerModal(hub)} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-[#004d3d] hover:text-[#fdb913] transition-all"><Edit3 size={18} /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CRM and Moderation tabs (simplified placeholders) */}
        {activeSubTab === 'crm' && (
           <div className="flex flex-col items-center justify-center h-96 text-center text-slate-300 space-y-4">
              <Users size={48} className="opacity-20" />
              <p className="text-xs font-black uppercase tracking-widest">CRM Management Coming Soon</p>
           </div>
        )}
        {activeSubTab === 'moderation' && (
           <div className="flex flex-col items-center justify-center h-96 text-center text-slate-300 space-y-4">
              <ShieldCheck size={48} className="opacity-20" />
              <p className="text-xs font-black uppercase tracking-widest">Safety Moderation Tools Coming Soon</p>
           </div>
        )}
      </div>

      {/* TOUR MODAL WITH IMAGE UPLOAD */}
      {showExpModal && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-xl flex items-end sm:items-center justify-center animate-fadeIn p-0 sm:p-4">
          <div className="bg-[#f8fafc] w-full sm:max-w-md h-[95vh] sm:h-auto sm:max-h-[90vh] rounded-t-[48px] sm:rounded-[48px] shadow-luxury animate-slideUp overflow-hidden flex flex-col border border-white/50">
            <div className="p-8 pb-4 flex justify-between items-center bg-white border-b border-slate-50 shrink-0">
              <h3 className="text-2xl font-black font-heading text-[#004d3d]">{editingExp ? 'Edit Tour' : 'New Tour'}</h3>
              <button onClick={() => setShowExpModal(false)} className="text-slate-300 p-2"><X size={28} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 no-scrollbar">
               <div className="space-y-3">
                 <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-3">Tour Banner Image</label>
                 <div 
                   onClick={() => tourImageInputRef.current?.click()}
                   className="relative h-44 w-full bg-slate-100 rounded-[32px] overflow-hidden border-2 border-dashed border-slate-200 flex flex-col items-center justify-center group cursor-pointer hover:border-[#fdb913] transition-all"
                 >
                   {expForm.image ? (
                     <>
                       <img src={expForm.image} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Preview" />
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                          <Camera className="text-white" size={32} />
                       </div>
                     </>
                   ) : (
                     <div className="text-center space-y-2">
                       <Upload className="text-slate-300 mx-auto" size={32} />
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tap to Upload Photo</p>
                     </div>
                   )}
                   {isUploading && (
                     <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                        <RefreshCw className="text-[#004d3d] animate-spin" size={24} />
                     </div>
                   )}
                 </div>
                 <input type="file" ref={tourImageInputRef} onChange={handleTourImageUpload} className="hidden" accept="image/*" />
               </div>

               <AdminInput label="Tour Name" value={expForm.title} onChange={v => setExpForm({...expForm, title: v})} icon={<Type size={14} />} placeholder="e.g. Final Whirlwind Tour" />
               <AdminInput label="Location" value={expForm.location} onChange={v => setExpForm({...expForm, location: v})} icon={<MapPin size={14} />} placeholder="City, Stadium" />
               
               <div className="grid grid-cols-2 gap-4">
                 <AdminInput label="Price PPS (R)" value={expForm.pricePPS?.toString()} onChange={v => setExpForm({...expForm, pricePPS: parseInt(v) || 0})} icon={<Wallet size={14} />} type="number" />
                 <AdminInput label="Price Single (R)" value={expForm.priceSingle?.toString()} onChange={v => setExpForm({...expForm, priceSingle: parseInt(v) || 0})} icon={<Wallet size={14} />} type="number" />
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <AdminInput label="Start Date" value={expForm.startDate} onChange={v => setExpForm({...expForm, startDate: v})} icon={<Calendar size={14} />} placeholder="DD MMM YYYY" />
                 <AdminInput label="End Date" value={expForm.endDate} onChange={v => setExpForm({...expForm, endDate: v})} icon={<Calendar size={14} />} placeholder="DD MMM YYYY" />
               </div>
            </div>

            <div className="p-8 bg-white border-t border-slate-100 shrink-0">
               <button 
                 onClick={handleSaveExperience} 
                 className="w-full bg-[#004d3d] text-[#fdb913] py-5 rounded-[32px] font-black uppercase text-sm tracking-[0.2em] shadow-luxury flex items-center justify-center space-x-4 active:scale-95 transition-all"
               >
                  <Save size={24} /> <span>{editingExp ? 'UPDATE TOUR' : 'CREATE TOUR'}</span>
               </button>
            </div>
          </div>
        </div>
      )}

      {/* PARTNER MODAL */}
      {showPartnerModal && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-xl flex items-end sm:items-center justify-center animate-fadeIn p-0 sm:p-4">
          <div className="bg-[#f8fafc] w-full sm:max-w-md h-[95vh] sm:h-auto sm:max-h-[90vh] rounded-t-[48px] sm:rounded-[48px] shadow-luxury animate-slideUp overflow-hidden flex flex-col border border-white/50">
            <div className="p-8 pb-4 flex justify-between items-center bg-white border-b border-slate-50 shrink-0">
              <h3 className="text-2xl font-black font-heading text-[#004d3d]">{editingPartner ? 'Edit Venue' : 'New Venue'}</h3>
              <button onClick={() => setShowPartnerModal(false)} className="text-slate-300 p-2"><X size={28} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 no-scrollbar">
               <AdminInput label="Venue Name" value={partnerForm.name} onChange={v => setPartnerForm({...partnerForm, name: v})} icon={<Home size={14} />} />
               <AdminInput label="Contact Person" value={partnerForm.contactPerson} onChange={v => setPartnerForm({...partnerForm, contactPerson: v})} icon={<User size={14} />} />
            </div>
            <div className="p-8 bg-white border-t border-slate-100 shrink-0">
               <button onClick={handleSavePartner} className="w-full bg-[#004d3d] text-[#fdb913] py-5 rounded-[32px] font-black uppercase text-sm tracking-[0.2em] shadow-luxury flex items-center justify-center space-x-4 active:scale-95">
                  <Save size={24} /> <span>SAVE PARTNER</span>
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminInput: React.FC<{ label: string, value?: string, onChange: (v: string) => void, icon?: React.ReactNode, type?: string, placeholder?: string }> = ({ label, value, onChange, icon, type = "text", placeholder }) => (
  <div className="space-y-1">
    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-3">{label}</label>
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>
      <input 
        type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-white border border-slate-100 rounded-2xl pl-11 pr-4 py-3.5 text-xs font-bold text-[#004d3d] outline-none shadow-sm focus:ring-2 focus:ring-[#fdb913]/20"
      />
    </div>
  </div>
);

const SubNavButton: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void, badge?: number }> = ({ icon, label, active, onClick, badge }) => (
  <button onClick={onClick} className={`px-5 py-2.5 rounded-full flex items-center space-x-2 border transition-all shrink-0 ${active ? 'bg-[#004d3d] text-[#fdb913] border-[#004d3d] shadow-md' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
    {icon}
    <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

export default Admin;

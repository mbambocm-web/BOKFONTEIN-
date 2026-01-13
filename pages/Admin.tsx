import React, { useState, useMemo } from 'react';
import { 
  Users, UserPlus, UserMinus, ShieldCheck, Mail, MessageSquare, Plus, 
  Edit3, Trash2, Camera, ChevronRight, X, Search, Filter, 
  Activity, Award, PieChart, TrendingUp, Save, Send, AlertCircle, 
  MapPin, Calendar, DollarSign, Image as ImageIcon, CheckCircle2, RefreshCw,
  Flag, ShieldAlert, Check, Ban, ChevronLeft, Minus, Bed, Bus, Flame, Ticket,
  CheckSquare, Square
} from 'lucide-react';
import { Member, Experience, ContentReport } from '../types';
import { native } from '../services/nativeService';
import { messagingService } from '../services/messagingService';

interface AdminProps {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  experiences: Experience[];
  setExperiences: React.Dispatch<React.SetStateAction<Experience[]>>;
  onAddNotification: (title: string, message: string, type: 'match' | 'system' | 'wallet') => void;
  reports: ContentReport[];
  setReports: React.Dispatch<React.SetStateAction<ContentReport[]>>;
}

const Admin: React.FC<AdminProps> = ({ members, setMembers, experiences, setExperiences, onAddNotification, reports, setReports }) => {
  const [activeSubTab, setActiveSubTab] = useState<'crm' | 'experiences' | 'broadcast' | 'moderation'>('crm');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showExpModal, setShowExpModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editingExp, setEditingExp] = useState<Experience | null>(null);

  // CRM Messaging State
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [directMsgForm, setDirectMsgForm] = useState({
    message: '',
    channel: 'whatsapp' as 'whatsapp' | 'email'
  });

  // Inclusion Input
  const [inclusionInput, setInclusionInput] = useState('');

  // Forms
  const [expForm, setExpForm] = useState<Partial<Experience>>({
    title: '', type: 'One Match', pricePPS: 0, priceSingle: 0, location: '', startDate: '', endDate: '', image: '', features: []
  });

  const [broadcastForm, setBroadcastForm] = useState({
    subject: '', message: '', channel: 'whatsapp' as 'whatsapp' | 'push' | 'email', target: 'all' as 'all' | 'active' | 'suspended'
  });

  const [isSending, setIsSending] = useState(false);

  // --- CRM ACTIONS ---
  const toggleMemberSelection = (id: string) => {
    setSelectedMemberIds(prev => 
      prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
    );
    native.hapticImpact();
  };

  const selectAllMembers = () => {
    if (selectedMemberIds.length === filteredMembers.length) {
      setSelectedMemberIds([]);
    } else {
      setSelectedMemberIds(filteredMembers.map(m => m.id));
    }
    native.hapticImpact();
  };

  const filteredMembers = useMemo(() => 
    members.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [members, searchQuery]
  );

  const handleSendDirectMessage = async () => {
    if (!directMsgForm.message || selectedMemberIds.length === 0) return;
    setIsSending(true);
    native.hapticImpact();

    try {
      const recipientNames = members
        .filter(m => selectedMemberIds.includes(m.id))
        .map(m => m.name)
        .join(', ');

      await messagingService.sendBroadcast(
        directMsgForm.message, 
        directMsgForm.channel as any
      );

      onAddNotification(
        "Message Sent", 
        `Sent ${directMsgForm.channel.toUpperCase()} to ${selectedMemberIds.length} fan(s): ${recipientNames.substring(0, 30)}...`, 
        "system"
      );

      native.hapticSuccess();
      setIsMessageModalOpen(false);
      setDirectMsgForm({ ...directMsgForm, message: '' });
      setSelectedMemberIds([]);
    } catch (e) {
      onAddNotification("Error", "Could not send direct message.", "system");
    } finally {
      setIsSending(false);
    }
  };

  const openIndividualMessage = (id: string, channel: 'whatsapp' | 'email') => {
    setSelectedMemberIds([id]);
    setDirectMsgForm(prev => ({ ...prev, channel }));
    setIsMessageModalOpen(true);
    native.hapticImpact();
  };

  const toggleMemberStatus = (id: string) => {
    setMembers(prev => prev.map(m => {
      if (m.id === id) {
        const newStatus = m.status === 'active' ? 'suspended' : 'active';
        onAddNotification(`Member ${newStatus}`, `${m.name} has been ${newStatus}.`, 'system');
        native.hapticImpact();
        return { ...m, status: newStatus };
      }
      return m;
    }));
  };

  const removeMember = (id: string) => {
    if (window.confirm("Are you sure you want to remove this member forever? This cannot be undone.")) {
      setMembers(prev => prev.filter(m => m.id !== id));
      onAddNotification("Member Removed", "User has been purged from the database.", "system");
      native.hapticImpact();
    }
  };

  // --- EXPERIENCE ACTIONS ---
  const handleSaveExp = () => {
    if (!expForm.title || !expForm.pricePPS || !expForm.priceSingle || !expForm.startDate || !expForm.endDate) {
      alert("Fill in all the lekke details first, boet!");
      return;
    }

    if (editingExp) {
      setExperiences(prev => prev.map(e => e.id === editingExp.id ? { ...e, ...expForm } as Experience : e));
      onAddNotification("Experience Updated", `${expForm.title} has been modified.`, "system");
    } else {
      const newExp: Experience = {
        ...expForm as Experience,
        id: Date.now().toString(),
        features: expForm.features || ['Bok Gees']
      };
      setExperiences(prev => [...prev, newExp]);
      onAddNotification("Experience Added", `${expForm.title} is now live!`, "system");
    }
    native.hapticSuccess();
    setShowExpModal(false);
    setEditingExp(null);
    setExpForm({ title: '', type: 'One Match', pricePPS: 0, priceSingle: 0, location: '', startDate: '', endDate: '', image: '', features: [] });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setExpForm(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addInclusion = () => {
    if (!inclusionInput.trim()) return;
    setExpForm(prev => ({
      ...prev,
      features: [...(prev.features || []), inclusionInput.trim()]
    }));
    setInclusionInput('');
    native.hapticImpact();
  };

  const removeInclusion = (idx: number) => {
    setExpForm(prev => ({
      ...prev,
      features: (prev.features || []).filter((_, i) => i !== idx)
    }));
    native.hapticImpact();
  };

  // --- BROADCAST ACTIONS ---
  const handleSendBroadcast = async () => {
    if (!broadcastForm.message) return;
    setIsSending(true);
    
    try {
      await messagingService.sendBroadcast(broadcastForm.message, broadcastForm.channel === 'push' ? 'push' : broadcastForm.channel as any);
      setIsSending(false);
      onAddNotification("Broadcast Sent", `Successfully sent to ${members.length} members via ${broadcastForm.channel.toUpperCase()}.`, "system");
      native.hapticSuccess();
      setBroadcastForm({ ...broadcastForm, message: '', subject: '' });
    } catch (e) {
      setIsSending(false);
      onAddNotification("Broadcast Failed", "Eish! Messaging server is down.", "system");
    }
  };

  // --- MODERATION ACTIONS ---
  const handleResolveReport = (reportId: string, action: 'remove' | 'dismiss') => {
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: action === 'remove' ? 'resolved' : 'dismissed' } : r));
    onAddNotification(
      action === 'remove' ? "Content Removed" : "Report Dismissed", 
      `The report has been ${action === 'remove' ? 'actioned' : 'closed'}.`, 
      "system"
    );
    native.hapticImpact();
  };

  const pendingReports = reports.filter(r => r.status === 'pending');

  return (
    <div className="flex flex-col h-full animate-fadeIn bg-slate-50">
      {/* Admin Sub-Navigation */}
      <div className="px-6 py-4 flex space-x-2 overflow-x-auto no-scrollbar bg-white border-b border-slate-100">
        <SubNavButton icon={<Users size={16} />} label="CRM" active={activeSubTab === 'crm'} onClick={() => setActiveSubTab('crm')} />
        <SubNavButton icon={<Award size={16} />} label="Tours" active={activeSubTab === 'experiences'} onClick={() => setActiveSubTab('experiences')} />
        <SubNavButton icon={<Send size={16} />} label="Blast" active={activeSubTab === 'broadcast'} onClick={() => setActiveSubTab('broadcast')} />
        <SubNavButton 
          icon={<Flag size={16} />} 
          label="Safety" 
          active={activeSubTab === 'moderation'} 
          onClick={() => setActiveSubTab('moderation')}
          badge={pendingReports.length > 0 ? pendingReports.length : undefined}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 pb-32">
        
        {/* CRM View */}
        {activeSubTab === 'crm' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="Total Fans" value={members.length.toString()} icon={<Users className="text-[#004d3d]" />} />
              <StatCard label="Active Bookings" value="12" icon={<PieChart className="text-[#fdb913]" />} />
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" placeholder="Search members..." 
                  className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-[#004d3d]/5"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <button 
                onClick={selectAllMembers}
                className={`p-4 rounded-2xl border transition-all ${selectedMemberIds.length === filteredMembers.length ? 'bg-[#004d3d] text-white' : 'bg-white border-slate-100 text-slate-400'}`}
              >
                <CheckSquare size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {filteredMembers.map(member => (
                <div key={member.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group animate-scaleIn relative overflow-hidden">
                  {selectedMemberIds.includes(member.id) && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#fdb913]"></div>
                  )}
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={() => toggleMemberSelection(member.id)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${selectedMemberIds.includes(member.id) ? 'bg-[#004d3d] text-[#fdb913]' : 'bg-slate-50 border border-slate-100'}`}
                    >
                      {selectedMemberIds.includes(member.id) ? <Check size={14} strokeWidth={4} /> : null}
                    </button>
                    <img src={member.avatar} className="w-12 h-12 rounded-2xl border-2 border-white shadow-sm" alt="" />
                    <div>
                      <h4 className="font-black text-[#004d3d] text-sm">{member.name}</h4>
                      <div className="flex items-center space-x-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${member.status === 'active' ? 'bg-geen-500' : 'bg-red-500'}`}></span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{member.status}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <button onClick={() => openIndividualMessage(member.id, 'whatsapp')} className="p-2 text-slate-300 hover:text-geen-500 transition-colors" title="Send WhatsApp">
                      <MessageSquare size={18} />
                    </button>
                    <button onClick={() => openIndividualMessage(member.id, 'email')} className="p-2 text-slate-300 hover:text-blue-500 transition-colors" title="Send Email">
                      <Mail size={18} />
                    </button>
                    <button onClick={() => toggleMemberStatus(member.id)} className="p-2 text-slate-300 hover:text-[#004d3d] transition-colors" title="Toggle Status">
                      <ShieldCheck size={18} />
                    </button>
                    <button onClick={() => removeMember(member.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors" title="Remove Member">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Bulk Actions Floating Bar */}
            {selectedMemberIds.length > 0 && (
              <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] glass-premium rounded-[32px] p-4 flex items-center justify-between shadow-luxury border border-[#004d3d]/10 animate-slideUp z-[100]">
                <div className="pl-4">
                  <p className="text-[10px] font-black text-[#004d3d] uppercase tracking-widest">{selectedMemberIds.length} Selected</p>
                </div>
                <div className="flex items-center space-x-2">
                   <button 
                    onClick={() => { setDirectMsgForm(prev => ({ ...prev, channel: 'whatsapp' })); setIsMessageModalOpen(true); }}
                    className="h-10 px-4 bg-geen-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center space-x-2"
                   >
                     <MessageSquare size={14} /> <span>WhatsApp</span>
                   </button>
                   <button 
                    onClick={() => { setDirectMsgForm(prev => ({ ...prev, channel: 'email' })); setIsMessageModalOpen(true); }}
                    className="h-10 px-4 bg-[#004d3d] text-[#fdb913] rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center space-x-2"
                   >
                     <Mail size={14} /> <span>Email</span>
                   </button>
                   <button onClick={() => setSelectedMemberIds([])} className="h-10 w-10 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center">
                     <X size={14} />
                   </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Experience Management View */}
        {activeSubTab === 'experiences' && (
          <div className="space-y-6">
            <button 
              onClick={() => { setEditingExp(null); setExpForm({ title: '', type: 'One Match', pricePPS: 0, priceSingle: 0, location: '', startDate: '', endDate: '', image: '', features: [] }); setShowExpModal(true); native.hapticImpact(); }}
              className="w-full py-5 bg-[#004d3d] text-[#fdb913] rounded-3xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center space-x-2 active:scale-95 transition-all"
            >
              <Plus size={20} />
              <span>Create New Tour</span>
            </button>
            <div className="space-y-4">
              {experiences.map(exp => (
                <div key={exp.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center space-x-4 animate-scaleIn">
                  <img src={exp.image || 'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?q=80&w=200&auto=format&fit=crop'} className="w-20 h-20 rounded-2xl object-cover" alt="" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-[#004d3d] text-sm truncate">{exp.title}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                      {exp.startDate} - {exp.endDate}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                      PPS: R {exp.pricePPS.toLocaleString()} | S: R {exp.priceSingle.toLocaleString()}
                    </p>
                    <div className="flex items-center space-x-3 mt-3">
                      <button 
                        onClick={() => { setEditingExp(exp); setExpForm(exp); setShowExpModal(true); native.hapticImpact(); }}
                        className="text-[9px] font-black text-[#004d3d] uppercase tracking-widest flex items-center bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100"
                      >
                        <Edit3 size={10} className="mr-1.5" /> Edit
                      </button>
                      <button 
                        onClick={() => { if(confirm("Delete this tour?")) { setExperiences(prev => prev.filter(e => e.id !== exp.id)); native.hapticImpact(); } }}
                        className="text-[9px] font-black text-red-500 uppercase tracking-widest flex items-center bg-red-50 px-3 py-1.5 rounded-lg border border-red-100"
                      >
                        <Trash2 size={10} className="mr-1.5" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mass Broadcast View */}
        {activeSubTab === 'broadcast' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-[#004d3d] rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#fdb913]/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <h3 className="text-xl font-black font-heading mb-2">Global Blast</h3>
              <p className="text-white/60 text-xs font-medium">Broadcast news, updates, or alerts to the entire BOKFONTEIN database instantly.</p>
            </div>
            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Channel</label>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => { setBroadcastForm({ ...broadcastForm, channel: 'whatsapp' }); native.hapticImpact(); }}
                    className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center space-x-2 border transition-all ${broadcastForm.channel === 'whatsapp' ? 'bg-geen-500 text-white border-geen-600 shadow-lg' : 'bg-slate-50 text-slate-400 border-slate-100'}`}
                  >
                    <MessageSquare size={16} /> <span>WhatsApp</span>
                  </button>
                  <button 
                    onClick={() => { setBroadcastForm({ ...broadcastForm, channel: 'email' }); native.hapticImpact(); }}
                    className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center space-x-2 border transition-all ${broadcastForm.channel === 'email' ? 'bg-[#004d3d] text-white border-[#004d3d] shadow-lg' : 'bg-slate-50 text-slate-400 border-slate-100'}`}
                  >
                    <Mail size={16} /> <span>Email</span>
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Message Content</label>
                <textarea 
                  value={broadcastForm.message}
                  onChange={e => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                  placeholder="Howzit fans! Today's braai is moving to the South Gate..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-6 text-sm font-medium focus:ring-2 focus:ring-[#004d3d]/5 min-h-[160px] outline-none"
                />
              </div>
              <button 
                onClick={handleSendBroadcast}
                disabled={!broadcastForm.message || isSending}
                className="w-full py-5 bg-[#fdb913] text-[#004d3d] rounded-3xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center space-x-3 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSending ? <RefreshCw className="animate-spin" size={20} /> : <Send size={20} />}
                <span>{isSending ? 'Sending...' : 'Fire Broadcast'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Moderation View */}
        {activeSubTab === 'moderation' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-red-500 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <div className="flex items-center space-x-3 mb-2">
                <ShieldAlert size={20} className="text-white" />
                <h3 className="text-xl font-black font-heading">Moderation Queue</h3>
              </div>
              <p className="text-white/60 text-xs font-medium">UGC Compliance: Review reported content for objectionable material.</p>
            </div>

            {pendingReports.length === 0 ? (
              <div className="bg-white rounded-[32px] p-12 text-center border border-slate-100 shadow-sm">
                <CheckCircle2 size={48} className="mx-auto text-geen-500 mb-4 opacity-20" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Neighborhood is safe, bru!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingReports.map(report => (
                  <div key={report.id} className="bg-white rounded-[32px] border border-red-100 overflow-hidden shadow-sm animate-scaleIn">
                    <div className="p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2">
                          <AlertCircle size={14} className="text-red-500" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Reported: {report.reason}</span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{report.timestamp}</span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl italic text-sm text-slate-600 border border-slate-100">
                        "{report.postContent}"
                      </div>
                      <div className="flex items-center justify-between pt-2">
                         <div className="flex items-center space-x-2">
                           <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                              <Users size={14} />
                           </div>
                           <span className="text-[10px] font-black text-slate-400 uppercase">User ID: {report.reportedUserId}</span>
                         </div>
                         <div className="flex space-x-2">
                            <button 
                              onClick={() => handleResolveReport(report.id, 'dismiss')}
                              className="px-4 py-2 bg-slate-100 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                            >
                              Dismiss
                            </button>
                            <button 
                              onClick={() => handleResolveReport(report.id, 'remove')}
                              className="px-4 py-2 bg-red-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                            >
                              Remove Post
                            </button>
                         </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Experience Modal */}
      {showExpModal && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-[48px] p-8 sm:p-10 animate-scaleIn relative max-h-[90vh] overflow-y-auto no-scrollbar shadow-luxury">
            <div className="flex items-center justify-between mb-8 sticky top-0 bg-white z-10 py-2">
               <button onClick={() => { setShowExpModal(false); native.hapticImpact(); }} className="p-2 -ml-2 text-slate-400 hover:text-[#004d3d] transition-colors flex items-center space-x-1">
                 <ChevronLeft size={20} />
                 <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
               </button>
               <h3 className="text-xl font-black font-heading text-[#004d3d]">{editingExp ? 'Edit Tour' : 'New Tour'}</h3>
               <div className="w-10"></div>
            </div>

            <div className="space-y-6">
              <div className="relative group">
                <div className="h-40 w-full bg-slate-100 rounded-3xl overflow-hidden border border-dashed border-slate-300 relative">
                  {expForm.image ? (
                    <img src={expForm.image} className="w-full h-full object-cover" alt="Preview" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                      <ImageIcon size={32} strokeWidth={1.5} className="mb-2" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Upload Tour Image</span>
                    </div>
                  )}
                  <input type="file" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                </div>
              </div>

              <AdminInput label="Tour Title" value={expForm.title} onChange={v => setExpForm({...expForm, title: v})} placeholder="e.g. Brisbane Glamping" />
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tour Type</label>
                <select 
                   value={expForm.type}
                   onChange={e => setExpForm({...expForm, type: e.target.value as any})}
                   className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-[#004d3d]/5 outline-none appearance-none"
                >
                  <option value="One Match">One Match</option>
                  <option value="Two Match">Two Match</option>
                  <option value="Full Group Stage">Full Group Stage</option>
                </select>
              </div>

              <AdminInput label="Location" value={expForm.location} onChange={v => setExpForm({...expForm, location: v})} placeholder="Brisbane, AU" />

              <div className="grid grid-cols-2 gap-4">
                <AdminInput label="Start Date" value={expForm.startDate} onChange={v => setExpForm({...expForm, startDate: v})} placeholder="e.g. 20 Aug 2027" />
                <AdminInput label="End Date" value={expForm.endDate} onChange={v => setExpForm({...expForm, endDate: v})} placeholder="e.g. 28 Aug 2027" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <AdminInput label="Price PPS (ZAR)" value={expForm.pricePPS?.toString()} onChange={v => setExpForm({...expForm, pricePPS: parseFloat(v)})} type="number" />
                <AdminInput label="Price Single (ZAR)" value={expForm.priceSingle?.toString()} onChange={v => setExpForm({...expForm, priceSingle: parseFloat(v)})} type="number" />
              </div>

              {/* Tour Inclusions (Features) */}
              <div className="space-y-4 pt-2">
                 <div className="flex items-center justify-between">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tour Inclusions</label>
                   <span className="text-[8px] font-bold text-slate-300 uppercase">Use keywords for icons</span>
                 </div>
                 <div className="flex space-x-2">
                    <input 
                      type="text" 
                      value={inclusionInput}
                      onChange={e => setInclusionInput(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && addInclusion()}
                      placeholder="e.g. Luxury Suite, Braai..."
                      className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-[#004d3d]/5 outline-none" 
                    />
                    <button 
                      onClick={addInclusion}
                      className="w-14 h-14 bg-[#004d3d] text-[#fdb913] rounded-2xl flex items-center justify-center shadow-md active:scale-95 transition-all"
                    >
                      <Plus size={20} />
                    </button>
                 </div>
                 <div className="flex flex-wrap gap-2">
                   {(expForm.features || []).map((feature, idx) => (
                     <div key={idx} className="flex items-center space-x-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl animate-scaleIn">
                        {/* Inline Icon Preview */}
                        <div className="text-[#004d3d]">
                          {feature.toLowerCase().includes('suite') || feature.toLowerCase().includes('accommodation') ? <Bed size={12} /> : 
                           feature.toLowerCase().includes('transport') ? <Bus size={12} /> :
                           feature.toLowerCase().includes('braai') ? <Flame size={12} /> : <Ticket size={12} />}
                        </div>
                        <span className="text-[10px] font-bold text-[#004d3d]">{feature}</span>
                        <button onClick={() => removeInclusion(idx)} className="text-slate-300 hover:text-red-500">
                           <X size={12} />
                        </button>
                     </div>
                   ))}
                   {(expForm.features || []).length === 0 && (
                     <p className="text-[10px] text-slate-300 italic px-2">No inclusions added yet, bru.</p>
                   )}
                 </div>
              </div>

              <div className="pt-6 border-t border-slate-100 space-y-3">
                <button 
                  onClick={handleSaveExp}
                  className="w-full py-5 bg-[#004d3d] text-white rounded-3xl font-black uppercase text-[11px] tracking-widest shadow-xl flex items-center justify-center space-x-2 active:scale-95 transition-all"
                >
                  <Save size={20} />
                  <span>{editingExp ? 'Save Changes' : 'Publish Tour'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CRM Direct Messaging Modal */}
      {isMessageModalOpen && (
        <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-[48px] p-8 animate-scaleIn relative shadow-luxury">
            <button onClick={() => { setIsMessageModalOpen(false); setSelectedMemberIds([]); native.hapticImpact(); }} className="absolute top-8 right-8 text-slate-400 p-2"><X size={24} /></button>
            <div className="mb-8">
              <h3 className="text-2xl font-black font-heading text-[#004d3d] mb-1">Direct Message</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">To: {selectedMemberIds.length} Recipient(s)</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Channel</label>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => { setDirectMsgForm({ ...directMsgForm, channel: 'whatsapp' }); native.hapticImpact(); }}
                    className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center space-x-2 border transition-all ${directMsgForm.channel === 'whatsapp' ? 'bg-geen-500 text-white border-geen-600 shadow-lg' : 'bg-slate-50 text-slate-400 border-slate-100'}`}
                  >
                    <MessageSquare size={16} /> <span>WhatsApp</span>
                  </button>
                  <button 
                    onClick={() => { setDirectMsgForm({ ...directMsgForm, channel: 'email' }); native.hapticImpact(); }}
                    className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center space-x-2 border transition-all ${directMsgForm.channel === 'email' ? 'bg-[#004d3d] text-white border-[#004d3d] shadow-lg' : 'bg-slate-50 text-slate-400 border-slate-100'}`}
                  >
                    <Mail size={16} /> <span>Email</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Message Content</label>
                <textarea 
                  value={directMsgForm.message}
                  onChange={e => setDirectMsgForm({ ...directMsgForm, message: e.target.value })}
                  placeholder="Type your private message..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-6 text-sm font-medium focus:ring-2 focus:ring-[#004d3d]/5 min-h-[140px] outline-none"
                />
              </div>

              <button 
                onClick={handleSendDirectMessage}
                disabled={!directMsgForm.message || isSending}
                className={`w-full py-5 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center space-x-3 active:scale-95 transition-all disabled:opacity-50 ${directMsgForm.channel === 'whatsapp' ? 'bg-geen-500' : 'bg-[#004d3d]'}`}
              >
                {isSending ? <RefreshCw className="animate-spin" size={20} /> : <Send size={20} />}
                <span>{isSending ? 'Sending...' : `Send ${directMsgForm.channel.toUpperCase()}`}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SubNavButton: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void, badge?: number }> = ({ icon, label, active, onClick, badge }) => (
  <button 
    onClick={onClick}
    className={`px-6 py-2.5 rounded-full flex items-center space-x-2 border transition-all shrink-0 active:scale-95 relative ${active ? 'bg-[#004d3d] text-white border-[#004d3d] shadow-md' : 'bg-slate-50 text-slate-400 border-slate-100'}`}
  >
    {icon}
    <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    {badge && (
      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-sm">
        {badge}
      </span>
    )}
  </button>
);

const StatCard: React.FC<{ label: string, value: string, icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
    <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">{icon}</div>
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <h3 className="text-2xl font-black text-[#004d3d] font-heading">{value}</h3>
  </div>
);

const AdminInput: React.FC<{ label: string, value: string | undefined, onChange: (val: string) => void, placeholder?: string, type?: string }> = ({ label, value, onChange, placeholder, type = "text" }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <input 
      type={type} 
      value={value} 
      onChange={e => onChange(e.target.value)} 
      placeholder={placeholder}
      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-[#004d3d]/5 outline-none" 
    />
  </div>
);

export default Admin;
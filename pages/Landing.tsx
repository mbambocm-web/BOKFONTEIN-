import React from 'react';
import { Plane, Globe, ShieldCheck, User } from 'lucide-react';

interface LandingProps {
  onAuth: (role: 'admin' | 'member') => void;
}

const Landing: React.FC<LandingProps> = ({ onAuth }) => {
  return (
    <div className="h-screen w-full relative flex flex-col bg-[#004d3d] overflow-hidden font-logo">
      {/* Immersive Cinematic Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1541252260730-0412e8e2108e?q=80&w=2000&auto=format&fit=crop" 
          alt="Rugby Stadium" 
          className="w-full h-full object-cover opacity-20 scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#004d3d]/70 via-[#004d3d]/90 to-[#004d3d]"></div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col h-full px-8 pt-20 pb-12 overflow-y-auto no-scrollbar">
        
        {/* Branding Section */}
        <div className="animate-fadeIn flex-none mb-10">
          <div className="w-12 h-1 bg-[#fdb913] mb-8 rounded-full"></div>
          <h1 className="text-[44px] sm:text-5xl font-logo text-white leading-none mb-4 logo-shimmer tracking-tighter whitespace-nowrap">
            BOK<span className="text-[#fdb913]">FONTEIN</span>
          </h1>
          <p className="text-white/60 font-semibold tracking-[0.5em] text-[10px] uppercase ml-1">
            THE ULTIMATE FAN EXPERIENCE
          </p>
        </div>

        {/* Value Proposition Section */}
        <div className="flex-none space-y-4 animate-slideUp delay-100">
          <LandingFeature 
            icon={<Plane size={20} />} 
            title="Premium Travel"
            desc="Elite fan travel experiences" 
          />
          <LandingFeature 
            icon={<Globe size={20} />} 
            title="Global Hub"
            desc="Connect with Mzansi fans worldwide" 
          />
          <LandingFeature 
            icon={<ShieldCheck size={20} />} 
            title="Secure Wallet"
            desc="Easy fan payments & rewards" 
          />
        </div>

        {/* Auth Section */}
        <div className="mt-12 flex-none space-y-5 animate-slideUp delay-200">
          <button 
            onClick={() => onAuth('admin')}
            className="w-full h-16 rounded-2xl bg-[#fdb913] text-[#004d3d] font-black text-sm uppercase tracking-[0.3em] active:scale-[0.98] transition-all shadow-2xl shadow-black/40 border-none flex items-center justify-center"
          >
            Enter BOKFONTEIN
          </button>

          <button 
            onClick={() => onAuth('member')}
            className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-[0.3em] active:scale-[0.98] transition-all flex items-center justify-center space-x-3"
          >
            <User size={16} className="text-[#fdb913]" />
            <span>Continue as Guest</span>
          </button>

          <div className="space-y-4 pt-4">
            <div className="flex items-center space-x-6 py-2">
              <div className="flex-1 h-px bg-white/10"></div>
              <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">OR</span>
              <div className="flex-1 h-px bg-white/10"></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SocialGoldTab 
              onClick={() => onAuth('admin')}
              icon={<GoogleIcon className="w-5 h-5 fill-[#004d3d] opacity-90" />}
              label="Google"
            />
            <SocialGoldTab 
              onClick={() => onAuth('admin')}
              icon={<AppleIcon className="w-5 h-5 fill-[#004d3d] opacity-90" />}
              label="Apple"
            />
          </div>

          <p className="text-white/20 text-[8px] text-center font-bold px-10 pt-4 leading-relaxed uppercase tracking-[0.3em]">
            By joining, you agree to the BOKFONTEIN Terms and Privacy Policy.
          </p>
        </div>

        <div className="flex-grow min-h-[40px]"></div>

        <div className="flex flex-col items-center flex-none">
          <p className="text-[#fdb913]/40 text-[7px] uppercase font-bold tracking-[0.6em]">
            © SPORTS TRAVEL EXPERIENCES 2026
          </p>
        </div>
      </div>
    </div>
  );
};

const LandingFeature: React.FC<{ icon: React.ReactNode, title: string, desc: string }> = ({ icon, title, desc }) => (
  <div className="flex items-center space-x-5 bg-white/5 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-xl">
    <div className="bg-[#fdb913] p-2.5 rounded-xl shrink-0 text-[#004d3d] shadow-lg">
      {icon}
    </div>
    <div className="font-heading">
      <h3 className="text-white font-black text-xs leading-tight tracking-widest uppercase">{title}</h3>
      <p className="text-white/40 text-[10px] mt-1 leading-tight font-bold">{desc}</p>
    </div>
  </div>
);

const SocialGoldTab: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void }> = ({ icon, label, onClick }) => (
  <button 
    onClick={onClick}
    className="w-full h-14 rounded-2xl bg-white text-[#004d3d] flex items-center justify-center space-x-3 active:scale-[0.98] transition-all shadow-xl font-black text-[11px] uppercase tracking-widest border-none"
  >
    {icon}
    <span>{label}</span>
  </button>
);

const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const AppleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 384 512">
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
  </svg>
);

export default Landing;
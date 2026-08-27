import { useState, useEffect, useRef } from 'react';
import {
  Compass,
  Play,
  Clock,
  PlusCircle,
  CheckCircle2,
  Radio,
  Server,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
} from 'lucide-react';
import { useInvestigation } from '../../context/InvestigationContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';




export const TopNav: React.FC = () => {
  const {
    executeDemo,
    loading,
    setActivePage,
    investigationList,
    investigation,
    spcsftLiveDetections,
    spcsftSyncEnabled,
  } = useInvestigation();
  const [timeString, setTimeString] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // hour '0' becomes '12'
      const strHours = String(hours).padStart(2, '0');

      setTimeString(`${strHours}:${minutes}:${seconds} ${ampm}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeCount = investigationList.length;

  const { user, logout, dockerTelemetry } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-14 bg-[#0c121e] border-b border-[rgba(255,255,255,0.08)] px-4 sm:px-6 flex items-center justify-between select-none z-30 sticky top-0 shrink-0">
      {/* LEFT: Brand & Active Case indicator */}
      <div className="flex items-center gap-4 min-w-0">
        <div
          onClick={() => setActivePage('dashboard')}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          {/* Crisp Logo */}
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/25 flex items-center justify-center group-hover:bg-sky-500/15 group-hover:border-sky-400/40 transition-all">
            <Compass className="w-4.5 h-4.5 text-sky-400" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold tracking-tight text-slate-100 text-sm">
                MarineTrace
              </span>
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                v2.4
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              Maritime Pollution Intelligence System
            </p>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="h-5 w-px bg-slate-800 hidden md:block" />

        {/* Active Incident Pill */}
        {investigation ? (
          <div
            onClick={() => setActivePage('investigation')}
            className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs cursor-pointer hover:bg-rose-500/15 transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            <span className="font-medium text-[11px]">
              Incident #{investigation.investigation_id}
            </span>
            <span className="text-[10px] font-mono text-rose-400 font-semibold bg-rose-500/20 px-1.5 py-0.2 rounded">
              {(investigation.spill.confidence * 100).toFixed(0)}% Match
            </span>
          </div>
        ) : activeCount > 0 ? (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            <span className="font-medium text-[11px]">{activeCount} Case Active</span>
          </div>
        ) : null}

        {/* Space Shift Real-Time Telemetry Pill */}
        <div
          onClick={() => setActivePage('spcsft-realtime')}
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs cursor-pointer hover:bg-cyan-500/20 transition-all group"
          title="Open Space Shift SateAIs Real-Time Surveillance"
        >
          <Radio className={`w-3 h-3 ${spcsftSyncEnabled ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
          <span className="font-semibold text-[11px] group-hover:text-white transition-colors">Space Shift API:</span>
          <span className="font-mono text-[10px] text-cyan-200 font-bold bg-cyan-500/20 px-1.5 py-0.2 rounded border border-cyan-500/30">
            {spcsftLiveDetections.length} Live Slicks
          </span>
        </div>
      </div>

      {/* CENTER: Clean System Telemetry */}
      <div className="hidden xl:flex items-center gap-2 px-3 py-1 bg-slate-900/60 rounded-full border border-slate-800/80 text-xs text-slate-400">
        <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Operational</span>
        </span>
        <span className="text-slate-700">·</span>
        <span>Sentinel-1 SAR</span>
        <span className="text-slate-700">·</span>
        <span>OpenDrift</span>
        <span className="text-slate-700">·</span>
        <span>AIS Feed</span>
      </div>

      {/* RIGHT: Actions, Docker Logs & User Profile */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Live 12-Hour Clock */}
        <div className="hidden lg:flex items-center gap-2 font-mono text-[11px] px-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-lg shadow-sm select-none">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <span className="text-cyan-300 font-bold tabular-nums tracking-tight">
            {timeString || '--:--:-- --'}
          </span>
        </div>

        {/* Docker Logs Quick Link */}
        <button
          onClick={() => setActivePage('access-logs')}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-medium transition-all group"
          title="View Docker Login & Activity Logs"
        >
          <Server className="w-3.5 h-3.5 text-cyan-400 group-hover:animate-pulse" />
          <span className="hidden xl:inline">Docker Logs</span>
          <span className="text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 px-1 rounded">
            {dockerTelemetry?.total_logins_recorded ?? 1}
          </span>
        </button>

        {/* Theme Switcher Toggle (Light / Dark) */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-medium transition-all group cursor-pointer"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-45 transition-transform" />
              <span className="hidden xl:inline text-[11px]">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-sky-500 group-hover:-rotate-12 transition-transform" />
              <span className="hidden xl:inline text-[11px]">Dark</span>
            </>
          )}
        </button>

        {/* Replay Demo Button */}
        <button
          onClick={executeDemo}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white rounded-md text-xs font-medium transition-all disabled:opacity-50"
        >
          <Play className="w-3 h-3 text-sky-400 fill-sky-400" />
          <span>{loading ? 'Simulating...' : 'Demo Scenario'}</span>
        </button>


        {/* New Investigation Primary Action */}
        <button
          onClick={() => setActivePage('new-investigation')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-md text-xs font-medium shadow-sm transition-all"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>New Investigation</span>
        </button>

        {/* User Profile Menu */}
        <div className="relative pl-1 border-l border-slate-800" ref={menuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 px-2 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/70 transition-all cursor-pointer text-left"
          >
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-cyan-500/30 to-sky-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-xs">
              {user?.full_name ? user.full_name.charAt(0) : 'U'}
            </div>
            <div className="hidden md:block">
              <div className="text-xs font-semibold text-slate-200 leading-tight max-w-[120px] truncate">
                {user?.full_name || 'Operator'}
              </div>
              <div className="text-[9px] text-cyan-400/80 font-mono truncate max-w-[120px]">
                {user?.role || 'Analyst'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* User Dropdown */}
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#090e1a] border border-slate-800 shadow-2xl p-2 z-50 text-xs animate-in fade-in zoom-in-95">
              <div className="p-3 bg-slate-900/70 rounded-lg border border-slate-800/80 mb-2">
                <div className="font-bold text-slate-100">{user?.full_name}</div>
                <div className="text-[11px] text-cyan-400 font-mono mt-0.5">{user?.email}</div>
                <div className="text-[10px] text-slate-400 mt-1">{user?.agency}</div>
                <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500">Docker Status:</span>
                  <span className="text-emerald-400 font-mono font-medium">● Connected</span>
                </div>
              </div>

              <div className="space-y-1">
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    setActivePage('access-logs');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition-colors text-left"
                >
                  <Server className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Docker & Login Logs</span>
                </button>

                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-rose-950/40 text-rose-300 hover:text-rose-200 transition-colors text-left"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span>Log Out / Switch Operator</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};



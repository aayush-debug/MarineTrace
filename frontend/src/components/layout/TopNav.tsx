import { useState, useEffect, useRef } from 'react';
import {
  Compass,
  Play,
  Clock,
  PlusCircle,
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
  const [utcString, setUtcString] = useState<string>('');
  const [localString, setLocalString] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // UTC Zulu Time
      const utcHours = String(now.getUTCHours()).padStart(2, '0');
      const utcMinutes = String(now.getUTCMinutes()).padStart(2, '0');
      const utcSeconds = String(now.getUTCSeconds()).padStart(2, '0');
      setUtcString(`${utcHours}:${utcMinutes}:${utcSeconds}Z`);

      // Local 12h Time
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      setLocalString(`${String(hours).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`);
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
    <header className="h-14 bg-[#070d1d] border-b border-[rgba(0,240,255,0.18)] px-4 sm:px-6 flex items-center justify-between gap-3 select-none z-30 sticky top-0 shrink-0 overflow-x-clip shadow-lg shadow-black/40 no-print">
      {/* LEFT: NASA Mission Control Brand & Active Orbit Indicator */}
      <div className="flex items-center gap-3 min-w-0 shrink-0">
        <div
          onClick={() => setActivePage('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
        >
          {/* Mission Control Insignia */}
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-cyan-500/20 to-sky-900/40 border border-cyan-400/40 flex items-center justify-center group-hover:border-cyan-300 group-hover:shadow-[0_0_12px_rgba(0,240,255,0.3)] transition-all shrink-0">
            <Compass className="w-4.5 h-4.5 text-cyan-400 group-hover:rotate-45 transition-transform duration-500" />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex flex-col">
              <span className="font-orbitron font-bold tracking-wider text-slate-100 text-xs sm:text-sm whitespace-nowrap uppercase">
                MarineTrace
              </span>
              <span className="text-[8px] font-mono tracking-widest text-cyan-400/80 uppercase -mt-0.5">
                Mission Control · SAR
              </span>
            </div>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 whitespace-nowrap">
              MCC-2.4
            </span>
          </div>
        </div>

        {/* Vertical HUD Divider */}
        <div className="h-5 w-px bg-cyan-900/40 hidden md:block shrink-0" />

        {/* Active Incident Telemetry Pill */}
        {investigation ? (
          <div
            onClick={() => setActivePage('investigation')}
            className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs cursor-pointer hover:bg-rose-900/30 hover:border-rose-400 transition-all shrink-0 whitespace-nowrap shadow-[0_0_8px_rgba(255,0,85,0.2)]"
            title={`Active Target #${investigation.investigation_id}`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
            <span className="font-mono font-bold text-[10px] tracking-wide uppercase text-rose-200">
              TARGET #{investigation.investigation_id}
            </span>
            <span className="text-[9px] font-mono text-rose-300 font-bold bg-rose-900/60 px-1.5 py-0.2 rounded border border-rose-500/30 shrink-0">
              {(investigation.spill.confidence * 100).toFixed(0)}% MATCH
            </span>
          </div>
        ) : activeCount > 0 ? (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs shrink-0 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
            <span className="font-mono text-[10px] tracking-wide uppercase">{activeCount} MISSIONS ACTIVE</span>
          </div>
        ) : null}
      </div>

      {/* CENTER: Constellation & Satellite Telemetry (Large screens) */}
      <div className="hidden 2xl:flex items-center gap-2.5 px-3.5 py-1 bg-[#0a1126]/90 rounded-md border border-cyan-500/20 text-xs font-mono text-slate-300 shrink-0 whitespace-nowrap">
        <span className="flex items-center gap-1.5 text-emerald-400 font-semibold shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>SYS NOMINAL</span>
        </span>
        <span className="text-cyan-900">|</span>
        <span className="text-cyan-400 font-medium shrink-0">S1A C-SAR (VV+VH)</span>
        <span className="text-cyan-900">|</span>
        <span className="text-slate-400 shrink-0">OPENDRIFT v1.14</span>
        <span className="text-cyan-900">|</span>
        <span className="text-slate-400 shrink-0">AIS STREAM WSS</span>
      </div>

      {/* RIGHT: Actions, UTC Clocks, Docker Logs & Flight Director Menu */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 whitespace-nowrap">
        {/* Space Shift Real-Time Telemetry Radar Pill */}
        <div
          onClick={() => setActivePage('spcsft-realtime')}
          className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-md bg-cyan-950/60 border border-cyan-500/35 text-cyan-300 text-xs cursor-pointer hover:bg-cyan-900/40 hover:border-cyan-400 transition-all group shrink-0 whitespace-nowrap"
          title="Open Space Shift Orbital Radar Ground Station"
        >
          <Radio className={`w-3.5 h-3.5 shrink-0 ${spcsftSyncEnabled ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
          <span className="font-mono text-[10px] tracking-wider uppercase group-hover:text-white transition-colors shrink-0">
            RADAR FEED:
          </span>
          <span className="font-mono text-[10px] text-cyan-200 font-bold bg-cyan-500/20 px-1.5 py-0.2 rounded border border-cyan-400/40 shrink-0">
            {spcsftLiveDetections.length} TARGETS
          </span>
        </div>

        {/* Dual Zulu UTC & Local Mission Clock */}
        <div className="hidden lg:flex items-center gap-2 font-mono text-[11px] px-2.5 py-1 bg-[#091124] border border-cyan-500/25 rounded-md shadow-inner select-none shrink-0 whitespace-nowrap">
          <div className="flex items-center gap-1.5 text-cyan-400 shrink-0">
            <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0" />
            <span className="text-[9px] font-bold tracking-wider text-cyan-500 uppercase">UTC:</span>
          </div>
          <span className="text-cyan-300 font-bold tabular-nums tracking-wider shrink-0">
            {utcString || '--:--:--Z'}
          </span>
          <span className="text-slate-700 hidden 2xl:inline">|</span>
          <span className="text-slate-400 text-[10px] hidden 2xl:inline tabular-nums">
            {localString}
          </span>
        </div>

        {/* System Telemetry & Logs Link */}
        <button
          onClick={() => setActivePage('access-logs')}
          className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#0a1126] hover:bg-cyan-950/50 border border-cyan-500/25 text-slate-300 hover:text-cyan-200 text-xs font-mono transition-all group shrink-0 whitespace-nowrap"
          title="View Node Telemetry & Security Audit Trail"
        >
          <Server className="w-3.5 h-3.5 text-cyan-400 group-hover:animate-pulse shrink-0" />
          <span className="hidden 2xl:inline text-[11px]">NODE LOGS</span>
          <span className="text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 px-1 rounded border border-cyan-500/30 shrink-0">
            {dockerTelemetry?.total_logins_recorded ?? 1}
          </span>
        </button>

        {/* Theme Switcher Toggle (Mission Dark / Flight Ops Light) */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-md bg-[#0a1126] hover:bg-cyan-950/50 border border-cyan-500/25 text-slate-300 hover:text-white text-xs font-medium transition-all group cursor-pointer shrink-0"
          title={theme === 'dark' ? 'Switch to Flight Ops Light Mode' : 'Switch to Mission Control Void Mode'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-45 transition-transform shrink-0" />
              <span className="hidden 2xl:inline text-[10px] font-mono">LIGHT</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-sky-400 group-hover:-rotate-12 transition-transform shrink-0" />
              <span className="hidden 2xl:inline text-[10px] font-mono">VOID</span>
            </>
          )}
        </button>

        {/* Replay Simulation Scenario Action */}
        <button
          onClick={executeDemo}
          disabled={loading}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#0a1126] hover:bg-cyan-950/60 border border-cyan-500/30 text-slate-200 hover:text-cyan-200 rounded-md text-xs font-mono transition-all disabled:opacity-50 shrink-0 whitespace-nowrap"
        >
          <Play className="w-3 h-3 text-cyan-400 fill-cyan-400 shrink-0" />
          <span>{loading ? 'SIMULATING...' : 'DEMO FLIGHT'}</span>
        </button>

        {/* Launch New Investigation Primary Action */}
        <button
          onClick={() => setActivePage('new-investigation')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white rounded-md text-xs font-mono font-bold shadow-[0_0_12px_rgba(0,240,255,0.3)] transition-all shrink-0 whitespace-nowrap cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">NEW TARGET</span>
          <span className="sm:hidden">NEW</span>
        </button>

        {/* Flight Director / Operator Clearance Dropdown */}
        <div className="relative pl-1 border-l border-cyan-900/30 shrink-0" ref={menuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 px-2 py-1 rounded-md bg-[#091124] hover:bg-cyan-950/40 border border-cyan-500/30 transition-all cursor-pointer text-left shrink-0"
          >
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-cyan-500/30 to-sky-700/30 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-mono font-bold text-xs shrink-0">
              {user?.full_name ? user.full_name.charAt(0) : 'O'}
            </div>
            <div className="hidden md:block">
              <div className="text-xs font-semibold text-slate-200 leading-tight max-w-[115px] truncate">
                {user?.full_name || 'Flight Director'}
              </div>
              <div className="text-[8px] text-cyan-400 font-mono truncate max-w-[115px] uppercase tracking-wider">
                {user?.role || 'Mission Lead'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-cyan-400/70 hidden sm:block shrink-0" />
          </button>

          {/* Tactical User Dropdown */}
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-lg bg-[#070d1d] border border-cyan-500/40 shadow-2xl p-2.5 z-50 text-xs animate-in fade-in zoom-in-95 backdrop-blur-xl">
              <div className="p-3 bg-[#0a1126] rounded-md border border-cyan-500/25 mb-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-100">{user?.full_name}</span>
                  <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                    CLEARANCE L3
                  </span>
                </div>
                <div className="text-[10px] text-cyan-400 font-mono mt-0.5">{user?.email}</div>
                <div className="text-[10px] text-slate-400 mt-1">{user?.agency}</div>
                <div className="mt-2.5 pt-2 border-t border-cyan-900/40 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-400">MISSION NODE:</span>
                  <span className="text-emerald-400 font-semibold">● ONLINE</span>
                </div>
              </div>

              <div className="space-y-1 font-mono text-[11px]">
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    setActivePage('access-logs');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-cyan-950/50 text-slate-300 hover:text-cyan-200 transition-colors text-left"
                >
                  <Server className="w-3.5 h-3.5 text-cyan-400" />
                  <span>NODE TELEMETRY & AUDIT</span>
                </button>

                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-rose-950/40 text-rose-300 hover:text-rose-200 transition-colors text-left"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span>ABORT SESSION / LOGOUT</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

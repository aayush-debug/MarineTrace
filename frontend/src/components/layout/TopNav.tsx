import { useState, useEffect, useRef } from 'react';
import {
  Compass,
  Play,
  Clock,
  Radio,
  Server,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
  LogIn,
} from 'lucide-react';
import { useInvestigation } from '../../context/InvestigationContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export const TopNav: React.FC = () => {
  const {
    executeDemo,
    loading,
    setActivePage,
    investigation,
    spcsftLiveDetections,
    spcsftSyncEnabled,
    setIsIncidentSelectorOpen,
  } = useInvestigation();
  const [utcString, setUtcString] = useState<string>('');
  const [localString, setLocalString] = useState<string>('');
  const [timeMode, setTimeMode] = useState<'both' | 'local' | 'utc'>('both');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // UTC Zulu Time
      const utcHours = String(now.getUTCHours()).padStart(2, '0');
      const utcMinutes = String(now.getUTCMinutes()).padStart(2, '0');
      const utcSeconds = String(now.getUTCSeconds()).padStart(2, '0');
      setUtcString(`${utcHours}:${utcMinutes}:${utcSeconds} UTC`);

      // Local System Time (e.g., 01:14:32 IST)
      try {
        const timeStr = now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        });
        const tzAbbr =
          new Intl.DateTimeFormat('en', { timeZoneName: 'short' })
            .formatToParts(now)
            .find((p) => p.type === 'timeZoneName')?.value || 'LOCAL';
        setLocalString(`${timeStr} ${tzAbbr}`);
      } catch {
        setLocalString(now.toLocaleTimeString());
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const { user, isAuthenticated, logout } = useAuth();
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
    <header className="h-12 bg-[#111622] border-b border-[#1e293b] px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-3 select-none z-30 sticky top-0 shrink-0 shadow-sm no-print">
      {/* LEFT: Product Brand & Active Case Indicator */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 shrink-0">
        <div
          onClick={() => setActivePage('dashboard')}
          className="flex items-center gap-2 cursor-pointer group shrink-0"
        >
          <div className="w-7 h-7 rounded bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 group-hover:border-blue-400 transition-colors shrink-0">
            <Compass className="w-4 h-4 text-blue-400" />
          </div>

          <div className="flex items-baseline gap-1.5 shrink-0">
            <span className="font-semibold text-slate-100 text-sm tracking-tight whitespace-nowrap">
              MarineTrace
            </span>
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
              v2.4
            </span>
          </div>
        </div>

        {/* Structural Divider */}
        <div className="h-4 w-px bg-slate-800 hidden md:block shrink-0" />

        {/* Active Incident Case Pill & Scenario Picker */}
        {investigation ? (
          <div className="hidden md:flex items-center gap-1 shrink-0">
            <div
              onClick={() => setActivePage('investigation')}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#161e2e] border border-rose-900/60 text-slate-200 text-xs cursor-pointer hover:border-rose-700/80 transition-colors shrink-0 whitespace-nowrap"
              title={`Active Case #${investigation.investigation_id} — Click to view investigation`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span className="font-mono font-medium text-[11px] text-slate-200">
                Case #{investigation.investigation_id}
              </span>
              <span className="text-[9px] font-mono text-rose-400 font-semibold bg-rose-950 px-1 py-0.2 rounded border border-rose-900/60 shrink-0">
                {(investigation.spill.confidence * 100).toFixed(0)}% Conf
              </span>
            </div>

            <button
              onClick={() => setIsIncidentSelectorOpen(true)}
              className="px-2 py-0.5 rounded bg-[#111622] hover:bg-[#161e2e] border border-[#1e293b] hover:border-blue-500/60 text-blue-400 hover:text-blue-300 text-[10px] font-mono transition-colors cursor-pointer whitespace-nowrap"
              title="Open Oil Spill Target Selector"
            >
              Switch Spill
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsIncidentSelectorOpen(true)}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-medium cursor-pointer transition-colors shrink-0"
          >
            <Compass className="w-3.5 h-3.5 text-blue-400" />
            <span>Select Target Oil Spill</span>
          </button>
        )}
      </div>

      {/* CENTER: Compact Status (Only on massive screens to prevent overflow) */}
      <div className="hidden 2xl:flex items-center gap-2.5 px-2.5 py-0.5 bg-[#0c1017] rounded border border-[#1e293b] text-xs font-mono text-slate-400 shrink-0 whitespace-nowrap">
        <span className="flex items-center gap-1 text-emerald-400 text-[10px] font-medium shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Operational</span>
        </span>
        <span className="text-slate-700">|</span>
        <span className="text-[10px]">Sentinel-1A SAR</span>
        <span className="text-slate-700">|</span>
        <span className="text-[10px]">CMEMS Ocean</span>
      </div>

      {/* RIGHT: Actions, Chronometer & Operator Profile / Login */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto whitespace-nowrap">
        {/* SpaceShift Real-Time Radar Feed Status */}
        <div
          onClick={() => setActivePage('spcsft-realtime')}
          className="hidden xl:flex items-center gap-1.5 px-2 py-1 rounded bg-[#161e2e] border border-[#1e293b] text-slate-300 text-xs cursor-pointer hover:border-slate-700 hover:text-slate-100 transition-colors shrink-0 whitespace-nowrap"
          title="SpaceShift Satellite Radar Feed"
        >
          <Radio className={`w-3 h-3 shrink-0 ${spcsftSyncEnabled ? 'text-blue-400' : 'text-slate-500'}`} />
          <span className="text-[10px] font-medium shrink-0">Radar:</span>
          <span className="font-mono text-[9px] text-blue-300 font-semibold bg-blue-950/60 px-1 py-0.2 rounded border border-blue-900/60 shrink-0">
            {spcsftLiveDetections.length} Targets
          </span>
        </div>

        {/* Real-Time Live Chronometer (Dual Local & UTC Zulu Time) */}
        <div
          onClick={() => setTimeMode((prev) => (prev === 'both' ? 'local' : prev === 'local' ? 'utc' : 'both'))}
          className="hidden lg:flex items-center gap-2 font-mono text-xs px-2.5 py-1 bg-[#0c1017] border border-[#1e293b] rounded text-slate-300 select-none shrink-0 whitespace-nowrap cursor-pointer hover:border-slate-700 transition-colors"
          title="Live Mission Clock — Click to toggle Local / UTC / Both"
        >
          <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          {timeMode !== 'utc' && (
            <span className="text-slate-100 text-[11px] font-semibold tabular-nums tracking-tight">
              {localString || '--:--:--'}
            </span>
          )}
          {timeMode === 'both' && <span className="text-slate-600">·</span>}
          {timeMode !== 'local' && (
            <span className="text-slate-400 text-[10px] tabular-nums">
              {utcString || '--:--:-- UTC'}
            </span>
          )}
        </div>

        {/* Theme Switcher Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center p-1.5 rounded bg-[#161e2e] hover:bg-[#1c2638] border border-[#1e293b] text-slate-400 hover:text-slate-200 text-xs transition-colors cursor-pointer shrink-0"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          )}
        </button>

        {/* Load Preset Demo Scenario */}
        <button
          onClick={executeDemo}
          disabled={loading}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-[#161e2e] hover:bg-[#1c2638] border border-[#1e293b] text-slate-200 hover:text-white rounded text-xs font-medium transition-colors disabled:opacity-50 shrink-0 whitespace-nowrap cursor-pointer"
        >
          <Play className="w-3 h-3 text-blue-400 fill-blue-400 shrink-0" />
          <span className="text-[11px]">{loading ? 'Simulating...' : 'Demo Scenario'}</span>
        </button>

        {/* Primary Action: Real-Time Satellite Surveillance */}
        <button
          onClick={() => setActivePage('spcsft-realtime')}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium shadow-sm transition-colors shrink-0 whitespace-nowrap cursor-pointer"
        >
          <Radio className="w-3.5 h-3.5 shrink-0 animate-pulse" />
          <span className="hidden sm:inline text-[11px]">Live Surveillance</span>
        </button>

        {/* OPERATOR PROFILE & LOG-IN DROPDOWN (Always Fully Visible on Far Right) */}
        <div className="relative pl-1 border-l border-slate-800 shrink-0" ref={menuRef}>
          {isAuthenticated && user ? (
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-1.5 sm:gap-2 px-2 py-1 rounded bg-[#161e2e] hover:bg-[#1c2638] border border-[#1e293b] transition-colors cursor-pointer text-left shrink-0"
              title={`${user.full_name} (${user.role})`}
            >
              <div className="w-6 h-6 rounded bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-300 font-mono font-bold text-xs shrink-0">
                {user.full_name ? user.full_name.charAt(0) : 'U'}
              </div>
              <div className="hidden sm:block">
                <div className="text-[11px] font-medium text-slate-200 leading-tight max-w-[100px] md:max-w-[130px] truncate">
                  {user.full_name || 'Operator'}
                </div>
                <div className="text-[9px] text-slate-400 font-mono truncate max-w-[100px] md:max-w-[130px]">
                  {user.role || 'Investigator'}
                </div>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>
          ) : (
            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#161e2e] hover:bg-blue-950 border border-slate-800 hover:border-blue-700 text-blue-400 text-xs font-medium transition-colors cursor-pointer shrink-0"
            >
              <LogIn className="w-3.5 h-3.5 shrink-0" />
              <span>Log In</span>
            </button>
          )}

          {/* User Profile Context Menu */}
          {userMenuOpen && user && (
            <div className="absolute right-0 mt-1.5 w-68 rounded bg-[#111622] border border-[#1e293b] shadow-2xl p-2.5 z-50 text-xs animate-in fade-in">
              <div className="p-2.5 bg-[#161e2e] rounded border border-slate-800 mb-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-100 truncate">{user.full_name}</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-800/60 shrink-0">
                    Active
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">{user.email}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 truncate">{user.agency}</div>
                <div className="mt-2 pt-1.5 border-t border-slate-800 flex items-center justify-between text-[9px] font-mono">
                  <span className="text-slate-400">Node Status:</span>
                  <span className="text-emerald-400 font-medium">● Connected</span>
                </div>
              </div>

              <div className="space-y-0.5 font-sans text-xs">
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    setActivePage('access-logs');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-[#161e2e] text-slate-300 hover:text-white transition-colors text-left cursor-pointer"
                >
                  <Server className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Audit Logs & Node Telemetry</span>
                </button>

                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 transition-colors text-left cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>Sign Out / Switch Operator</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

import {
  LayoutDashboard,
  PlusCircle,
  Search,
  Compass,
  Ship,
  Satellite,
  FileText,
  ChevronRight,
  ShieldAlert,
  Radio,
  Server,
  Cpu,
} from 'lucide-react';
import { useInvestigation, type PageId } from '../../context/InvestigationContext';

interface NavItem {
  id: PageId;
  label: string;
  code: string;
  badge?: string;
  badgeType?: 'alert' | 'info' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
}

const PRIMARY_NAV: NavItem[] = [
  { id: 'dashboard', label: 'Situation Overview', code: 'MCC-01', icon: LayoutDashboard },
  { id: 'spcsft-realtime', label: 'Space Shift Ground Station', code: 'SAT-02', icon: Radio, badge: 'LIVE', badgeType: 'alert' },
  { id: 'new-investigation', label: 'Launch New Target', code: 'OPS-03', icon: PlusCircle },
  { id: 'satellite', label: 'Sentinel-1 SAR Ingestion', code: 'SAR-04', icon: Satellite },
  { id: 'investigation', label: 'Workspace & Reticle', code: 'HUD-05', icon: Search, badge: 'Target', badgeType: 'alert' },
];

const ANALYTICS_NAV: NavItem[] = [
  { id: 'drift', label: 'Drift Physics Matrix', code: 'SIM-06', icon: Compass },
  { id: 'attribution', label: 'AIS Correlation Scoring', code: 'AIS-07', icon: Ship, badge: 'Scored', badgeType: 'info' },
  { id: 'reports', label: 'Mission Incident Dossier', code: 'DOC-08', icon: FileText },
];

const SYSTEM_NAV: NavItem[] = [
  { id: 'access-logs', label: 'Telemetry & Security Node', code: 'SYS-09', icon: Server, badge: 'Audit', badgeType: 'info' },
];

export const Sidebar: React.FC = () => {
  const { activePage, setActivePage, investigation } = useInvestigation();

  const renderNavGroup = (items: NavItem[]) => (
    <div className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activePage === item.id;

        return (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all group relative border cursor-pointer ${
              isActive
                ? 'bg-cyan-950/50 text-cyan-300 border-cyan-500/40 shadow-[0_0_12px_rgba(0,240,255,0.15)] font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#0c1630]/60 border-transparent'
            }`}
          >
            {/* Active Left Indicator Bar */}
            {isActive && (
              <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
            )}

            <div className="flex items-center gap-2.5 min-w-0">
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-cyan-300'
                }`}
              />
              <div className="flex flex-col text-left truncate">
                <span className="truncate">{item.label}</span>
                <span className="text-[8px] font-mono text-cyan-500/70 -mt-0.5 tracking-wider">
                  [{item.code}]
                </span>
              </div>
            </div>

            {/* Tactical Badges */}
            <div className="flex items-center gap-1 shrink-0 ml-1">
              {item.badge && (
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                    item.badgeType === 'alert'
                      ? isActive
                        ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                        : 'bg-rose-950/60 text-rose-400 border border-rose-500/30'
                      : isActive
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                      : 'bg-[#0b1428] text-slate-400 border border-slate-700/50'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );

  return (
    <aside className="w-64 bg-[#060b18] border-r border-[rgba(0,240,255,0.15)] flex flex-col justify-between select-none z-20 shrink-0 shadow-xl shadow-black/60">
      {/* Navigation Subsystem Groups */}
      <nav className="p-3 space-y-4.5 overflow-y-auto">
        <div>
          <div className="px-2.5 pb-1.5 text-[9px] font-mono font-bold tracking-widest text-cyan-500/90 uppercase flex items-center gap-1.5">
            <span className="text-cyan-400">//</span>
            <span>01 · ORBITAL SURVEILLANCE</span>
          </div>
          {renderNavGroup(PRIMARY_NAV)}
        </div>

        <div>
          <div className="px-2.5 pb-1.5 text-[9px] font-mono font-bold tracking-widest text-cyan-500/90 uppercase flex items-center gap-1.5">
            <span className="text-cyan-400">//</span>
            <span>02 · FORENSIC INTELLIGENCE</span>
          </div>
          {renderNavGroup(ANALYTICS_NAV)}
        </div>

        <div>
          <div className="px-2.5 pb-1.5 text-[9px] font-mono font-bold tracking-widest text-cyan-500/90 uppercase flex items-center gap-1.5">
            <span className="text-cyan-400">//</span>
            <span>03 · SYSTEM NODE TELEMETRY</span>
          </div>
          {renderNavGroup(SYSTEM_NAV)}
        </div>
      </nav>

      {/* Bottom Panel: Active Target Telemetry Module */}
      <div className="p-3 border-t border-[rgba(0,240,255,0.15)] bg-[#040814]">
        {investigation ? (
          <div
            onClick={() => setActivePage('investigation')}
            className="p-3 rounded-md bg-[#081024] border border-cyan-500/30 hover:border-cyan-400 cursor-pointer transition-all space-y-2 group shadow-inner relative"
          >
            {/* Tactical Corner Brackets */}
            <div className="absolute top-1 right-1 w-1.5 h-1.5 border-t border-r border-cyan-400" />
            <div className="absolute bottom-1 left-1 w-1.5 h-1.5 border-b border-l border-cyan-400" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-100">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                <span className="font-mono text-[11px] tracking-wide uppercase">ACTIVE TARGET</span>
              </div>
              <span className="text-[9px] font-mono text-emerald-300 font-bold bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-500/40">
                {(investigation.spill.confidence * 100).toFixed(0)}% CONF
              </span>
            </div>

            <div className="text-[11px] font-mono text-cyan-300 font-bold tracking-wider truncate">
              #{investigation.investigation_id}
            </div>

            <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400 pt-1.5 border-t border-cyan-900/40 font-mono">
              <div>
                <span className="text-slate-500 text-[9px] block">SLICK AREA:</span>
                <span className="text-cyan-200 font-semibold">{investigation.spill.area_km2.toFixed(1)} KM²</span>
              </div>
              <div>
                <span className="text-slate-500 text-[9px] block">SUSPECT:</span>
                <span className="text-rose-300 font-semibold truncate block">
                  {investigation.vessels[0]?.vessel_name || 'FLAGGED'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400 pt-1 font-semibold group-hover:text-cyan-300">
              <span>ENGAGE RETICLE</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ) : (
          <div className="p-2.5 rounded-md bg-[#081024]/60 border border-slate-800 text-center font-mono">
            <p className="text-[10px] text-slate-400 tracking-wide">NO ACTIVE TARGET</p>
            <p className="text-[9px] text-slate-500 mt-0.5">Awaiting SAR Pass / Ingest</p>
          </div>
        )}

        <div className="mt-2.5 flex items-center justify-between text-[9px] font-mono text-slate-400 px-1">
          <span className="flex items-center gap-1">
            <Cpu className="w-3 h-3 text-cyan-400" />
            <span>UNET-RESNET34</span>
          </span>
          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            STANDBY
          </span>
        </div>
      </div>
    </aside>
  );
};

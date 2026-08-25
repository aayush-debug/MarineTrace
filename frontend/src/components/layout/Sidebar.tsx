import {
  LayoutDashboard,
  PlusCircle,
  Search,
  Compass,
  Ship,
  Satellite,
  FileText,
  AlertTriangle,
  Cpu,
  ChevronRight,
} from 'lucide-react';
import { useInvestigation, type PageId } from '../../context/InvestigationContext';

interface NavItem {
  id: PageId;
  label: string;
  shortLabel: string;
  badge?: string;
  badgeColor?: string;
  icon: React.ComponentType<{ className?: string }>;
  step: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', shortLabel: 'Overview', icon: LayoutDashboard, step: '00' },
  { id: 'new-investigation', label: 'New Investigation', shortLabel: 'New Invest.', icon: PlusCircle, step: '01' },
  { id: 'satellite', label: 'Satellite Imagery', shortLabel: 'SAR Imagery', icon: Satellite, step: '02' },
  { id: 'investigation', label: 'Investigation Workspace', shortLabel: 'Workspace', icon: Search, step: '03', badge: 'ACTIVE', badgeColor: 'rose' },
  { id: 'drift', label: 'Drift Analysis', shortLabel: 'Drift', icon: Compass, step: '04' },
  { id: 'attribution', label: 'Vessel Attribution', shortLabel: 'Attribution', icon: Ship, step: '05', badge: 'ML', badgeColor: 'indigo' },
  { id: 'reports', label: 'Investigation Report', shortLabel: 'Report', icon: FileText, step: '06' },
];

export const Sidebar: React.FC = () => {
  const { activePage, setActivePage, investigation } = useInvestigation();

  const getBadgeClasses = (color?: string, isActive?: boolean) => {
    if (color === 'rose') {
      return isActive
        ? 'bg-rose-500 text-white'
        : 'bg-rose-500/15 text-rose-400 border border-rose-500/25';
    }
    if (color === 'indigo') {
      return isActive
        ? 'bg-indigo-500 text-white'
        : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25';
    }
    return isActive
      ? 'bg-cyan-400 text-slate-950'
      : 'bg-slate-800 text-slate-400 border border-slate-700';
  };

  return (
    <aside className="w-56 bg-[#080d18] border-r border-[rgba(255,255,255,0.07)] flex flex-col justify-between select-none z-20 shrink-0">

      {/* Navigation */}
      <nav className="p-2.5 space-y-0.5">
        <div className="px-2 py-2 text-[9px] font-mono tracking-[0.18em] text-slate-600 uppercase font-semibold">
          INVESTIGATION WORKFLOW
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-medium transition-all duration-150 group relative ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/25'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-slate-900/70 border border-transparent'
              }`}
            >
              {/* Active left accent */}
              {isActive && (
                <div className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-cyan-400" />
              )}

              <div className="flex items-center gap-2.5">
                {/* Step number */}
                <span className={`text-[9px] font-mono font-bold w-5 text-right shrink-0 ${
                  isActive ? 'text-cyan-500' : 'text-slate-700 group-hover:text-slate-500'
                }`}>
                  {item.step}
                </span>

                <Icon className={`w-3.5 h-3.5 shrink-0 ${
                  isActive ? 'text-cyan-400' : 'text-slate-600 group-hover:text-slate-400'
                }`} />

                <span className="truncate text-[11px]">{item.label}</span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {item.badge && (
                  <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded font-bold ${getBadgeClasses(item.badgeColor, isActive)}`}>
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <ChevronRight className="w-3 h-3 text-cyan-500" />
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Bottom Panel */}
      <div className="p-2.5 space-y-2 border-t border-[rgba(255,255,255,0.06)]">

        {/* Active Incident Monitor */}
        <div className="p-2.5 rounded-md bg-[#0d1427] border border-[rgba(255,255,255,0.07)]">
          <div className="flex items-center justify-between text-[10px] font-mono mb-1.5">
            <span className="text-slate-500 flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              CURRENT INCIDENT
            </span>
            {investigation && (
              <span className="text-cyan-400 font-bold text-[9px]">LIVE</span>
            )}
          </div>

          {investigation ? (
            <div className="space-y-1">
              <div className="text-[10px] font-mono text-cyan-300 font-bold truncate">
                {investigation.investigation_id}
              </div>
              <div className="text-[9px] text-slate-500 font-mono space-y-0.5">
                <div className="flex justify-between">
                  <span>Area:</span>
                  <span className="text-slate-300">{investigation.spill.area_km2.toFixed(1)} km²</span>
                </div>
                <div className="flex justify-between">
                  <span>Conf:</span>
                  <span className="text-emerald-400">{(investigation.spill.confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Top Suspect:</span>
                  <span className="text-rose-400 truncate max-w-[70px] text-right">
                    {investigation.vessels[0]?.vessel_name?.split(' ').slice(-1)[0] || '—'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-[9px] text-slate-600 font-mono">
              No incident loaded. Run demo scenario.
            </p>
          )}
        </div>

        {/* ML Model Status */}
        <div className="p-2.5 rounded-md bg-[#0a0f1f] border border-[rgba(255,255,255,0.05)]">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Cpu className="w-3 h-3 text-indigo-400" />
            <span className="text-[9px] font-mono font-bold text-slate-500 tracking-widest">ML ENGINE</span>
          </div>
          <div className="text-[9px] font-mono text-slate-600 space-y-0.5">
            <div className="text-indigo-400/80 font-medium">U-Net ResNet-34</div>
            <div className="flex justify-between">
              <span>Params:</span>
              <span className="text-slate-400">24.4M</span>
            </div>
            <div className="flex justify-between">
              <span>Input:</span>
              <span className="text-slate-400">VV+VH SAR</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Status:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 signal-blink inline-block" />
                READY
              </span>
            </div>
          </div>
        </div>

        <div className="text-[8px] text-slate-700 text-center font-mono tracking-widest">
          MARITIME POLLUTION INTELLIGENCE
        </div>
      </div>
    </aside>
  );
};

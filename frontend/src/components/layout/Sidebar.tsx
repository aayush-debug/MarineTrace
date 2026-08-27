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
} from 'lucide-react';
import { useInvestigation, type PageId } from '../../context/InvestigationContext';

interface NavItem {
  id: PageId;
  label: string;
  badge?: string;
  badgeType?: 'alert' | 'info' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
}

const PRIMARY_NAV: NavItem[] = [
  { id: 'dashboard', label: 'Situation Overview', icon: LayoutDashboard },
  { id: 'spcsft-realtime', label: 'Space Shift Real-Time API', icon: Radio, badge: 'LIVE', badgeType: 'alert' },
  { id: 'new-investigation', label: 'New Investigation', icon: PlusCircle },
  { id: 'satellite', label: 'Satellite SAR Imagery', icon: Satellite },
  { id: 'investigation', label: 'Workspace & Map', icon: Search, badge: 'Live Case', badgeType: 'alert' },
];

const ANALYTICS_NAV: NavItem[] = [
  { id: 'drift', label: 'Drift Trajectory Analysis', icon: Compass },
  { id: 'attribution', label: 'Vessel AIS Attribution', icon: Ship, badge: 'ML Match', badgeType: 'info' },
  { id: 'reports', label: 'Incident Dossier', icon: FileText },
];

const SYSTEM_NAV: NavItem[] = [
  { id: 'access-logs', label: 'Docker & Access Logs', icon: Server, badge: 'Telemetry', badgeType: 'info' },
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
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group relative ${
              isActive
                ? 'bg-sky-500/10 text-sky-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {/* Active Left Indicator */}
            {isActive && (
              <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-sky-500" />
            )}

            <div className="flex items-center gap-2.5 min-w-0">
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-300'
                }`}
              />
              <span className="truncate">{item.label}</span>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-1 shrink-0 ml-1">
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    item.badgeType === 'alert'
                      ? isActive
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-rose-500/10 text-rose-400'
                      : isActive
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      : 'bg-slate-800 text-slate-400'
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
    <aside className="w-60 bg-[#0c121e] border-r border-[rgba(255,255,255,0.08)] flex flex-col justify-between select-none z-20 shrink-0">

      {/* Navigation Sections */}
      <nav className="p-3 space-y-5 overflow-y-auto">
        <div>
          <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
            Surveillance & Ingestion
          </div>
          {renderNavGroup(PRIMARY_NAV)}
        </div>

        <div>
          <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
            Physics & Intelligence
          </div>
          {renderNavGroup(ANALYTICS_NAV)}
        </div>

        <div>
          <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
            System & Infrastructure
          </div>
          {renderNavGroup(SYSTEM_NAV)}
        </div>
      </nav>


      {/* Bottom Panel: Active Incident Summary Card */}
      <div className="p-3 border-t border-[rgba(255,255,255,0.08)] bg-[#090e18]">
        {investigation ? (
          <div
            onClick={() => setActivePage('investigation')}
            className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>Active Incident</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                {(investigation.spill.confidence * 100).toFixed(0)}% Conf.
              </span>
            </div>

            <div className="text-[11px] font-mono text-sky-400 font-bold truncate">
              {investigation.investigation_id}
            </div>

            <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
              <div>
                <span className="text-slate-500 block">Slick Area:</span>
                <span className="font-mono text-slate-300 font-medium">{investigation.spill.area_km2.toFixed(1)} km²</span>
              </div>
              <div>
                <span className="text-slate-500 block">Top Suspect:</span>
                <span className="text-rose-400 font-medium truncate block">
                  {investigation.vessels[0]?.vessel_name || 'Flagged'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-sky-400 pt-1 font-medium group-hover:text-sky-300">
              <span>Open Workspace</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800/70 text-center">
            <p className="text-[11px] text-slate-400">No active incident loaded</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Run demo scenario or ingest SAR</p>
          </div>
        )}

        <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400 px-1">
          <span>AI Engine: ResNet-34</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Ready
          </span>
        </div>
      </div>
    </aside>
  );
};


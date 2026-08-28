import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  Search,
  Compass,
  Ship,
  Satellite,
  FileText,
  ChevronRight,
  Radio,
  Server,
  AlertTriangle,
} from 'lucide-react';
import { useInvestigation, type PageId } from '../../context/InvestigationContext';

interface NavItem {
  id: PageId;
  label: string;
  badge?: string;
  badgeType?: 'alert' | 'info' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
}

const SURVEILLANCE_NAV: NavItem[] = [
  { id: 'spcsft-realtime', label: 'SpaceShift Live Surveillance', icon: Radio, badge: 'Live', badgeType: 'alert' },
  { id: 'dashboard', label: 'Situation Overview', icon: LayoutDashboard },
  { id: 'new-investigation', label: 'New Investigation', icon: PlusCircle },
  { id: 'satellite', label: 'Sentinel-1 SAR Viewer', icon: Satellite },
];

const FORENSICS_NAV: NavItem[] = [
  { id: 'investigation', label: 'Investigation Workspace', icon: Search, badge: 'Active', badgeType: 'alert' },
  { id: 'drift', label: 'Hydrodynamic Drift', icon: Compass },
  { id: 'attribution', label: 'AIS Vessel Attribution', icon: Ship, badge: '5D', badgeType: 'info' },
  { id: 'reports', label: 'Incident Intelligence Dossier', icon: FileText },
];

const SYSTEM_NAV: NavItem[] = [
  { id: 'access-logs', label: 'Audit Logs & Telemetry', icon: Server },
];

export const Sidebar: React.FC = () => {
  const { activePage, setActivePage, investigation } = useInvestigation();

  const renderNavGroup = (title: string, items: NavItem[]) => (
    <div className="space-y-1">
      <div className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
        {title}
      </div>
      <div className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-colors group cursor-pointer ${
                isActive
                  ? 'bg-[#161e2e] text-slate-100 font-semibold border-l-2 border-blue-500 pl-2.5'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#161e2e]/50'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
                  }`}
                />
                <span className="truncate text-[12px]">{item.label}</span>
              </div>

              {/* Status Badge */}
              {item.badge && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-medium shrink-0 ml-1 ${
                    item.badgeType === 'alert'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                      : item.badgeType === 'info'
                      ? 'bg-blue-950 text-blue-300 border border-blue-800/60'
                      : 'bg-[#161e2e] text-slate-400 border border-[#1e293b]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <aside className="w-60 bg-[#111622] border-r border-[#1e293b] flex flex-col justify-between select-none z-20 shrink-0 shadow-sm no-print">
      {/* Navigation Subsystem Groups */}
      <nav className="p-3 space-y-5 overflow-y-auto">
        {renderNavGroup('Surveillance & Ingestion', SURVEILLANCE_NAV)}
        {renderNavGroup('Forensic Analysis', FORENSICS_NAV)}
        {renderNavGroup('System & Administration', SYSTEM_NAV)}
      </nav>

      {/* Bottom Panel: Active Target Telemetry Module */}
      <div className="p-3 border-t border-[#1e293b] bg-[#0c1017]">
        {investigation ? (
          <div
            onClick={() => setActivePage('investigation')}
            className="p-3 rounded bg-[#161e2e] border border-[#1e293b] hover:border-slate-700 cursor-pointer transition-colors space-y-2 group shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Active Target</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-semibold bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-900/60">
                {(investigation.spill.confidence * 100).toFixed(0)}% Conf
              </span>
            </div>

            <div className="text-xs font-mono text-slate-200 font-semibold truncate">
              Case #{investigation.investigation_id}
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1.5 border-t border-[#1e293b]">
              <div>
                <span className="text-slate-500 text-[10px] block">Slick Area</span>
                <span className="text-slate-200 font-mono font-medium">{investigation.spill.area_km2.toFixed(1)} km²</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Top Suspect</span>
                <span className="text-rose-400 font-medium truncate block">
                  {investigation.vessels[0]?.vessel_name || 'Unassigned'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-blue-400 pt-1 font-medium group-hover:text-blue-300">
              <span>Open Case File</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        ) : (
          <div className="p-2.5 rounded bg-[#161e2e]/50 border border-[#1e293b] text-center">
            <p className="text-[11px] text-slate-400 font-medium">No Active Case</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Select or upload a SAR scene</p>
          </div>
        )}
      </div>
    </aside>
  );
};

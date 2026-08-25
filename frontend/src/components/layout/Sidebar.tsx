import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  Search,
  Compass,
  Ship,
  Satellite,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { useInvestigation, type PageId } from '../../context/InvestigationContext';

interface NavItem {
  id: PageId;
  label: string;
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'new-investigation', label: 'New Investigation', icon: PlusCircle },
  { id: 'investigation', label: 'Investigation Workspace', icon: Search, badge: 'ACTIVE' },
  { id: 'drift', label: 'Drift Analysis', icon: Compass },
  { id: 'attribution', label: 'Vessel Attribution', icon: Ship, badge: 'ML' },
  { id: 'satellite', label: 'Satellite Imagery', icon: Satellite },
  { id: 'reports', label: 'Investigation Report', icon: FileText },
];

export const Sidebar: React.FC = () => {
  const { activePage, setActivePage, investigation } = useInvestigation();

  return (
    <aside className="w-64 bg-[#0a0f1d] border-r border-slate-800/80 flex flex-col justify-between select-none z-20 shrink-0">
      {/* Navigation Links */}
      <div className="p-3 space-y-1">
        <div className="px-3 py-2 text-[10px] font-mono tracking-widest text-slate-400 uppercase font-semibold">
          NAVIGATION CONTROL
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded text-xs font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-950/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-cyan-400' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    isActive
                      ? 'bg-cyan-400 text-slate-950'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Situational Monitor Card */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="p-3 rounded bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              CURRENT INCIDENT
            </span>
            <span className="text-cyan-400 font-bold">
              {investigation ? investigation.investigation_id : 'STANDBY'}
            </span>
          </div>

          {investigation ? (
            <div className="text-[11px] space-y-1 font-mono text-slate-400 border-t border-slate-800/60 pt-2">
              <div className="flex justify-between">
                <span>Location:</span>
                <span className="text-slate-200">
                  {investigation.spill.geometry?.coordinates?.[0]?.[0]?.[1]?.toFixed(2)}°N,{' '}
                  {investigation.spill.geometry?.coordinates?.[0]?.[0]?.[0]?.toFixed(2)}°E
                </span>
              </div>
              <div className="flex justify-between">
                <span>Sector:</span>
                <span className="text-slate-200">Arabian Sea (West Coast)</span>
              </div>
              <div className="flex justify-between">
                <span>Top Suspect:</span>
                <span className="text-rose-400 font-semibold truncate max-w-[100px]">
                  {investigation.vessels[0]?.vessel_name || 'Evaluating'}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-slate-400">
              No active investigation selected. Start new or run demo scenario.
            </p>
          )}
        </div>

        <div className="mt-2 text-[10px] text-slate-400 text-center font-mono">
          GOVERNMENT MARITIME SURVEILLANCE
        </div>
      </div>
    </aside>
  );
};

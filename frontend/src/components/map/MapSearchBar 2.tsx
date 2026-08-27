import React, { useState } from 'react';
import { Search, Navigation, Crosshair, X, Flame, Anchor, Ship, Globe2 } from 'lucide-react';
import { useInvestigation } from '../../context/InvestigationContext';

export interface QuickJumpLocation {
  id: string;
  name: string;
  category: 'spill' | 'origin' | 'vessel' | 'port' | 'offshore' | 'eez';
  lat: number;
  lng: number;
  zoom: number;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const PRESET_LOCATIONS: QuickJumpLocation[] = [
  {
    id: 'spill-site',
    name: 'Detected Oil Spill Centroid',
    category: 'spill',
    lat: 18.721,
    lng: 72.914,
    zoom: 12,
    badge: '18.4 km²',
    icon: Flame,
  },
  {
    id: 'origin-zone',
    name: 'Estimated Discharge Origin Zone',
    category: 'origin',
    lat: 18.82,
    lng: 73.05,
    zoom: 12,
    badge: '92% Conf',
    icon: Crosshair,
  },
  {
    id: 'suspect-vessel',
    name: 'MV Ocean Star (Rank #1 Suspect)',
    category: 'vessel',
    lat: 18.73,
    lng: 72.91,
    zoom: 13,
    badge: '94.2 Score',
    icon: Ship,
  },
  {
    id: 'mumbai-port',
    name: 'Port of Mumbai / JNPT Harbor',
    category: 'port',
    lat: 18.95,
    lng: 72.95,
    zoom: 11,
    badge: 'Major Port',
    icon: Anchor,
  },
  {
    id: 'mumbai-high',
    name: 'Mumbai High Offshore Petroleum Field',
    category: 'offshore',
    lat: 19.42,
    lng: 71.33,
    zoom: 10,
    badge: 'Oil Platform',
    icon: Globe2,
  },
  {
    id: 'gujarat-eez',
    name: 'North Arabian Sea / Gujarat EEZ Outer Sector',
    category: 'eez',
    lat: 20.5,
    lng: 70.8,
    zoom: 8,
    badge: 'EEZ Boundary',
    icon: Navigation,
  },
];

export const MapSearchBar: React.FC<{
  onFlyTo: (lat: number, lng: number, zoom: number) => void;
}> = ({ onFlyTo }) => {
  const { setSelectedVesselMmsi, investigation } = useInvestigation();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (loc: QuickJumpLocation) => {
    onFlyTo(loc.lat, loc.lng, loc.zoom);
    if (loc.category === 'vessel' && investigation?.vessels[0]) {
      setSelectedVesselMmsi(investigation.vessels[0].mmsi);
    }
    setQuery(loc.name);
    setIsOpen(false);
  };

  const handleCoordinateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Parse "lat, lng" e.g. "18.72, 72.91" or "18.72 72.91"
    const match = query.match(/([-+]?\d*\.?\d+)[,\s]+([-+]?\d*\.?\d+)/);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        onFlyTo(lat, lng, 12);
        setIsOpen(false);
        return;
      }
    }
    // Fallback: search matches in presets
    const found = PRESET_LOCATIONS.find((loc) =>
      loc.name.toLowerCase().includes(query.toLowerCase())
    );
    if (found) {
      handleSelect(found);
    }
  };

  const filtered = PRESET_LOCATIONS.filter((loc) =>
    loc.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="absolute top-3 left-3 z-[1000] font-mono select-none w-72 sm:w-80">
      {/* Floating Google Maps-Style Search Pill */}
      <form
        onSubmit={handleCoordinateSubmit}
        className="relative flex items-center bg-[#080d1a]/95 backdrop-blur-md border border-[rgba(255,255,255,0.14)] rounded-xl shadow-2xl overflow-hidden focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400 transition-all"
      >
        <div className="pl-3 text-cyan-400">
          <Search className="w-4 h-4" />
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search sector, vessel, or lat, lon..."
          className="w-full bg-transparent px-2.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="pr-2.5 text-slate-500 hover:text-slate-200 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </form>

      {/* Dropdown Suggestions */}
      {isOpen && (
        <div className="mt-1.5 p-2 bg-[#080d1a]/95 backdrop-blur-md border border-[rgba(255,255,255,0.12)] rounded-xl shadow-2xl space-y-1 animate-fade-up max-h-72 overflow-y-auto">
          <div className="px-2 py-1 text-[9px] font-bold text-slate-500 tracking-wider uppercase border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
            <span>QUICK JUMP LOCATIONS</span>
            <span>ENTER COORDS (LAT, LON)</span>
          </div>

          {filtered.map((loc) => {
            const Icon = loc.icon;
            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => handleSelect(loc)}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#111c33] text-left transition-colors group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-[#0e172e] border border-[rgba(255,255,255,0.08)] flex items-center justify-center shrink-0 group-hover:border-cyan-500/40">
                    <Icon className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-slate-200 truncate group-hover:text-cyan-300 transition-colors">
                      {loc.name}
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono">
                      {loc.lat.toFixed(3)}°N, {loc.lng.toFixed(3)}°E
                    </div>
                  </div>
                </div>

                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 shrink-0 ml-2">
                  {loc.badge}
                </span>
              </button>
            );
          })}

          {filtered.length === 0 && (
            <div className="p-3 text-center text-slate-500 text-[10px]">
              Press <strong className="text-cyan-300">Enter</strong> to jump to coordinates:{' '}
              <span className="text-slate-300 font-bold">{query}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

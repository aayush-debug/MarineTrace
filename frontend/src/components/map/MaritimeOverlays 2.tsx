import React, { Fragment } from 'react';
import { Polyline, CircleMarker, Popup } from 'react-leaflet';
import { useInvestigation } from '../../context/InvestigationContext';

// Indian EEZ West Coast Coordinates (Simplified UNCLOS Baseline)
const EEZ_BOUNDARY_COORDS: [number, number][] = [
  [23.5, 67.8],
  [22.2, 67.2],
  [20.5, 68.1],
  [19.2, 69.5],
  [18.0, 70.8],
  [16.5, 71.5],
  [15.0, 72.0],
  [13.5, 72.8],
  [11.8, 73.5],
  [10.0, 74.2],
];

// 12 NM Territorial Sea Limit (West Coast)
const TERRITORIAL_SEA_COORDS: [number, number][] = [
  [20.8, 72.3],
  [19.8, 72.4],
  [19.0, 72.6],
  [18.5, 72.7],
  [17.8, 72.9],
  [16.8, 73.1],
  [15.8, 73.4],
];

// Traffic Separation Scheme (TSS) Lanes — Arabian Sea Inbound / Outbound
const SHIPPING_LANE_INBOUND: [number, number][] = [
  [18.0, 71.5],
  [18.5, 72.2],
  [18.85, 72.75],
  [18.95, 72.85],
];

const SHIPPING_LANE_OUTBOUND: [number, number][] = [
  [18.95, 72.88],
  [18.82, 72.78],
  [18.45, 72.25],
  [17.95, 71.55],
];

// Major Offshore Oil Platforms (Mumbai High Field & Satellite Rigs)
const OFFSHORE_PLATFORMS = [
  {
    id: 'mh-north',
    name: 'Mumbai High North (MHN) Complex',
    operator: 'ONGC (Oil and Natural Gas Corp)',
    lat: 19.42,
    lng: 71.33,
    type: 'Production & Processing Platform',
    status: 'ACTIVE PRODUCTION',
  },
  {
    id: 'mh-south',
    name: 'Mumbai High South (MHS) Platform',
    operator: 'ONGC',
    lat: 19.18,
    lng: 71.38,
    type: 'Drilling & Extraction Rig',
    status: 'ACTIVE PRODUCTION',
  },
  {
    id: 'neelam',
    name: 'Neelam & Heera Offshore Field',
    operator: 'ONGC',
    lat: 18.78,
    lng: 72.25,
    type: 'Subsea Wellhead Gathering System',
    status: 'ACTIVE / MONITORED',
  },
  {
    id: 'bassein',
    name: 'Bassein Gas Processing Platform',
    operator: 'ONGC',
    lat: 19.25,
    lng: 72.15,
    type: 'Offshore Gas Compression Hub',
    status: 'OPERATIONAL',
  },
];

// Major Ports & Harbor Anchorages
const MAJOR_PORTS = [
  {
    id: 'jnpt',
    name: 'Jawaharlal Nehru Port (JNPT)',
    lat: 18.95,
    lng: 72.95,
    type: 'Major Container Terminal',
    berths: 14,
  },
  {
    id: 'mumbai-port',
    name: 'Mumbai Port (MbPT)',
    lat: 18.93,
    lng: 72.84,
    type: 'Crude Oil & Bulk Cargo Port',
    berths: 32,
  },
  {
    id: 'mormugao',
    name: 'Mormugao Port (Goa)',
    lat: 15.42,
    lng: 73.8,
    type: 'Ore & Petroleum Terminal',
    berths: 11,
  },
];

export const MaritimeOverlays: React.FC = () => {
  const { layers } = useInvestigation();

  return (
    <>
      {/* 1. Indian Exclusive Economic Zone (EEZ 200 NM Boundary) */}
      {layers.eez && (
        <>
          <Polyline
            positions={EEZ_BOUNDARY_COORDS}
            pathOptions={{
              color: '#0284c7',
              weight: 2,
              dashArray: '12, 8',
              opacity: 0.85,
            }}
          >
            <Popup>
              <div className="text-xs font-mono p-1">
                <strong className="text-cyan-300">🇮🇳 Indian EEZ Limit (200 NM)</strong>
                <div className="text-slate-300 text-[10px]">
                  Exclusive Economic Zone — Maritime Jurisdiction under UNCLOS Act 1976.
                </div>
              </div>
            </Popup>
          </Polyline>

          {/* 12 NM Territorial Sea Limit */}
          <Polyline
            positions={TERRITORIAL_SEA_COORDS}
            pathOptions={{
              color: '#38bdf8',
              weight: 1.5,
              dashArray: '4, 4',
              opacity: 0.7,
            }}
          >
            <Popup>
              <div className="text-xs font-mono p-1">
                <strong className="text-sky-300">Territorial Sea Boundary (12 NM)</strong>
                <div className="text-slate-300 text-[10px]">
                  Sovereign territorial waters of India.
                </div>
              </div>
            </Popup>
          </Polyline>
        </>
      )}

      {/* 2. Traffic Separation Scheme (TSS) Shipping Corridors */}
      {layers.lanes && (
        <>
          {/* Inbound Shipping Lane */}
          <Polyline
            positions={SHIPPING_LANE_INBOUND}
            pathOptions={{
              color: '#818cf8',
              weight: 3,
              opacity: 0.65,
              dashArray: '6, 6',
            }}
          >
            <Popup>
              <div className="text-xs font-mono p-1">
                <strong className="text-indigo-300">🚢 TSS Inbound Traffic Lane (Mumbai Approach)</strong>
                <div className="text-slate-400 text-[10px]">Course: ~065° True</div>
              </div>
            </Popup>
          </Polyline>

          {/* Outbound Shipping Lane */}
          <Polyline
            positions={SHIPPING_LANE_OUTBOUND}
            pathOptions={{
              color: '#a78bfa',
              weight: 3,
              opacity: 0.65,
              dashArray: '6, 6',
            }}
          >
            <Popup>
              <div className="text-xs font-mono p-1">
                <strong className="text-violet-300">🚢 TSS Outbound Traffic Lane</strong>
                <div className="text-slate-400 text-[10px]">Course: ~245° True</div>
              </div>
            </Popup>
          </Polyline>
        </>
      )}

      {/* 3. Offshore Oil Platforms (Mumbai High Field) */}
      {layers.platforms &&
        OFFSHORE_PLATFORMS.map((plat) => (
          <Fragment key={plat.id}>
            <CircleMarker
              center={[plat.lat, plat.lng]}
              radius={6}
              pathOptions={{
                color: '#f59e0b',
                fillColor: '#b45309',
                fillOpacity: 0.9,
                weight: 2,
              }}
            >
              <Popup>
                <div className="text-xs font-mono p-1 space-y-1">
                  <div className="flex items-center justify-between font-bold text-amber-300">
                    <span>🛢️ {plat.name}</span>
                  </div>
                  <div className="text-slate-300 text-[11px]">Operator: {plat.operator}</div>
                  <div className="text-slate-400 text-[10px]">Type: {plat.type}</div>
                  <div className="text-emerald-400 text-[10px] font-bold">{plat.status}</div>
                </div>
              </Popup>
            </CircleMarker>
          </Fragment>
        ))}

      {/* 4. Major Ports */}
      {MAJOR_PORTS.map((port) => (
        <CircleMarker
          key={port.id}
          center={[port.lat, port.lng]}
          radius={5}
          pathOptions={{
            color: '#06b6d4',
            fillColor: '#0891b2',
            fillOpacity: 0.8,
            weight: 1.5,
          }}
        >
          <Popup>
            <div className="text-xs font-mono p-1">
              <strong className="text-cyan-300">⚓ {port.name}</strong>
              <div className="text-slate-300 text-[10px]">{port.type}</div>
              <div className="text-slate-400 text-[10px]">{port.berths} Commercial Berths</div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
};

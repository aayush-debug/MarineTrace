import React, { useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  ImageOverlay,
  Polygon,
  CircleMarker,
  Popup,
  Rectangle,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Layers,
  Ship,
  Sliders,
} from 'lucide-react';
import type { SARSceneDetails, SARChannel } from '../../types/sar';
import { BASEMAP_CONFIGS } from '../../utils/mapTiles';
import type { BasemapType } from '../../utils/mapTiles';

interface SARGisMapViewProps {
  scene: SARSceneDetails;
  channel: SARChannel;
  selectedCandidateId: number | null;
  onSelectCandidate: (id: number | null) => void;
  showCandidateContours: boolean;
  showCandidateLabels: boolean;
}

// Auto-center map on scene bounds or selected candidate
const MapBoundsHandler: React.FC<{
  bounds: [[number, number], [number, number]];
  selectedCandidateCoords?: [number, number][];
}> = ({ bounds, selectedCandidateCoords }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedCandidateCoords && selectedCandidateCoords.length > 0) {
      const lats = selectedCandidateCoords.map((c) => c[0]);
      const lons = selectedCandidateCoords.map((c) => c[1]);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLon = Math.min(...lons);
      const maxLon = Math.max(...lons);

      map.fitBounds(
        [
          [minLat - 0.02, minLon - 0.02],
          [maxLat + 0.02, maxLon + 0.02],
        ],
        { padding: [40, 40], maxZoom: 13, animate: true }
      );
    } else if (bounds) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 12, animate: true });
    }
  }, [bounds, selectedCandidateCoords, map]);

  return null;
};

export const SARGisMapView: React.FC<SARGisMapViewProps> = ({
  scene,
  channel,
  selectedCandidateId,
  onSelectCandidate,
  showCandidateContours,
  showCandidateLabels,
}) => {
  const [basemap, setBasemap] = useState<BasemapType>('google-hybrid');
  const [sarOverlayOpacity, setSarOverlayOpacity] = useState<number>(0.65);
  const [showSarRaster, setShowSarRaster] = useState<boolean>(true);
  const [showVessels, setShowVessels] = useState<boolean>(true);
  const [showFootprint, setShowFootprint] = useState<boolean>(true);

  const bbox = scene.metadata.bbox;
  const mapBounds: [[number, number], [number, number]] = [
    [bbox.min_latitude, bbox.min_longitude],
    [bbox.max_latitude, bbox.max_longitude],
  ];

  const imgW = scene.metadata.dimensions?.width || 1024;
  const imgH = scene.metadata.dimensions?.height || 1024;
  const dLat = bbox.max_latitude - bbox.min_latitude;
  const dLon = bbox.max_longitude - bbox.min_longitude;

  const channelKey = channel.toLowerCase() as 'vv' | 'vh' | 'composite';
  const rasterUrl = scene.imagery_urls[channelKey] || `/sar/sample_s1_${channelKey}.png`;

  // Selected candidate coordinates for focusing
  const selectedCandidate = scene.candidates.find((c) => c.candidate_id === selectedCandidateId);
  const selectedCoords = selectedCandidate?.contour_pixels
    ? selectedCandidate.contour_pixels.map(([px, py]): [number, number] => [
        bbox.max_latitude - (py / imgH) * dLat,
        bbox.min_longitude + (px / imgW) * dLon,
      ])
    : undefined;

  const activeBasemap = BASEMAP_CONFIGS[basemap] || BASEMAP_CONFIGS['google-hybrid'];

  // Suspect Vessels at Time of SAR Acquisition in Arabian Sea off Mumbai
  const suspectVessels = [
    {
      mmsi: '636019842',
      name: 'MV Ocean Star',
      type: 'Crude Oil Tanker',
      lat: 18.812,
      lon: 72.438,
      speed_kts: 12.4,
      heading: 148,
      isPrimary: true,
    },
    {
      mmsi: '477218900',
      name: 'MT Pacific Pioneer',
      type: 'Chemical Tanker',
      lat: 18.765,
      lon: 72.482,
      speed_kts: 14.1,
      heading: 152,
      isPrimary: false,
    },
  ];

  return (
    <div className="relative w-full h-full bg-[#030712] overflow-hidden">
      <MapContainer
        center={[scene.metadata.center_coordinates.latitude, scene.metadata.center_coordinates.longitude]}
        zoom={10}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        zoomControl={false}
      >
        {/* Layer 1: Google Maps Satellite / Hybrid Tiles */}
        <TileLayer
          key={activeBasemap.id}
          url={activeBasemap.url}
          attribution={activeBasemap.attribution}
          subdomains={activeBasemap.subdomains || ['mt0', 'mt1', 'mt2', 'mt3']}
          maxZoom={activeBasemap.maxZoom}
        />

        {/* Layer 2: Georeferenced Sentinel-1 SAR Raster Overlay with Opacity */}
        {showSarRaster && (
          <ImageOverlay
            url={rasterUrl}
            bounds={mapBounds}
            opacity={sarOverlayOpacity}
            zIndex={10}
          />
        )}

        {/* Layer 3: Sentinel-1 SAR Acquisition Footprint */}
        {showFootprint && (
          <Rectangle
            bounds={mapBounds}
            pathOptions={{
              color: '#38bdf8',
              weight: 1.5,
              dashArray: '6, 6',
              fill: false,
              opacity: 0.8,
            }}
          />
        )}

        {/* Layer 4: Candidate Spill Geometries transformed accurately to SAR georeference plane */}
        {showCandidateContours &&
          scene.candidates.map((cand) => {
            const isSelected = selectedCandidateId === cand.candidate_id;
            const strokeColor =
              cand.candidate_id === 1
                ? '#f43f5e'
                : cand.candidate_id === 2
                ? '#f59e0b'
                : '#38bdf8';
            const fillColor = strokeColor;

            // Generate polygon lat/lons from candidate contour_pixels georeferencing
            let coords: [number, number][] = [];
            if (cand.contour_pixels && cand.contour_pixels.length > 0) {
              coords = cand.contour_pixels.map(([px, py]) => [
                bbox.max_latitude - (py / imgH) * dLat,
                bbox.min_longitude + (px / imgW) * dLon,
              ]);
            } else if (cand.geo_coordinates && cand.geo_coordinates.length > 0) {
              coords = cand.geo_coordinates as [number, number][];
            } else {
              const cLat = bbox.max_latitude - (cand.centroid.pixel_y / imgH) * dLat;
              const cLon = bbox.min_longitude + (cand.centroid.pixel_x / imgW) * dLon;
              coords = [
                [cLat - 0.015, cLon - 0.025],
                [cLat + 0.02, cLon - 0.01],
                [cLat + 0.015, cLon + 0.03],
                [cLat - 0.02, cLon + 0.015],
              ];
            }

            // Accurate georeferenced centroid
            const centroidLat = bbox.max_latitude - (cand.centroid.pixel_y / imgH) * dLat;
            const centroidLon = bbox.min_longitude + (cand.centroid.pixel_x / imgW) * dLon;

            return (
              <React.Fragment key={cand.candidate_id}>
                <Polygon
                  positions={coords}
                  pathOptions={{
                    color: strokeColor,
                    weight: isSelected ? 3 : 2,
                    fillColor: fillColor,
                    fillOpacity: isSelected ? 0.45 : 0.25,
                  }}
                  eventHandlers={{
                    click: () => onSelectCandidate(isSelected ? null : cand.candidate_id),
                  }}
                >
                  <Popup className="sar-map-popup">
                    <div className="p-1 font-mono text-xs text-slate-100">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-1 mb-1">
                        <span className="font-bold text-sky-400">Candidate #{cand.candidate_id}</span>
                        <span className="font-bold text-rose-400">
                          {(cand.oil_probability * 100).toFixed(1)}% Match
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300 mb-1 font-sans font-semibold">
                        {cand.classification}
                      </div>
                      <div className="grid grid-cols-2 gap-x-2 text-[10px] text-slate-400">
                        <div>Area: <span className="text-white font-bold">{cand.area_km2} km²</span></div>
                        <div>Perimeter: <span className="text-white">{cand.properties.perimeter_km} km</span></div>
                        <div>Mean VV: <span className="text-white">{cand.properties.mean_vv_db} dB</span></div>
                        <div>Solidity: <span className="text-white">{cand.properties.solidity}</span></div>
                      </div>
                    </div>
                  </Popup>
                </Polygon>

                {/* Candidate Centroid Marker */}
                {showCandidateLabels && (
                  <CircleMarker
                    center={[centroidLat, centroidLon]}
                    radius={isSelected ? 6 : 4}
                    pathOptions={{
                      color: '#ffffff',
                      fillColor: strokeColor,
                      fillOpacity: 1,
                      weight: 1.5,
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}

        {/* Layer 5: AIS Suspect Vessels */}
        {showVessels &&
          suspectVessels.map((v) => (
            <CircleMarker
              key={v.mmsi}
              center={[v.lat, v.lon]}
              radius={v.isPrimary ? 7 : 5}
              pathOptions={{
                color: v.isPrimary ? '#f43f5e' : '#38bdf8',
                fillColor: v.isPrimary ? '#f43f5e' : '#0284c7',
                fillOpacity: 0.9,
                weight: 2,
              }}
            >
              <Popup>
                <div className="p-1 font-mono text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 border-b pb-1 mb-1">
                    <Ship className="w-3.5 h-3.5 text-rose-600" />
                    <span>{v.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-600 space-y-0.5">
                    <div>MMSI: <span className="font-bold">{v.mmsi}</span></div>
                    <div>Type: {v.type}</div>
                    <div>Speed: {v.speed_kts} kts | Heading: {v.heading}°</div>
                    {v.isPrimary && (
                      <div className="text-rose-600 font-bold text-[10px] pt-1">
                        Rank #1 Attribution Suspect
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}

        <MapBoundsHandler bounds={mapBounds} selectedCandidateCoords={selectedCoords} />
      </MapContainer>

      {/* Floating Map Controls & Overlays Panel */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 max-w-xs">
        {/* Basemap & SAR Overlay Controller */}
        <div className="bg-[#111622]/90 backdrop-blur-md border border-[#1e293b] rounded p-3 shadow-xl text-xs font-mono space-y-3">
          <div className="flex items-center justify-between border-b border-[#1e293b] pb-2">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Google Maps GIS View</span>
            </span>
            <span className="text-[10px] text-blue-300 font-semibold px-1.5 py-0.5 rounded bg-blue-950 border border-blue-800/60">
              Live Satellite
            </span>
          </div>

          {/* Basemap Toggle Buttons */}
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1 font-sans">
              Optical Basemap
            </label>
            <div className="grid grid-cols-2 gap-1">
              {(
                [
                  { id: 'google-hybrid', label: 'Hybrid' },
                  { id: 'google-satellite', label: 'Satellite' },
                  { id: 'google-terrain', label: 'Terrain' },
                  { id: 'google-streets', label: 'Roadmap' },
                ] as const
              ).map((b) => (
                <button
                  key={b.id}
                  onClick={() => setBasemap(b.id)}
                  className={`px-2 py-1 rounded text-[10px] font-medium border transition-colors cursor-pointer ${
                    basemap === b.id
                      ? 'bg-blue-950 border-blue-700 text-blue-200 font-semibold'
                      : 'bg-[#161e2e] border-[#1e293b] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* SAR Raster Overlay Blend Slider */}
          <div className="pt-2 border-t border-[#1e293b] space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-300 font-medium flex items-center gap-1">
                <Sliders className="w-3 h-3 text-blue-400" />
                SAR Radar Overlay Opacity:
              </span>
              <span className="text-blue-300 font-bold">{(sarOverlayOpacity * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={sarOverlayOpacity}
              onChange={(e) => setSarOverlayOpacity(parseFloat(e.target.value))}
              className="w-full accent-blue-500 h-1 bg-slate-800 rounded cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>Google Maps Optical</span>
              <span>Sentinel-1 SAR Radar</span>
            </div>
          </div>

          {/* Layer Toggles */}
          <div className="pt-2 border-t border-[#1e293b] space-y-1.5 text-[11px]">
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showSarRaster}
                onChange={(e) => setShowSarRaster(e.target.checked)}
                className="rounded accent-blue-500 cursor-pointer"
              />
              <span>SAR Backscatter Raster ({channel})</span>
            </label>
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showVessels}
                onChange={(e) => setShowVessels(e.target.checked)}
                className="rounded accent-rose-500 cursor-pointer"
              />
              <span>AIS Suspect Tankers</span>
            </label>
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showFootprint}
                onChange={(e) => setShowFootprint(e.target.checked)}
                className="rounded accent-blue-500 cursor-pointer"
              />
              <span>Sentinel-1 Swath Boundary</span>
            </label>
          </div>
        </div>
      </div>

      {/* Bottom Map Telemetry Legend */}
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-3 px-3 py-1.5 bg-[#111622]/90 backdrop-blur-md border border-[#1e293b] rounded shadow-lg font-mono text-[10px] text-slate-300">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-rose-500/30 border border-rose-500" />
          <span>Candidate #1 (Primary)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-amber-500/30 border border-amber-500" />
          <span>Candidate #2 (Secondary)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500 ring-2 ring-rose-400/40" />
          <span>Suspect Vessel (CPA)</span>
        </div>
      </div>
    </div>
  );
};

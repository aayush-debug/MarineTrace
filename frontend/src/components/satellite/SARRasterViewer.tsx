import React, { useRef, useState, useEffect, useCallback } from 'react';
import type {
  SARSceneDetails,
  SARMode,
  SARChannel,
  SARMaskType,
  SARImageEnhancement,
  SARCandidate,
} from '../../types/sar';

interface SARRasterViewerProps {
  scene: SARSceneDetails;
  activeTab: SARMode;
  maskType: SARMaskType;
  channel: SARChannel;
  selectedCandidateId: number | null;
  hoveredCandidateId: number | null;
  onSelectCandidate: (id: number | null) => void;
  onHoverCandidate: (id: number | null) => void;
  enhancements: SARImageEnhancement;
  showCandidateContours: boolean;
  showCandidateLabels: boolean;
  zoom: number;
  onZoomChange: (zoom: number | ((prev: number) => number)) => void;
  pan: { x: number; y: number };
  onPanChange: (pan: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  onCursorCoords: (coords: { pixelX: number; pixelY: number; lat: number; lon: number } | null) => void;
  onImageLoaded?: () => void;
}

export const SARRasterViewer: React.FC<SARRasterViewerProps> = ({
  scene,
  activeTab,
  maskType,
  channel,
  selectedCandidateId,
  hoveredCandidateId,
  onSelectCandidate,
  onHoverCandidate,
  enhancements,
  showCandidateContours,
  showCandidateLabels,
  zoom,
  onZoomChange,
  pan,
  onPanChange,
  onCursorCoords,
  onImageLoaded,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredCandidate, setLocalHoveredCandidate] = useState<SARCandidate | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [isBaseLoaded, setIsBaseLoaded] = useState(false);

  const baseImageRef = useRef<HTMLImageElement | null>(null);

  const imgDim = scene.metadata.dimensions?.width || 1024;

  // Determine base SAR raster URL
  const channelKey = channel.toLowerCase() as 'vv' | 'vh' | 'composite';
  const baseRasterUrl = scene.imagery_urls[channelKey] || `/sar/sample_s1_${channelKey}.png`;

  // Determine mask raster URL
  const maskUrl =
    maskType === 'binary'
      ? scene.imagery_urls.mask || '/sar/sample_s1_mask.png'
      : scene.imagery_urls.prob || '/sar/sample_s1_prob.png';

  // Preload images
  useEffect(() => {
    let mounted = true;
    setIsBaseLoaded(false);

    const imgBase = new Image();
    imgBase.src = activeTab === 'mask' ? maskUrl : baseRasterUrl;
    imgBase.onload = () => {
      if (!mounted) return;
      baseImageRef.current = imgBase;
      setIsBaseLoaded(true);
      onImageLoaded?.();
    };

    return () => {
      mounted = false;
    };
  }, [baseRasterUrl, maskUrl, activeTab, onImageLoaded]);

  // Handle Mouse Down for Pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - pan.x,
      y: e.clientY - pan.y,
    });
  };

  // Handle Mouse Move for Pan & Coordinate Telemetry
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      if (isDragging) {
        onPanChange({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }

      // Base display size in viewer (720px)
      const baseDisplaySize = 720;
      const centerX = rect.width / 2 + pan.x;
      const centerY = rect.height / 2 + pan.y;
      const scale = zoom / 100;
      const renderWidth = baseDisplaySize * scale;
      const renderHeight = baseDisplaySize * scale;

      const imgLeft = centerX - renderWidth / 2;
      const imgTop = centerY - renderHeight / 2;

      const normX = (clientX - imgLeft) / renderWidth;
      const normY = (clientY - imgTop) / renderHeight;

      if (normX >= 0 && normX <= 1 && normY >= 0 && normY <= 1) {
        const pixelX = Math.round(normX * imgDim);
        const pixelY = Math.round(normY * imgDim);

        const bbox = scene.metadata.bbox;
        const lat = bbox.max_latitude - normY * (bbox.max_latitude - bbox.min_latitude);
        const lon = bbox.min_longitude + normX * (bbox.max_longitude - bbox.min_longitude);

        onCursorCoords({ pixelX, pixelY, lat, lon });
      } else {
        onCursorCoords(null);
      }
    },
    [isDragging, dragStart, pan, zoom, imgDim, scene.metadata.bbox, onPanChange, onCursorCoords]
  );

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    onZoomChange((prevZoom: number) => {
      return Math.round(Math.min(Math.max(prevZoom * zoomFactor, 50), 400));
    });
  };

  // Build SVG Path from contour coordinates
  const renderContourPath = (coords: [number, number][]) => {
    if (!coords || coords.length === 0) return '';
    return (
      coords.reduce((acc, pt, i) => {
        return `${acc} ${i === 0 ? 'M' : 'L'} ${pt[0]} ${pt[1]}`;
      }, '') + ' Z'
    );
  };

  const getCandidateColors = (id: number) => {
    switch (id) {
      case 1:
        return {
          stroke: '#f43f5e',
          fill: 'rgba(244, 63, 94, 0.16)',
          highlight: 'rgba(244, 63, 94, 0.32)',
          badgeBg: 'bg-rose-950/90 border-rose-500/80 text-rose-300',
        };
      case 2:
        return {
          stroke: '#f59e0b',
          fill: 'rgba(245, 158, 11, 0.16)',
          highlight: 'rgba(245, 158, 11, 0.32)',
          badgeBg: 'bg-amber-950/90 border-amber-500/80 text-amber-300',
        };
      default:
        return {
          stroke: '#38bdf8',
          fill: 'rgba(56, 189, 248, 0.16)',
          highlight: 'rgba(56, 189, 248, 0.32)',
          badgeBg: 'bg-sky-950/90 border-sky-500/80 text-sky-300',
        };
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-[#03060c] overflow-hidden select-none flex items-center justify-center ${
        isDragging ? 'cursor-grabbing' : 'cursor-crosshair'
      }`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        setIsDragging(false);
        onCursorCoords(null);
        setLocalHoveredCandidate(null);
        onHoverCandidate(null);
      }}
      onWheel={handleWheel}
    >
      {/* Background Precision Measurement Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Main Raster & Vector Viewport Plane (720 x 720 base resolution) */}
      <div
        className="relative w-[720px] h-[720px] max-w-[88vw] max-h-[85vh] origin-center transition-transform duration-75 ease-out shadow-2xl shrink-0"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`,
        }}
      >
        {/* Loading Spinner */}
        {!isBaseLoaded && (
          <div className="absolute inset-0 bg-[#060a12] flex items-center justify-center z-10">
            <div className="w-10 h-10 rounded-full border-2 border-slate-800 border-t-cyan-400 animate-spin" />
          </div>
        )}

        {/* Layer 1: SAR Raster (Raw or Overlay) */}
        {activeTab !== 'mask' && (
          <img
            src={baseRasterUrl}
            alt="Sentinel-1 SAR Backscatter Raster"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            style={{
              filter: `brightness(${enhancements.brightness}%) contrast(${enhancements.contrast}%)`,
              imageRendering: 'crisp-edges',
            }}
          />
        )}

        {/* Layer 2: U-Net ML Segmentation Mask Raster (Mask mode) */}
        {activeTab === 'mask' && (
          <div className="absolute inset-0 bg-black">
            <img
              src={maskUrl}
              alt="U-Net ML Segmentation Mask"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              style={{
                filter: `brightness(${enhancements.brightness}%) contrast(${enhancements.contrast}%)`,
                imageRendering: 'pixelated',
              }}
            />
          </div>
        )}

        {/* Layer 3: SVG Vector Closed Polygon Contours */}
        {activeTab !== 'raw' && showCandidateContours && (
          <svg
            viewBox={`0 0 ${imgDim} ${imgDim}`}
            className="absolute inset-0 w-full h-full pointer-events-auto"
            style={{ overflow: 'visible' }}
          >
            {scene.candidates.map((cand) => {
              const isSelected = selectedCandidateId === cand.candidate_id;
              const isHovered = hoveredCandidateId === cand.candidate_id;
              const colors = getCandidateColors(cand.candidate_id);
              const pathData = renderContourPath(cand.contour_pixels);
              const dimOther = selectedCandidateId !== null && !isSelected;

              return (
                <g
                  key={cand.candidate_id}
                  className="transition-opacity duration-150 cursor-pointer"
                  style={{ opacity: dimOther ? 0.35 : 1 }}
                  onMouseEnter={(e) => {
                    setLocalHoveredCandidate(cand);
                    onHoverCandidate(cand.candidate_id);
                    setTooltipPos({ x: e.clientX, y: e.clientY });
                  }}
                  onMouseMove={(e) => {
                    setTooltipPos({ x: e.clientX, y: e.clientY });
                  }}
                  onMouseLeave={() => {
                    setLocalHoveredCandidate(null);
                    onHoverCandidate(null);
                    setTooltipPos(null);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCandidate(isSelected ? null : cand.candidate_id);
                  }}
                >
                  {/* Subtle polygon fill and crisp 1.5px boundary */}
                  <path
                    d={pathData}
                    fill={isHovered || isSelected ? colors.highlight : colors.fill}
                    stroke={colors.stroke}
                    strokeWidth={isSelected ? 2.5 : isHovered ? 2.0 : 1.5}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    className="transition-all duration-150"
                  />

                  {/* Centroid Crosshair Marker */}
                  <circle
                    cx={cand.centroid.pixel_x}
                    cy={cand.centroid.pixel_y}
                    r={isSelected ? 4 : 3}
                    fill={colors.stroke}
                    stroke="#ffffff"
                    strokeWidth={1}
                  />
                </g>
              );
            })}
          </svg>
        )}

        {/* Layer 4: Candidate Labels */}
        {activeTab !== 'raw' && showCandidateLabels && (
          <div className="absolute inset-0 pointer-events-none">
            {scene.candidates.map((cand) => {
              const isSelected = selectedCandidateId === cand.candidate_id;
              const isHovered = hoveredCandidateId === cand.candidate_id;
              const colors = getCandidateColors(cand.candidate_id);
              const dimOther = selectedCandidateId !== null && !isSelected;

              return (
                <div
                  key={cand.candidate_id}
                  className="absolute transition-all duration-150 transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${(cand.centroid.pixel_x / imgDim) * 100}%`,
                    top: `${(cand.centroid.pixel_y / imgDim) * 100}%`,
                    opacity: dimOther ? 0.35 : 1,
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCandidate(isSelected ? null : cand.candidate_id);
                    }}
                    className={`pointer-events-auto flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-mono font-bold shadow-lg transition-transform ${
                      colors.badgeBg
                    } ${isSelected || isHovered ? 'scale-110 ring-2 ring-cyan-400/50' : 'scale-100'}`}
                  >
                    <span>#{cand.candidate_id}</span>
                    <span className="opacity-90 font-normal">
                      {(cand.oil_probability * 100).toFixed(0)}%
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Subtle Frame Bounding Box */}
        <div className="absolute inset-0 border border-slate-700/60 pointer-events-none rounded" />
      </div>

      {/* Floating Candidate Hover Tooltip */}
      {hoveredCandidate && tooltipPos && (
        <div
          className="fixed z-50 pointer-events-none p-3 bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-lg shadow-2xl font-mono text-xs text-slate-200 space-y-1.5 min-w-[220px]"
          style={{
            left: `${tooltipPos.x + 16}px`,
            top: `${tooltipPos.y + 16}px`,
          }}
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-1">
            <span className="font-bold text-slate-100">Candidate #{hoveredCandidate.candidate_id}</span>
            <span
              className={`text-[10px] font-bold ${
                hoveredCandidate.oil_probability >= 0.8 ? 'text-rose-400' : 'text-amber-400'
              }`}
            >
              {(hoveredCandidate.oil_probability * 100).toFixed(1)}% Match
            </span>
          </div>

          <div className="text-[10px] text-sky-400 font-semibold uppercase">
            {hoveredCandidate.classification}
          </div>

          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-slate-400 pt-1">
            <div>
              Area: <span className="text-slate-200 font-bold">{hoveredCandidate.area_km2} km²</span>
            </div>
            <div>
              Perimeter: <span className="text-slate-200">{hoveredCandidate.properties.perimeter_km} km</span>
            </div>
            <div>
              Aspect: <span className="text-slate-200">{hoveredCandidate.properties.aspect_ratio}</span>
            </div>
            <div>
              Solidity: <span className="text-slate-200">{hoveredCandidate.properties.solidity}</span>
            </div>
          </div>

          <div className="text-[9px] text-slate-500 pt-1 border-t border-slate-800">
            Centroid: {hoveredCandidate.centroid.latitude.toFixed(4)}°N, {hoveredCandidate.centroid.longitude.toFixed(4)}°E
          </div>
        </div>
      )}
    </div>
  );
};

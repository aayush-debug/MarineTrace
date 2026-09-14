/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { useInvestigation } from './InvestigationContext';

export type DriftAnimationMode = 'backward' | 'forward' | 'both';
export type SpillPositionPhase = 'original' | 'current' | 'future';

export function formatSimulationTimestamp(raw?: string | null): string {
  if (!raw) return 'Observation T₀';
  const clean = raw.split(' ')[0].replace(/[()]/g, '');
  const parsed = new Date(clean);
  if (isNaN(parsed.getTime())) {
    return raw;
  }
  return parsed.toUTCString().replace('GMT', 'UTC');
}

export interface TrajectoryWaypoint {
  index: number;
  lat: number;
  lon: number;
  timestamp: string;
  timeMs: number;
  offsetHours: number;
  label: string;
}

export interface DriftAnimationContextType {
  mode: DriftAnimationMode;
  setMode: (mode: DriftAnimationMode) => void;
  spillPosition: SpillPositionPhase;
  setSpillPosition: (pos: SpillPositionPhase, animate?: boolean) => void;
  isPlaying: boolean;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  reset: () => void;
  progress: number; // 0 to 1
  seek: (prog: number) => void;
  speed: number; // 0.5, 1, 2, 4
  setSpeed: (speed: number) => void;
  loop: boolean;
  setLoop: (loop: boolean) => void;

  // Active interpolated telemetry
  currentPosition: [number, number] | null; // [lat, lon]
  currentHeading: number | null; // degrees 0-360
  currentTimestampStr: string;
  currentOffsetHours: number;

  // Active path coordinates
  activePolyline: [number, number][]; // [lat, lon][] traversed so far
  fullPolyline: [number, number][]; // [lat, lon][] full path for selected mode
  waypoints: TrajectoryWaypoint[];

  // Step navigation
  stepForward: () => void;
  stepBackward: () => void;

  // Availability & Metadata
  hasBackward: boolean;
  hasForward: boolean;
  hasDriftData: boolean;
  spillCentroid: [number, number] | null;
  originPoint: [number, number] | null;
  originConfidence: number;
  originTimeStr: string | null;
}

const DriftAnimationContext = createContext<DriftAnimationContextType | null>(null);

// Geodetic distance in meters (haversine)
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Bearing calculation in degrees 0-360
function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  return ((θ * 180) / Math.PI + 360) % 360;
}

// Parse ISO date or string with annotations into timestamp in ms
function parseTimestampMs(raw?: string, fallbackBaseMs = 0): number {
  if (!raw) return fallbackBaseMs;
  const clean = raw.split(' ')[0].replace(/[()]/g, '');
  const parsed = Date.parse(clean);
  return isNaN(parsed) ? fallbackBaseMs : parsed;
}

export const DriftAnimationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { investigation } = useInvestigation();

  const [mode, setModeState] = useState<DriftAnimationMode>('backward');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(1);
  const [loop, setLoop] = useState<boolean>(true);

  // Reference for requestAnimationFrame
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const lastStateUpdateTimeRef = useRef<number>(0);

  // Observation base time
  const obsTimeStr = investigation?.observation_time;
  const obsTimeMs = useMemo(() => {
    if (!obsTimeStr) return 0;
    return parseTimestampMs(obsTimeStr);
  }, [obsTimeStr]);

  // Backward Trajectory Data
  const rawBackward = investigation?.drift?.backward_trajectory?.points;
  const backwardPoints = useMemo(() => {
    if (!rawBackward || rawBackward.length === 0) return [];
    // raw is [[lon, lat], ...]
    return rawBackward.map((p) => [p[1], p[0]] as [number, number]);
  }, [rawBackward]);

  const backwardTimestamps = useMemo(() => {
    return investigation?.drift?.backward_trajectory?.timestamps || [];
  }, [investigation?.drift?.backward_trajectory?.timestamps]);

  // Forward Trajectory Data
  const rawForward = investigation?.drift?.forward_trajectory?.points;
  const forwardPoints = useMemo(() => {
    if (!rawForward || rawForward.length === 0) return [];
    return rawForward.map((p) => [p[1], p[0]] as [number, number]);
  }, [rawForward]);

  const forwardTimestamps = useMemo(() => {
    return investigation?.drift?.forward_trajectory?.timestamps || [];
  }, [investigation?.drift?.forward_trajectory?.timestamps]);

  const hasBackward = backwardPoints.length > 1;
  const hasForward = forwardPoints.length > 1;
  const hasDriftData = hasBackward || hasForward;

  // Origin and spill centroids
  const spillGeom = investigation?.spill?.geometry;
  const spillCentroid = useMemo<[number, number] | null>(() => {
    if (backwardPoints.length > 0) return backwardPoints[0];
    if (forwardPoints.length > 0) return forwardPoints[0];
    if (spillGeom?.coordinates?.[0]?.[0]) {
      const c = spillGeom.coordinates[0][0];
      return [c[1], c[0]];
    }
    return null;
  }, [backwardPoints, forwardPoints, spillGeom]);

  const originLat = investigation?.drift?.origin?.latitude;
  const originLon = investigation?.drift?.origin?.longitude;
  const originPoint = useMemo<[number, number] | null>(() => {
    if (originLat !== undefined && originLon !== undefined) {
      return [originLat, originLon];
    }
    if (backwardPoints.length > 0) {
      return backwardPoints[backwardPoints.length - 1];
    }
    return null;
  }, [originLat, originLon, backwardPoints]);

  const originConfidence = investigation?.drift?.origin?.confidence ?? 0.85;
  const originTimeStr =
    investigation?.drift?.origin_time_window?.start ||
    investigation?.drift?.backward_trajectory?.timestamps?.slice(-1)[0] ||
    null;

  // Derive effective mode safely without cascading render effects
  const effectiveMode: DriftAnimationMode = useMemo(() => {
    if (mode === 'backward' && !hasBackward && hasForward) return 'forward';
    if (mode === 'forward' && !hasForward && hasBackward) return 'backward';
    return mode;
  }, [mode, hasBackward, hasForward]);

  const setMode = useCallback((newMode: DriftAnimationMode) => {
    setModeState(newMode);
    setProgress(0);
    setIsPlaying(false);
  }, []);

  // Assemble full path and waypoints depending on current mode
  const { pathPoints, waypoints } = useMemo(() => {
    if (!hasDriftData) {
      return { pathPoints: [], pathTimestamps: [], waypoints: [] };
    }

    if (effectiveMode === 'backward') {
      // Spill centroid -> Historical positions -> Probable origin
      const pts = backwardPoints;
      const tss = backwardTimestamps;

      const wps: TrajectoryWaypoint[] = pts.map((pt, idx) => {
        const rawTs = tss[idx];
        const timeMs = rawTs
          ? parseTimestampMs(rawTs, obsTimeMs - idx * 3600000 * 2)
          : obsTimeMs - idx * 3600000 * 2;
        const offsetHours = (timeMs - obsTimeMs) / 3600000;
        const isFirst = idx === 0;
        const isLast = idx === pts.length - 1;
        const label = isFirst
          ? 'T₀ Spill Detected'
          : isLast
          ? 'Probable Origin'
          : `${offsetHours.toFixed(0)}h`;

        return {
          index: idx,
          lat: pt[0],
          lon: pt[1],
          timestamp: rawTs || new Date(timeMs).toISOString(),
          timeMs,
          offsetHours,
          label,
        };
      });

      return { pathPoints: pts, pathTimestamps: tss, waypoints: wps };
    }

    if (effectiveMode === 'forward') {
      // Spill centroid -> Predicted future positions
      const pts = forwardPoints;
      const tss = forwardTimestamps;

      const wps: TrajectoryWaypoint[] = pts.map((pt, idx) => {
        const rawTs = tss[idx];
        const timeMs = rawTs
          ? parseTimestampMs(rawTs, obsTimeMs + idx * 3600000 * 3)
          : obsTimeMs + idx * 3600000 * 3;
        const offsetHours = (timeMs - obsTimeMs) / 3600000;
        const isFirst = idx === 0;
        const isLast = idx === pts.length - 1;
        const label = isFirst
          ? 'T₀ Spill Detected'
          : isLast
          ? `+${offsetHours.toFixed(0)}h Forecast`
          : `+${offsetHours.toFixed(0)}h`;

        return {
          index: idx,
          lat: pt[0],
          lon: pt[1],
          timestamp: rawTs || new Date(timeMs).toISOString(),
          timeMs,
          offsetHours,
          label,
        };
      });

      return { pathPoints: pts, pathTimestamps: tss, waypoints: wps };
    }

    // mode === 'both' (Full cycle: Origin -> Spill -> Forecast)
    // Reverse backward points so we travel Origin -> Spill, then forward into future
    const reversedBackward = [...backwardPoints].reverse();
    const reversedTs = [...backwardTimestamps].reverse();

    // Skip the first forward point if it duplicates the spill centroid
    const forwardSlice = forwardPoints.length > 0 ? forwardPoints.slice(1) : [];
    const forwardTsSlice = forwardTimestamps.length > 0 ? forwardTimestamps.slice(1) : [];

    const combinedPts = [...reversedBackward, ...forwardSlice];
    const combinedTss = [...reversedTs, ...forwardTsSlice];

    const wps: TrajectoryWaypoint[] = combinedPts.map((pt, idx) => {
      const rawTs = combinedTss[idx];
      let timeMs: number;
      if (rawTs) {
        timeMs = parseTimestampMs(rawTs, obsTimeMs);
      } else {
        const offsetFromObs = idx - reversedBackward.length + 1;
        timeMs = obsTimeMs + offsetFromObs * 3600000 * 2;
      }
      const offsetHours = (timeMs - obsTimeMs) / 3600000;
      const isOrigin = idx === 0;
      const isSpill = idx === reversedBackward.length - 1;
      const isEnd = idx === combinedPts.length - 1;

      const label = isOrigin
        ? 'Probable Origin'
        : isSpill
        ? 'T₀ Spill Detected'
        : isEnd
        ? `+${offsetHours.toFixed(0)}h Forecast`
        : offsetHours < 0
        ? `${offsetHours.toFixed(0)}h`
        : `+${offsetHours.toFixed(0)}h`;

      return {
        index: idx,
        lat: pt[0],
        lon: pt[1],
        timestamp: rawTs || new Date(timeMs).toISOString(),
        timeMs,
        offsetHours,
        label,
      };
    });

    return { pathPoints: combinedPts, pathTimestamps: combinedTss, waypoints: wps };
  }, [
    hasDriftData,
    effectiveMode,
    backwardPoints,
    backwardTimestamps,
    forwardPoints,
    forwardTimestamps,
    obsTimeMs,
  ]);

  // Compute cumulative distances along the trajectory for distance-based interpolation
  const { segmentDistances, cumulativeDistances, totalDistance } = useMemo(() => {
    if (pathPoints.length < 2) {
      return { segmentDistances: [], cumulativeDistances: [0], totalDistance: 0 };
    }

    const segs: number[] = [];
    const cum: number[] = [0];
    let total = 0;

    for (let i = 0; i < pathPoints.length - 1; i++) {
      const d = haversineDistance(
        pathPoints[i][0],
        pathPoints[i][1],
        pathPoints[i + 1][0],
        pathPoints[i + 1][1]
      );
      segs.push(d);
      total += d;
      cum.push(total);
    }

    return {
      segmentDistances: segs,
      cumulativeDistances: cum,
      totalDistance: Math.max(total, 1),
    };
  }, [pathPoints]);

  // Interpolate current position and telemetry based on progress (0 to 1)
  const {
    currentPosition,
    currentHeading,
    currentTimestampStr,
    currentOffsetHours,
    activePolyline,
  } = useMemo(() => {
    if (pathPoints.length === 0) {
      return {
        currentPosition: null,
        currentHeading: null,
        currentTimestampStr: '',
        currentOffsetHours: 0,
        activePolyline: [],
      };
    }

    if (pathPoints.length === 1 || progress <= 0) {
      const wp = waypoints[0];
      return {
        currentPosition: pathPoints[0],
        currentHeading: null,
        currentTimestampStr: wp?.timestamp || '',
        currentOffsetHours: wp?.offsetHours || 0,
        activePolyline: [pathPoints[0]],
      };
    }

    if (progress >= 1) {
      const lastIdx = pathPoints.length - 1;
      const prevIdx = Math.max(0, lastIdx - 1);
      const heading = calculateBearing(
        pathPoints[prevIdx][0],
        pathPoints[prevIdx][1],
        pathPoints[lastIdx][0],
        pathPoints[lastIdx][1]
      );
      const lastWp = waypoints[lastIdx];
      return {
        currentPosition: pathPoints[lastIdx],
        currentHeading: heading,
        currentTimestampStr: lastWp?.timestamp || '',
        currentOffsetHours: lastWp?.offsetHours || 0,
        activePolyline: pathPoints,
      };
    }

    // Target distance along polyline
    const targetDist = progress * totalDistance;

    // Find segment containing target distance
    let segIdx = 0;
    for (let i = 0; i < cumulativeDistances.length - 1; i++) {
      if (
        targetDist >= cumulativeDistances[i] &&
        targetDist <= cumulativeDistances[i + 1]
      ) {
        segIdx = i;
        break;
      }
    }

    const segStartDist = cumulativeDistances[segIdx];
    const segLen = Math.max(segmentDistances[segIdx] || 1, 0.001);
    const alpha = Math.min(1, Math.max(0, (targetDist - segStartDist) / segLen));

    const p1 = pathPoints[segIdx];
    const p2 = pathPoints[segIdx + 1] || p1;

    const lat = p1[0] + alpha * (p2[0] - p1[0]);
    const lon = p1[1] + alpha * (p2[1] - p1[1]);

    const heading = calculateBearing(p1[0], p1[1], p2[0], p2[1]);

    // Interpolate timestamp & offset
    const wp1 = waypoints[segIdx];
    const wp2 = waypoints[segIdx + 1] || wp1;
    const timeMs = wp1.timeMs + alpha * (wp2.timeMs - wp1.timeMs);
    const offsetHours = wp1.offsetHours + alpha * (wp2.offsetHours - wp1.offsetHours);

    // Active path: pathPoints up to segIdx, plus interpolated current point
    const active: [number, number][] = [
      ...pathPoints.slice(0, segIdx + 1),
      [lat, lon],
    ];

    return {
      currentPosition: [lat, lon] as [number, number],
      currentHeading: heading,
      currentTimestampStr: new Date(timeMs).toISOString(),
      currentOffsetHours: offsetHours,
      activePolyline: active,
    };
  }, [
    pathPoints,
    progress,
    totalDistance,
    cumulativeDistances,
    segmentDistances,
    waypoints,
  ]);

  // RequestAnimationFrame animation tick
  useEffect(() => {
    if (!isPlaying || pathPoints.length < 2) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      lastTimeRef.current = null;
      return;
    }

    // Base duration: 10 seconds for 1x speed across the trajectory
    const baseDurationMs = 10000;
    const effectiveDurationMs = baseDurationMs / Math.max(speed, 0.25);
    const minFrameIntervalMs = 28; // ~35 FPS cap to prevent main thread saturation and map lag

    const tick = (now: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = now;
        lastStateUpdateTimeRef.current = now;
      }

      // Throttle React state updates to ~35 FPS so the browser compositor and Leaflet remain silky smooth
      const elapsedSinceLastUpdate = now - lastStateUpdateTimeRef.current;
      if (elapsedSinceLastUpdate < minFrameIntervalMs) {
        animFrameRef.current = requestAnimationFrame(tick);
        return;
      }

      const deltaMs = now - lastTimeRef.current;
      lastTimeRef.current = now;
      lastStateUpdateTimeRef.current = now;

      const deltaProgress = deltaMs / effectiveDurationMs;

      setProgress((prev) => {
        const next = prev + deltaProgress;
        if (next >= 1) {
          if (loop) {
            return 0; // Loop back
          } else {
            setIsPlaying(false);
            return 1;
          }
        }
        return next;
      });

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [isPlaying, speed, loop, pathPoints.length]);

  const play = useCallback(() => {
    if (progress >= 0.999) {
      setProgress(0);
    }
    setIsPlaying(true);
  }, [progress]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      if (!prev && progress >= 0.999) {
        setProgress(0);
      }
      return !prev;
    });
  }, [progress]);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setProgress(0);
  }, []);

  const seek = useCallback((val: number) => {
    setProgress(Math.min(1, Math.max(0, val)));
  }, []);

  const stepForward = useCallback(() => {
    if (waypoints.length < 2) return;
    setIsPlaying(false);
    // Find closest waypoint and move to next
    const stepSize = 1 / (waypoints.length - 1);
    setProgress((prev) => Math.min(1, Math.round(prev / stepSize + 1) * stepSize));
  }, [waypoints.length]);

  const stepBackward = useCallback(() => {
    if (waypoints.length < 2) return;
    setIsPlaying(false);
    const stepSize = 1 / (waypoints.length - 1);
    setProgress((prev) => Math.max(0, Math.round(prev / stepSize - 1) * stepSize));
  }, [waypoints.length]);

  const [spillPosition, setSpillPositionState] = useState<SpillPositionPhase>('current');

  const setSpillPosition = useCallback((pos: SpillPositionPhase, animate = true) => {
    setSpillPositionState(pos);
    setIsPlaying(false);

    if (pos === 'original') {
      setModeState('backward');
      if (animate) {
        const start = performance.now();
        const duration = 500;
        const initialProg = progress;
        const targetProg = 1.0;
        const animateStep = (now: number) => {
          const elapsed = now - start;
          const t = Math.min(1, elapsed / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          setProgress(initialProg + (targetProg - initialProg) * eased);
          if (t < 1) requestAnimationFrame(animateStep);
        };
        requestAnimationFrame(animateStep);
      } else {
        setProgress(1.0);
      }
    } else if (pos === 'current') {
      if (animate) {
        const start = performance.now();
        const duration = 500;
        const initialProg = progress;
        const targetProg = 0.0;
        const animateStep = (now: number) => {
          const elapsed = now - start;
          const t = Math.min(1, elapsed / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          setProgress(initialProg + (targetProg - initialProg) * eased);
          if (t < 1) requestAnimationFrame(animateStep);
        };
        requestAnimationFrame(animateStep);
      } else {
        setProgress(0.0);
      }
    } else if (pos === 'future') {
      setModeState('forward');
      if (animate) {
        const start = performance.now();
        const duration = 500;
        const initialProg = mode === 'forward' ? progress : 0;
        const targetProg = 1.0;
        const animateStep = (now: number) => {
          const elapsed = now - start;
          const t = Math.min(1, elapsed / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          setProgress(initialProg + (targetProg - initialProg) * eased);
          if (t < 1) requestAnimationFrame(animateStep);
        };
        requestAnimationFrame(animateStep);
      } else {
        setProgress(1.0);
      }
    }
  }, [mode, progress]);

  const value = {
    mode: effectiveMode,
    setMode,
    spillPosition,
    setSpillPosition,
    isPlaying,
    play,
    pause,
    togglePlay,
    reset,
    progress,
    seek,
    speed,
    setSpeed,
    loop,
    setLoop,
    currentPosition,
    currentHeading,
    currentTimestampStr,
    currentOffsetHours,
    activePolyline,
    fullPolyline: pathPoints,
    waypoints,
    stepForward,
    stepBackward,
    hasBackward,
    hasForward,
    hasDriftData,
    spillCentroid,
    originPoint,
    originConfidence,
    originTimeStr,
  };

  return (
    <DriftAnimationContext.Provider value={value}>
      {children}
    </DriftAnimationContext.Provider>
  );
};

export const useDriftAnimation = (): DriftAnimationContextType => {
  const context = useContext(DriftAnimationContext);
  if (!context) {
    throw new Error('useDriftAnimation must be used within a DriftAnimationProvider');
  }
  return context;
};

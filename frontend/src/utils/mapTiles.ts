export type BasemapType =
  | 'google-hybrid'
  | 'google-satellite'
  | 'google-terrain'
  | 'google-streets';

export const GOOGLE_MAPS_KEY: string =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) ||
  (import.meta.env.GOOGLE_MAPS_API_KEY as string) ||
  (import.meta.env.VITE_MAPS_API_KEY as string) ||
  'AIzaSyA3ExiOVHGoDWfjNv7SzioFLomaZdM_ivQ';

export interface BasemapConfig {
  id: BasemapType;
  name: string;
  sublabel: string;
  icon: string;
  url: string;
  attribution: string;
  subdomains?: string[];
  maxZoom: number;
}

export const BASEMAP_CONFIGS: Record<BasemapType, BasemapConfig> = {
  'google-hybrid': {
    id: 'google-hybrid',
    name: 'Google Hybrid',
    sublabel: 'Satellite + Nautical Labels',
    icon: '🌍',
    url: `https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&key=${GOOGLE_MAPS_KEY}`,
    attribution: '&copy; <a href="https://www.google.com/maps">Google Maps</a> | MaritimeTrace',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 20,
  },
  'google-satellite': {
    id: 'google-satellite',
    name: 'Google Satellite',
    sublabel: 'High-Res Optical Sea & Coast',
    icon: '🛰️',
    url: `https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}&key=${GOOGLE_MAPS_KEY}`,
    attribution: '&copy; <a href="https://www.google.com/maps">Google Maps</a> | MaritimeTrace',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 20,
  },
  'google-terrain': {
    id: 'google-terrain',
    name: 'Google Terrain',
    sublabel: 'Topography & Coastal Relief',
    icon: '⛰️',
    url: `https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}&key=${GOOGLE_MAPS_KEY}`,
    attribution: '&copy; <a href="https://www.google.com/maps">Google Maps</a> | MaritimeTrace',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 20,
  },
  'google-streets': {
    id: 'google-streets',
    name: 'Google Roadmap',
    sublabel: 'Ports & Maritime Facilities',
    icon: '🗺️',
    url: `https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=${GOOGLE_MAPS_KEY}`,
    attribution: '&copy; <a href="https://www.google.com/maps">Google Maps</a> | MaritimeTrace',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 20,
  },
};


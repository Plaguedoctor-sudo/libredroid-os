import React, { useState } from 'react';
import {
  Map, Search, Navigation, Star, Layers, Download, Compass,
  MapPin, X, ChevronRight, Wifi, AlertTriangle, Route
} from 'lucide-react';

interface POI {
  id: string;
  name: string;
  category: string;
  distance: string;
  icon: string;
}

interface Props {
  onClose: () => void;
}

// @mock
const MOCK_POIS: POI[] = [
  { id: '1', name: 'Central Library', category: 'Library', distance: '0.3 km', icon: '📚' },
  { id: '2', name: 'Green Park Café', category: 'Coffee', distance: '0.5 km', icon: '☕' },
  { id: '3', name: 'Civic Hospital', category: 'Healthcare', distance: '1.2 km', icon: '🏥' },
  { id: '4', name: 'Metro Station Nord', category: 'Transit', distance: '0.8 km', icon: '🚇' },
  { id: '5', name: 'Farmers Market', category: 'Shopping', distance: '1.5 km', icon: '🛒' },
];

// @mock
const OFFLINE_MAPS = [
  { region: 'Europe / France', size: '2.4 GB', date: '2026-10-15', status: 'downloaded' },
  { region: 'Europe / Germany', size: '3.1 GB', date: '2026-10-10', status: 'downloaded' },
  { region: 'North America / US East', size: '4.8 GB', date: null, status: 'available' },
  { region: 'Asia / Japan', size: '1.9 GB', date: null, status: 'available' },
];

export const MapsApp: React.FC<Props> = ({ onClose }) => {
  const [tab, setTab] = useState<'map' | 'search' | 'downloads' | 'favorites'>('map');
  const [search, setSearch] = useState('');
  const [navigating, setNavigating] = useState(false);
  const [navTarget, setNavTarget] = useState<POI | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState<string[]>(['Europe / France', 'Europe / Germany']);
  const [favorites, setFavorites] = useState<POI[]>([]); // @mock
  const [mapLayer, setMapLayer] = useState<'standard' | 'satellite' | 'topo'>('standard');

  const filteredPOIs = MOCK_POIS.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const startNav = (poi: POI) => {
    setNavTarget(poi);
    setNavigating(true);
    setTab('map');
  };

  const handleDownload = async (region: string) => {
    setDownloading(region);
    await new Promise(r => setTimeout(r, 2000)); // @mock download simulation
    setDownloaded(d => [...d, region]);
    setDownloading(null);
  };

  const toggleFav = (poi: POI) => {
    setFavorites(fs => fs.some(f => f.id === poi.id) ? fs.filter(f => f.id !== poi.id) : [...fs, poi]);
  };

  const isFav = (id: string) => favorites.some(f => f.id === id);

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-neutral-900 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-neutral-950 border-b border-neutral-800 shrink-0">
        <Map size={17} className="text-teal-400" />
        <h1 className="text-sm font-bold flex-1">LibreMaps</h1>
        <div className="flex gap-1 bg-neutral-800 p-1 rounded-xl">
          {(['standard','satellite','topo'] as const).map(l => (
            <button key={l} onClick={() => setMapLayer(l)}
              className={`px-2 py-1 rounded-lg text-[10px] font-semibold capitalize transition-all ${
                mapLayer === l ? 'bg-teal-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >{l}</button>
          ))}
        </div>
      </div>

      {/* No-Google banner */}
      <div className="flex items-center gap-2 px-4 py-2 bg-teal-900/20 border-b border-teal-800/30 shrink-0">
        <Wifi size={11} className="text-teal-400" />
        <span className="text-[10px] text-teal-300 font-medium">OpenStreetMap · OsmAnd engine · No Google · 100% offline capable</span>
      </div>

      {/* Navigation Banner */}
      {navigating && navTarget && (
        <div className="flex items-center gap-3 px-4 py-3 bg-blue-900/40 border-b border-blue-700/40 shrink-0">
          <Navigation size={16} className="text-blue-400 shrink-0" />
          <div className="flex-1">
            <div className="text-xs font-bold text-white">Navigating to {navTarget.name}</div>
            <div className="text-[11px] text-blue-300">Turn left in 200m · ETA ~6 min · {navTarget.distance}</div>
          </div>
          <button
            onClick={() => { setNavigating(false); setNavTarget(null); }}
            className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition-colors"
          >
            End
          </button>
        </div>
      )}

      {/* Map Canvas (simulated) */}
      {tab === 'map' && (
        <div className="flex-1 relative overflow-hidden bg-neutral-800">
          {/* Fake map background */}
          <div className={`absolute inset-0 ${
            mapLayer === 'standard' ? 'bg-gradient-to-br from-teal-900/40 via-neutral-800 to-blue-900/30' :
            mapLayer === 'satellite' ? 'bg-gradient-to-br from-green-900/60 via-neutral-900 to-green-800/40' :
            'bg-gradient-to-br from-amber-900/40 via-neutral-800 to-teal-900/30'
          }`}>
            {/* Grid lines to simulate map */}
            <svg className="absolute inset-0 w-full h-full opacity-10">
              {Array.from({length:12}).map((_,i) => (
                <line key={`h${i}`} x1="0" y1={`${i*8.33}%`} x2="100%" y2={`${i*8.33}%`} stroke="white" strokeWidth="0.5" />
              ))}
              {Array.from({length:12}).map((_,i) => (
                <line key={`v${i}`} x1={`${i*8.33}%`} y1="0" x2={`${i*8.33}%`} y2="100%" stroke="white" strokeWidth="0.5" />
              ))}
            </svg>

            {/* POI markers */}
            {MOCK_POIS.map((poi, i) => (
              <div
                key={poi.id}
                onClick={() => { setTab('search'); }}
                className="absolute cursor-pointer"
                style={{ left: `${20 + i * 14}%`, top: `${25 + (i % 3) * 20}%` }}
              >
                <div className="bg-neutral-900 border border-teal-500 rounded-full px-2 py-1 text-xs font-semibold text-teal-300 shadow-lg whitespace-nowrap flex items-center gap-1">
                  <span>{poi.icon}</span>
                  <span className="text-[9px]">{poi.name.split(' ')[0]}</span>
                </div>
              </div>
            ))}

            {/* Current location */}
            <div className="absolute" style={{ left: '48%', top: '50%' }}>
              <div className="relative">
                <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg" />
                <div className="absolute inset-0 w-4 h-4 rounded-full bg-blue-500/40 animate-ping" />
              </div>
            </div>
          </div>

          {/* Map Controls */}
          <div className="absolute right-4 bottom-6 flex flex-col gap-2">
            <button className="w-10 h-10 bg-neutral-900/90 rounded-2xl flex items-center justify-center hover:bg-neutral-800 transition-colors shadow-lg">
              <Compass size={18} className="text-white" />
            </button>
            <button className="w-10 h-10 bg-neutral-900/90 rounded-2xl flex items-center justify-center hover:bg-neutral-800 transition-colors shadow-lg text-lg font-bold text-white">
              +
            </button>
            <button className="w-10 h-10 bg-neutral-900/90 rounded-2xl flex items-center justify-center hover:bg-neutral-800 transition-colors shadow-lg text-lg font-bold text-white">
              −
            </button>
          </div>

          {/* Search overlay */}
          <div className="absolute top-3 left-3 right-16">
            <button
              onClick={() => setTab('search')}
              className="w-full flex items-center gap-2 px-4 py-2.5 bg-neutral-900/95 rounded-2xl border border-neutral-700 shadow-lg hover:bg-neutral-900 transition-colors"
            >
              <Search size={15} className="text-neutral-400" />
              <span className="text-sm text-neutral-400">Search places…</span>
            </button>
          </div>
        </div>
      )}

      {/* Search View */}
      {tab === 'search' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 py-3 shrink-0">
            <div className="flex items-center gap-2 bg-neutral-800 rounded-2xl px-3 py-2">
              <Search size={15} className="text-neutral-400" />
              <input
                className="flex-1 bg-transparent text-sm text-white placeholder-neutral-500 outline-none"
                placeholder="Search places, addresses, POIs…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
              {search && <button onClick={() => setSearch('')}><X size={14} className="text-neutral-400" /></button>}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-4">
            {filteredPOIs.map(poi => (
              <div key={poi.id} className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-800/60 hover:bg-neutral-800 transition-colors">
                <span className="text-2xl shrink-0">{poi.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{poi.name}</div>
                  <div className="text-xs text-neutral-400">{poi.category} · {poi.distance}</div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => toggleFav(poi)} className={`p-1.5 rounded-xl transition-colors ${isFav(poi.id) ? 'text-amber-400' : 'text-neutral-600 hover:text-neutral-400'}`}>
                    <Star size={14} fill={isFav(poi.id) ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={() => startNav(poi)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs font-bold text-white transition-colors"
                  >
                    <Route size={12} />
                    Go
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Downloads View */}
      {tab === 'downloads' && (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-4">
          <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Offline Map Regions</div>
          {OFFLINE_MAPS.map(m => {
            const isDl = downloaded.includes(m.region);
            const isLoading = downloading === m.region;
            return (
              <div key={m.region} className="flex items-center gap-3 p-4 rounded-2xl bg-neutral-800/60">
                <Layers size={18} className={isDl ? 'text-teal-400' : 'text-neutral-500'} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white">{m.region}</div>
                  <div className="text-xs text-neutral-400 mt-0.5">
                    {m.size}{isDl && m.date ? ` · Updated ${m.date}` : ''}
                  </div>
                </div>
                {isDl ? (
                  <span className="text-xs text-teal-400 font-bold">✓ Downloaded</span>
                ) : isLoading ? (
                  <span className="text-xs text-blue-400 animate-pulse">Downloading…</span>
                ) : (
                  <button
                    onClick={() => handleDownload(m.region)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs font-bold text-white transition-colors"
                  >
                    <Download size={12} />
                    Download
                  </button>
                )}
              </div>
            );
          })}
          <div className="p-3 rounded-2xl bg-amber-900/20 border border-amber-800/30 flex items-start gap-2">
            <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300">Downloaded maps work fully offline. Updates pull from OpenStreetMap mirrors only, no Google servers.</p>
          </div>
        </div>
      )}

      {/* Favorites View */}
      {tab === 'favorites' && (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 pb-4">
          {favorites.length === 0 ? (
            <div className="text-center py-16 text-neutral-500 text-sm">
              <Star size={32} className="mx-auto mb-3 text-neutral-700" />
              No favorites yet. Star a place to save it here.
            </div>
          ) : (
            favorites.map(poi => (
              <div key={poi.id} className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-800/60">
                <span className="text-2xl">{poi.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{poi.name}</div>
                  <div className="text-xs text-neutral-400">{poi.category} · {poi.distance}</div>
                </div>
                <button onClick={() => startNav(poi)} className="p-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 transition-colors">
                  <Navigation size={14} className="text-white" />
                </button>
                <button onClick={() => toggleFav(poi)} className="p-1.5 rounded-xl hover:bg-neutral-700 transition-colors text-amber-400">
                  <Star size={14} fill="currentColor" />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Bottom Nav */}
      <div className="flex border-t border-neutral-800 bg-neutral-950 shrink-0">
        {[
          { id: 'map', label: 'Map', icon: Map },
          { id: 'search', label: 'Search', icon: Search },
          { id: 'favorites', label: 'Saved', icon: Star },
          { id: 'downloads', label: 'Offline', icon: Download },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id as any)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-semibold transition-colors ${
              tab === id ? 'text-teal-400' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

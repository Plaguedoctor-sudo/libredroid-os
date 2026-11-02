import React, { useState, useEffect } from 'react';
import { Image, Heart, Share2, Sparkles, X, ShieldCheck, Folder, RefreshCw, Camera, Bot } from 'lucide-react';
import { useWindow } from '../../context/WindowContext';
import type { AppIntent } from '../../types/apps';
import { fetchDevicePhotos, DevicePhoto } from '../../services/hardwareBridgeClient';

interface PhotoItem {
  id: string;
  url: string;
  caption: string;
  date: string;
  path?: string;
}

interface Props extends Partial<AppIntent> {
  intent?: AppIntent;
}

export const PhotosApp: React.FC<Props> = ({ intent, params, paramSeq }) => {
  const effectiveIntent = intent || (params ? { params, paramSeq } : undefined);
  const { openApp } = useWindow();
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);

  const loadPhotos = async () => {
    setLoading(true);
    const devicePhotos = await fetchDevicePhotos();
    if (devicePhotos.length > 0) {
      setPhotos(devicePhotos.map(p => ({
        id: p.id,
        url: p.url,
        caption: p.caption || p.name,
        date: p.date || 'Device Camera',
        path: p.path
      })));
    } else {
      // Fallback sample photos if device has 0 images
      setPhotos([
        {
          id: '1',
          url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
          caption: 'Mountain Lake Sunrise',
          date: 'Sample Vault',
        },
        {
          id: '2',
          url: 'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=800&q=80',
          caption: 'Misty Evergreen Forest',
          date: 'Sample Vault',
        },
      ]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPhotos();
  }, []);

  /* Consume Intent (e.g. opened from Files or Camera) */
  useEffect(() => {
    const p = effectiveIntent?.params;
    if (!p) return;
    if (typeof p.photoUrl === 'string') {
      const item: PhotoItem = {
        id: `intent-${Date.now()}`,
        url: p.photoUrl,
        caption: typeof p.caption === 'string' ? p.caption : 'Viewed Photo',
        date: 'Just now',
        path: typeof p.path === 'string' ? p.path : undefined
      };
      setSelectedPhoto(item);
    }
  }, [effectiveIntent?.paramSeq]);

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-neutral-900 text-white select-none overflow-hidden">
      {/* Top Header */}
      <div className="p-3 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
            <Image size={18} />
          </div>
          <div>
            <span className="text-sm font-bold block">Immich Gallery</span>
            <span className="text-[10px] text-neutral-400 font-mono">DCIM / Pictures Storage</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <button
            onClick={() => openApp('camera', 'Open Camera')}
            className="px-2.5 py-1.5 bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40 rounded-xl transition-all flex items-center gap-1.5 active:scale-95"
            title="Open Camera to capture new photo"
          >
            <Camera size={13} />
            <span className="font-semibold hidden sm:inline">Camera</span>
          </button>
          <button
            onClick={loadPhotos}
            className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors flex items-center gap-1"
            title="Refresh device photos"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-teal-400' : ''} />
            <span className="text-[11px] font-mono">{photos.length} items</span>
          </button>
          <span>•</span>
          <span className="text-emerald-400 font-mono flex items-center gap-1">
            <ShieldCheck size={13} />
            <span className="hidden sm:inline">Local Access</span>
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 p-3 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
        {photos.map((photo) => (
          <div
            key={photo.id}
            onClick={() => setSelectedPhoto(photo)}
            className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group border border-neutral-800 bg-neutral-950"
          >
            <img
              src={photo.url}
              alt={photo.caption}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
              <span className="text-xs text-white truncate font-medium">{photo.caption}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-4 animate-fade-in"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="w-full flex items-center justify-between text-white max-w-3xl pt-2">
            <div>
              <div className="text-sm font-bold truncate max-w-sm">{selectedPhoto.caption}</div>
              <div className="text-xs text-neutral-400 font-mono truncate max-w-md">{selectedPhoto.path || selectedPhoto.date}</div>
            </div>
            <button 
              onClick={() => setSelectedPhoto(null)}
              className="p-1.5 hover:bg-neutral-800 rounded-full transition-colors text-neutral-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          <div 
            className="flex-1 flex items-center justify-center p-4 max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.caption}
              className="max-h-[75vh] max-w-full rounded-2xl shadow-2xl object-contain border border-neutral-800"
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pb-2 text-neutral-300">
            <button 
              onClick={() => {
                openApp('chats', 'Sovereign Chats', 'anonymity-whonix', {
                  message: `Shared photo: ${selectedPhoto.caption} (${selectedPhoto.url})`,
                });
                setSelectedPhoto(null);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-850 hover:bg-neutral-800 text-xs text-white transition-all active:scale-95"
            >
              <Share2 size={15} className="text-emerald-400" />
              <span>Share via Chats</span>
            </button>

            <button 
              onClick={() => {
                openApp('universal_ai', 'Universal AI', 'vault-airgap', {
                  initialPrompt: `Analyze and enhance details in this photo: "${selectedPhoto.caption}"`,
                  image: selectedPhoto.url,
                });
                setSelectedPhoto(null);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 border border-violet-500/40 text-xs transition-all active:scale-95"
            >
              <Sparkles size={15} className="text-violet-400" />
              <span>AI Vision Scan</span>
            </button>

            <button 
              onClick={() => {
                openApp('files', 'Nextcloud Files', undefined, {
                  path: selectedPhoto.path || '/storage/emulated/0/DCIM',
                  source: 'physical'
                });
                setSelectedPhoto(null);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-850 hover:bg-neutral-800 text-xs text-white transition-all active:scale-95"
            >
              <Folder size={15} className="text-amber-400" />
              <span>View in Files</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

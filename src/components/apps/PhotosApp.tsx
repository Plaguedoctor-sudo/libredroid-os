import React, { useState, useEffect } from 'react';
import { Image, Heart, Share2, Sparkles, X, ShieldCheck, Folder, RefreshCw } from 'lucide-react';
import { fetchDevicePhotos, DevicePhoto } from '../../services/hardwareBridgeClient';

interface PhotoItem {
  id: string;
  url: string;
  caption: string;
  date: string;
  path?: string;
}

export const PhotosApp: React.FC = () => {
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
            <span>Local Access</span>
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

          <div className="flex items-center gap-6 pb-2 text-neutral-400">
            <button className="flex items-center gap-1.5 hover:text-white text-xs">
              <Share2 size={16} />
              <span>Share Locally</span>
            </button>
            <button className="flex items-center gap-1.5 hover:text-pink-400 text-xs">
              <Heart size={16} />
              <span>Favorite</span>
            </button>
            <button className="flex items-center gap-1.5 hover:text-teal-300 text-xs">
              <Sparkles size={16} />
              <span>Enhanced View</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

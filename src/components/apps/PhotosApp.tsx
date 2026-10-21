import React, { useState } from 'react';
import { Image, Heart, Share2, Sparkles, X, ShieldCheck } from 'lucide-react';

interface PhotoItem {
  id: string;
  url: string;
  caption: string;
  date: string;
}

export const PhotosApp: React.FC = () => {
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);

  const photos: PhotoItem[] = [
    {
      id: '1',
      url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
      caption: 'Mountain Lake Sunrise',
      date: 'Oct 20, 2026',
    },
    {
      id: '2',
      url: 'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=800&q=80',
      caption: 'Misty Evergreen Forest',
      date: 'Oct 19, 2026',
    },
    {
      id: '3',
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      caption: 'Golden Dunes at Dusk',
      date: 'Oct 18, 2026',
    },
    {
      id: '4',
      url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
      caption: 'Wilderness Fog Valley',
      date: 'Oct 17, 2026',
    },
    {
      id: '5',
      url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80',
      caption: 'Sunny Meadows Peak',
      date: 'Oct 16, 2026',
    },
    {
      id: '6',
      url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=800&q=80',
      caption: 'Green Tree Canopy',
      date: 'Oct 15, 2026',
    },
  ];

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-neutral-900 text-white select-none overflow-hidden">
      {/* Top Header */}
      <div className="p-3 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Image size={18} className="text-teal-400" />
          <span className="text-sm font-bold">Immich FOSS Gallery</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <span>{photos.length} photos</span>
          <span>•</span>
          <span className="text-emerald-400 font-mono flex items-center gap-1">
            <ShieldCheck size={13} />
            <span>Local Vault</span>
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 p-3 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2">
        {photos.map((photo) => (
          <div
            key={photo.id}
            onClick={() => setSelectedPhoto(photo)}
            className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group border border-neutral-800"
          >
            <img
              src={photo.url}
              alt={photo.caption}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-4 animate-fade-in"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="w-full flex items-center justify-between text-white max-w-2xl pt-2">
            <div>
              <div className="text-sm font-bold">{selectedPhoto.caption}</div>
              <div className="text-xs text-neutral-400">{selectedPhoto.date}</div>
            </div>
            <button 
              onClick={() => setSelectedPhoto(null)}
              className="p-1.5 hover:bg-neutral-800 rounded-full transition-colors text-neutral-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          <div 
            className="flex-1 flex items-center justify-center p-4 max-w-3xl"
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
              <span>Local Tagging</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

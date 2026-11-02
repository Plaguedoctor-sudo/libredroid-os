import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Lock, ShieldCheck, Bot, Share2, MessageSquare } from 'lucide-react';
import { useWindow } from '../../context/WindowContext';
import type { AppIntent } from '../../types/apps';

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  createdAt: string;
}

const COLORS = [
  'bg-indigo-900/40 border-indigo-600/50',
  'bg-emerald-900/40 border-emerald-600/50',
  'bg-blue-900/40 border-blue-600/50',
  'bg-purple-900/40 border-purple-600/50',
  'bg-amber-900/40 border-amber-600/50',
];

interface Props extends Partial<AppIntent> {
  intent?: AppIntent;
}

export const NotesApp: React.FC<Props> = ({ intent, params, paramSeq }) => {
  const effectiveIntent = intent || (params ? { params, paramSeq } : undefined);
  const { openApp } = useWindow();
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('libredroid_notes');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [
      {
        id: '1',
        title: 'Sovereign Operating System Goals',
        content: '1. No corporate tracking or telemetry.\n2. Containerized Waydroid AOSP execution.\n3. Native installation to any PC or phone hardware.',
        color: COLORS[0],
        createdAt: 'Today',
      },
      {
        id: '2',
        title: 'F-Droid App Recommendations',
        content: 'Install NewPipe for private media streaming, OsmAnd for offline vector maps, and Element for Matrix encrypted messaging.',
        color: COLORS[1],
        createdAt: 'Yesterday',
      },
    ];
  });

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    localStorage.setItem('libredroid_notes', JSON.stringify(notes));
  }, [notes]);

  /* Consume Intent (e.g. create note from Browser, AI, or Files) */
  useEffect(() => {
    const p = effectiveIntent?.params;
    if (!p) return;
    if (typeof p.title === 'string' || typeof p.content === 'string') {
      const title = (p.title as string) || 'New Note';
      const content = (p.content as string) || '';
      const newNote: Note = {
        id: `intent-${Date.now()}`,
        title,
        content,
        color: selectedColor,
        createdAt: 'Just now'
      };
      setNotes(prev => [newNote, ...prev]);
    }
  }, [effectiveIntent?.paramSeq]);

  const addNote = () => {
    if (!newTitle.trim() && !newContent.trim()) return;
    const newNote: Note = {
      id: Math.random().toString(36).substring(2, 8),
      title: newTitle || 'Untitled Note',
      content: newContent,
      color: selectedColor,
      createdAt: 'Just now',
    };
    setNotes([newNote, ...notes]);
    setNewTitle('');
    setNewContent('');
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter((n) => n.id !== id));
  };

  const filtered = notes.filter((n) =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-neutral-900 text-white p-4 select-none overflow-hidden">
      {/* Top Search & Actions */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-neutral-800 shrink-0">
        <div className="flex-1 flex items-center gap-2 bg-neutral-800 rounded-full px-3 py-1.5 border border-neutral-700">
          <Search size={14} className="text-neutral-400" />
          <input
            type="text"
            placeholder="Search Joplin encrypted notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-xs text-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs text-indigo-300 font-mono bg-indigo-950/60 px-3 py-1.5 rounded-full border border-indigo-500/30">
          <Lock size={12} />
          <span>E2EE Active</span>
        </div>
      </div>

      {/* Note Creation Card */}
      <div className="bg-neutral-800/80 border border-neutral-700/80 rounded-2xl p-3 my-3 shadow-md shrink-0 space-y-2">
        <input
          type="text"
          placeholder="Note Title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="w-full bg-transparent text-xs font-semibold text-white focus:outline-none placeholder-neutral-500"
        />
        <textarea
          placeholder="Write your private note..."
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          rows={2}
          className="w-full bg-transparent text-xs text-neutral-300 focus:outline-none resize-none placeholder-neutral-500"
        />
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            {COLORS.map((c, i) => (
              <button
                key={i}
                onClick={() => setSelectedColor(c)}
                className={`w-4 h-4 rounded-full border ${c} ${selectedColor === c ? 'ring-2 ring-white' : ''}`}
              />
            ))}
          </div>
          <button
            onClick={addNote}
            disabled={!newTitle.trim() && !newContent.trim()}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold text-xs rounded-xl transition-all"
          >
            Save Note
          </button>
        </div>
      </div>

      {/* Notes Grid */}
      <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 pr-1">
        {filtered.map((note) => (
          <div
            key={note.id}
            className={`p-3.5 rounded-2xl border flex flex-col justify-between transition-all group ${note.color}`}
          >
            <div>
              <div className="flex items-start justify-between">
                <h4 className="text-xs font-bold text-white mb-1.5">{note.title}</h4>
                <button
                  onClick={() => deleteNote(note.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-red-400 transition-opacity"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <p className="text-xs text-neutral-200 whitespace-pre-wrap leading-relaxed">
                {note.content}
              </p>
            </div>
            <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-white/10 text-[10px] text-neutral-400">
              <span>{note.createdAt}</span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Ask AI */}
                <button
                  onClick={() => openApp('universal_ai', 'Universal AI', 'vault-airgap', {
                    initialPrompt: `Help me expand and summarize this note:\n\nTitle: ${note.title}\n\n${note.content}`
                  })}
                  className="p-1 hover:bg-white/10 text-violet-300 rounded-md transition-colors"
                  title="Ask Universal AI"
                >
                  <Bot size={13} />
                </button>

                {/* Share via Chats */}
                <button
                  onClick={() => openApp('chats', 'Sovereign Chats', 'anonymity-whonix', {
                    message: `Note: ${note.title}\n\n${note.content}`
                  })}
                  className="p-1 hover:bg-white/10 text-emerald-300 rounded-md transition-colors"
                  title="Share in Sovereign Chats"
                >
                  <Share2 size={13} />
                </button>

                {/* Share via SMS */}
                <button
                  onClick={() => openApp('messages', 'Messages & SMS', undefined, {
                    text: `${note.title}: ${note.content}`
                  })}
                  className="p-1 hover:bg-white/10 text-blue-300 rounded-md transition-colors"
                  title="Send via SMS"
                >
                  <MessageSquare size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

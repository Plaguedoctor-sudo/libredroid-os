import React, { useState, useMemo } from 'react';
import {
  User, Search, Plus, Edit2, Trash2, Phone, Mail, X,
  Users, Cloud, Lock, ChevronRight, Check, ArrowLeft
} from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  group: string;
  avatar?: string;
}

interface Props {
  onClose: () => void;
}

// @mock
const INITIAL_CONTACTS: Contact[] = [
  { id: '1', name: 'Alice Moreau', phone: '+33 6 12 34 56 78', email: 'alice@proton.me', group: 'Friends' },
  { id: '2', name: 'Bob Nguyen', phone: '+84 90 123 4567', email: 'bob@tutanota.com', group: 'Work' },
  { id: '3', name: 'Carol Smith', phone: '+1 415 555 0192', email: 'carol@librem.one', group: 'Family' },
  { id: '4', name: 'David Patel', phone: '+91 98765 43210', email: 'david@proton.me', group: 'Work' },
  { id: '5', name: 'Eva Lindström', phone: '+46 70 123 45 67', email: 'eva@tutanota.com', group: 'Friends' },
];

// @mock
const GROUPS = ['All', 'Friends', 'Family', 'Work', 'Other'];

const EMPTY_CONTACT: Omit<Contact, 'id'> = { name: '', phone: '', email: '', group: 'Other' };

export const ContactsApp: React.FC<Props> = ({ onClose }) => {
  const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS); // @mock
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState('All');
  const [view, setView] = useState<'list' | 'detail' | 'edit'>('list');
  const [selected, setSelected] = useState<Contact | null>(null);
  const [form, setForm] = useState<Omit<Contact, 'id'>>(EMPTY_CONTACT);
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);

  const filtered = useMemo(() => {
    return contacts.filter(c => {
      const matchGroup = activeGroup === 'All' || c.group === activeGroup;
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search) || c.email.toLowerCase().includes(search.toLowerCase());
      return matchGroup && matchSearch;
    });
  }, [contacts, search, activeGroup]);

  const openEdit = (contact?: Contact) => {
    if (contact) {
      setForm({ name: contact.name, phone: contact.phone, email: contact.email, group: contact.group });
      setSelected(contact);
    } else {
      setForm(EMPTY_CONTACT);
      setSelected(null);
    }
    setView('edit');
  };

  const saveContact = () => {
    if (!form.name.trim()) return;
    if (selected) {
      setContacts(cs => cs.map(c => c.id === selected.id ? { ...c, ...form } : c));
      setSelected({ ...selected, ...form });
    } else {
      const newC: Contact = { ...form, id: Date.now().toString() };
      setContacts(cs => [...cs, newC]);
    }
    setView(selected ? 'detail' : 'list');
  };

  const deleteContact = (id: string) => {
    setContacts(cs => cs.filter(c => c.id !== id));
    setView('list');
    setSelected(null);
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncDone(false);
    await new Promise(r => setTimeout(r, 1800)); // @mock simulated Nextcloud CardDAV sync
    setSyncing(false);
    setSyncDone(true);
    setTimeout(() => setSyncDone(false), 3000);
  };

  const avatarColor = (name: string) => {
    const colors = ['bg-purple-600', 'bg-emerald-600', 'bg-blue-600', 'bg-rose-600', 'bg-amber-600', 'bg-teal-600'];
    return colors[name.charCodeAt(0) % colors.length];
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-neutral-900 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-neutral-950 border-b border-neutral-800 shrink-0">
        {view !== 'list' && (
          <button onClick={() => setView('list')} className="p-1.5 rounded-xl hover:bg-neutral-800 transition-colors">
            <ArrowLeft size={18} />
          </button>
        )}
        <User size={18} className="text-purple-400" />
        <h1 className="text-sm font-bold flex-1">
          {view === 'list' ? 'Contacts' : view === 'detail' ? selected?.name : selected ? 'Edit Contact' : 'New Contact'}
        </h1>
        {view === 'list' && (
          <>
            <button
              onClick={handleSync}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                syncDone ? 'bg-emerald-600 text-white' : 'bg-neutral-800 text-neutral-300 hover:text-white'
              }`}
            >
              {syncing ? (
                <Cloud size={13} className="animate-pulse" />
              ) : syncDone ? (
                <Check size={13} />
              ) : (
                <Cloud size={13} />
              )}
              {syncing ? 'Syncing…' : syncDone ? 'Synced' : 'Nextcloud Sync'}
            </button>
            <button
              onClick={() => openEdit()}
              className="p-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 transition-colors"
            >
              <Plus size={16} />
            </button>
          </>
        )}
        {view === 'edit' && (
          <button
            onClick={saveContact}
            disabled={!form.name.trim()}
            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-xs font-bold transition-all"
          >
            Save
          </button>
        )}
        {view === 'detail' && selected && (
          <button
            onClick={() => openEdit(selected)}
            className="p-1.5 rounded-xl hover:bg-neutral-800 transition-colors"
          >
            <Edit2 size={16} />
          </button>
        )}
      </div>

      {/* E2E Sync Banner */}
      <div className="flex items-center gap-2 px-4 py-2 bg-purple-900/20 border-b border-purple-800/30 shrink-0">
        <Lock size={11} className="text-purple-400" />
        <span className="text-[10px] text-purple-300 font-medium">E2E encrypted · CardDAV sync via Nextcloud · No Google</span>
      </div>

      {/* List View */}
      {view === 'list' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search */}
          <div className="px-4 py-3 shrink-0">
            <div className="flex items-center gap-2 bg-neutral-800 rounded-2xl px-3 py-2">
              <Search size={15} className="text-neutral-400" />
              <input
                className="flex-1 bg-transparent text-sm text-white placeholder-neutral-500 outline-none"
                placeholder="Search contacts…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch('')}>
                  <X size={14} className="text-neutral-400 hover:text-white" />
                </button>
              )}
            </div>
          </div>

          {/* Groups */}
          <div className="flex gap-2 px-4 pb-3 shrink-0 overflow-x-auto">
            {GROUPS.map(g => (
              <button
                key={g}
                onClick={() => setActiveGroup(g)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all ${
                  activeGroup === g
                    ? 'bg-purple-600 text-white'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <Users size={11} />
                {g}
              </button>
            ))}
          </div>

          {/* Contact List */}
          <div className="flex-1 overflow-y-auto px-4 space-y-1 pb-4">
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-neutral-500 text-sm">No contacts found</div>
            ) : (
              filtered.map(c => (
                <button
                  key={c.id}
                  onClick={() => { setSelected(c); setView('detail'); }}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl bg-neutral-800/60 hover:bg-neutral-800 transition-colors text-left"
                >
                  <div className={`w-9 h-9 rounded-full ${avatarColor(c.name)} flex items-center justify-center text-sm font-bold shrink-0`}>
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{c.name}</div>
                    <div className="text-xs text-neutral-400 truncate">{c.phone}</div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-700 text-neutral-400 shrink-0">{c.group}</span>
                  <ChevronRight size={14} className="text-neutral-600 shrink-0" />
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Detail View */}
      {view === 'detail' && selected && (
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          <div className="flex flex-col items-center gap-3 pb-4">
            <div className={`w-20 h-20 rounded-full ${avatarColor(selected.name)} flex items-center justify-center text-3xl font-bold`}>
              {selected.name.charAt(0)}
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{selected.name}</div>
              <span className="text-xs px-3 py-1 rounded-full bg-neutral-800 text-neutral-400">{selected.group}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-neutral-800/60">
              <Phone size={16} className="text-emerald-400 shrink-0" />
              <div>
                <div className="text-[11px] text-neutral-400 uppercase font-bold">Phone</div>
                <div className="text-sm text-white mt-0.5">{selected.phone}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-neutral-800/60">
              <Mail size={16} className="text-blue-400 shrink-0" />
              <div>
                <div className="text-[11px] text-neutral-400 uppercase font-bold">Email</div>
                <div className="text-sm text-white mt-0.5">{selected.email}</div>
              </div>
            </div>
          </div>

          <button
            onClick={() => deleteContact(selected.id)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-rose-900/30 hover:bg-rose-900/50 text-rose-400 text-sm font-semibold border border-rose-800/40 transition-colors"
          >
            <Trash2 size={15} />
            Delete Contact
          </button>
        </div>
      )}

      {/* Edit/New Form */}
      {view === 'edit' && (
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
          {[
            { label: 'Full Name', key: 'name', placeholder: 'Jane Doe', type: 'text' },
            { label: 'Phone Number', key: 'phone', placeholder: '+1 555 000 0000', type: 'tel' },
            { label: 'Email Address', key: 'email', placeholder: 'jane@proton.me', type: 'email' },
          ].map(({ label, key, placeholder, type }) => (
            <div key={key} className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">{label}</label>
              <input
                type={type}
                value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full px-4 py-3 rounded-2xl bg-neutral-800 border border-neutral-700 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          ))}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Group</label>
            <div className="flex flex-wrap gap-2">
              {GROUPS.filter(g => g !== 'All').map(g => (
                <button
                  key={g}
                  onClick={() => setForm(f => ({ ...f, group: g }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    form.group === g ? 'bg-purple-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  Calendar, ChevronLeft, ChevronRight, Plus, X, Bell,
  Clock, Cloud, Lock, ArrowLeft, Repeat, Trash2
} from 'lucide-react';

interface CalEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration: number; // minutes
  color: string;
  reminder: boolean;
  repeat: 'none' | 'daily' | 'weekly' | 'monthly';
  description?: string;
}

interface Props {
  onClose: () => void;
}

type ViewMode = 'month' | 'week' | 'day';

// @mock
const INITIAL_EVENTS: CalEvent[] = [
  { id: '1', title: 'Team Standup', date: '2026-11-14', time: '09:00', duration: 30, color: 'bg-blue-600', reminder: true, repeat: 'daily' },
  { id: '2', title: 'Dentist Appointment', date: '2026-11-17', time: '14:00', duration: 60, color: 'bg-rose-600', reminder: true, repeat: 'none' },
  { id: '3', title: 'Grocery Run', date: '2026-11-13', time: '11:00', duration: 45, color: 'bg-emerald-600', reminder: false, repeat: 'weekly' },
  { id: '4', title: 'Book Club', date: '2026-11-20', time: '19:30', duration: 90, color: 'bg-purple-600', reminder: true, repeat: 'monthly' },
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const COLORS = ['bg-blue-600','bg-rose-600','bg-emerald-600','bg-purple-600','bg-amber-600','bg-teal-600'];

const today = new Date();
const pad = (n: number) => String(n).padStart(2, '0');
const fmtDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;

export const CalendarApp: React.FC<Props> = ({ onClose }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [events, setEvents] = useState<CalEvent[]>(INITIAL_EVENTS); // @mock
  const [selected, setSelected] = useState<CalEvent | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [form, setForm] = useState<Omit<CalEvent,'id'>>({
    title: '', date: fmtDate(today), time: '09:00', duration: 60,
    color: 'bg-blue-600', reminder: true, repeat: 'none', description: ''
  });

  const monthDays = useMemo(() => {
    const year = cursor.getFullYear(), month = cursor.getMonth();
    const first = new Date(year, month, 1).getDay();
    const count = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = Array(first).fill(null);
    for (let d = 1; d <= count; d++) days.push(d);
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [cursor]);

  const eventsForDate = (dateStr: string) => events.filter(e => e.date === dateStr);

  const saveEvent = () => {
    if (!form.title.trim()) return;
    setEvents(es => [...es, { ...form, id: Date.now().toString() }]);
    setShowForm(false);
  };

  const deleteEvent = (id: string) => {
    setEvents(es => es.filter(e => e.id !== id));
    setSelected(null);
  };

  const handleSync = async () => {
    setSyncing(true);
    await new Promise(r => setTimeout(r, 1600)); // @mock CalDAV sync
    setSyncing(false);
    setSyncDone(true);
    setTimeout(() => setSyncDone(false), 3000);
  };

  const navigate = (dir: number) => {
    const d = new Date(cursor);
    if (viewMode === 'month') d.setMonth(d.getMonth() + dir);
    else if (viewMode === 'week') d.setDate(d.getDate() + dir * 7);
    else d.setDate(d.getDate() + dir);
    setCursor(d);
  };

  const cursorLabel = () => {
    if (viewMode === 'month') return `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;
    if (viewMode === 'week') {
      const end = new Date(cursor); end.setDate(cursor.getDate() + 6);
      return `${cursor.getDate()} – ${end.getDate()} ${MONTHS[end.getMonth()]}`;
    }
    return `${DAYS[cursor.getDay()]}, ${cursor.getDate()} ${MONTHS[cursor.getMonth()]}`;
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-neutral-900 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-neutral-950 border-b border-neutral-800 shrink-0">
        {(showForm || selected) && (
          <button onClick={() => { setShowForm(false); setSelected(null); }} className="p-1.5 rounded-xl hover:bg-neutral-800">
            <ArrowLeft size={16} />
          </button>
        )}
        <Calendar size={17} className="text-blue-400" />
        <h1 className="text-sm font-bold flex-1">
          {showForm ? 'New Event' : selected ? selected.title : 'Calendar'}
        </h1>

        {!showForm && !selected && (
          <>
            <button
              onClick={handleSync}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                syncDone ? 'bg-emerald-600 text-white' : 'bg-neutral-800 text-neutral-300 hover:text-white'
              }`}
            >
              <Cloud size={12} className={syncing ? 'animate-pulse' : ''} />
              {syncing ? 'Syncing…' : syncDone ? 'Synced' : 'CalDAV'}
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="p-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors"
            >
              <Plus size={16} />
            </button>
          </>
        )}
        {showForm && (
          <button
            onClick={saveEvent}
            disabled={!form.title.trim()}
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-xs font-bold"
          >
            Add
          </button>
        )}
      </div>

      {/* Offline + E2E badge */}
      <div className="flex items-center gap-2 px-4 py-2 bg-blue-900/20 border-b border-blue-800/30 shrink-0">
        <Lock size={11} className="text-blue-400" />
        <span className="text-[10px] text-blue-300 font-medium">Offline-first · E2E encrypted · CalDAV sync via Nextcloud</span>
      </div>

      {/* New Event Form */}
      {showForm && (
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
          {[
            { label: 'Event Title', key: 'title', type: 'text', placeholder: 'Meeting, Doctor…' },
            { label: 'Date', key: 'date', type: 'date', placeholder: '' },
            { label: 'Time', key: 'time', type: 'time', placeholder: '' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key} className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">{label}</label>
              <input
                type={type}
                value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full px-4 py-3 rounded-2xl bg-neutral-800 border border-neutral-700 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          ))}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Duration</label>
            <select
              value={form.duration}
              onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}
              className="w-full px-4 py-3 rounded-2xl bg-neutral-800 border border-neutral-700 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              {[15,30,45,60,90,120].map(d => <option key={d} value={d}>{d} min</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Repeat</label>
            <div className="flex gap-2 flex-wrap">
              {(['none','daily','weekly','monthly'] as const).map(r => (
                <button key={r} onClick={() => setForm(f => ({ ...f, repeat: r }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
                    form.repeat === r ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >{r === 'none' ? 'No Repeat' : r}</button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Color</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                  className={`w-7 h-7 rounded-full ${c} transition-all ${form.color === c ? 'ring-2 ring-offset-2 ring-offset-neutral-800 ring-white' : ''}`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-800/60">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Bell size={15} className="text-amber-400" />
              Reminder
            </div>
            <button
              onClick={() => setForm(f => ({ ...f, reminder: !f.reminder }))}
              className={`w-11 h-6 rounded-full relative transition-colors ${form.reminder ? 'bg-blue-600' : 'bg-neutral-700'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${form.reminder ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
        </div>
      )}

      {/* Event Detail */}
      {selected && !showForm && (
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          <div className={`w-16 h-16 rounded-2xl ${selected.color} flex items-center justify-center`}>
            <Calendar size={28} className="text-white" />
          </div>
          <div>
            <div className="text-xl font-bold">{selected.title}</div>
            <div className="text-sm text-neutral-400 mt-1 flex items-center gap-2">
              <Clock size={13} />
              {selected.date} at {selected.time} · {selected.duration} min
            </div>
            {selected.repeat !== 'none' && (
              <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1.5">
                <Repeat size={12} />
                Repeats {selected.repeat}
              </div>
            )}
            {selected.reminder && (
              <div className="text-xs text-amber-400 mt-1 flex items-center gap-1.5">
                <Bell size={12} />
                Reminder set
              </div>
            )}
          </div>
          <button
            onClick={() => deleteEvent(selected.id)}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-rose-900/30 hover:bg-rose-900/50 text-rose-400 text-sm font-semibold border border-rose-800/40 transition-colors"
          >
            <Trash2 size={15} />
            Delete Event
          </button>
        </div>
      )}

      {/* Calendar Views */}
      {!showForm && !selected && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* View Mode + Navigation */}
          <div className="flex items-center gap-2 px-4 py-3 shrink-0">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-xl hover:bg-neutral-800 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <span className="flex-1 text-center text-sm font-bold">{cursorLabel()}</span>
            <button onClick={() => navigate(1)} className="p-1.5 rounded-xl hover:bg-neutral-800 transition-colors">
              <ChevronRight size={16} />
            </button>
            <div className="flex gap-1 ml-2 bg-neutral-800 p-1 rounded-xl">
              {(['month','week','day'] as ViewMode[]).map(m => (
                <button key={m} onClick={() => setViewMode(m)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                    viewMode === m ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white'
                  }`}
                >{m}</button>
              ))}
            </div>
          </div>

          {/* Month View */}
          {viewMode === 'month' && (
            <div className="flex-1 overflow-y-auto px-3 pb-4">
              <div className="grid grid-cols-7 mb-1">
                {DAYS.map(d => (
                  <div key={d} className="text-center text-[10px] font-bold text-neutral-500 py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {monthDays.map((day, i) => {
                  if (!day) return <div key={i} />;
                  const dateStr = `${cursor.getFullYear()}-${pad(cursor.getMonth()+1)}-${pad(day)}`;
                  const dayEvents = eventsForDate(dateStr);
                  const isToday = dateStr === fmtDate(today);
                  return (
                    <div
                      key={i}
                      onClick={() => { if (dayEvents.length) setSelected(dayEvents[0]); }}
                      className={`min-h-12 p-1 rounded-xl cursor-pointer transition-colors ${
                        isToday ? 'bg-blue-600/20 border border-blue-500/40' : 'hover:bg-neutral-800/60'
                      }`}
                    >
                      <div className={`text-xs font-bold mb-0.5 ${isToday ? 'text-blue-400' : 'text-neutral-300'}`}>{day}</div>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0,2).map(e => (
                          <div key={e.id} className={`text-[9px] font-medium px-1 py-0.5 rounded-md ${e.color} text-white truncate`}>
                            {e.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-[9px] text-neutral-400">+{dayEvents.length - 2} more</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Week / Day view: simple list of events */}
          {(viewMode === 'week' || viewMode === 'day') && (
            <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-4">
              {events
                .filter(e => {
                  if (viewMode === 'day') return e.date === fmtDate(cursor);
                  const start = new Date(cursor);
                  const end = new Date(cursor); end.setDate(end.getDate() + 6);
                  const eDate = new Date(e.date);
                  return eDate >= start && eDate <= end;
                })
                .sort((a,b) => `${a.date}${a.time}` < `${b.date}${b.time}` ? -1 : 1)
                .map(e => (
                  <button
                    key={e.id}
                    onClick={() => setSelected(e)}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl bg-neutral-800/60 hover:bg-neutral-800 text-left transition-colors"
                  >
                    <div className={`w-3 h-10 rounded-full ${e.color} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{e.title}</div>
                      <div className="text-xs text-neutral-400">{e.date} · {e.time} · {e.duration}m</div>
                    </div>
                    {e.reminder && <Bell size={13} className="text-amber-400 shrink-0" />}
                    {e.repeat !== 'none' && <Repeat size={12} className="text-neutral-500 shrink-0" />}
                  </button>
                ))}
              {events.filter(e => viewMode === 'day' ? e.date === fmtDate(cursor) : true).length === 0 && (
                <div className="text-center py-16 text-neutral-500 text-sm">No events this {viewMode}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

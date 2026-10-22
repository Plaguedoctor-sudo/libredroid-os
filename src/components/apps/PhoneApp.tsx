import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  PhoneCall, 
  PhoneOff, 
  Delete, 
  User, 
  Users, 
  Clock, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Grid,
  CheckCircle,
  Search,
  Plus
} from 'lucide-react';
import { useSystem } from '../../context/SystemContext';
import { dialPhoneNumber, fetchDeviceContacts } from '../../services/hardwareBridgeClient';

export interface CallLogItem {
  id: string;
  name: string;
  number: string;
  type: 'incoming' | 'outgoing' | 'missed';
  time: string;
  duration?: string;
}

export interface ContactItem {
  id: string;
  name: string;
  number: string;
  avatarColor: string;
}

export const PhoneApp: React.FC = () => {
  const { addNotification } = useSystem();
  const [activeTab, setActiveTab] = useState<'dialer' | 'recents' | 'contacts'>('dialer');
  const [dialedNumber, setDialedNumber] = useState('');
  const [isInCall, setIsInCall] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [searchContact, setSearchContact] = useState('');

  const [callLogs, setCallLogs] = useState<CallLogItem[]>([
    { id: '1', name: 'Emergency Services', number: '112', type: 'outgoing', time: 'Yesterday', duration: '1m 24s' },
    { id: '2', name: 'Matrix Encrypted Node', number: '+1 (555) 019-2834', type: 'incoming', time: 'Oct 21', duration: '4m 12s' },
    { id: '3', name: 'Home Voicemail', number: '123', type: 'missed', time: 'Oct 20' },
  ]);

  const [contacts, setContacts] = useState<ContactItem[]>([
    { id: '1', name: 'Emergency Services', number: '112', avatarColor: 'bg-red-600' },
    { id: '2', name: 'LibreDroid Support Node', number: '+1 (800) 555-0199', avatarColor: 'bg-emerald-600' },
    { id: '3', name: 'Matrix Voice Gateway', number: '+1 (555) 019-2834', avatarColor: 'bg-purple-600' },
    { id: '4', name: 'Voicemail Hub', number: '123', avatarColor: 'bg-blue-600' },
  ]);

  // Load real device contacts from Android HAL
  const loadContacts = async () => {
    const devContacts = await fetchDeviceContacts();
    if (devContacts && devContacts.length > 0) {
      setContacts(devContacts);
    }
  };

  useEffect(() => {
    loadContacts();
  }, [activeTab]);

  // Call timer
  useEffect(() => {
    let interval: any = null;
    if (isInCall) {
      interval = setInterval(() => {
        setCallDuration((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isInCall]);

  const formatDuration = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleDigit = (digit: string) => {
    if (navigator.vibrate) navigator.vibrate(10);
    setDialedNumber((prev) => prev + digit);
  };

  const handleBackspace = () => {
    if (navigator.vibrate) navigator.vibrate(10);
    setDialedNumber((prev) => prev.slice(0, -1));
  };

  const handleStartCall = async (numToCall?: string) => {
    const target = numToCall || dialedNumber;
    if (!target) return;

    if (navigator.vibrate) navigator.vibrate(25);
    setIsInCall(true);
    setCallDuration(0);

    // Trigger physical Android telephony dialer intent
    await dialPhoneNumber(target);

    // Add to call log
    const contact = contacts.find((c) => c.number === target);
    setCallLogs((prev) => [
      {
        id: Math.random().toString(36).substring(2, 7),
        name: contact ? contact.name : target,
        number: target,
        type: 'outgoing',
        time: 'Just now',
        duration: 'Active',
      },
      ...prev,
    ]);

    addNotification({
      appId: 'phone',
      appName: 'Phone',
      title: 'Outgoing Call Placed',
      body: `Calling ${contact ? contact.name : target} via Android Telephony HAL`,
    });
  };

  const handleEndCall = () => {
    if (navigator.vibrate) navigator.vibrate(30);
    setIsInCall(false);
    setCallDuration(0);
  };

  const keypadButtons = [
    { digit: '1', sub: 'Voicemail' },
    { digit: '2', sub: 'ABC' },
    { digit: '3', sub: 'DEF' },
    { digit: '4', sub: 'GHI' },
    { digit: '5', sub: 'JKL' },
    { digit: '6', sub: 'MNO' },
    { digit: '7', sub: 'PQRS' },
    { digit: '8', sub: 'TUV' },
    { digit: '9', sub: 'WXYZ' },
    { digit: '*', sub: '' },
    { digit: '0', sub: '+' },
    { digit: '#', sub: '' },
  ];

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchContact.toLowerCase()) ||
    c.number.includes(searchContact)
  );

  // ACTIVE IN-CALL SCREEN
  if (isInCall) {
    const contact = contacts.find((c) => c.number === dialedNumber);
    return (
      <div className="flex-1 w-full h-full bg-neutral-950 text-white flex flex-col items-center justify-between p-6 sm:p-8 select-none animate-fade-in">
        {/* Caller Info */}
        <div className="flex flex-col items-center pt-8 space-y-2">
          <div className="w-24 h-24 rounded-full bg-emerald-600/20 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-400 text-3xl font-bold shadow-2xl">
            <User size={44} />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mt-2">
            {contact ? contact.name : dialedNumber || 'Outgoing Call'}
          </h2>
          <div className="text-xs text-neutral-400 font-mono">
            {dialedNumber || 'Private Line'}
          </div>
          <div className="text-sm font-semibold text-emerald-400 font-mono tracking-wider pt-2">
            {formatDuration(callDuration)}
          </div>
        </div>

        {/* In-Call Actions */}
        <div className="w-full max-w-xs space-y-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-4 rounded-full flex flex-col items-center justify-center transition-all ${
                isMuted ? 'bg-rose-600 text-white' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
              <span className="text-[10px] mt-1">{isMuted ? 'Muted' : 'Mute'}</span>
            </button>

            <button
              onClick={() => setIsSpeaker(!isSpeaker)}
              className={`p-4 rounded-full flex flex-col items-center justify-center transition-all ${
                isSpeaker ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              {isSpeaker ? <Volume2 size={22} /> : <VolumeX size={22} />}
              <span className="text-[10px] mt-1">{isSpeaker ? 'Speaker' : 'Speaker'}</span>
            </button>

            <button
              onClick={() => setActiveTab('dialer')}
              className="p-4 rounded-full bg-neutral-800 text-neutral-300 hover:bg-neutral-700 flex flex-col items-center justify-center"
            >
              <Grid size={22} />
              <span className="text-[10px] mt-1">Keypad</span>
            </button>
          </div>

          {/* End Call Button */}
          <div className="flex justify-center pt-4">
            <button
              onClick={handleEndCall}
              className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
              title="End Call"
            >
              <PhoneOff size={32} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-neutral-900 text-white select-none overflow-hidden">
      {/* Top Header Tabs */}
      <div className="flex items-center justify-center gap-2 p-3 bg-neutral-950 border-b border-neutral-800 shrink-0">
        <button
          onClick={() => setActiveTab('dialer')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
            activeTab === 'dialer' ? 'bg-emerald-600 text-white shadow' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Grid size={14} />
          <span>Keypad</span>
        </button>

        <button
          onClick={() => setActiveTab('recents')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
            activeTab === 'recents' ? 'bg-emerald-600 text-white shadow' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Clock size={14} />
          <span>Recents</span>
        </button>

        <button
          onClick={() => setActiveTab('contacts')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
            activeTab === 'contacts' ? 'bg-emerald-600 text-white shadow' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Users size={14} />
          <span>Contacts</span>
        </button>
      </div>

      {/* Main Tab Views */}
      <div className="flex-1 overflow-y-auto flex flex-col justify-between p-4 max-w-sm mx-auto w-full">
        {activeTab === 'dialer' && (
          <div className="flex-1 flex flex-col justify-between">
            {/* Dialed Display */}
            <div className="h-16 flex items-center justify-center px-4 relative">
              <span className="text-2xl sm:text-3xl font-mono font-bold tracking-wider truncate text-center">
                {dialedNumber || <span className="text-neutral-600 font-normal text-lg">Enter phone number...</span>}
              </span>
              {dialedNumber && (
                <button
                  onClick={handleBackspace}
                  className="absolute right-2 p-2 text-neutral-400 hover:text-white active:scale-90 transition-transform"
                >
                  <Delete size={20} />
                </button>
              )}
            </div>

            {/* Keypad Grid */}
            <div className="grid grid-cols-3 gap-3 my-auto">
              {keypadButtons.map((btn) => (
                <button
                  key={btn.digit}
                  onClick={() => handleDigit(btn.digit)}
                  className="h-14 sm:h-16 rounded-2xl bg-neutral-800/80 hover:bg-neutral-750 active:bg-neutral-700 border border-neutral-700/60 shadow flex flex-col items-center justify-center active:scale-95 transition-all"
                >
                  <span className="text-xl sm:text-2xl font-bold text-white">{btn.digit}</span>
                  {btn.sub && (
                    <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-medium">
                      {btn.sub}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Call Action Bar */}
            <div className="flex items-center justify-center pt-2">
              <button
                onClick={() => handleStartCall()}
                disabled={!dialedNumber}
                className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white flex items-center justify-center shadow-xl active:scale-90 transition-transform"
                title="Call Number"
              >
                <Phone size={26} />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'recents' && (
          <div className="flex-1 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 pb-1">
              Recent Calls
            </div>
            {callLogs.map((log) => (
              <div
                key={log.id}
                onClick={() => handleStartCall(log.number)}
                className="p-3 bg-neutral-800/60 hover:bg-neutral-800 rounded-2xl border border-neutral-700/60 flex items-center justify-between cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${
                    log.type === 'missed' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    <PhoneCall size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{log.name}</div>
                    <div className="text-xs text-neutral-400 font-mono">{log.number} • {log.time}</div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartCall(log.number);
                  }}
                  className="p-2 bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white rounded-full transition-colors"
                >
                  <Phone size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2 bg-neutral-800 rounded-full px-3 py-1.5 border border-neutral-700 text-xs">
              <Search size={14} className="text-neutral-400" />
              <input
                type="text"
                placeholder="Search phone contacts..."
                value={searchContact}
                onChange={(e) => setSearchContact(e.target.value)}
                className="w-full bg-transparent text-white focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => handleStartCall(contact.number)}
                  className="p-3 bg-neutral-800/60 hover:bg-neutral-800 rounded-2xl border border-neutral-700/60 flex items-center justify-between cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${contact.avatarColor} flex items-center justify-center font-bold text-sm text-white`}>
                      {contact.name[0]}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{contact.name}</div>
                      <div className="text-xs text-neutral-400 font-mono">{contact.number}</div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartCall(contact.number);
                    }}
                    className="p-2 bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white rounded-full transition-colors"
                  >
                    <Phone size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

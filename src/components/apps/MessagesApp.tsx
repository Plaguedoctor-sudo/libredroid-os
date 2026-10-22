import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  ArrowLeft, 
  User, 
  Plus, 
  Search, 
  ShieldCheck, 
  CheckCheck,
  Smartphone
} from 'lucide-react';
import { useSystem } from '../../context/SystemContext';
import { useVirtualKeyboard } from '../../context/KeyboardContext';
import { sendSmsMessage, fetchDeviceContacts, DeviceContact } from '../../services/hardwareBridgeClient';

export interface MessageThread {
  id: string;
  name: string;
  number: string;
  avatarColor: string;
  messages: Array<{
    id: string;
    sender: 'me' | 'them';
    text: string;
    time: string;
  }>;
}

export const MessagesApp: React.FC = () => {
  const { addNotification } = useSystem();
  const { openKeyboard, closeKeyboard } = useVirtualKeyboard();

  const [threads, setThreads] = useState<MessageThread[]>([
    {
      id: '1',
      name: 'Matrix Encrypted Gateway',
      number: '+1 (555) 019-2834',
      avatarColor: 'bg-purple-600',
      messages: [
        { id: '1', sender: 'them', text: 'Welcome to LibreDroid Sovereign Telephony! Your line is encrypted via E2EE.', time: '10:30 AM' },
        { id: '2', sender: 'me', text: 'Thanks! Testing hardware telephony stack.', time: '10:32 AM' },
      ],
    },
    {
      id: '2',
      name: 'Emergency Broadcast Service',
      number: '112',
      avatarColor: 'bg-red-600',
      messages: [
        { id: '1', sender: 'them', text: 'Emergency telemetry ready. GPS location sandboxed.', time: 'Yesterday' },
      ],
    },
    {
      id: '3',
      name: 'Carrier Voicemail',
      number: '123',
      avatarColor: 'bg-blue-600',
      messages: [
        { id: '1', sender: 'them', text: 'You have 0 new voice messages.', time: 'Oct 20' },
      ],
    },
  ]);

  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isComposingNew, setIsComposingNew] = useState(false);
  const [newRecipientNumber, setNewRecipientNumber] = useState('');
  const [deviceContacts, setDeviceContacts] = useState<DeviceContact[]>([]);

  useEffect(() => {
    fetchDeviceContacts().then((contacts) => {
      if (contacts && contacts.length > 0) setDeviceContacts(contacts);
    });
  }, []);

  const activeThread = threads.find((t) => t.id === activeThreadId);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    const textToSend = inputText.trim();

    if (activeThread) {
      // Trigger physical Android SMS intent
      await sendSmsMessage(activeThread.number, textToSend);

      const newMessage = {
        id: Math.random().toString(36).substring(2, 7),
        sender: 'me' as const,
        text: textToSend,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThread.id
            ? { ...t, messages: [...t.messages, newMessage] }
            : t
        )
      );
      setInputText('');
      closeKeyboard();

      addNotification({
        appId: 'messages',
        appName: 'SMS',
        title: 'SMS Sent',
        body: `Dispatched message to ${activeThread.name} (${activeThread.number})`,
      });
    } else if (isComposingNew && newRecipientNumber) {
      await sendSmsMessage(newRecipientNumber, textToSend);

      const newThread: MessageThread = {
        id: Math.random().toString(36).substring(2, 7),
        name: newRecipientNumber,
        number: newRecipientNumber,
        avatarColor: 'bg-emerald-600',
        messages: [
          {
            id: '1',
            sender: 'me',
            text: textToSend,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ],
      };
      setThreads([newThread, ...threads]);
      setActiveThreadId(newThread.id);
      setIsComposingNew(false);
      setInputText('');
      closeKeyboard();
    }
  };

  const handleInputTap = () => {
    openKeyboard({
      value: inputText,
      onChange: (val) => setInputText(val),
      onEnter: () => handleSendMessage(),
      placeholder: 'Type message...',
    });
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-neutral-900 text-white select-none overflow-hidden">
      {/* Top Header */}
      <div className="p-3 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          {(activeThread || isComposingNew) ? (
            <button
              onClick={() => {
                setActiveThreadId(null);
                setIsComposingNew(false);
                closeKeyboard();
              }}
              className="p-1.5 hover:bg-neutral-800 rounded-xl text-neutral-300 hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
            </button>
          ) : (
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <MessageSquare size={16} />
            </div>
          )}
          <div>
            <div className="text-sm font-bold flex items-center gap-2">
              {activeThread ? activeThread.name : isComposingNew ? 'New Message' : 'LibreDroid Messages'}
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                SMS / E2EE
              </span>
            </div>
            {activeThread && (
              <div className="text-[11px] text-neutral-400 font-mono">
                {activeThread.number}
              </div>
            )}
          </div>
        </div>

        {!activeThread && !isComposingNew && (
          <button
            onClick={() => setIsComposingNew(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow transition-all"
          >
            <Plus size={14} />
            <span>New Chat</span>
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {activeThread ? (
          // THREAD CHAT VIEW
          <div className="flex-1 flex flex-col justify-between overflow-hidden">
            {/* Messages Bubbles */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeThread.messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.sender === 'me' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      m.sender === 'me'
                        ? 'bg-emerald-600 text-white rounded-br-none'
                        : 'bg-neutral-800 text-neutral-200 border border-neutral-700/60 rounded-bl-none'
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="text-[10px] text-neutral-500 mt-1 px-1">
                    {m.time}
                  </span>
                </div>
              ))}
            </div>

            {/* Compose Input Bar */}
            <div 
              onClick={handleInputTap}
              className="p-3 bg-neutral-950 border-t border-neutral-800 flex items-center gap-2 cursor-pointer"
            >
              <input
                type="text"
                placeholder="Type SMS or encrypted message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onClick={handleInputTap}
                inputMode="none"
                className="flex-1 bg-neutral-800 border border-neutral-700 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none cursor-pointer"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSendMessage();
                }}
                disabled={!inputText.trim()}
                className="p-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-2xl shadow active:scale-95 transition-transform"
                title="Send Message"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        ) : isComposingNew ? (
          // NEW RECIPIENT COMPOSER
          <div className="flex-1 flex flex-col justify-between p-4 max-w-md mx-auto w-full">
            <div className="space-y-3">
              <label className="text-xs font-semibold text-neutral-400">Recipient Phone Number</label>
              <input
                type="text"
                placeholder="Enter phone number (e.g. +1 555 123 4567)..."
                value={newRecipientNumber}
                onChange={(e) => setNewRecipientNumber(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
              />

              {deviceContacts.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Or Pick Device Contact:</span>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {deviceContacts.slice(0, 12).map((dc) => (
                      <button
                        key={dc.id}
                        type="button"
                        onClick={() => setNewRecipientNumber(dc.number)}
                        className={`px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                          newRecipientNumber === dc.number
                            ? 'bg-emerald-600 text-white font-medium'
                            : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>{dc.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <label className="text-xs font-semibold text-neutral-400 pt-2 block">Initial Message</label>
              <textarea
                rows={4}
                placeholder="Type message text..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-3 text-sm text-white focus:outline-none resize-none"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={handleSendMessage}
                disabled={!newRecipientNumber || !inputText.trim()}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-2"
              >
                <Send size={14} />
                <span>Send SMS Message</span>
              </button>
            </div>
          </div>
        ) : (
          // THREADS LIST
          <div className="flex-1 overflow-y-auto p-3 space-y-2 max-w-2xl mx-auto w-full">
            {threads.map((thread) => {
              const lastMsg = thread.messages[thread.messages.length - 1];
              return (
                <div
                  key={thread.id}
                  onClick={() => setActiveThreadId(thread.id)}
                  className="p-3 bg-neutral-800/60 hover:bg-neutral-800 rounded-2xl border border-neutral-700/60 flex items-center justify-between cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl ${thread.avatarColor} flex items-center justify-center font-bold text-sm text-white shadow`}>
                      {thread.name[0]}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{thread.name}</div>
                      <div className="text-xs text-neutral-400 truncate max-w-xs mt-0.5">
                        {lastMsg ? lastMsg.text : thread.number}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-neutral-500">{lastMsg?.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

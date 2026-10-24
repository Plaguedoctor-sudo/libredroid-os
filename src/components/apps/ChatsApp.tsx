import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Plus,
  Search,
  ShieldCheck,
  Check,
  CheckCheck,
  Phone,
  Video,
  Paperclip,
  Smile,
  Bot,
  User,
  Radio,
  Lock,
  WifiOff,
  MoreVertical,
  Volume2,
  FileText,
  Image as ImageIcon,
  Folder,
  Trash2,
  Share2
} from 'lucide-react';
import { useSystem } from '../../context/SystemContext';
import { useVirtualKeyboard } from '../../context/KeyboardContext';

export interface ChatThreadItem {
  id: string;
  name: string;
  avatarColor: string;
  type: 'direct' | 'channel' | 'p2p_mesh';
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
  protocol: 'Matrix (E2EE Megolm)' | 'Briar (P2P Tor)' | 'Nostr (Decentralized)';
  verificationFingerprint: string;
  messages: Array<{
    id: string;
    sender: 'me' | 'them' | 'ai';
    text: string;
    time: string;
    status?: 'sent' | 'delivered' | 'read';
    attachment?: {
      type: 'image' | 'audio' | 'file';
      name: string;
      size: string;
    };
  }>;
}

const INITIAL_CHATS: ChatThreadItem[] = [
  {
    id: 'chat-ai',
    name: 'Universal AI Copilot',
    avatarColor: 'bg-gradient-to-tr from-violet-600 to-indigo-600',
    type: 'direct',
    lastMessage: 'Ready to assist in sovereign messaging and translation.',
    lastMessageTime: '10:45 AM',
    unreadCount: 0,
    isOnline: true,
    protocol: 'Matrix (E2EE Megolm)',
    verificationFingerprint: 'AI_VAULT_KEY_0x82A1_LOCAL',
    messages: [
      {
        id: 'm1',
        sender: 'ai',
        text: 'Hello! I am your in-chat Universal AI Copilot. You can ask me to draft replies, translate foreign messages, or summarize this thread at any time.',
        time: '10:45 AM',
      }
    ]
  },
  {
    id: 'chat-alice',
    name: 'Alice (Matrix E2EE)',
    avatarColor: 'bg-gradient-to-tr from-emerald-600 to-teal-700',
    type: 'direct',
    lastMessage: 'The new Waydroid container builds run flawlessly with zero telemetry.',
    lastMessageTime: '10:15 AM',
    unreadCount: 1,
    isOnline: true,
    protocol: 'Matrix (E2EE Megolm)',
    verificationFingerprint: 'ED25519: 9F82 4B11 00DC A418',
    messages: [
      {
        id: 'm1',
        sender: 'them',
        text: 'Hey! Have you tested the new microG container on the sovereign Android base?',
        time: '10:12 AM',
      },
      {
        id: 'm2',
        sender: 'me',
        text: 'Yes! Completely severed from Google Play Services. Memory allocation is bounded by cgroups v2.',
        time: '10:14 AM',
        status: 'read'
      },
      {
        id: 'm3',
        sender: 'them',
        text: 'The new Waydroid container builds run flawlessly with zero telemetry.',
        time: '10:15 AM',
      }
    ]
  },
  {
    id: 'chat-mesh',
    name: 'Briar Local Mesh (Offline)',
    avatarColor: 'bg-gradient-to-tr from-amber-600 to-orange-700',
    type: 'p2p_mesh',
    lastMessage: 'Relayed via Bluetooth Low Energy mesh hop 2.',
    lastMessageTime: 'Yesterday',
    unreadCount: 0,
    isOnline: true,
    protocol: 'Briar (P2P Tor)',
    verificationFingerprint: 'BRIAR: B441 98AA FE01 C902',
    messages: [
      {
        id: 'm1',
        sender: 'them',
        text: 'Zero-internet peer-to-peer transmission verified over local Wi-Fi direct and Bluetooth mesh.',
        time: 'Yesterday 18:30',
      },
      {
        id: 'm2',
        sender: 'them',
        text: 'Relayed via Bluetooth Low Energy mesh hop 2.',
        time: 'Yesterday 18:31',
      }
    ]
  },
  {
    id: 'chat-devs',
    name: '#libredroid-core',
    avatarColor: 'bg-gradient-to-tr from-cyan-600 to-blue-700',
    type: 'channel',
    lastMessage: 'Release v2.4 signed with sovereign GPG keys.',
    lastMessageTime: 'Oct 22',
    unreadCount: 0,
    isOnline: true,
    protocol: 'Matrix (E2EE Megolm)',
    verificationFingerprint: 'ROOM: !libredroid:matrix.org',
    messages: [
      {
        id: 'm1',
        sender: 'them',
        text: 'Welcome to #libredroid-core sovereign channel. Public discussion on seL4 microkernel and GSI flashing.',
        time: 'Oct 21 09:00',
      },
      {
        id: 'm2',
        sender: 'them',
        text: 'Release v2.4 signed with sovereign GPG keys.',
        time: 'Oct 22 14:15',
      }
    ]
  }
];

export const ChatsApp: React.FC = () => {
  const { addNotification } = useSystem();
  const { openKeyboard, closeKeyboard } = useVirtualKeyboard();

  const [chats, setChats] = useState<ChatThreadItem[]>(() => {
    try {
      const stored = localStorage.getItem('libredroid_chats_v2');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_CHATS;
  });

  const [activeChatId, setActiveChatId] = useState<string>(chats[0]?.id || 'chat-ai');
  const [filterFolder, setFilterFolder] = useState<'all' | 'direct' | 'channel' | 'p2p_mesh'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const [newChatType, setNewChatType] = useState<'direct' | 'channel' | 'p2p_mesh'>('direct');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem('libredroid_chats_v2', JSON.stringify(chats));
    } catch {}
  }, [chats]);

  const activeChat = chats.find(c => c.id === activeChatId) || chats[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages, isAiProcessing]);

  const handleInputTap = () => {
    openKeyboard({
      value: inputText,
      onChange: (val) => setInputText(val),
      onEnter: () => handleSendMessage(),
      placeholder: `Message ${activeChat?.name}...`,
    });
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const userText = inputText.trim();
    setInputText('');
    closeKeyboard();

    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: 'me' as const,
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent' as const
    };

    setChats(prev =>
      prev.map(c => {
        if (c.id === activeChat.id) {
          return {
            ...c,
            lastMessage: userText,
            lastMessageTime: 'Just now',
            messages: [...c.messages, newMsg]
          };
        }
        return c;
      })
    );

    // If chat is with AI Copilot, generate automated sovereign answer
    if (activeChat.id === 'chat-ai') {
      setIsAiProcessing(true);
      setTimeout(() => {
        const aiReply = {
          id: `msg-ai-${Date.now()}`,
          sender: 'ai' as const,
          text: `[Universal AI]: Processed your request in Vault container.\n\n"${userText}"\n\nAll cryptographic keys and data remain sovereign on your device.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setChats(prev =>
          prev.map(c =>
            c.id === 'chat-ai'
              ? {
                  ...c,
                  lastMessage: aiReply.text.slice(0, 40) + '...',
                  lastMessageTime: 'Just now',
                  messages: [...c.messages, aiReply]
                }
              : c
          )
        );
        setIsAiProcessing(false);
      }, 500);
    }
  };

  // Quick In-Chat Universal AI Assistance
  const handleInvokeAiInChat = () => {
    setIsAiProcessing(true);
    setTimeout(() => {
      const summaryMsg = {
        id: `msg-ai-${Date.now()}`,
        sender: 'ai' as const,
        text: `🤖 **Universal AI In-Chat Summary**:\n- Active Thread: ${activeChat.name}\n- Protocol: ${activeChat.protocol}\n- Safety: Fully verified end-to-end encryption\n- Suggested Response: "Agreed. Let us deploy the updated sovereign build."`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChats(prev =>
        prev.map(c =>
          c.id === activeChat.id
            ? {
                ...c,
                messages: [...c.messages, summaryMsg]
              }
            : c
        )
      );
      setIsAiProcessing(false);
    }, 400);
  };

  const handleCreateChat = () => {
    if (!newChatName.trim()) return;

    const newChat: ChatThreadItem = {
      id: `chat-${Date.now()}`,
      name: newChatName.trim(),
      avatarColor: newChatType === 'direct' ? 'bg-indigo-600' : newChatType === 'p2p_mesh' ? 'bg-amber-600' : 'bg-cyan-600',
      type: newChatType,
      lastMessage: 'Chat initialized with sovereign E2EE keys.',
      lastMessageTime: 'Just now',
      unreadCount: 0,
      isOnline: true,
      protocol: newChatType === 'p2p_mesh' ? 'Briar (P2P Tor)' : 'Matrix (E2EE Megolm)',
      verificationFingerprint: `KEY: ${Math.random().toString(16).substring(2, 10).toUpperCase()}`,
      messages: [
        {
          id: `m-init-${Date.now()}`,
          sender: 'them',
          text: `Encrypted channel established. Security domain verified via Qubes bridge.`,
          time: 'Just now'
        }
      ]
    };

    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setNewChatName('');
    setShowNewChatModal(false);

    addNotification({
      appId: 'chats',
      appName: 'Sovereign Chats',
      title: 'Encrypted Chat Created',
      body: `Established E2EE session with ${newChat.name}`,
    });
  };

  const filteredChats = chats.filter(c => {
    const matchFolder = filterFolder === 'all' || c.type === filterFolder;
    const matchSearch = !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFolder && matchSearch;
  });

  return (
    <div className="flex-1 w-full h-full flex flex-col sm:flex-row bg-neutral-950 text-white select-none overflow-hidden font-sans">
      {/* LEFT: Chats List & Folders */}
      <div className="w-full sm:w-80 bg-neutral-900 border-b sm:border-b-0 sm:border-r border-neutral-800 flex flex-col shrink-0">
        {/* Header */}
        <div className="p-3.5 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 flex items-center justify-center text-white shadow-md">
              <MessageSquare size={17} />
            </div>
            <div>
              <div className="text-sm font-bold">Sovereign Chats</div>
              <div className="text-[10px] text-emerald-400 font-mono">Matrix & Briar E2EE</div>
            </div>
          </div>

          <button
            onClick={() => setShowNewChatModal(true)}
            className="p-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 transition-all active:scale-95"
            title="Start New Chat"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Folders / Filter Tabs */}
        <div className="p-2 border-b border-neutral-800/80 flex gap-1 overflow-x-auto text-[11px] bg-neutral-950/40">
          {[
            { id: 'all', label: 'All Chats' },
            { id: 'direct', label: 'Direct DMs' },
            { id: 'channel', label: 'Channels' },
            { id: 'p2p_mesh', label: 'Mesh P2P' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterFolder(tab.id as any)}
              className={`px-2.5 py-1 rounded-lg shrink-0 font-medium transition-all ${
                filterFolder === tab.id
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="p-2.5 border-b border-neutral-800/60">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
          {filteredChats.map(c => {
            const isActive = c.id === activeChat.id;
            return (
              <div
                key={c.id}
                onClick={() => setActiveChatId(c.id)}
                className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${
                  isActive
                    ? 'bg-emerald-950/40 border border-emerald-500/40 text-white'
                    : 'text-neutral-300 hover:bg-neutral-850'
                }`}
              >
                {/* Avatar with Status indicator */}
                <div className="relative shrink-0">
                  <div className={`w-11 h-11 rounded-2xl ${c.avatarColor} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                    {c.type === 'channel' ? '#' : c.id === 'chat-ai' ? <Bot size={18} /> : c.name.charAt(0)}
                  </div>
                  {c.isOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-neutral-900" />
                  )}
                </div>

                {/* Meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-bold truncate text-white">{c.name}</span>
                    <span className="text-[10px] text-neutral-500 shrink-0 font-mono">{c.lastMessageTime}</span>
                  </div>
                  <div className="text-[11px] text-neutral-400 truncate flex items-center gap-1">
                    {c.type === 'p2p_mesh' && <Radio size={11} className="text-amber-400 shrink-0" />}
                    {c.type === 'direct' && <Lock size={11} className="text-emerald-400 shrink-0" />}
                    <span className="truncate">{c.lastMessage}</span>
                  </div>
                </div>

                {c.unreadCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-black text-[10px] font-bold flex items-center justify-center shrink-0">
                    {c.unreadCount}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Active Conversation Stream */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-neutral-950">
        {/* Chat Stream Header */}
        <div className="h-14 border-b border-neutral-800 px-4 flex items-center justify-between bg-neutral-900/40 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-xl ${activeChat.avatarColor} flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm`}>
              {activeChat.type === 'channel' ? '#' : activeChat.id === 'chat-ai' ? <Bot size={17} /> : activeChat.name.charAt(0)}
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                <span>{activeChat.name}</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-mono">
                  E2EE
                </span>
              </div>
              <div className="text-[10px] text-neutral-400 font-mono truncate">
                {activeChat.protocol} • {activeChat.verificationFingerprint}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* AI Assistant Button */}
            <button
              onClick={handleInvokeAiInChat}
              disabled={isAiProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 border border-violet-500/30 text-xs font-medium transition-all active:scale-95"
              title="Invoke Universal AI in thread"
            >
              <Bot size={14} className="text-violet-400" />
              <span className="hidden md:inline">@AI Copilot</span>
            </button>

            <button
              onClick={() => {
                addNotification({
                  appId: 'chats',
                  appName: 'Sovereign Telephony',
                  title: 'Secure P2P Call',
                  body: `Voice session bridged with ${activeChat.name} over Tor Onion circuit.`,
                });
              }}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all"
              title="Encrypted Audio Call"
            >
              <Phone size={16} />
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {activeChat.messages.map((m) => {
            const isMe = m.sender === 'me';
            const isAi = m.sender === 'ai';

            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-xl ${isMe ? 'ml-auto' : 'mr-auto'}`}
              >
                <div className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  isAi
                    ? 'bg-neutral-900 border border-violet-500/50 text-neutral-200 shadow-lg'
                    : isMe
                      ? 'bg-emerald-600 text-white rounded-tr-none shadow-md'
                      : 'bg-neutral-850 border border-neutral-700/60 text-neutral-200 rounded-tl-none shadow-md'
                }`}>
                  {isAi && (
                    <div className="flex items-center gap-1.5 text-violet-400 font-bold text-[11px] mb-1">
                      <Bot size={13} />
                      <span>Universal AI Companion</span>
                    </div>
                  )}

                  <div className="whitespace-pre-wrap">{m.text}</div>
                </div>

                <div className={`flex items-center gap-1.5 text-[10px] text-neutral-500 mt-1 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <span>{m.time}</span>
                  {isMe && (
                    <span>
                      {m.status === 'read' ? <CheckCheck size={13} className="text-cyan-400" /> : <Check size={13} />}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {isAiProcessing && (
            <div className="flex items-center gap-2 p-3 bg-neutral-900 border border-violet-500/30 rounded-2xl w-fit text-xs text-neutral-400">
              <Bot size={14} className="text-violet-400 animate-spin" />
              <span>Universal AI drafting sovereign response...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Composer Bar */}
        <div className="p-3 bg-neutral-900/80 border-t border-neutral-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                addNotification({
                  appId: 'chats',
                  appName: 'Sovereign Attachment',
                  title: 'File Isolated in Sandbox',
                  body: 'Media attachment stripped of EXIF metadata and GPS coordinates.',
                });
              }}
              className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-all shrink-0"
              title="Attach File"
            >
              <Paperclip size={16} />
            </button>

            <div className="flex-1 relative">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                onClick={handleInputTap}
                placeholder={`Encrypted message for ${activeChat.name}...`}
                className="w-full bg-neutral-950 border border-neutral-700/80 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 shadow-inner"
              />
            </div>

            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim()}
              className="p-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none text-white shadow-md transition-all active:scale-95 shrink-0"
              title="Send"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* NEW CHAT MODAL */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-bold text-sm text-white">New Encrypted Chat</h3>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="text-neutral-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-neutral-400 block mb-1">
                  Recipient or Channel Name
                </label>
                <input
                  type="text"
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
                  placeholder="e.g. Charlie or #privacy-mesh"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-400 block mb-1">
                  Protocol Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'direct', label: 'Matrix DM' },
                    { id: 'channel', label: 'Channel' },
                    { id: 'p2p_mesh', label: 'Briar Mesh' }
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setNewChatType(t.id as any)}
                      className={`p-2 rounded-xl text-xs font-medium border text-center transition-all ${
                        newChatType === t.id
                          ? 'bg-emerald-600 text-white border-emerald-500 font-bold'
                          : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowNewChatModal(false)}
                className="flex-1 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateChat}
                disabled={!newChatName.trim()}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-xs font-bold text-white shadow-md"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

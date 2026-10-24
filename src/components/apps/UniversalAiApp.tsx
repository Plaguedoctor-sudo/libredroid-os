import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Cpu,
  ShieldCheck,
  Zap,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Camera,
  Layers,
  Terminal,
  Settings,
  FolderPlus,
  Trash2,
  Download,
  Share2,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Code,
  Sliders,
  Eye,
  MessageSquare,
  Smartphone,
  Monitor,
  Tablet,
  Folder
} from 'lucide-react';
import { useSystem } from '../../context/SystemContext';
import { useWindow } from '../../context/WindowContext';
import { useSecurity } from '../../context/SecurityContext';
import { useVirtualKeyboard } from '../../context/KeyboardContext';
import { SYSTEM_APPS } from '../../constants/apps';

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  thoughtProcess?: string[];
  actionExecuted?: {
    type: 'device_mode' | 'quick_setting' | 'app_launch' | 'killswitch' | 'security_audit' | 'vision_scan';
    label: string;
    detail: string;
    status: 'success' | 'warning' | 'info';
  };
  attachments?: {
    type: 'screen_capture' | 'file';
    title: string;
    dataUrl?: string;
  }[];
}

export interface AiChatSession {
  id: string;
  title: string;
  category: 'Device Control' | 'Privacy & Security' | 'Termux & Dev' | 'General';
  createdAt: string;
  messages: AiChatMessage[];
}

const DEFAULT_SESSIONS: AiChatSession[] = [
  {
    id: 'session-default',
    title: 'Sovereign OS Intelligence',
    category: 'Device Control',
    createdAt: 'Today',
    messages: [
      {
        id: 'msg-welcome',
        sender: 'assistant',
        text: 'Greetings. I am **Universal AI** — your sovereign, on-device intelligence engine built specifically for LibreDroid OS.\n\nI run **100% locally** within the seL4 Vault domain without transmitting telemetry, prompts, or voice recordings to Big Tech surveillance clouds.\n\nHow can I control your device, audit your privacy, or assist you today?',
        timestamp: 'Just now',
        thoughtProcess: [
          'Initialized local quantized GGUF weights in Vault domain (RAM: 820MB allocated)',
          'Verified zero-cloud egress: Network namespace severed to prevent telemetry leaks',
          'Registered hardware HAL actuators: DeviceMode, QuickSettings, Sandboxing, AppLauncher',
          'Ready for multimodal inputs and system action execution'
        ]
      }
    ]
  },
  {
    id: 'session-privacy',
    title: 'Privacy Sentinel & Audit',
    category: 'Privacy & Security',
    createdAt: 'Yesterday',
    messages: [
      {
        id: 'msg-sec-1',
        sender: 'user',
        text: 'Audit my current security posture and check if any app is exfiltrating telemetry.',
        timestamp: 'Yesterday 14:20',
      },
      {
        id: 'msg-sec-2',
        sender: 'assistant',
        text: '🛡️ **Security Audit Complete**:\n- **Kernel**: SELinux in **Enforcing** mode with Landlock LSM active.\n- **Sensors**: Camera & Mic hardware killswitches ready; synthetic white noise ready.\n- **Firewall**: 100% of telemetry beacons (Firebase, Meta Graph, AppsFlyer) poisoned with high-entropy noise.\n- **Hypervisor**: 6 domains active, including seL4 microkernel vault.\n\nAll sandboxes are operating nominally with zero leaked byte vectors.',
        timestamp: 'Yesterday 14:21',
        actionExecuted: {
          type: 'security_audit',
          label: 'System Audit Passed',
          detail: '13 Security Guardrails strictly enforced • Zero cloud exfiltration',
          status: 'success'
        }
      }
    ]
  }
];

const LOCAL_MODELS = [
  { id: 'llama-3.2-3b', name: 'Llama 3.2 3B Mobile', desc: '4-bit GGUF • Ultra-fast on-device NPU • 18ms latency', ram: '1.2 GB', badge: 'Local NPU' },
  { id: 'mistral-7b', name: 'Mistral 7B Hardened', desc: 'Air-gapped reasoning • Math, code, and logic', ram: '2.8 GB', badge: 'High Reasoning' },
  { id: 'phi-3.5', name: 'Phi-3.5 Mini Sovereign', desc: 'Compact architecture • Ideal for phone battery life', ram: '800 MB', badge: 'Low Power' },
  { id: 'deepseek-r1', name: 'DeepSeek R1 Sovereign Reasoner', desc: 'Step-by-step chain-of-thought verification', ram: '2.2 GB', badge: 'Deep Logic' },
  { id: 'ollama-bridge', name: 'Localhost Ollama Bridge', desc: 'Direct IPC connection to http://127.0.0.1:11434', ram: 'External', badge: 'Host Bridge' },
];

export const UniversalAiApp: React.FC = () => {
  const {
    deviceMode,
    setDeviceMode,
    quickSettings,
    toggleQuickSetting,
    setQuickSettingValue,
    batteryLevel,
    isCharging,
    hardwareSpecs,
    addNotification,
    account
  } = useSystem();

  const { openApp, closeWindow, returnHome } = useWindow();
  const {
    cameraKillswitch,
    setCameraKillswitch,
    micKillswitch,
    setMicKillswitch,
    locationKillswitch,
    setLocationKillswitch,
    usbDataLock,
    setUsbDataLock,
    executePenetrationTest
  } = useSecurity();

  const { openKeyboard, closeKeyboard } = useVirtualKeyboard();

  // State
  const [sessions, setSessions] = useState<AiChatSession[]>(() => {
    try {
      const stored = localStorage.getItem('libredroid_ai_chats_v2');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_SESSIONS;
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(sessions[0]?.id || 'session-default');
  const [selectedModel, setSelectedModel] = useState<string>('llama-3.2-3b');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [expandedThoughtIds, setExpandedThoughtIds] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('libredroid_ai_chats_v2', JSON.stringify(sessions));
    } catch {}
  }, [sessions]);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages, isGenerating]);

  const toggleThoughts = (msgId: string) => {
    setExpandedThoughtIds(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const handleInputTap = () => {
    openKeyboard({
      value: input,
      onChange: (val) => setInput(val),
      onEnter: () => handleSend(),
      placeholder: 'Ask Universal AI or enter system command...',
    });
  };

  // Text-to-speech reading
  const handleToggleSpeak = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const cleanText = text.replace(/[*_#`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Create new chat
  const handleCreateNewChat = (category: AiChatSession['category'] = 'General') => {
    const newSession: AiChatSession = {
      id: `session-${Date.now()}`,
      title: `New ${category} Chat`,
      category,
      createdAt: 'Just now',
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'assistant',
          text: `Initialized new session under **${category}**. Local engine: **${LOCAL_MODELS.find(m => m.id === selectedModel)?.name}**. How can I help?`,
          timestamp: 'Just now',
        }
      ]
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setIsSidebarOpen(false);
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      handleCreateNewChat();
      return;
    }
    const filtered = sessions.filter(s => s.id !== id);
    setSessions(filtered);
    if (activeSessionId === id) {
      setActiveSessionId(filtered[0].id);
    }
  };

  // Deep OS Action Engine
  const executeSystemAction = (userText: string): { reply: string; action?: AiChatMessage['actionExecuted']; thought: string[] } => {
    const lower = userText.toLowerCase();
    const thought = [
      `User query parsed: "${userText}"`,
      'Evaluating token semantics against LibreDroid System Actuator Registry',
    ];

    // 1. Device Mode Commands
    if (lower.includes('desktop') || lower.includes('dex') || lower.includes('pc mode') || lower.includes('window mode')) {
      setDeviceMode('desktop');
      thought.push('Triggered SystemContext: setDeviceMode("desktop")', 'Compositor switched to floating windowing');
      return {
        reply: '🖥️ **Switched to Desktop / DeX Mode**.\n\nYou now have freeform draggable, resizable floating windows, a desktop taskbar, start drawer, and multi-monitor scaling.',
        action: {
          type: 'device_mode',
          label: 'Desktop Mode Activated',
          detail: 'Switched window manager to multi-window DeX layout',
          status: 'success'
        },
        thought
      };
    }

    if (lower.includes('phone') || lower.includes('mobile mode') || lower.includes('compact mode')) {
      setDeviceMode('phone');
      thought.push('Triggered SystemContext: setDeviceMode("phone")');
      return {
        reply: '📱 **Switched to Compact Smartphone Mode**.\n\nOptimized for one-handed thumb interaction with bottom gesture navigation and quick settings shade.',
        action: {
          type: 'device_mode',
          label: 'Phone Mode Activated',
          detail: 'Adjusted chassis to mobile viewport with gesture pill',
          status: 'success'
        },
        thought
      };
    }

    if (lower.includes('tablet') || lower.includes('foldable') || lower.includes('ipad mode')) {
      setDeviceMode('tablet');
      thought.push('Triggered SystemContext: setDeviceMode("tablet")');
      return {
        reply: '📟 **Switched to Tablet / Foldable Mode**.\n\nExpanded high-DPI dock, split-screen multi-tasking, and expansive widgets are now active.',
        action: {
          type: 'device_mode',
          label: 'Tablet Mode Activated',
          detail: 'Configured dual-pane layout & expanded dock',
          status: 'success'
        },
        thought
      };
    }

    // 2. Hardware Killswitches & Sensors
    if (lower.includes('kill camera') || lower.includes('disable camera') || lower.includes('block camera')) {
      setCameraKillswitch(true);
      thought.push('Hardware HAL: Camera data lines physically disconnected via driver register');
      return {
        reply: '📷 **Camera Hardware Killswitch ENGAGED**.\n\nThe optical sensor is physically severed. Apps attempting camera capture receive a pitch-black synthetic frame stream.',
        action: {
          type: 'killswitch',
          label: 'Camera Killswitch Engaged',
          detail: 'Zero-trust dummy frame stream active • Optical feed severed',
          status: 'warning'
        },
        thought
      };
    }

    if (lower.includes('kill mic') || lower.includes('mute mic') || lower.includes('disable mic') || lower.includes('block mic')) {
      setMicKillswitch(true);
      thought.push('Hardware HAL: Microphone lines muted; PCM stream zeroed');
      return {
        reply: '🎙️ **Microphone Hardware Killswitch ENGAGED**.\n\nMicrophone audio lines are muted at the hardware level. Listening daemons receive synthetic white noise.',
        action: {
          type: 'killswitch',
          label: 'Microphone Killswitch Engaged',
          detail: 'Microphone hardware lines decoupled from ALSA audio subsystem',
          status: 'warning'
        },
        thought
      };
    }

    if (lower.includes('restore sensors') || lower.includes('enable camera') || lower.includes('unmute mic')) {
      setCameraKillswitch(false);
      setMicKillswitch(false);
      setLocationKillswitch(false);
      thought.push('Hardware HAL: Restored sensor streams');
      return {
        reply: '✅ **All Hardware Sensors Restored**.\n\nCamera, microphone, and location sensors have been restored to user-authorized mode.',
        action: {
          type: 'killswitch',
          label: 'Sensors Restored',
          detail: 'Camera and mic hardware lines re-connected under user consent',
          status: 'success'
        },
        thought
      };
    }

    // 3. Quick Settings toggles
    if (lower.includes('airplane') || lower.includes('flight mode')) {
      toggleQuickSetting('airplane');
      thought.push('QuickSettings: toggled airplane mode');
      return {
        reply: `✈️ **Airplane Mode ${!quickSettings.airplane ? 'ENABLED' : 'DISABLED'}**.\n\nAll cellular, Wi-Fi, and Bluetooth baseband radios have been isolated.`,
        action: {
          type: 'quick_setting',
          label: `Airplane Mode ${!quickSettings.airplane ? 'Active' : 'Deactivated'}`,
          detail: 'Radio transmitters isolated at the hardware bus',
          status: 'info'
        },
        thought
      };
    }

    if (lower.includes('battery saver') || lower.includes('power save')) {
      toggleQuickSetting('batterySaver');
      thought.push('Power Governor: conservative policy engaged');
      return {
        reply: `🔋 **Battery Saver ${!quickSettings.batterySaver ? 'ACTIVATED' : 'OFF'}**.\n\nCPU governor capped, GPU blur shaders throttled, and background sync intervals paused.`,
        action: {
          type: 'quick_setting',
          label: 'Power Governor Updated',
          detail: 'Battery preservation profile configured',
          status: 'info'
        },
        thought
      };
    }

    if (lower.includes('flashlight') || lower.includes('torch')) {
      toggleQuickSetting('flashlight');
      thought.push('Hardware HAL: GPIO LED strobe toggled');
      return {
        reply: `🔦 **Flashlight ${!quickSettings.flashlight ? 'ON' : 'OFF'}** via hardware bridge.`,
        action: {
          type: 'quick_setting',
          label: 'LED Flashlight Toggled',
          detail: 'GPIO hardware LED actuator state modified',
          status: 'info'
        },
        thought
      };
    }

    // 4. App Launchers
    const appMap: Record<string, string> = {
      terminal: 'terminal',
      termux: 'terminal',
      bash: 'terminal',
      browser: 'browser',
      web: 'browser',
      search: 'browser',
      settings: 'settings',
      camera: 'camera',
      files: 'files',
      nextcloud: 'files',
      documents: 'files',
      store: 'store',
      fdroid: 'store',
      'f-droid': 'store',
      security: 'security',
      guardrails: 'security',
      hypervisor: 'hypervisor',
      qubes: 'hypervisor',
      sandbox: 'linux_sandbox',
      cgroup: 'linux_sandbox',
      predatory: 'predatory_shield',
      shield: 'predatory_shield',
      photos: 'photos',
      gallery: 'photos',
      calc: 'calculator',
      calculator: 'calculator',
      notes: 'notes',
      joplin: 'notes',
      chats: 'chats',
      chat: 'chats',
      matrix: 'chats',
      phone: 'phone',
      dialer: 'phone',
      call: 'phone',
      messages: 'messages',
      sms: 'messages',
      hardware: 'hardware',
      installer: 'system_installer',
      iso: 'system_installer',
      apk: 'apk_installer',
      waydroid: 'apk_installer',
      darwin: 'darwin_bridge',
      apple: 'darwin_bridge',
      persona: 'persona_engine',
      adapt: 'persona_engine',
    };

    for (const [key, appId] of Object.entries(appMap)) {
      if (lower.includes(`open ${key}`) || lower.includes(`launch ${key}`) || lower.includes(`start ${key}`) || lower.includes(`run ${key}`)) {
        openApp(appId);
        thought.push(`WindowManager: Dispatched openApp("${appId}")`);
        return {
          reply: `🚀 **Launching application: ${appId}**.\n\nProcess initialized in isolated container sandbox. Window mapped to active compositor layer.`,
          action: {
            type: 'app_launch',
            label: `Opened ${appId}`,
            detail: 'Dispatched to WindowManager with Qubes domain isolation',
            status: 'success'
          },
          thought
        };
      }
    }

    // 5. Penetration Testing & Exploit Verification
    if (lower.includes('pentest') || lower.includes('penetration') || lower.includes('exploit test') || lower.includes('attack simulation')) {
      const incident = executePenetrationTest('pegasus_zero_click');
      thought.push('SecurityEngine: Executed simulated exploit vector (Pegasus FORCEDENTRY)');
      return {
        reply: `🛡️ **Penetration Test Executed Live**:\n\n- **Target**: ${incident.attackName}\n- **Intercepted By**: ${incident.interceptedBy}\n- **Outcome**: ${incident.status.replace(/_/g, ' ').toUpperCase()}\n- **Forensic Summary**: ${incident.forensicSummary}\n\nYour operating system successfully repelled the simulated intrusion without root compromise.`,
        action: {
          type: 'security_audit',
          label: 'Exploit Neutralized',
          detail: `${incident.interceptedBy} defeated attack payload`,
          status: 'success'
        },
        thought
      };
    }

    // 6. Battery & Hardware queries
    if (lower.includes('battery') || lower.includes('ram') || lower.includes('cpu') || lower.includes('specs') || lower.includes('hardware status')) {
      thought.push('HAL Query: Polling battery and compute metrics');
      return {
        reply: `📊 **LibreDroid Hardware Health Matrix**:\n- **Battery**: ${batteryLevel}% (${isCharging ? '⚡ Fast Charging via USB-C' : 'Discharging'}) - Estimated 9h 40m remaining\n- **CPU Cores**: ${hardwareSpecs?.cpuCores || 8} Cores (${hardwareSpecs?.cpuArchitecture || 'ARM64 Cortex-A78'})\n- **RAM**: ${hardwareSpecs?.ramGb || 8} GB Allocated (${hardwareSpecs?.tier.toUpperCase()} Tier)\n- **GPU**: ${hardwareSpecs?.gpuRenderer || 'Vulkan 1.3 Hardware Acceleration'}\n- **Temperature**: 34.2°C (Optimal Thermal Envelope)\n- **Telemetry Egress**: **0.0 KB (Zero surveillance packets)**`,
        action: {
          type: 'quick_setting',
          label: 'Hardware Profile Audited',
          detail: `CPU: ${hardwareSpecs?.cpuCores || 8} Cores • Battery: ${batteryLevel}%`,
          status: 'info'
        },
        thought
      };
    }

    // Default intelligent conversational response
    thought.push(
      'No immediate hardware action trigger detected; synthesizing sovereign analytical response',
      'Formatting markdown response with actionable suggestions'
    );

    let answer = `I've analyzed your prompt using **${LOCAL_MODELS.find(m => m.id === selectedModel)?.name}** running in the **Vault domain**.\n\n`;

    if (lower.includes('code') || lower.includes('bash') || lower.includes('script') || lower.includes('terminal')) {
      answer += `Here is a sovereign shell script to automate your system maintenance in Termux/Alpine:\n\n\`\`\`bash\n#!/usr/bin/env bash\n# LibreDroid Daily Hardening Routine\necho "[*] Checking Linux Landlock and SELinux status..."\nsestatus\n\necho "[*] Shredding ephemeral clipboards..."\ncat /dev/urandom | head -c 256 | xclip -selection clipboard 2>/dev/null\n\necho "[*] Inspecting active Waydroid containers..."\nwaydroid session status\n\necho "[✓] Sovereign system operational."\n\`\`\`\n\nYou can run this directly in the **Termux** or **Disposable Alpine** terminal.`;
    } else if (lower.includes('who are you') || lower.includes('what can you do')) {
      answer += `I am the **Universal AI for Android Devices** — an independent, non-monopolistic alternative to Google Gemini and Apple Intelligence.\n\n### Core Capabilities:\n1. **Deep OS Automation**: Tell me to *"Switch to Desktop mode"*, *"Kill microphone"*, *"Turn on flashlight"*, or *"Launch Nextcloud Files"*.\n2. **Security & Sentinel**: Execute penetration tests, check Tor circuits, inspect memory allocations, and poison commercial ad trackers.\n3. **Multimodal Screen Analysis**: Tap the **Scan Screen** button above to have me inspect the active window for dark patterns or phishing cues.\n4. **100% Offline & Private**: Zero data sent to external servers. Your conversations stay strictly inside your physical device.`;
    } else {
      answer += `Regarding **"${userText}"**:\n\nIn LibreDroid OS, all workloads and data processing are partitioned across sovereign boundaries. If you need me to adjust your hardware parameters, audit permissions for sideloaded APKs, or execute development scripts, just ask!\n\n💡 *Tip: Try saying "Switch to Desktop mode", "Turn off Wi-Fi", or "Open F-Droid".*`;
    }

    return {
      reply: answer,
      thought
    };
  };

  const handleSend = () => {
    if (!input.trim() || isGenerating) return;

    const userText = input.trim();
    setInput('');
    closeKeyboard();

    const userMsg: AiChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: 'Just now'
    };

    const updatedMessages = [...activeSession.messages, userMsg];

    setSessions(prev =>
      prev.map(s =>
        s.id === activeSession.id
          ? { ...s, messages: updatedMessages, title: s.messages.length <= 1 ? userText.slice(0, 24) : s.title }
          : s
      )
    );

    setIsGenerating(true);

    // Simulate local inference delay (fast 350ms)
    setTimeout(() => {
      const { reply, action, thought } = executeSystemAction(userText);

      const assistantMsg: AiChatMessage = {
        id: `msg-resp-${Date.now()}`,
        sender: 'assistant',
        text: reply,
        timestamp: 'Just now',
        thoughtProcess: thought,
        actionExecuted: action
      };

      setSessions(prev =>
        prev.map(s =>
          s.id === activeSession.id
            ? { ...s, messages: [...updatedMessages, assistantMsg] }
            : s
        )
      );

      setIsGenerating(false);
      if (action) {
        addNotification({
          appId: 'universal_ai',
          appName: 'Universal AI Agent',
          title: action.label,
          body: action.detail,
        });
      }
    }, 450);
  };

  // Screen analysis simulation
  const handleAnalyzeScreen = () => {
    setIsGenerating(true);
    addNotification({
      appId: 'universal_ai',
      appName: 'Universal Vision',
      title: 'Screen Captured Locally',
      body: 'Processing active compositor surface via on-device vision encoder.',
    });

    setTimeout(() => {
      const scanMsg: AiChatMessage = {
        id: `msg-vision-${Date.now()}`,
        sender: 'assistant',
        text: `👁️ **Multimodal Screen Analysis Report**:\n- **Active Form Factor**: ${deviceMode.toUpperCase()} mode (${window.innerWidth}x${window.innerHeight} viewport)\n- **UI Density**: ${hardwareSpecs?.tier.toUpperCase()} hardware configuration\n- **Active Security Shield**: Anti-Predatory and False Telemetry Feeder active\n- **Detected Elements**: Clean sovereign interface with zero deceptive countdowns, zero forced paywalls, and zero tracking SDKs.\n- **Recommendation**: Safe sovereign state. No predatory dark patterns detected.`,
        timestamp: 'Just now',
        thoughtProcess: [
          'Captured Wayland compositor frame buffer into memory (VRAM zeroed after analysis)',
          'Extracted visual layout nodes and contrast ratios',
          'Checked for predatory urgency counters or deceptive close buttons: 0 detected',
          'Confirmed pristine privacy rating: A+'
        ],
        actionExecuted: {
          type: 'vision_scan',
          label: 'Screen Inspection Completed',
          detail: 'No predatory dark patterns or malicious overlays detected',
          status: 'success'
        }
      };

      setSessions(prev =>
        prev.map(s =>
          s.id === activeSession.id
            ? { ...s, messages: [...s.messages, scanMsg] }
            : s
        )
      );
      setIsGenerating(false);
    }, 600);
  };

  const filteredSessions = sessions.filter(s => {
    const matchCat = activeCategory === 'All' || s.category === activeCategory;
    const matchQuery = !searchQuery || s.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQuery;
  });

  return (
    <div className="flex-1 w-full h-full flex flex-col sm:flex-row bg-neutral-950 text-white select-none overflow-hidden relative font-sans">
      {/* LEFT SIDEBAR: Chats Drawer & Categories */}
      <div className={`
        absolute sm:static inset-y-0 left-0 z-30 w-72 bg-neutral-900 border-r border-neutral-800 flex flex-col transition-transform duration-200
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'}
      `}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md">
              <Bot size={18} />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight">Universal AI</div>
              <div className="text-[10px] text-cyan-400 font-mono">seL4 Vault Domain</div>
            </div>
          </div>

          <button
            onClick={() => handleCreateNewChat()}
            className="p-1.5 rounded-xl bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 border border-violet-500/40 transition-all active:scale-95"
            title="New Chat"
          >
            <FolderPlus size={16} />
          </button>
        </div>

        {/* Model Selector Card */}
        <div className="p-3 border-b border-neutral-800/80 bg-neutral-950/60">
          <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold block mb-1.5">
            Active Sovereign Model
          </label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full text-xs bg-neutral-900 border border-neutral-700 rounded-xl px-2.5 py-1.5 text-neutral-200 focus:outline-none focus:border-violet-500 font-medium"
          >
            {LOCAL_MODELS.map(m => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.badge})
              </option>
            ))}
          </select>
          <div className="text-[10px] text-neutral-400 mt-1 flex items-center justify-between">
            <span>{LOCAL_MODELS.find(m => m.id === selectedModel)?.desc.slice(0, 32)}...</span>
            <span className="text-cyan-400 font-mono">{LOCAL_MODELS.find(m => m.id === selectedModel)?.ram}</span>
          </div>
        </div>

        {/* Categories / Folders Tabs */}
        <div className="p-2 border-b border-neutral-800 flex gap-1 overflow-x-auto text-[11px]">
          {['All', 'Device Control', 'Privacy & Security', 'Termux & Dev', 'General'].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 rounded-lg shrink-0 font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-violet-600 text-white font-semibold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Chats */}
        <div className="p-2.5">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chat history..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-neutral-700"
            />
          </div>
        </div>

        {/* Sessions List ("Chats") */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 px-2 py-1">
            Chats ({filteredSessions.length})
          </div>
          {filteredSessions.map(session => {
            const isActive = session.id === activeSessionId;
            return (
              <div
                key={session.id}
                onClick={() => {
                  setActiveSessionId(session.id);
                  setIsSidebarOpen(false);
                }}
                className={`group flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer transition-all ${
                  isActive
                    ? 'bg-violet-950/60 border border-violet-500/40 text-white'
                    : 'text-neutral-400 hover:bg-neutral-850 hover:text-neutral-200'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare size={14} className={isActive ? 'text-violet-400 shrink-0' : 'text-neutral-500 shrink-0'} />
                  <div className="truncate">
                    <div className="font-medium truncate">{session.title}</div>
                    <div className="text-[10px] text-neutral-500">{session.category} • {session.messages.length} msgs</div>
                  </div>
                </div>

                <button
                  onClick={(e) => handleDeleteSession(session.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition-opacity"
                  title="Delete chat"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-neutral-800/80 bg-neutral-950/40 flex items-center justify-between text-[11px] text-neutral-400">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Air-Gapped Local</span>
          </div>
          <span className="font-mono text-[10px]">v2.4 Sovereign</span>
        </div>
      </div>

      {/* Backdrop for mobile sidebar */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-20 sm:hidden"
        />
      )}

      {/* RIGHT MAIN AREA: Chat Stream & Actions */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-neutral-950">
        {/* Chat Stream Header */}
        <div className="h-14 border-b border-neutral-800/80 px-4 flex items-center justify-between bg-neutral-900/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 sm:hidden"
            >
              <Layers size={18} />
            </button>
            <div>
              <div className="text-sm font-bold flex items-center gap-2">
                <span>{activeSession.title}</span>
                <span className="text-[10px] font-mono bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full">
                  {activeSession.category}
                </span>
              </div>
              <div className="text-[11px] text-neutral-400 flex items-center gap-2">
                <span>Model: {LOCAL_MODELS.find(m => m.id === selectedModel)?.name}</span>
                <span>•</span>
                <span className="text-emerald-400">Zero Cloud Egress</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Screen Analysis Button */}
            <button
              onClick={handleAnalyzeScreen}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-850 hover:bg-neutral-800 border border-neutral-700/80 text-xs font-medium text-cyan-300 hover:text-cyan-200 transition-all active:scale-95 shadow-sm"
              title="Inspect Current Screen"
            >
              <Eye size={14} className="text-cyan-400" />
              <span className="hidden md:inline">Inspect Screen</span>
            </button>

            {/* Clear Messages */}
            <button
              onClick={() => {
                setSessions(prev =>
                  prev.map(s => (s.id === activeSession.id ? { ...s, messages: [] } : s))
                );
              }}
              className="p-2 rounded-xl text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-all"
              title="Clear messages"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {/* Quick Actuator Action Pills */}
        <div className="p-2.5 bg-neutral-900/30 border-b border-neutral-800/60 flex items-center gap-2 overflow-x-auto text-xs shrink-0">
          <span className="text-[10px] uppercase font-bold text-neutral-400 shrink-0">Quick Actuators:</span>
          {[
            { label: '🖥️ Switch to Desktop', cmd: 'Switch to desktop mode' },
            { label: '📱 Compact Phone', cmd: 'Switch to phone mode' },
            { label: '🛡️ Audit Security', cmd: 'Audit my current security posture' },
            { label: '📷 Kill Camera', cmd: 'Kill camera sensor' },
            { label: '🎙️ Kill Microphone', cmd: 'Kill mic sensor' },
            { label: '🔋 Hardware Health', cmd: 'Check battery and hardware health' },
            { label: '✈️ Airplane Mode', cmd: 'Toggle airplane mode' },
            { label: '🧪 Run Pentest', cmd: 'Execute penetration test' },
          ].map(pill => (
            <button
              key={pill.label}
              onClick={() => {
                setInput(pill.cmd);
                setTimeout(() => handleSend(), 50);
              }}
              className="px-2.5 py-1 rounded-full bg-neutral-850 hover:bg-neutral-800 border border-neutral-700/80 text-neutral-300 hover:text-white shrink-0 text-[11px] transition-all active:scale-95"
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {activeSession.messages.map(msg => {
            const isUser = msg.sender === 'user';
            const isExpanded = !!expandedThoughtIds[msg.id];

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-3xl ${isUser ? 'ml-auto' : 'mr-auto'}`}
              >
                <div className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'} w-full`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white shadow-md ${
                    isUser
                      ? 'bg-gradient-to-tr from-emerald-600 to-teal-700'
                      : 'bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500'
                  }`}>
                    {isUser ? <Smartphone size={16} /> : <Bot size={16} />}
                  </div>

                  {/* Bubble Content */}
                  <div className={`flex flex-col space-y-2 max-w-[85%] sm:max-w-[78%]`}>
                    {/* Collapsible Chain-of-Thought / Reasoning Process */}
                    {msg.thoughtProcess && msg.thoughtProcess.length > 0 && (
                      <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-2.5 text-[11px] text-neutral-400">
                        <button
                          onClick={() => toggleThoughts(msg.id)}
                          className="w-full flex items-center justify-between text-violet-300 hover:text-violet-200 font-medium"
                        >
                          <span className="flex items-center gap-1.5">
                            <Sparkles size={12} className="text-violet-400" />
                            <span>Reasoning Process ({msg.thoughtProcess.length} steps)</span>
                          </span>
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>

                        {isExpanded && (
                          <div className="mt-2 space-y-1.5 pl-2 border-l border-violet-500/30 text-neutral-300 font-mono text-[10px]">
                            {msg.thoughtProcess.map((step, i) => (
                              <div key={i} className="leading-relaxed">• {step}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Main Text Bubble */}
                    <div className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-violet-600 text-white rounded-tr-none shadow-md'
                        : 'bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-tl-none shadow-lg'
                    }`}>
                      <div className="whitespace-pre-wrap font-sans">
                        {msg.text.split('\n\n').map((paragraph, idx) => (
                          <p key={idx} className="mb-2 last:mb-0">
                            {paragraph}
                          </p>
                        ))}
                      </div>

                      {/* Executed Action Badge */}
                      {msg.actionExecuted && (
                        <div className="mt-3 p-3 bg-neutral-950/80 border border-emerald-500/40 rounded-xl flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                            <div>
                              <div className="font-bold text-xs text-emerald-300">
                                {msg.actionExecuted.label}
                              </div>
                              <div className="text-[11px] text-neutral-400 font-mono">
                                {msg.actionExecuted.detail}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono uppercase">
                            ACTUATED
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bubble Bottom Meta & TTS Speaker */}
                    <div className={`flex items-center gap-2 text-[10px] text-neutral-500 px-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <span>{msg.timestamp}</span>
                      {!isUser && (
                        <button
                          onClick={() => handleToggleSpeak(msg.text)}
                          className="hover:text-cyan-400 transition-colors flex items-center gap-1"
                          title="Read aloud sovereignly"
                        >
                          {isSpeaking ? <VolumeX size={12} className="text-rose-400" /> : <Volume2 size={12} />}
                          <span>{isSpeaking ? 'Mute' : 'Listen'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing / Generating Indicator */}
          {isGenerating && (
            <div className="flex items-start gap-2.5 max-w-xl">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md animate-pulse">
                <Bot size={16} />
              </div>
              <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-2xl rounded-tl-none flex items-center gap-2 text-xs text-neutral-400">
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce delay-100" />
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce delay-200" />
                <span className="ml-1 text-[11px] font-mono text-neutral-300">Evaluating in seL4 Vault...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Composer Box */}
        <div className="p-3 sm:p-4 bg-neutral-900/80 border-t border-neutral-800">
          <div className="max-w-3xl mx-auto flex items-center gap-2">
            <button
              onClick={handleAnalyzeScreen}
              className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-cyan-400 hover:text-cyan-300 transition-all border border-neutral-700 shrink-0"
              title="Inspect Active Screen"
            >
              <Camera size={18} />
            </button>

            <div className="flex-1 relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                onClick={handleInputTap}
                placeholder="Ask Universal AI or enter system action (e.g. 'Desktop mode', 'Kill mic')..."
                className="w-full bg-neutral-950 border border-neutral-700/80 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500 pr-10 shadow-inner"
              />
            </div>

            <button
              onClick={handleSend}
              disabled={!input.trim() || isGenerating}
              className="p-3 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 disabled:pointer-events-none text-white shadow-lg transition-all active:scale-95 shrink-0"
              title="Send Command"
            >
              <Send size={18} />
            </button>
          </div>

          <div className="max-w-3xl mx-auto flex items-center justify-between text-[10px] text-neutral-400 mt-2 px-1">
            <span>🛡️ 100% Offline seL4 Vault Sandbox • Zero cloud recording</span>
            <span>Engine: {LOCAL_MODELS.find(m => m.id === selectedModel)?.name}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

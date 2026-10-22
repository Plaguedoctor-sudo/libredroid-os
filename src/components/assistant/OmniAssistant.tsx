import React, { useState } from 'react';
import { Sparkles, Send, X, ShieldCheck, Box, HardDrive } from 'lucide-react';
import { useSystem } from '../../context/SystemContext';
import { useWindow } from '../../context/WindowContext';
import { useVirtualKeyboard } from '../../context/KeyboardContext';

export const OmniAssistant: React.FC = () => {
  const { 
    isAssistantOpen, 
    setIsAssistantOpen, 
    setDeviceMode, 
    batteryLevel, 
    quickSettings, 
    account 
  } = useSystem();
  const { openApp } = useWindow();
  const { openKeyboard, closeKeyboard } = useVirtualKeyboard();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string }>>([
    {
      sender: 'assistant',
      text: "Hello! I am your Sovereign Local AI Assistant. I run 100% on-device with zero telemetry sent to Big Tech clouds. How can I assist your system today?",
    },
  ]);

  if (!isAssistantOpen) return null;

  const handleInputTap = () => {
    openKeyboard({
      value: input,
      onChange: (val) => setInput(val),
      onEnter: () => handleSend(),
      placeholder: "Ask local model or give system command...",
    });
  };

  const handleClose = () => {
    closeKeyboard();
    setIsAssistantOpen(false);
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userText = input.trim();
    const newMessages = [...messages, { sender: 'user' as const, text: userText }];
    setMessages(newMessages);
    setInput('');

    // Handle smart triggers
    const lower = userText.toLowerCase();
    setTimeout(() => {
      let reply = "Processed via local on-device quantized model (Llama-3-8B-Q4_K_M).";
      
      if (lower.includes('desktop') || lower.includes('dex')) {
        setDeviceMode('desktop');
        reply = "Switching to Desktop/DeX mode with freeform resizable windows!";
      } else if (lower.includes('phone') || lower.includes('mobile')) {
        setDeviceMode('phone');
        reply = "Switching to Compact Phone mode with gesture navigation!";
      } else if (lower.includes('tablet')) {
        setDeviceMode('tablet');
        reply = "Switching to Tablet layout mode with high-DPI dock!";
      } else if (lower.includes('apk') || lower.includes('install app')) {
        openApp('apk_installer');
        reply = "Opening APK Package Installer & Waydroid Runner. You can sideload any Android .apk file.";
      } else if (lower.includes('f-droid') || lower.includes('store')) {
        openApp('store');
        reply = "Opening F-Droid Free Software repository.";
      } else if (lower.includes('install system') || lower.includes('iso') || lower.includes('hardware')) {
        openApp('system_installer');
        reply = "Opening LibreDroid Hardware System Installer wizard.";
      } else if (lower.includes('browser') || lower.includes('search')) {
        openApp('browser');
        reply = "Opening LibreBrowse with DuckDuckGo private search.";
      } else if (lower.includes('settings')) {
        openApp('settings');
        reply = "Opening System Settings.";
      } else if (lower.includes('terminal')) {
        openApp('terminal');
        reply = "Launching Termux bash environment.";
      } else if (lower.includes('battery')) {
        reply = `Battery level is ${batteryLevel}%. Running under power governor 'conservative' with zero background tracking analytics.`;
      } else if (lower.includes('telemetry') || lower.includes('false') || lower.includes('poison') || lower.includes('spyware') || lower.includes('tracking')) {
        openApp('predatory_shield');
        reply = "Opening Anti-Predatory Shield & False Telemetry Feeder. When apps demand tracking consent, LibreDroid feeds synthetic randomized noise to analytics beacons and returns HTTP 200 OK.";
      } else if (lower.includes('source') || lower.includes('repository') || lower.includes('repo') || lower.includes('store') || lower.includes('market') || lower.includes('f-droid')) {
        openApp('store');
        reply = "Opening Sovereign App Store. You can install verified applications across multiple safe sources: F-Droid, IzzyOnDroid, Guardian Project, Flathub, and AltStore.";
      } else if (lower.includes('apple') || lower.includes('ios') || lower.includes('ipa') || lower.includes('darwin') || lower.includes('cocoa') || lower.includes('iphone') || lower.includes('mac')) {
        openApp('darwin_bridge');
        reply = "Opening Apple Darwin & CocoaTouch Bridge. LibreDroid can natively execute Apple iOS (.ipa) and macOS (.app) binaries using Darling XNU emulation and touchHLE UIKit translation.";
      } else if (lower.includes('apk') || lower.includes('android') || lower.includes('waydroid') || lower.includes('sideload')) {
        openApp('apk_installer');
        reply = "Opening Universal Package Hub. You can sideload and run both Android APKs (via Waydroid AOSP) and Apple IPAs (via Darwin CocoaTouch) without proprietary app stores.";
      } else if (lower.includes('hypervisor') || lower.includes('qubes') || lower.includes('whonix') || lower.includes('vault') || lower.includes('domain')) {
        openApp('hypervisor');
        reply = "Opening Multi-OS Hypervisor Matrix. You can inspect or operate inside the 5 specialized OS domains: seL4 Vault, Whonix Tor, GrapheneOS Android, Disposable Alpine, and Debian Workstation.";
      } else if (lower.includes('security') || lower.includes('guardrail') || lower.includes('firewall')) {
        openApp('security');
        reply = "Opening Hardened Security Guardrails & Hardware Killswitches.";
      } else if (lower.includes('sandbox') || lower.includes('cgroup') || lower.includes('namespace') || lower.includes('seccomp')) {
        openApp('linux_sandbox');
        reply = "Opening Linux 35-Year Evolution Sandbox Engine.";
      } else if (lower.includes('predatory') || lower.includes('subscription') || lower.includes('dark pattern')) {
        openApp('predatory_shield');
        reply = "Opening Anti-Predatory Shield. Analyzing dark patterns and active subscriptions.";
      } else if (lower.includes('hardware') || lower.includes('cpu') || lower.includes('gpu') || lower.includes('hal')) {
        openApp('hardware');
        reply = "Opening Hardware HAL Manager.";
      } else if (lower.includes('monopoly') || lower.includes('google') || lower.includes('independent') || lower.includes('unifiedpush')) {
        openApp('guardian');
        reply = "Opening Anti-Monopoly Core & UnifiedPush Provider Manager.";
      }

      setMessages((prev) => [...prev, { sender: 'assistant', text: reply }]);
    }, 350);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex flex-col justify-end items-center p-3 sm:p-6 animate-fade-in select-none"
      onClick={handleClose}
    >
      <div 
        className="w-full max-w-lg bg-neutral-900/95 border border-emerald-500/30 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Assistant Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-xl text-white">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="text-sm font-bold flex items-center gap-1.5">
                Sovereign Local AI
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                  100% On-Device
                </span>
              </div>
              <div className="text-xs text-neutral-400">Zero Cloud Dependency • Private</div>
            </div>
          </div>
          <button 
            onClick={() => setIsAssistantOpen(false)}
            className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Conversation View */}
        <div className="space-y-3 max-h-60 overflow-y-auto pr-1 text-sm">
          {messages.map((m, idx) => (
            <div 
              key={idx}
              className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[85%] p-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  m.sender === 'user' 
                    ? 'bg-emerald-600 text-white rounded-br-none' 
                    : 'bg-neutral-800/90 text-neutral-200 border border-neutral-700/60 rounded-bl-none'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { label: 'Sideload APK', cmd: 'how do i sideload apk' },
            { label: 'Install to Hardware', cmd: 'install system to hardware' },
            { label: 'F-Droid Store', cmd: 'open f-droid' },
            { label: 'Switch to Desktop', cmd: 'switch to desktop' },
          ].map((chip) => (
            <button
              key={chip.label}
              onClick={() => {
                setInput(chip.cmd);
              }}
              className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-full text-[11px] text-neutral-300 whitespace-nowrap transition-colors"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Input Bar with LibreDroid Virtual Keyboard Integration */}
        <div 
          onClick={handleInputTap}
          className="flex items-center gap-2 bg-neutral-800/90 hover:bg-neutral-800 border border-neutral-700 hover:border-emerald-500/50 rounded-2xl px-3 py-2 cursor-pointer transition-all"
        >
          <input
            type="text"
            placeholder="Ask local model or give system command..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onClick={handleInputTap}
            inputMode="none"
            className="w-full bg-transparent text-white placeholder-neutral-500 text-xs sm:text-sm focus:outline-none cursor-pointer"
          />
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleSend();
            }}
            disabled={!input.trim()}
            className="p-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl transition-all"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

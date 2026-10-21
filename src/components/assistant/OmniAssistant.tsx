import React, { useState } from 'react';
import { Sparkles, Mic, Send, X, Laptop, Smartphone, Tablet, Terminal } from 'lucide-react';
import { useSystem } from '../../context/SystemContext';
import { useWindow } from '../../context/WindowContext';

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

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string }>>([
    {
      sender: 'assistant',
      text: "Hi there! I'm your Omni Gemini Assistant. How can I help you across your devices today?",
    },
  ]);

  if (!isAssistantOpen) return null;

  const handleSend = () => {
    if (!input.trim()) return;

    const userText = input.trim();
    const newMessages = [...messages, { sender: 'user' as const, text: userText }];
    setMessages(newMessages);
    setInput('');

    // Handle smart triggers
    const lower = userText.toLowerCase();
    setTimeout(() => {
      let reply = "I understand. I can help configure your device or launch universal apps!";
      
      if (lower.includes('desktop') || lower.includes('dex')) {
        setDeviceMode('desktop');
        reply = "Switching to Desktop/Dex mode with freeform resizable windows!";
      } else if (lower.includes('phone') || lower.includes('mobile')) {
        setDeviceMode('phone');
        reply = "Switching to Compact Phone mode with gesture navigation!";
      } else if (lower.includes('tablet')) {
        setDeviceMode('tablet');
        reply = "Switching to Tablet layout mode with high-DPI dock!";
      } else if (lower.includes('browser') || lower.includes('chrome') || lower.includes('search')) {
        openApp('browser');
        reply = "Opening Chrome browser for you now.";
      } else if (lower.includes('settings')) {
        openApp('settings');
        reply = "Opening System Settings.";
      } else if (lower.includes('terminal')) {
        openApp('terminal');
        reply = "Launching Omni Terminal environment.";
      } else if (lower.includes('battery')) {
        reply = `Your battery is at ${batteryLevel}%. Wi-Fi is ${quickSettings.wifi ? 'connected' : 'off'}.`;
      } else if (lower.includes('who are you') || lower.includes('what is this')) {
        reply = `This is OmniOS: an adaptive universal Android system operating environment designed to run seamlessly on phones, tablets, foldables, and desktops!`;
      }

      setMessages((prev) => [...prev, { sender: 'assistant', text: reply }]);
    }, 400);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex flex-col justify-end items-center p-3 sm:p-6 animate-fade-in select-none"
      onClick={() => setIsAssistantOpen(false)}
    >
      <div 
        className="w-full max-w-lg bg-neutral-900/95 border border-purple-500/30 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 text-white glow-primary"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Assistant Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400 rounded-xl text-white">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="text-sm font-bold flex items-center gap-1.5">
                Omni Gemini
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-mono">
                  v2.0
                </span>
              </div>
              <div className="text-xs text-neutral-400">Universal Assistant</div>
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
                    ? 'bg-purple-600 text-white rounded-br-none' 
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
            { label: 'Switch to Desktop', cmd: 'switch to desktop' },
            { label: 'Open Terminal', cmd: 'open terminal' },
            { label: 'Battery Status', cmd: 'what is battery status' },
            { label: 'Open Chrome', cmd: 'open browser' },
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

        {/* Input Bar */}
        <div className="flex items-center gap-2 bg-neutral-800/90 border border-neutral-700 rounded-2xl px-3 py-2">
          <input
            type="text"
            placeholder="Ask Omni anything or command system..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            autoFocus
            className="w-full bg-transparent text-white placeholder-neutral-500 text-xs sm:text-sm focus:outline-none"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl transition-all"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

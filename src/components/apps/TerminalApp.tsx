import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Send, CornerDownLeft } from 'lucide-react';
import { useSystem } from '../../context/SystemContext';

interface TerminalLine {
  text: string;
  type: 'input' | 'output' | 'system' | 'error';
}

export const TerminalApp: React.FC = () => {
  const { actualDevice, deviceMode, setDeviceMode, batteryLevel, account } = useSystem();
  const [history, setHistory] = useState<TerminalLine[]>([
    { text: 'OmniOS Universal Linux Shell [v1.0.4-aosp-x86_64]', type: 'system' },
    { text: 'Type "help" or "neofetch" to begin exploring system services.', type: 'system' },
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    const newHistory = [...history, { text: `user@omni:~$ ${trimmed}`, type: 'input' as const }];
    const parts = trimmed.split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (command) {
      case 'help':
        newHistory.push({
          text: `OmniOS Shell Commands:
• neofetch         - Display system architecture and ASCII banner
• device           - Show current viewport and form factor state
• device <mode>    - Switch mode (phone, tablet, desktop, foldable)
• battery          - Show battery health and voltage metrics
• whoami           - Print active Google profile identity
• uname -a         - Print operating system kernel information
• ls               - List virtual directories
• date             - Print current hardware clock time
• clear            - Clear terminal screen buffer`,
          type: 'output',
        });
        break;

      case 'neofetch':
        newHistory.push({
          text: `
    .---.      OS: OmniOS Universal Android 15
   /     \\     Host: Multi-Form-Factor Device Engine
  | () () |    Kernel: 6.6.21-omni-android-gki
   \\  -  /     Uptime: 2 days, 14 hours
    '---'      Shell: omni-sh 1.2
  /|     |\\    Resolution: ${window.innerWidth}x${window.innerHeight} (${actualDevice} mode)
 / |     | \\   DE: Omni DeX / Material You 3
*  |_____|  *  Memory: 4.8 GB / 16.0 GB
   |     |     Battery: ${batteryLevel}% (Optimized)
`,
          type: 'output',
        });
        break;

      case 'device':
        if (args[0]) {
          const target = args[0].toLowerCase();
          if (['phone', 'tablet', 'desktop', 'foldable', 'auto'].includes(target)) {
            setDeviceMode(target as any);
            newHistory.push({
              text: `Switched form factor to [${target}]. Adapting layout engine...`,
              type: 'output',
            });
          } else {
            newHistory.push({
              text: `Unknown device mode: ${target}. Choose: phone, tablet, desktop, foldable, auto`,
              type: 'error',
            });
          }
        } else {
          newHistory.push({
            text: `Current Form Factor: ${actualDevice} (Setting: ${deviceMode})\nViewport: ${window.innerWidth} x ${window.innerHeight} px`,
            type: 'output',
          });
        }
        break;

      case 'battery':
        newHistory.push({
          text: `Battery Level: ${batteryLevel}%\nStatus: Discharging (Good Health)\nPower Governor: adaptive-schedutil`,
          type: 'output',
        });
        break;

      case 'whoami':
        newHistory.push({
          text: `UID: 1000 (${account.name} <${account.email}>)\nUniversal Auth Token: verified`,
          type: 'output',
        });
        break;

      case 'uname':
        newHistory.push({
          text: `Linux omni-universal 6.6.21-android15-gki #1 SMP PREEMPT GNU/Linux`,
          type: 'output',
        });
        break;

      case 'ls':
        newHistory.push({
          text: `bin/  dev/  etc/  home/  proc/  sdcard/  storage/  sys/  system/`,
          type: 'output',
        });
        break;

      case 'date':
        newHistory.push({
          text: new Date().toString(),
          type: 'output',
        });
        break;

      case 'clear':
        setHistory([]);
        setInput('');
        return;

      default:
        newHistory.push({
          text: `omni-sh: command not found: ${command}. Type "help" for valid commands.`,
          type: 'error',
        });
        break;
    }

    setHistory(newHistory);
    setInput('');
  };

  return (
    <div className="flex-1 w-full h-full bg-neutral-950 text-emerald-400 font-mono text-xs sm:text-sm p-4 flex flex-col select-text overflow-hidden">
      {/* Terminal Titlebar indicator */}
      <div className="pb-2 border-b border-neutral-800 text-neutral-500 text-xs flex justify-between select-none">
        <span>terminal://omni-root-session</span>
        <span>bash (x86_64)</span>
      </div>

      {/* Terminal Output */}
      <div className="flex-1 overflow-y-auto py-3 space-y-1">
        {history.map((h, i) => (
          <div
            key={i}
            className={`whitespace-pre-wrap leading-relaxed ${
              h.type === 'input'
                ? 'text-white font-semibold'
                : h.type === 'system'
                ? 'text-purple-400'
                : h.type === 'error'
                ? 'text-red-400'
                : 'text-emerald-400'
            }`}
          >
            {h.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Command Input Row */}
      <div className="pt-2 border-t border-neutral-800 flex items-center gap-2 select-none">
        <span className="text-purple-400 font-bold select-none">user@omni:~$</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCommand(input)}
          autoFocus
          className="flex-1 bg-transparent text-white font-mono text-xs sm:text-sm focus:outline-none"
        />
        <button
          onClick={() => handleCommand(input)}
          className="p-1 hover:text-white text-neutral-500 transition-colors"
        >
          <CornerDownLeft size={16} />
        </button>
      </div>
    </div>
  );
};

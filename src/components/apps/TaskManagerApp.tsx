import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Layers, 
  RefreshCw, 
  Search, 
  XOctagon, 
  Pause, 
  Play, 
  Sliders, 
  ShieldCheck, 
  Clock, 
  AlertTriangle,
  RotateCcw,
  Zap,
  Terminal,
  Server
} from 'lucide-react';
import { 
  processManager, 
  OsProcess, 
  ProcessDomain, 
  ProcessSignal, 
  DomainCgroupLimit,
  SystemProcessMetrics 
} from '../../services/processManager';
import { useSystem } from '../../context/SystemContext';
import { useWindow } from '../../context/WindowContext';
import { AppIntent } from '../../types/apps';

interface Props extends Partial<AppIntent> {
  intent?: AppIntent;
}

const DOMAIN_COLORS: Record<ProcessDomain, { badge: string; text: string; bg: string }> = {
  vault: { badge: 'bg-purple-950/80 border-purple-500/50 text-purple-300', text: 'text-purple-400', bg: 'bg-purple-500' },
  'tor-gw': { badge: 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300', text: 'text-emerald-400', bg: 'bg-emerald-500' },
  'anon-ws': { badge: 'bg-teal-950/80 border-teal-500/50 text-teal-300', text: 'text-teal-400', bg: 'bg-teal-500' },
  work: { badge: 'bg-amber-950/80 border-amber-500/50 text-amber-300', text: 'text-amber-400', bg: 'bg-amber-500' },
  dispos: { badge: 'bg-rose-950/80 border-rose-500/50 text-rose-300', text: 'text-rose-400', bg: 'bg-rose-500' },
  android: { badge: 'bg-blue-950/80 border-blue-500/50 text-blue-300', text: 'text-blue-400', bg: 'bg-blue-500' },
  host: { badge: 'bg-neutral-800 border-neutral-600 text-neutral-300', text: 'text-neutral-400', bg: 'bg-neutral-500' },
};

export const TaskManagerApp: React.FC<Props> = () => {
  const { addNotification } = useSystem();
  const { openApp } = useWindow();

  const [processes, setProcesses] = useState<OsProcess[]>([]);
  const [selectedPid, setSelectedPid] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'cpu' | 'mem' | 'pid' | 'name'>('cpu');
  const [sortAsc, setSortAsc] = useState(false);
  const [activeTab, setActiveTab] = useState<'processes' | 'cgroups' | 'resources'>('processes');
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [signalLog, setSignalLog] = useState<{ time: string; msg: string; type: 'kill' | 'stop' | 'cont' }[]>([]);

  // Refresh process list
  const refresh = async () => {
    const list = await processManager.getProcesses();
    setProcesses(list);
    setLastRefreshed(new Date());
  };

  useEffect(() => {
    refresh();
    if (!isAutoRefresh) return;
    const interval = setInterval(refresh, 2000);
    return () => clearInterval(interval);
  }, [isAutoRefresh]);

  const metrics: SystemProcessMetrics = useMemo(() => {
    return processManager.calculateMetrics(processes);
  }, [processes]);

  const domainLimits: DomainCgroupLimit[] = useMemo(() => {
    return processManager.getDomainLimits();
  }, []);

  const selectedProcess = useMemo(() => {
    return processes.find(p => p.pid === selectedPid) || null;
  }, [processes, selectedPid]);

  const filteredProcesses = useMemo(() => {
    return processes
      .filter(p => {
        const matchesQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.command.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.pid.toString().includes(searchQuery);
        const matchesDomain = domainFilter === 'all' || p.domain === domainFilter;
        return matchesQuery && matchesDomain;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'cpu') diff = b.cpu - a.cpu;
        else if (sortBy === 'mem') diff = b.memMb - a.memMb;
        else if (sortBy === 'pid') diff = b.pid - a.pid;
        else if (sortBy === 'name') diff = a.name.localeCompare(b.name);
        return sortAsc ? -diff : diff;
      });
  }, [processes, searchQuery, domainFilter, sortBy, sortAsc]);

  const handleSendSignal = async (signal: ProcessSignal) => {
    if (!selectedProcess) return;
    const res = await processManager.sendSignal(selectedProcess.pid, signal);
    setSignalLog(prev => [
      {
        time: new Date().toLocaleTimeString(),
        msg: `${signal} → ${selectedProcess.name} (PID ${selectedProcess.pid}): ${res.message}`,
        type: signal === 'SIGKILL' || signal === 'SIGTERM' ? 'kill' : signal === 'SIGSTOP' ? 'stop' : 'cont',
      },
      ...prev.slice(0, 15),
    ]);

    addNotification({
      appId: 'system',
      appName: 'Task Manager',
      title: `${signal} Sent`,
      body: res.message,
    });

    if (signal === 'SIGKILL' || signal === 'SIGTERM') {
      setSelectedPid(null);
    }
    await refresh();
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-neutral-950 text-white select-none overflow-hidden">
      {/* Top Banner / System Resource Overview */}
      <div className="bg-neutral-900/90 border-b border-neutral-800 p-3 sm:p-4 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-700 flex items-center justify-center text-white shadow-md">
              <Activity size={18} />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                LibreDroid Task Manager
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono">
                  cgroup v2
                </span>
              </h1>
              <p className="text-[11px] text-neutral-400">
                Host Kernel & Domain Container Process Monitor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                isAutoRefresh
                  ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/60'
                  : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              {isAutoRefresh ? <Pause size={12} /> : <Play size={12} />}
              <span className="hidden sm:inline">{isAutoRefresh ? 'Live (2s)' : 'Paused'}</span>
            </button>

            <button
              onClick={refresh}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
              title="Refresh now"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Resource Gauges Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* CPU Card */}
          <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] text-neutral-400">
              <span className="flex items-center gap-1">
                <Cpu size={13} className="text-cyan-400" /> CPU Load
              </span>
              <span className="font-mono font-bold text-white">{metrics.totalCpuPercent}%</span>
            </div>
            <div className="w-full bg-neutral-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  metrics.totalCpuPercent > 80 ? 'bg-rose-500' : metrics.totalCpuPercent > 50 ? 'bg-amber-500' : 'bg-cyan-500'
                }`}
                style={{ width: `${Math.min(100, metrics.totalCpuPercent)}%` }}
              />
            </div>
          </div>

          {/* Memory Card */}
          <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] text-neutral-400">
              <span className="flex items-center gap-1">
                <HardDrive size={13} className="text-emerald-400" /> RAM Used
              </span>
              <span className="font-mono font-bold text-white">
                {Math.round(metrics.usedMemoryMb / 1024 * 10) / 10} / {Math.round(metrics.totalMemoryMb / 1024)} GB
              </span>
            </div>
            <div className="w-full bg-neutral-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (metrics.usedMemoryMb / metrics.totalMemoryMb) * 100)}%` }}
              />
            </div>
          </div>

          {/* Tasks Card */}
          <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] text-neutral-400">
              <span className="flex items-center gap-1">
                <Layers size={13} className="text-purple-400" /> Active Tasks
              </span>
              <span className="font-mono font-bold text-white">{metrics.tasksTotal}</span>
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-neutral-400">
              <span className="text-emerald-400 font-mono">{metrics.tasksRunning} running</span>
              <span>·</span>
              <span className="text-neutral-400 font-mono">{metrics.tasksSleeping} sleeping</span>
            </div>
          </div>

          {/* Domains Card */}
          <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] text-neutral-400">
              <span className="flex items-center gap-1">
                <ShieldCheck size={13} className="text-amber-400" /> Domains
              </span>
              <span className="font-mono font-bold text-emerald-400">6 Enforced</span>
            </div>
            <div className="flex items-center gap-1 mt-1.5">
              {Object.keys(DOMAIN_COLORS).map(dom => (
                <div 
                  key={dom} 
                  className={`w-2 h-2 rounded-full ${DOMAIN_COLORS[dom as ProcessDomain].bg}`}
                  title={`Domain: ${dom}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-neutral-800/60 text-xs">
          <button
            onClick={() => setActiveTab('processes')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'processes'
                ? 'bg-neutral-800 text-white border border-neutral-700'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Processes ({filteredProcesses.length})
          </button>
          <button
            onClick={() => setActiveTab('cgroups')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'cgroups'
                ? 'bg-neutral-800 text-white border border-neutral-700'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Cgroup v2 Domains ({domainLimits.length})
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'resources'
                ? 'bg-neutral-800 text-white border border-neutral-700'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Signal Activity
          </button>
        </div>
      </div>

      {/* Main Body */}
      {activeTab === 'processes' && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Filter & Action Toolbar */}
          <div className="p-2 sm:p-3 bg-neutral-900/50 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <div className="relative flex-1 max-w-sm">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Filter by name, PID, or command..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-600"
                />
              </div>

              {/* Domain Filter Pills */}
              <select
                value={domainFilter}
                onChange={e => setDomainFilter(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-none focus:border-cyan-600"
              >
                <option value="all">All Domains</option>
                <option value="host">Host</option>
                <option value="vault">seL4 Vault</option>
                <option value="tor-gw">Tor Gateway</option>
                <option value="anon-ws">Anon Workstation</option>
                <option value="work">Work Debian</option>
                <option value="dispos">Disposable RAM</option>
                <option value="android">Waydroid Android</option>
              </select>
            </div>

            {/* Selected Process Action Bar */}
            {selectedProcess && (
              <div className="flex items-center gap-1.5 bg-neutral-950 border border-neutral-700 rounded-lg p-1 animate-in fade-in">
                <span className="text-[11px] font-mono text-cyan-400 px-2 font-bold truncate max-w-[120px]">
                  PID {selectedProcess.pid}
                </span>

                <button
                  onClick={() => handleSendSignal('SIGTERM')}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-rose-950/80 border border-rose-700/60 hover:bg-rose-900 text-rose-300 text-xs font-medium transition-colors"
                  title="Graceful termination (SIGTERM)"
                >
                  <XOctagon size={12} />
                  <span>End Task</span>
                </button>

                <button
                  onClick={() => handleSendSignal('SIGKILL')}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-red-950/80 border border-red-700/60 hover:bg-red-900 text-red-200 text-xs font-medium transition-colors"
                  title="Force Kill immediately (SIGKILL)"
                >
                  <span>Kill -9</span>
                </button>

                <button
                  onClick={() => handleSendSignal(selectedProcess.state === 'stopped' ? 'SIGCONT' : 'SIGSTOP')}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors"
                  title={selectedProcess.state === 'stopped' ? 'Resume process (SIGCONT)' : 'Freeze process (SIGSTOP)'}
                >
                  {selectedProcess.state === 'stopped' ? <Play size={12} /> : <Pause size={12} />}
                  <span>{selectedProcess.state === 'stopped' ? 'Resume' : 'Freeze'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Processes Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-neutral-900 text-neutral-400 sticky top-0 border-b border-neutral-800 z-10">
                <tr>
                  <th 
                    onClick={() => { setSortBy('pid'); setSortAsc(!sortAsc); }}
                    className="p-2.5 font-semibold cursor-pointer hover:text-white"
                  >
                    PID {sortBy === 'pid' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th 
                    onClick={() => { setSortBy('name'); setSortAsc(!sortAsc); }}
                    className="p-2.5 font-semibold cursor-pointer hover:text-white"
                  >
                    Process Name {sortBy === 'name' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th className="p-2.5 font-semibold">Domain</th>
                  <th 
                    onClick={() => { setSortBy('cpu'); setSortAsc(!sortAsc); }}
                    className="p-2.5 font-semibold cursor-pointer hover:text-white text-right"
                  >
                    CPU % {sortBy === 'cpu' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th 
                    onClick={() => { setSortBy('mem'); setSortAsc(!sortAsc); }}
                    className="p-2.5 font-semibold cursor-pointer hover:text-white text-right"
                  >
                    Memory {sortBy === 'mem' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th className="p-2.5 font-semibold text-center">State</th>
                  <th className="p-2.5 font-semibold hidden sm:table-cell">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {filteredProcesses.map(proc => {
                  const isSelected = selectedPid === proc.pid;
                  const domConfig = DOMAIN_COLORS[proc.domain] || DOMAIN_COLORS.host;

                  return (
                    <tr
                      key={proc.pid}
                      onClick={() => setSelectedPid(isSelected ? null : proc.pid)}
                      className={`cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-cyan-950/40 text-cyan-200 border-l-2 border-cyan-400' 
                          : 'hover:bg-neutral-900/60'
                      }`}
                    >
                      <td className="p-2.5 font-mono text-neutral-400">{proc.pid}</td>
                      <td className="p-2.5 font-medium text-white">
                        <div className="flex flex-col">
                          <span>{proc.name}</span>
                          <span className="text-[10px] text-neutral-500 font-mono truncate max-w-xs sm:max-w-md">
                            {proc.command}
                          </span>
                        </div>
                      </td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${domConfig.badge}`}>
                          {proc.domain}
                        </span>
                      </td>
                      <td className="p-2.5 text-right font-mono font-medium">
                        <span className={proc.cpu > 2 ? 'text-amber-400 font-bold' : 'text-neutral-300'}>
                          {proc.cpu.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-2.5 text-right font-mono text-neutral-300">
                        {proc.memMb} MB
                      </td>
                      <td className="p-2.5 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase ${
                          proc.state === 'running' 
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                            : proc.state === 'stopped' 
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-neutral-800 text-neutral-400'
                        }`}>
                          {proc.state}
                        </span>
                      </td>
                      <td className="p-2.5 text-neutral-400 hidden sm:table-cell font-mono">
                        {proc.user}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cgroups View */}
      {activeTab === 'cgroups' && (
        <div className="flex-1 p-4 overflow-auto">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
              <h2 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-400" />
                Kernel Cgroup v2 Isolation Hierarchy
              </h2>
              <p className="text-xs text-neutral-400 mb-4">
                MemoryMax, CPUQuota, and task limits enforced by systemd-nspawn on each domain rootfs.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {domainLimits.map(dom => {
                  const domConfig = DOMAIN_COLORS[dom.domain];
                  return (
                    <div 
                      key={dom.domain}
                      className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono border ${domConfig.badge}`}>
                            {dom.domain}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400 uppercase font-semibold">
                            {dom.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 mb-3">{dom.securityLevel}</p>

                        <div className="grid grid-cols-3 gap-2 text-center text-xs bg-neutral-900/60 p-2 rounded-lg font-mono">
                          <div>
                            <span className="text-[10px] text-neutral-500 block">Memory Limit</span>
                            <span className="font-bold text-white">{dom.memoryMax}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-neutral-500 block">CPU Quota</span>
                            <span className="font-bold text-white">{dom.cpuQuota}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-neutral-500 block">Tasks Max</span>
                            <span className="font-bold text-white">{dom.tasksMax}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-neutral-900 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-neutral-400">
                          Active tasks: <strong className="text-white font-mono">{dom.activeTasks}</strong>
                        </span>
                        {dom.domain === 'dispos' && (
                          <span className="text-[10px] text-rose-400 font-mono">
                            Volatile RAM-overlay
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Signal Log View */}
      {activeTab === 'resources' && (
        <div className="flex-1 p-4 overflow-auto">
          <div className="max-w-3xl mx-auto bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Terminal size={16} className="text-cyan-400" />
              Process Signal Audit Trail
            </h2>
            <p className="text-xs text-neutral-400 mb-4">
              Log of IPC signals, process terminations, and cgroup interventions.
            </p>

            {signalLog.length === 0 ? (
              <div className="text-center py-8 text-neutral-500 text-xs font-mono">
                No process intervention signals recorded this session. Select a process and click "End Task" or "Freeze" to deliver signals.
              </div>
            ) : (
              <div className="space-y-2">
                {signalLog.map((entry, idx) => (
                  <div 
                    key={idx}
                    className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs font-mono"
                  >
                    <span className="text-neutral-400">{entry.time}</span>
                    <span className={`font-medium ${
                      entry.type === 'kill' ? 'text-rose-400' : entry.type === 'stop' ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {entry.msg}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

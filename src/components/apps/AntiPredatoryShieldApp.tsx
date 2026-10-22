import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Ban, 
  BellOff, 
  EyeOff, 
  BatteryCharging, 
  CreditCard, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  X, 
  Lock, 
  Layers, 
  RefreshCw,
  Radio,
  UserCheck,
  Fingerprint,
  Cpu,
  Zap,
  Copy,
  Check
} from 'lucide-react';
import { 
  NeutralizedAction, 
  AppFairnessProfile, 
  ManagedSubscription,
  BurnerIdentity,
  INITIAL_NEUTRALIZED_ACTIONS,
  DEFAULT_APP_FAIRNESS_PROFILES,
  DEFAULT_MANAGED_SUBSCRIPTIONS,
  generateBurnerIdentity
} from '../../services/antiPredatoryEngine';
import {
  PoisonedBeaconEvent,
  TelemetryDefenseSettings,
  INITIAL_POISONED_BEACONS,
  getTelemetrySettings,
  updateTelemetrySettings,
  generateSyntheticTelemetryPayload
} from '../../services/telemetryPoisoningEngine';
import { useSystem } from '../../context/SystemContext';

export const AntiPredatoryShieldApp: React.FC = () => {
  const { addNotification } = useSystem();
  const [activeTab, setActiveTab] = useState<'neutralized' | 'telemetry' | 'burner' | 'toggles' | 'subscriptions' | 'audit'>('neutralized');
  const [actions, setActions] = useState<NeutralizedAction[]>(INITIAL_NEUTRALIZED_ACTIONS);
  const [subscriptions, setSubscriptions] = useState<ManagedSubscription[]>(DEFAULT_MANAGED_SUBSCRIPTIONS);
  const [beacons, setBeacons] = useState<PoisonedBeaconEvent[]>(INITIAL_POISONED_BEACONS);
  const [telemetrySettings, setTelemetrySettings] = useState<TelemetryDefenseSettings>(getTelemetrySettings());
  const [burnerIdentities, setBurnerIdentities] = useState<BurnerIdentity[]>([
    generateBurnerIdentity('Social Video Forced Registration'),
    generateBurnerIdentity('News Article Paywall Bypass'),
  ]);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Anti-Predatory OS Shields
  const [shields, setShields] = useState({
    antiFomoNotifications: true,
    permissionVirtualizer: true,
    clipboardGuard: true,
    wakeLockKiller: true,
    deceptiveAdBlocker: true,
    antiGamblingMechanics: true,
    forcedTelemetryPoisoner: true,
    reviewNagDefuser: true,
  });

  const toggleShield = (key: keyof typeof shields) => {
    setShields((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleToggleTelemetrySetting = (key: keyof TelemetryDefenseSettings) => {
    const updated = updateTelemetrySettings({ [key]: !telemetrySettings[key] });
    setTelemetrySettings(updated);
  };

  const handleSimulatePoisoning = () => {
    const newBeacon = generateSyntheticTelemetryPayload('Targeted Commercial App', 'Google Firebase / Analytics');
    setBeacons((prev) => [newBeacon, ...prev]);
    addNotification({
      appId: 'predatory_shield',
      appName: 'Anti-Predatory Shield',
      title: 'False Telemetry Fed to Tracker',
      body: 'App forced tracking consent. LibreDroid emitted synthetic garbage data & returned HTTP 200 OK.',
    });
  };

  const handleCreateBurnerIdentity = () => {
    const fresh = generateBurnerIdentity('Disposable Account Paywall Bypass');
    setBurnerIdentities((prev) => [fresh, ...prev]);
    addNotification({
      appId: 'predatory_shield',
      appName: 'Anti-Predatory Shield',
      title: 'Burner Identity Created',
      body: `Alias ${fresh.aliasEmail} ready for disposable one-time registration.`,
    });
  };

  const cancelSubscription = (id: string) => {
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'cancelled' } : s))
    );
    const sub = subscriptions.find((s) => s.id === id);
    addNotification({
      appId: 'predatory_shield',
      appName: 'Anti-Predatory Shield',
      title: 'Subscription Cancelled Instantly',
      body: `Recurring billing for ${sub?.appName} was revoked via OS 1-click authority. No dark patterns permitted.`,
    });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedToken(id);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-neutral-900 text-white select-none overflow-hidden font-sans">
      {/* Top Header */}
      <div className="p-3.5 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-rose-500 via-pink-600 to-red-600 text-white rounded-2xl shadow-lg">
            <ShieldAlert size={20} />
          </div>
          <div>
            <div className="text-sm font-bold flex items-center gap-2">
              Anti-Predatory Shield
              <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-mono">
                Active Defense Active
              </span>
            </div>
            <div className="text-[11px] text-neutral-400">
              Countermeasures against dark patterns, forced telemetry, fake urgency & predatory monetization
            </div>
          </div>
        </div>

        {/* Global Protection Health Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-xs text-emerald-400">
          <ShieldCheck size={14} />
          <span>Active Agency Protection: 100%</span>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-1.5 px-4 py-2 bg-neutral-950/80 border-b border-neutral-800 text-xs overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('neutralized')}
          className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
            activeTab === 'neutralized' ? 'bg-rose-600 text-white shadow' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Intercepted Attacks ({actions.length})
        </button>
        <button
          onClick={() => setActiveTab('telemetry')}
          className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap flex items-center gap-1.5 transition-colors ${
            activeTab === 'telemetry' ? 'bg-rose-600 text-white shadow' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Radio size={13} className="text-amber-400" />
          <span>False Telemetry Feeder ({beacons.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('burner')}
          className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap flex items-center gap-1.5 transition-colors ${
            activeTab === 'burner' ? 'bg-rose-600 text-white shadow' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <UserCheck size={13} className="text-cyan-400" />
          <span>Burner Identities ({burnerIdentities.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
            activeTab === 'subscriptions' ? 'bg-rose-600 text-white shadow' : 'text-neutral-400 hover:text-white'
          }`}
        >
          1-Click Subscription Killer
        </button>
        <button
          onClick={() => setActiveTab('toggles')}
          className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
            activeTab === 'toggles' ? 'bg-rose-600 text-white shadow' : 'text-neutral-400 hover:text-white'
          }`}
        >
          OS Defense Shields
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
            activeTab === 'audit' ? 'bg-rose-600 text-white shadow' : 'text-neutral-400 hover:text-white'
          }`}
        >
          App Ethical Audit
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        {/* TAB 1: INTERCEPTED ATTACKS & DARK PATTERNS */}
        {activeTab === 'neutralized' && (
          <div className="space-y-4 max-w-3xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Live Interception Log</h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Dark patterns, disguised close buttons, coercive review prompts, and fake countdowns intercepted in real time.
                </p>
              </div>

              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                0 Leaked User Actions
              </span>
            </div>

            <div className="space-y-2.5">
              {actions.map((act) => (
                <div
                  key={act.id}
                  className="p-3.5 bg-neutral-850 border border-neutral-800 rounded-2xl flex items-start justify-between gap-3 hover:border-neutral-700 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl mt-0.5 shrink-0">
                      <Ban size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>{act.title}</span>
                        <span className="text-[10px] text-rose-300 bg-rose-500/20 px-2 py-0.2 rounded font-mono">
                          {act.app}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-300 mt-1 leading-relaxed">{act.detail}</p>
                      <div className="flex items-center gap-3 text-[10px] text-neutral-500 font-mono mt-2">
                        <span className="text-emerald-400">Neutralized by: {act.neutralizedBy}</span>
                        <span>•</span>
                        <span>{act.timestamp}</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-neutral-900 border border-emerald-500/30 px-2 py-1 rounded-lg shrink-0">
                    BLOCKED
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: FALSE TELEMETRY FEEDER & HONEYTOKEN PROXY */}
        {activeTab === 'telemetry' && (
          <div className="space-y-5 max-w-3xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Feeding False Telemetry if Coerced to Accept</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-mono border border-amber-500/30">
                    Synthetic Noise Engine
                  </span>
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  When commercial apps demand mandatory consent or refuse to operate without tracking SDKs, LibreDroid does not crash: it feeds high-entropy randomized garbage data while returning HTTP 200 OK.
                </p>
              </div>

              <button
                onClick={handleSimulatePoisoning}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow shrink-0 transition-colors"
              >
                <Zap size={14} />
                <span>Test Poisoning</span>
              </button>
            </div>

            {/* Synthetic Device Fingerprint Status */}
            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-3">
              <div className="text-xs font-bold text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Fingerprint size={16} className="text-rose-400" />
                  <span>Emulated Synthetic Fingerprint Parameters (Active)</span>
                </span>
                <span className="text-emerald-400 font-mono text-[11px]">Rotates per Cold Boot</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono">
                <div className="p-2.5 bg-neutral-900 rounded-xl border border-neutral-850">
                  <span className="text-neutral-400 block text-[10px]">Spoofed AAID / IDFA:</span>
                  <span className="text-amber-300 font-bold truncate block">00000000-0000-0000-0000-000000000000</span>
                </div>
                <div className="p-2.5 bg-neutral-900 rounded-xl border border-neutral-850">
                  <span className="text-neutral-400 block text-[10px]">Synthetic Battery Level:</span>
                  <span className="text-emerald-400 font-bold">83% Constant (Neutralizing drain profiling)</span>
                </div>
                <div className="p-2.5 bg-neutral-900 rounded-xl border border-neutral-850">
                  <span className="text-neutral-400 block text-[10px]">Carrier Network:</span>
                  <span className="text-cyan-300 font-bold">Sovereign Mesh Telecom (MCC 999)</span>
                </div>
                <div className="p-2.5 bg-neutral-900 rounded-xl border border-neutral-850">
                  <span className="text-neutral-400 block text-[10px]">Location Telemetry:</span>
                  <span className="text-purple-300 font-bold">Null Island (0.0000, 0.0000) Coarse Jitter</span>
                </div>
              </div>
            </div>

            {/* Live Poisoned Beacons */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
                <span>Intercepted & Poisoned Tracking Beacons</span>
                <span className="text-rose-400 font-mono">{beacons.length} Trapped</span>
              </div>

              {beacons.map((beacon) => (
                <div key={beacon.id} className="p-3.5 bg-neutral-850 border border-neutral-800 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{beacon.app}</span>
                      <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.2 rounded font-mono">
                        {beacon.trackerSdk}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {beacon.returnedStatus}
                    </span>
                  </div>

                  <div className="text-[11px] text-neutral-300 font-mono bg-neutral-950 p-2 rounded-xl border border-neutral-850 space-y-1">
                    <div className="text-neutral-400">Target: <span className="text-white">{beacon.destination}</span></div>
                    <div className="text-neutral-400">Original Request: <span className="text-red-400">{beacon.originalAttempt}</span></div>
                    <div className="text-neutral-400">Poisoned Payload Injected: <span className="text-amber-300">{beacon.poisonedPayload}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: BURNER IDENTITIES (FORCED PAYWALL / LOGIN BYPASS) */}
        {activeTab === 'burner' && (
          <div className="space-y-5 max-w-3xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Disposable Burner Identities</h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Bypass coercive paywalls, forced newsletter modals, and mandatory sign-up traps without leaking your true email or identity.
                </p>
              </div>

              <button
                onClick={handleCreateBurnerIdentity}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow"
              >
                <UserCheck size={14} />
                <span>Generate Burner Identity</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {burnerIdentities.map((burner, i) => (
                <div key={i} className="p-4 bg-neutral-850 border border-neutral-800 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{burner.fullName}</span>
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-mono">
                      Active Alias
                    </span>
                  </div>

                  <div className="p-2.5 bg-neutral-900 rounded-xl border border-neutral-800 text-xs font-mono space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400 text-[10px]">Alias Email:</span>
                      <button
                        onClick={() => copyToClipboard(burner.aliasEmail, burner.aliasEmail)}
                        className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                      >
                        {copiedToken === burner.aliasEmail ? <Check size={12} /> : <Copy size={12} />}
                        <span>{burner.aliasEmail}</span>
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-neutral-400 text-[10px]">
                      <span>Auth Token:</span>
                      <span className="text-neutral-300">{burner.token}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-neutral-400">
                    Purpose: <span className="text-white">{burner.purpose}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: 1-CLICK IRREVOCABLE SUBSCRIPTION KILLER */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-5 max-w-2xl">
            <div>
              <h2 className="text-base font-bold text-white">1-Click Irrevocable Subscriptions</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Eliminates "Roach Motel" dark patterns where companies make it effortless to subscribe but force you through 10 cancellation pages, phone calls, or surveys. In LibreDroid, the OS holds root authority to terminate any recurring payment with 1 click.
              </p>
            </div>

            <div className="space-y-3">
              {subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-4 bg-neutral-850 border border-neutral-700 rounded-2xl flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-neutral-800 rounded-xl text-neutral-300">
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white flex items-center gap-2">
                        <span>{sub.appName}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                          sub.status === 'active' 
                            ? 'bg-emerald-500/20 text-emerald-300' 
                            : 'bg-neutral-700 text-neutral-400'
                        }`}>
                          {sub.status === 'active' ? 'Active' : 'Cancelled'}
                        </span>
                      </div>
                      <div className="text-xs text-neutral-400 mt-0.5">
                        {sub.planName} • <span className="text-white font-mono">{sub.amount}</span>
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">
                        Renews on {sub.renewsOn}
                      </div>
                    </div>
                  </div>

                  {sub.status === 'active' ? (
                    <button
                      onClick={() => cancelSubscription(sub.id)}
                      className="px-3.5 py-2 bg-rose-600/30 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-500/40 rounded-xl text-xs font-semibold transition-all shrink-0"
                    >
                      Instant 1-Click Cancel
                    </button>
                  ) : (
                    <span className="text-xs text-neutral-500 font-mono shrink-0 flex items-center gap-1">
                      <CheckCircle2 size={14} className="text-emerald-400" />
                      <span>Revoked</span>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: OS DEFENSE SHIELDS */}
        {activeTab === 'toggles' && (
          <div className="space-y-4 max-w-2xl">
            <h2 className="text-base font-bold text-white">Active Defense Shields</h2>
            <div className="space-y-2.5">
              {[
                {
                  key: 'forcedTelemetryPoisoner',
                  title: 'Mandatory Telemetry Consent Poisoner',
                  desc: 'If an app coerces consent before allowing launch, feed randomized synthetic telemetry and return HTTP 200 OK.',
                  icon: Radio,
                },
                {
                  key: 'reviewNagDefuser',
                  title: 'Coercive Rating & Review Defuser',
                  desc: 'Traps 5-star review request dialogs, auto-answers with dummy acknowledgment without opening any store.',
                  icon: Sparkles,
                },
                {
                  key: 'antiGamblingMechanics',
                  title: 'Anti-Gacha / Loot Box Defense',
                  desc: 'Disables variable-ratio psychological reinforcement hooks and flags microtransaction gambling in games.',
                  icon: Ban,
                },
                {
                  key: 'antiFomoNotifications',
                  title: 'Anti-FOMO Push Notification Shield',
                  desc: 'Filters artificial countdowns ("Hurry, your free gems expire in 5m!") and streak pressure hooks.',
                  icon: BellOff,
                },
                {
                  key: 'permissionVirtualizer',
                  title: 'Permission Hostage Virtualizer',
                  desc: 'If an app crashes when contacts/storage are denied, feeds empty synthetic databases so the app continues running.',
                  icon: EyeOff,
                },
                {
                  key: 'clipboardGuard',
                  title: 'Zero-Trust Clipboard Scraper Blocker',
                  desc: 'Drops passive background reads of the system clipboard unless the user executes an explicit paste action.',
                  icon: Lock,
                },
              ].map((s) => {
                const Icon = s.icon;
                const isEnabled = (shields as any)[s.key];
                return (
                  <div
                    key={s.key}
                    onClick={() => toggleShield(s.key as any)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-4 ${
                      isEnabled ? 'bg-rose-950/20 border-rose-500/50' : 'bg-neutral-850 border-neutral-800 hover:bg-neutral-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-xl mt-0.5 ${isEnabled ? 'bg-rose-600/30 text-rose-300' : 'bg-neutral-700 text-neutral-400'}`}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">{s.title}</div>
                        <div className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">{s.desc}</div>
                      </div>
                    </div>

                    <div className={`w-11 h-6 rounded-full flex items-center p-1 transition-colors shrink-0 ${
                      isEnabled ? 'bg-rose-600 justify-end' : 'bg-neutral-700 justify-start'
                    }`}>
                      <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 6: APP ETHICAL AUDIT */}
        {activeTab === 'audit' && (
          <div className="space-y-4 max-w-2xl">
            <h2 className="text-base font-bold text-white">App Ethical Audit & Anti-Features Inspector</h2>
            <div className="space-y-3">
              {DEFAULT_APP_FAIRNESS_PROFILES.map((app) => (
                <div key={app.appId} className="p-3.5 bg-neutral-850 border border-neutral-700 rounded-2xl space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>{app.name}</span>
                        {app.isFoss && (
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                            FOSS Certified
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono">{app.appId}</div>
                    </div>

                    <div className={`w-7 h-7 rounded-xl font-bold font-mono text-xs flex items-center justify-center ${
                      app.grade.startsWith('A') 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}>
                      {app.grade}
                    </div>
                  </div>

                  <p className="text-[11px] text-neutral-300 bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800">
                    {app.recommendation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

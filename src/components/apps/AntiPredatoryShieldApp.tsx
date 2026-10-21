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
  RefreshCw 
} from 'lucide-react';
import { 
  NeutralizedAction, 
  AppFairnessProfile, 
  ManagedSubscription,
  INITIAL_NEUTRALIZED_ACTIONS,
  DEFAULT_APP_FAIRNESS_PROFILES,
  DEFAULT_MANAGED_SUBSCRIPTIONS
} from '../../services/antiPredatoryEngine';
import { useSystem } from '../../context/SystemContext';

export const AntiPredatoryShieldApp: React.FC = () => {
  const { addNotification } = useSystem();
  const [activeTab, setActiveTab] = useState<'neutralized' | 'toggles' | 'subscriptions' | 'audit'>('neutralized');
  const [actions, setActions] = useState<NeutralizedAction[]>(INITIAL_NEUTRALIZED_ACTIONS);
  const [subscriptions, setSubscriptions] = useState<ManagedSubscription[]>(DEFAULT_MANAGED_SUBSCRIPTIONS);

  // Anti-Predatory OS Shields
  const [shields, setShields] = useState({
    antiFomoNotifications: true,
    permissionVirtualizer: true,
    clipboardGuard: true,
    wakeLockKiller: true,
    deceptiveAdBlocker: true,
    antiGamblingMechanics: true,
  });

  const toggleShield = (key: keyof typeof shields) => {
    setShields((prev) => ({ ...prev, [key]: !prev[key] }));
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

  return (
    <div className="flex-1 w-full h-full flex flex-col sm:flex-row bg-neutral-900 text-white select-none overflow-hidden">
      {/* Sidebar Navigation */}
      <div className="w-full sm:w-60 bg-neutral-950 p-3 sm:p-4 border-b sm:border-b-0 sm:border-r border-neutral-800 flex sm:flex-col gap-1.5 shrink-0 overflow-x-auto">
        <div className="hidden sm:block text-xs font-bold uppercase tracking-wider text-rose-400 px-3 py-2 flex items-center gap-1.5">
          <ShieldAlert size={16} />
          <span>Anti-Predatory Shield</span>
        </div>

        {[
          { id: 'neutralized', label: 'Neutralized Attacks', icon: ShieldAlert, badge: actions.length },
          { id: 'toggles', label: 'Defensive Shields', icon: Ban },
          { id: 'subscriptions', label: '1-Click Subscriptions', icon: CreditCard, badge: subscriptions.filter(s => s.status === 'active').length },
          { id: 'audit', label: 'App Ethical Audit', icon: CheckCircle2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-medium transition-all shrink-0 ${
                isActive
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-850'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon size={16} />
                <span>{tab.label}</span>
              </div>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-white text-rose-600' : 'bg-neutral-800 text-neutral-300'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Panel Content */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        {/* TAB 1: NEUTRALIZED ATTACKS FEED */}
        {activeTab === 'neutralized' && (
          <div className="space-y-5 max-w-2xl">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 text-rose-300 rounded-full text-xs font-medium mb-2 border border-rose-500/30">
                <ShieldAlert size={14} />
                <span>Active Predatory Defense</span>
              </div>
              <h2 className="text-xl font-bold">Neutralized Predatory App Tactics</h2>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Modern mobile apps frequently use deceptive UI dark patterns, notification spam to manufacture FOMO, permission hostage-taking, and battery-draining wake-locks. LibreDroid systematically neutralizes these tactics at the OS runtime layer.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-neutral-800/60 rounded-2xl border border-neutral-700">
                <div className="text-xl font-bold text-rose-400 font-mono">{actions.length}</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">Attacks Neutralized</div>
              </div>
              <div className="p-3 bg-neutral-800/60 rounded-2xl border border-neutral-700">
                <div className="text-xl font-bold text-emerald-400 font-mono">0</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">Clipboard Leaks</div>
              </div>
              <div className="p-3 bg-neutral-800/60 rounded-2xl border border-neutral-700">
                <div className="text-xl font-bold text-cyan-400 font-mono">100%</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">Sandbox Enforced</div>
              </div>
            </div>

            {/* Live Interception List */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Recent Interception Activity
              </h3>

              {actions.map((act) => (
                <div
                  key={act.id}
                  className="p-3.5 bg-neutral-850 border border-neutral-700/80 rounded-2xl space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                      <span>{act.title}</span>
                    </span>
                    <span className="text-neutral-500 text-[11px] font-mono">{act.timestamp}</span>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">{act.detail}</p>
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-neutral-800 font-mono">
                    <span>App: <span className="text-rose-300">{act.app}</span></span>
                    <span className="text-emerald-400">Defended by: {act.neutralizedBy}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: DEFENSIVE SHIELDS */}
        {activeTab === 'toggles' && (
          <div className="space-y-5 max-w-2xl">
            <div>
              <h2 className="text-lg font-bold">OS-Level Anti-Predatory Defenses</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Configure runtime safeguards that intercept deceptive application behavior automatically.
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  key: 'antiFomoNotifications',
                  title: 'Attention & FOMO Quarantine',
                  desc: 'Automatically drops artificial urgency notifications ("Limited time only!", "Claim free coins!", "Your streak will die!").',
                  icon: BellOff,
                },
                {
                  key: 'permissionVirtualizer',
                  title: 'Permission Hostage Virtualizer',
                  desc: 'When an app refuses to launch without unnecessary permissions (e.g. flashlight demanding contacts), LibreDroid feeds it mock blank data so it runs without learning your private info.',
                  icon: EyeOff,
                },
                {
                  key: 'clipboardGuard',
                  title: 'Clipboard Snooping Shield',
                  desc: 'Prevents background apps from silently reading text, passwords, or crypto addresses copied to your clipboard.',
                  icon: Lock,
                },
                {
                  key: 'wakeLockKiller',
                  title: 'Parasitic Wake-Lock Terminator',
                  desc: 'Immediately suspends CPU wake-locks when apps are minimized to prevent stealth background crypto-mining and battery drain.',
                  icon: BatteryCharging,
                },
                {
                  key: 'deceptiveAdBlocker',
                  title: 'Deceptive Full-Screen Ad Blocker',
                  desc: 'Disables unskippable interstitial modals and fake "X" close buttons that trick users into clicking ad redirects.',
                  icon: Ban,
                },
              ].map((s) => {
                const Icon = s.icon;
                const isEnabled = (shields as any)[s.key];
                return (
                  <div
                    key={s.key}
                    onClick={() => toggleShield(s.key as any)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-4 ${
                      isEnabled
                        ? 'bg-rose-950/20 border-rose-500/50'
                        : 'bg-neutral-800/40 border-neutral-700/60 hover:bg-neutral-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-xl mt-0.5 ${isEnabled ? 'bg-rose-600/30 text-rose-300' : 'bg-neutral-700 text-neutral-400'}`}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{s.title}</div>
                        <div className="text-xs text-neutral-400 mt-0.5 leading-relaxed">{s.desc}</div>
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

        {/* TAB 3: 1-CLICK IRREVOCABLE SUBSCRIPTION MANAGER */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-5 max-w-2xl">
            <div>
              <h2 className="text-lg font-bold">1-Click Irrevocable Subscriptions</h2>
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
                    <div className="p-2.5 bg-neutral-750 rounded-xl text-neutral-300">
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

            <div className="p-4 bg-rose-950/20 border border-rose-500/30 rounded-2xl text-xs text-neutral-300 leading-relaxed">
              <span className="font-semibold text-rose-300 block mb-1">OS-Enforced Subscription Mandate:</span>
              Apps running in LibreDroid cannot enforce separate obscure cancellation URLs. Any payment initiated on the device must respect the system's one-click revocation signal immediately.
            </div>
          </div>
        )}

        {/* TAB 4: APP ETHICAL AUDIT */}
        {activeTab === 'audit' && (
          <div className="space-y-5 max-w-2xl">
            <div>
              <h2 className="text-lg font-bold">App Ethical Audit & Anti-Features Inspector</h2>
              <p className="text-xs text-neutral-400 mt-1">
                F-Droid style ethical auditing of installed packages. We rate each app based on respect for user agency, absence of dark patterns, and absence of gambling mechanics.
              </p>
            </div>

            <div className="space-y-3">
              {DEFAULT_APP_FAIRNESS_PROFILES.map((app) => (
                <div
                  key={app.appId}
                  className="p-4 bg-neutral-850 border border-neutral-700 rounded-2xl space-y-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{app.name}</span>
                        {app.isFoss && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                            FOSS Certified
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-neutral-400 font-mono mt-0.5">{app.appId}</div>
                    </div>

                    <div className={`w-8 h-8 rounded-xl font-bold font-mono text-sm flex items-center justify-center ${
                      app.grade.startsWith('A') 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}>
                      {app.grade}
                    </div>
                  </div>

                  <p className="text-xs text-neutral-300 leading-relaxed bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800">
                    {app.recommendation}
                  </p>

                  {app.antiFeatures.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">
                        Detected Predatory Anti-Features:
                      </span>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {app.antiFeatures.map((af, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-rose-950/60 text-rose-300 border border-rose-800/60 px-2 py-0.5 rounded-md"
                          >
                            ⚠️ {af}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

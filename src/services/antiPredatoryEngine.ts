export type PredatoryTacticType = 
  | 'dark_pattern' 
  | 'notification_spam' 
  | 'predatory_billing' 
  | 'parasitic_background' 
  | 'clipboard_snooping' 
  | 'permission_hostage' 
  | 'fake_countdown'
  | 'forced_telemetry'
  | 'forced_review_nag'
  | 'loot_box_gamble'
  | 'coerced_login';

export interface BurnerIdentity {
  aliasEmail: string;
  fullName: string;
  token: string;
  createdAt: string;
  purpose: string;
}

export interface NeutralizedAction {
  id: string;
  app: string;
  tactic: PredatoryTacticType;
  title: string;
  detail: string;
  timestamp: string;
  neutralizedBy: string;
}

export interface AppFairnessProfile {
  appId: string;
  name: string;
  grade: 'A+' | 'A' | 'B' | 'D' | 'F';
  isFoss: boolean;
  hasDarkPatterns: boolean;
  hasPredatoryAds: boolean;
  hasUnnecessaryPermissions: boolean;
  hasLootBoxesOrGambling: boolean;
  antiFeatures: string[];
  recommendation: string;
}

export interface ManagedSubscription {
  id: string;
  appName: string;
  planName: string;
  amount: string;
  renewsOn: string;
  status: 'active' | 'cancelled';
  cancelMethod: 'instant-1-click';
}

export const PREDATORY_KEYWORDS = [
  'limited time',
  'expires in',
  'act now',
  'claim your free',
  'your streak is dying',
  'exclusive deal',
  'dont miss out',
  'hurry',
  'loot box',
  'free gems',
  'spin the wheel',
];

export const INITIAL_NEUTRALIZED_ACTIONS: NeutralizedAction[] = [
  {
    id: 'na-0',
    app: 'Social Video Network',
    tactic: 'forced_telemetry',
    title: 'Forced Telemetry Intercepted & Poisoned',
    detail: 'App refused to boot without mandatory telemetry consent: Fed high-entropy synthetic dummy data; returned HTTP 200.',
    timestamp: 'Just now',
    neutralizedBy: 'Synthetic Telemetry Feeder',
  },
  {
    id: 'na-00',
    app: 'Commercial Note Editor',
    tactic: 'forced_review_nag',
    title: 'Coercive 5-Star Rating Nag Defused',
    detail: 'Trapped modal review prompt blocking document saving: Emulated fake 5-star submit token without touching store.',
    timestamp: '2 mins ago',
    neutralizedBy: 'Anti-Coercion Review Proxy',
  },
  {
    id: 'na-1',
    app: 'Sideloaded Free Game',
    tactic: 'notification_spam',
    title: 'Fake Urgency Push Blocked',
    detail: 'Detected artificial FOMO hook: "Hurry! Your 200 free energy expires in 10 minutes!"',
    timestamp: '4 mins ago',
    neutralizedBy: 'Notification Attention Guardian',
  },
  {
    id: 'na-2',
    app: 'Commercial Scanner APK',
    tactic: 'clipboard_snooping',
    title: 'Silent Clipboard Read Dropped',
    detail: 'Attempted to read clipboard without active paste input gesture.',
    timestamp: '18 mins ago',
    neutralizedBy: 'Clipboard Privacy Sandbox',
  },
  {
    id: 'na-3',
    app: 'Flashlight Utility',
    tactic: 'permission_hostage',
    title: 'Permission Hostage Neutralized',
    detail: 'App demanded android.permission.READ_CONTACTS before turning on flashlight. Fed spoofed empty sandbox.',
    timestamp: '1 hour ago',
    neutralizedBy: 'Permission Virtualizer',
  },
  {
    id: 'na-4',
    app: 'Video Player APK',
    tactic: 'parasitic_background',
    title: 'Background Wake-Lock Terminated',
    detail: 'Attempted to hold CPU wake-lock and drain battery while app window was minimized.',
    timestamp: '2 hours ago',
    neutralizedBy: 'Wake-Lock Sentinel',
  },
  {
    id: 'na-5',
    app: 'Social Media Web Wrapper',
    tactic: 'dark_pattern',
    title: 'Deceptive Full-Screen Interstitial Blocked',
    detail: 'Attempted to render unskippable overlay hiding Android back and home buttons.',
    timestamp: '3 hours ago',
    neutralizedBy: 'Navigation Overlay Shield',
  },
];

export const DEFAULT_APP_FAIRNESS_PROFILES: AppFairnessProfile[] = [
  {
    appId: 'org.videolan.vlc',
    name: 'VLC Media Player',
    grade: 'A+',
    isFoss: true,
    hasDarkPatterns: false,
    hasPredatoryAds: false,
    hasUnnecessaryPermissions: false,
    hasLootBoxesOrGambling: false,
    antiFeatures: [],
    recommendation: 'Exemplary ethical software. Zero ads, zero trackers, full offline functionality.',
  },
  {
    appId: 'org.schabi.newpipe',
    name: 'NewPipe',
    grade: 'A+',
    isFoss: true,
    hasDarkPatterns: false,
    hasPredatoryAds: false,
    hasUnnecessaryPermissions: false,
    hasLootBoxesOrGambling: false,
    antiFeatures: [],
    recommendation: 'Privacy-first media player. Disables surveillance algorithms and monetization traps.',
  },
  {
    appId: 'net.osmand.plus',
    name: 'OsmAnd Maps',
    grade: 'A',
    isFoss: true,
    hasDarkPatterns: false,
    hasPredatoryAds: false,
    hasUnnecessaryPermissions: false,
    hasLootBoxesOrGambling: false,
    antiFeatures: [],
    recommendation: 'Open source offline navigation. No location tracking or profiling.',
  },
  {
    appId: 'commercial.sample.adgame',
    name: 'Typical Freemium Game (Simulated)',
    grade: 'F',
    isFoss: false,
    hasDarkPatterns: true,
    hasPredatoryAds: true,
    hasUnnecessaryPermissions: true,
    hasLootBoxesOrGambling: true,
    antiFeatures: [
      'Gacha / Loot Box Gambling',
      'Artificial Wait Timers',
      'Deceptive "X" Close Buttons',
      'Unnecessary Contacts Permission',
      'Forced Account Registration',
    ],
    recommendation: 'Predatory practices detected. LibreDroid has isolated this package in a sandbox with mock data.',
  },
];

export const DEFAULT_MANAGED_SUBSCRIPTIONS: ManagedSubscription[] = [
  {
    id: 'sub-1',
    appName: 'Cloud Storage Tier Pro',
    planName: 'Annual Storage Backup',
    amount: '$2.99 / mo',
    renewsOn: 'Nov 14, 2026',
    status: 'active',
    cancelMethod: 'instant-1-click',
  },
  {
    id: 'sub-2',
    appName: 'News Reader Digest',
    planName: 'Digital Access Weekly',
    amount: '$0.99 / wk',
    renewsOn: 'Oct 28, 2026',
    status: 'active',
    cancelMethod: 'instant-1-click',
  },
];

export function generateBurnerIdentity(purpose: string = 'Forced Registration Bypass'): BurnerIdentity {
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const aliasEmail = `anon_user${randNum}@libredroid.mesh`;
  const firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Sam', 'Robin'];
  const lastNames = ['Smith', 'Vance', 'Sovereign', 'Miller', 'Hayes', 'North'];
  const fullName = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  const token = `LIBRE_AUTH_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;

  return {
    aliasEmail,
    fullName,
    token,
    createdAt: 'Just now',
    purpose,
  };
}

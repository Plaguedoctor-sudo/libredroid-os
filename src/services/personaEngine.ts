import { 
  UserPersonaProfile, 
  PersonaArchetype, 
  NavigationStyle, 
  UiDensity, 
  SecurityLevel, 
  AccentTheme 
} from '../types/persona';

export const PERSONA_PRESETS: Record<PersonaArchetype, UserPersonaProfile> = {
  everyday: {
    id: 'everyday',
    name: 'Everyday Mobile Migrator',
    tagline: 'Familiar, intuitive layout for daily communication, photos, notes, and browsing.',
    archetype: 'everyday',
    previousOs: 'android',
    navigationStyle: 'android_gestures',
    uiDensity: 'comfortable',
    securityLevel: 'balanced',
    accentTheme: 'emerald',
    wallpaperId: 'material-waves',
    darkPatternStrictness: 'medium',
    falseTelemetryEnabled: true,
    dummySensorsEnabled: false,
    burnerIdentityEnabled: true,
    homeApps: ['universal_ai', 'chats', 'phone', 'messages', 'browser', 'camera', 'photos', 'notes', 'files', 'store', 'settings'],
    dockApps: ['phone', 'chats', 'universal_ai', 'browser', 'camera'],
    showAtAGlance: true,
    showLiveThreatStats: false,
    searchEngine: 'duckduckgo',
    isSetupComplete: true,
  },

  privacy_purist: {
    id: 'privacy_purist',
    name: 'Privacy Defender & Activist',
    tagline: 'Maximum defensive armor: Tor routing, dummy sensor feeds, and active false telemetry.',
    archetype: 'privacy_purist',
    previousOs: 'linux',
    navigationStyle: 'android_buttons',
    uiDensity: 'comfortable',
    securityLevel: 'paranoid_airgap',
    accentTheme: 'cyan',
    wallpaperId: 'aurora-borealis',
    darkPatternStrictness: 'maximum',
    falseTelemetryEnabled: true,
    dummySensorsEnabled: true,
    burnerIdentityEnabled: true,
    homeApps: ['phone', 'messages', 'predatory_shield', 'security', 'hypervisor', 'linux_sandbox', 'store', 'browser', 'terminal', 'files'],
    dockApps: ['phone', 'messages', 'browser', 'security'],
    showAtAGlance: false,
    showLiveThreatStats: true,
    searchEngine: 'searxng',
    isSetupComplete: true,
  },

  developer: {
    id: 'developer',
    name: 'Power User & Developer',
    tagline: 'Terminal-first workflow, Linux container sandboxes, eBPF inspection, and multi-OS matrix.',
    archetype: 'developer',
    previousOs: 'linux',
    navigationStyle: 'desktop_taskbar',
    uiDensity: 'compact',
    securityLevel: 'hardened',
    accentTheme: 'violet',
    wallpaperId: 'deep-space',
    darkPatternStrictness: 'strict',
    falseTelemetryEnabled: true,
    dummySensorsEnabled: false,
    burnerIdentityEnabled: true,
    homeApps: ['phone', 'messages', 'terminal', 'linux_sandbox', 'hardware', 'hypervisor', 'darwin_bridge', 'apk_installer', 'files', 'notes'],
    dockApps: ['phone', 'messages', 'terminal', 'browser'],
    showAtAGlance: true,
    showLiveThreatStats: true,
    searchEngine: 'duckduckgo',
    isSetupComplete: true,
  },

  accessible: {
    id: 'accessible',
    name: 'Senior & Accessible Simplicity',
    tagline: 'Large high-contrast touch targets, simplified dialer/camera, and 100% scam neutralization.',
    archetype: 'accessible',
    previousOs: 'android',
    navigationStyle: 'android_buttons',
    uiDensity: 'accessible_large',
    securityLevel: 'hardened',
    accentTheme: 'amber',
    wallpaperId: 'cyber-dusk',
    darkPatternStrictness: 'maximum',
    falseTelemetryEnabled: true,
    dummySensorsEnabled: false,
    burnerIdentityEnabled: true,
    homeApps: ['phone', 'messages', 'camera', 'photos', 'clock', 'calculator', 'browser', 'notes', 'predatory_shield', 'settings'],
    dockApps: ['phone', 'messages', 'camera', 'browser'],
    showAtAGlance: true,
    showLiveThreatStats: false,
    searchEngine: 'duckduckgo',
    isSetupComplete: true,
  },

  creator_gamer: {
    id: 'creator_gamer',
    name: 'Creator & Performance Gamer',
    tagline: 'Maximized GPU acceleration, low-latency audio, anti-loot-box shields, and Darwin CocoaTouch.',
    archetype: 'creator_gamer',
    previousOs: 'windows',
    navigationStyle: 'android_gestures',
    uiDensity: 'comfortable',
    securityLevel: 'balanced',
    accentTheme: 'rose',
    wallpaperId: 'deep-space',
    darkPatternStrictness: 'strict',
    falseTelemetryEnabled: true,
    dummySensorsEnabled: false,
    burnerIdentityEnabled: false,
    homeApps: ['photos', 'camera', 'hardware', 'darwin_bridge', 'store', 'browser', 'files', 'notes'],
    dockApps: ['camera', 'photos', 'hardware', 'darwin_bridge'],
    showAtAGlance: true,
    showLiveThreatStats: false,
    searchEngine: 'brave',
    isSetupComplete: true,
  },

  custom: {
    id: 'custom',
    name: 'Custom Tailored OS',
    tagline: 'Hand-tuned operating parameters, modular privacy filters, and bespoke layout.',
    archetype: 'custom',
    previousOs: 'none',
    navigationStyle: 'android_gestures',
    uiDensity: 'comfortable',
    securityLevel: 'balanced',
    accentTheme: 'emerald',
    wallpaperId: 'material-waves',
    darkPatternStrictness: 'strict',
    falseTelemetryEnabled: true,
    dummySensorsEnabled: false,
    burnerIdentityEnabled: true,
    homeApps: ['store', 'browser', 'security', 'predatory_shield', 'files', 'notes', 'camera', 'settings'],
    dockApps: ['store', 'browser', 'security', 'settings'],
    showAtAGlance: true,
    showLiveThreatStats: false,
    searchEngine: 'duckduckgo',
    isSetupComplete: true,
  },
};

const STORAGE_KEY = 'libredroid_user_persona_v1';

export class PersonaEngine {
  private static instance: PersonaEngine;
  private currentProfile: UserPersonaProfile;

  private constructor() {
    this.currentProfile = this.loadStoredProfile();
  }

  public static getInstance(): PersonaEngine {
    if (!PersonaEngine.instance) {
      PersonaEngine.instance = new PersonaEngine();
    }
    return PersonaEngine.instance;
  }

  public getProfile(): UserPersonaProfile {
    return { ...this.currentProfile };
  }

  public setProfile(profile: Partial<UserPersonaProfile>): UserPersonaProfile {
    this.currentProfile = {
      ...this.currentProfile,
      ...profile,
      isSetupComplete: true,
    };
    this.saveProfile();
    return this.getProfile();
  }

  public applyArchetype(archetype: PersonaArchetype, overridePreviousOs?: UserPersonaProfile['previousOs']): UserPersonaProfile {
    const base = PERSONA_PRESETS[archetype];
    const prevOs = overridePreviousOs || base.previousOs;
    
    // Auto-adjust navigation style based on previous OS familiarity
    let navStyle = base.navigationStyle;
    if (prevOs === 'ios') {
      navStyle = 'ios_homebar';
    } else if (prevOs === 'windows' || prevOs === 'linux') {
      navStyle = 'desktop_taskbar';
    } else if (archetype === 'accessible') {
      navStyle = 'android_buttons';
    }

    this.currentProfile = {
      ...base,
      previousOs: prevOs,
      navigationStyle: navStyle,
      isSetupComplete: true,
    };
    this.saveProfile();
    return this.getProfile();
  }

  public hasStoredProfile(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem(STORAGE_KEY);
  }

  public resetToFactory(): UserPersonaProfile {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    this.currentProfile = { ...PERSONA_PRESETS.everyday, isSetupComplete: false };
    return this.getProfile();
  }

  private loadStoredProfile(): UserPersonaProfile {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          const homeApps = Array.isArray(parsed.homeApps) ? [...parsed.homeApps] : [...PERSONA_PRESETS.everyday.homeApps];
          if (!homeApps.includes('universal_ai')) homeApps.unshift('universal_ai');
          if (!homeApps.includes('chats')) homeApps.splice(1, 0, 'chats');
          if (!homeApps.includes('phone')) homeApps.splice(2, 0, 'phone');
          if (!homeApps.includes('messages')) homeApps.splice(3, 0, 'messages');

          const dockApps = Array.isArray(parsed.dockApps) ? [...parsed.dockApps] : [...PERSONA_PRESETS.everyday.dockApps];
          if (!dockApps.includes('chats') && dockApps.length < 5) dockApps.splice(1, 0, 'chats');
          if (!dockApps.includes('universal_ai') && dockApps.length < 5) dockApps.splice(2, 0, 'universal_ai');

          return { 
            ...PERSONA_PRESETS.everyday, 
            ...parsed, 
            homeApps, 
            dockApps, 
            isSetupComplete: true 
          };
        }
      } catch (err) {
        console.warn('Failed to parse saved persona profile:', err);
      }
    }
    // Default initial profile
    return {
      ...PERSONA_PRESETS.everyday,
      isSetupComplete: false,
    };
  }

  private saveProfile(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.currentProfile));
      } catch (err) {
        console.warn('Failed to save persona profile:', err);
      }
    }
  }
}

export const getAccentColorClasses = (theme: AccentTheme) => {
  switch (theme) {
    case 'emerald':
      return {
        primary: 'emerald-500',
        bg: 'bg-emerald-600',
        text: 'text-emerald-400',
        border: 'border-emerald-500/50',
        gradient: 'from-emerald-600 to-teal-700',
        glow: 'shadow-emerald-500/30',
        badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      };
    case 'cyan':
      return {
        primary: 'cyan-500',
        bg: 'bg-cyan-600',
        text: 'text-cyan-400',
        border: 'border-cyan-500/50',
        gradient: 'from-cyan-600 to-blue-700',
        glow: 'shadow-cyan-500/30',
        badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      };
    case 'amber':
      return {
        primary: 'amber-500',
        bg: 'bg-amber-600',
        text: 'text-amber-400',
        border: 'border-amber-500/50',
        gradient: 'from-amber-600 to-orange-700',
        glow: 'shadow-amber-500/30',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      };
    case 'violet':
      return {
        primary: 'purple-500',
        bg: 'bg-purple-600',
        text: 'text-purple-400',
        border: 'border-purple-500/50',
        gradient: 'from-purple-600 to-indigo-700',
        glow: 'shadow-purple-500/30',
        badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      };
    case 'rose':
      return {
        primary: 'rose-500',
        bg: 'bg-rose-600',
        text: 'text-rose-400',
        border: 'border-rose-500/50',
        gradient: 'from-rose-600 to-pink-700',
        glow: 'shadow-rose-500/30',
        badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      };
    case 'monochrome':
      return {
        primary: 'neutral-400',
        bg: 'bg-neutral-600',
        text: 'text-neutral-300',
        border: 'border-neutral-500/50',
        gradient: 'from-neutral-700 to-neutral-900',
        glow: 'shadow-neutral-500/20',
        badge: 'bg-neutral-800 text-neutral-200 border-neutral-600',
      };
  }
};

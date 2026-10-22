export type PersonaArchetype = 
  | 'everyday'        // "Everyday Mobile Migrator" - Familiar, clean, high convenience, friendly
  | 'privacy_purist'  // "Privacy Defender & Activist" - Tor, maximum dummy sensors, false telemetry, ephemeral
  | 'developer'       // "Power User & Developer" - Terminal, eBPF, package compilers, keyboard shortcuts
  | 'accessible'      // "Senior & Accessible Simplicity" - High contrast, large icons/text, 100% scam & fake ad shield
  | 'creator_gamer'   // "Media Creator & Gamer" - High-FPS GPU HAL, low-latency audio, anti-gacha/loot box spending locks
  | 'custom';         // Fully customized

export type NavigationStyle = 
  | 'android_gestures' // Android pill/back gesture
  | 'android_buttons'  // Classic 3-button (Back, Home, Recents)
  | 'ios_homebar'      // iOS swipe bar & bounce
  | 'desktop_taskbar'; // Windows / Linux start menu & taskbar

export type UiDensity = 'compact' | 'comfortable' | 'accessible_large';

export type SecurityLevel = 'balanced' | 'hardened' | 'paranoid_airgap';

export type AccentTheme = 'emerald' | 'cyan' | 'amber' | 'violet' | 'rose' | 'monochrome';

export interface UserPersonaProfile {
  id: string;
  name: string;
  tagline: string;
  archetype: PersonaArchetype;
  previousOs: 'android' | 'ios' | 'linux' | 'windows' | 'none';
  navigationStyle: NavigationStyle;
  uiDensity: UiDensity;
  securityLevel: SecurityLevel;
  accentTheme: AccentTheme;
  wallpaperId: string;
  darkPatternStrictness: 'medium' | 'strict' | 'maximum';
  falseTelemetryEnabled: boolean;
  dummySensorsEnabled: boolean;
  burnerIdentityEnabled: boolean;
  homeApps: string[]; // App IDs on home screen
  dockApps: string[]; // App IDs in bottom dock
  showAtAGlance: boolean;
  showLiveThreatStats: boolean;
  searchEngine: 'duckduckgo' | 'searxng' | 'brave' | 'startpage';
  isSetupComplete: boolean;
}

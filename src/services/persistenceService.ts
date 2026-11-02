import { UserPersonaProfile } from '../types/persona';
import { QuickSettingsState, SystemWallpaper } from '../types/system';

/**
 * PersistenceService handles the long-term storage of system and user state.
 * It uses localStorage for the web-shell but is designed to be swapped
 * for a filesystem-based store in the native OS build.
 */
export class PersistenceService {
  private static instance: PersistenceService;
  private readonly STORAGE_KEYS = {
    PERSONA: 'libredroid_persona',
    SYSTEM_SETTINGS: 'libredroid_system_settings',
    WALLPAPER: 'libredroid_wallpaper_id',
    KEYSTORE: 'libredroid_vault_keystore_v1',
    AUDIO_SETTINGS: 'libredroid_audio_settings_v1',
  };

  private constructor() {}

  public static getInstance(): PersistenceService {
    if (!PersistenceService.instance) {
      PersistenceService.instance = new PersistenceService();
    }
    return PersistenceService.instance;
  }

  // --- Persona Persistence ---

  public savePersona(persona: UserPersonaProfile): void {
    localStorage.setItem(this.STORAGE_KEYS.PERSONA, JSON.stringify(persona));
  }

  public loadPersona(): UserPersonaProfile | null {
    const data = localStorage.getItem(this.STORAGE_KEYS.PERSONA);
    return data ? JSON.parse(data) : null;
  }

  public clearPersona(): void {
    localStorage.removeItem(this.STORAGE_KEYS.PERSONA);
  }

  // --- System Settings Persistence ---

  public saveSystemSettings(settings: Partial<QuickSettingsState>): void {
    const current = this.loadSystemSettings() || {};
    const updated = { ...current, ...settings };
    localStorage.setItem(this.STORAGE_KEYS.SYSTEM_SETTINGS, JSON.stringify(updated));
  }

  public loadSystemSettings(): QuickSettingsState | null {
    const data = localStorage.getItem(this.STORAGE_KEYS.SYSTEM_SETTINGS);
    return data ? JSON.parse(data) : null;
  }

  public saveWallpaperId(id: string): void {
    localStorage.setItem(this.STORAGE_KEYS.WALLPAPER, id);
  }

  public loadWallpaperId(): string | null {
    return localStorage.getItem(this.STORAGE_KEYS.WALLPAPER);
  }

  // --- Keystore / Vault Persistence ---

  public saveKeystoreData<T>(data: T): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.KEYSTORE, JSON.stringify(data));
    } catch {}
  }

  public loadKeystoreData<T>(): T | null {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEYS.KEYSTORE);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  // --- Audio Settings Persistence ---

  public saveAudioSettings<T>(settings: T): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.AUDIO_SETTINGS, JSON.stringify(settings));
    } catch {}
  }

  public loadAudioSettings<T>(): T | null {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEYS.AUDIO_SETTINGS);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  public clearAll(): void {
    Object.values(this.STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  }

  // --- Generic Key-Value Persistence ---

  public getItem<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  public setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }
}

export const persistenceService = PersistenceService.getInstance();

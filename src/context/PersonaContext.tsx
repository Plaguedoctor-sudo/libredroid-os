import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  UserPersonaProfile, 
  PersonaArchetype, 
  AccentTheme 
} from '../types/persona';
import { 
  PersonaEngine, 
  PERSONA_PRESETS 
} from '../services/personaEngine';
import { useSystem, WALLPAPERS } from './SystemContext';
import { useSecurity } from './SecurityContext';

interface PersonaContextType {
  persona: UserPersonaProfile;
  updatePersona: (updates: Partial<UserPersonaProfile>) => void;
  applyPreset: (archetype: PersonaArchetype, previousOs?: UserPersonaProfile['previousOs']) => void;
  isWizardOpen: boolean;
  setIsWizardOpen: (open: boolean) => void;
  hasCompletedSetup: boolean;
  openWizard: () => void;
  resetPersona: () => void;
}

const PersonaContext = createContext<PersonaContextType | undefined>(undefined);

export const PersonaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const engine = PersonaEngine.getInstance();
  const [persona, setPersonaState] = useState<UserPersonaProfile>(engine.getProfile());
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const { setWallpaper } = useSystem();
  const { setLocationKillswitch, setUsbDataLock } = useSecurity();

  // If user has not completed initial setup, open wizard on first launch
  useEffect(() => {
    if (!persona.isSetupComplete) {
      // Auto-open wizard after brief mount delay
      const timer = setTimeout(() => {
        setIsWizardOpen(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [persona.isSetupComplete]);

  // Synchronize persona settings with system components
  useEffect(() => {
    // 1. Sync Wallpaper
    const targetWp = WALLPAPERS.find((w) => w.id === persona.wallpaperId);
    if (targetWp) {
      setWallpaper(targetWp);
    }

    // 2. Sync Security Killswitches if paranoid airgap
    if (persona.securityLevel === 'paranoid_airgap') {
      setLocationKillswitch(true);
      setUsbDataLock(true);
    }
  }, [persona]);

  const updatePersona = (updates: Partial<UserPersonaProfile>) => {
    const updated = engine.setProfile(updates);
    setPersonaState(updated);
  };

  const applyPreset = (archetype: PersonaArchetype, previousOs?: UserPersonaProfile['previousOs']) => {
    const updated = engine.applyArchetype(archetype, previousOs);
    setPersonaState(updated);
  };

  const resetPersona = () => {
    const reset = engine.resetToFactory();
    setPersonaState(reset);
    setIsWizardOpen(true);
  };

  const openWizard = () => {
    setIsWizardOpen(true);
  };

  return (
    <PersonaContext.Provider
      value={{
        persona,
        updatePersona,
        applyPreset,
        isWizardOpen,
        setIsWizardOpen,
        hasCompletedSetup: persona.isSetupComplete,
        openWizard,
        resetPersona,
      }}
    >
      {children}
    </PersonaContext.Provider>
  );
};

export const usePersona = () => {
  const context = useContext(PersonaContext);
  if (!context) throw new Error('usePersona must be used within PersonaProvider');
  return context;
};

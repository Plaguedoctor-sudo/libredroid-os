import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface KeyboardTarget {
  value: string;
  onChange: (val: string) => void;
  onEnter?: () => void;
  placeholder?: string;
}

interface KeyboardContextType {
  isKeyboardOpen: boolean;
  activeTarget: KeyboardTarget | null;
  openKeyboard: (target: KeyboardTarget) => void;
  closeKeyboard: () => void;
  typeCharacter: (char: string) => void;
  deleteCharacter: () => void;
  clearText: () => void;
  submitText: () => void;
}

const KeyboardContext = createContext<KeyboardContextType | undefined>(undefined);

export const KeyboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [activeTarget, setActiveTarget] = useState<KeyboardTarget | null>(null);

  const openKeyboard = useCallback((target: KeyboardTarget) => {
    setActiveTarget(target);
    setIsKeyboardOpen(true);
  }, []);

  const closeKeyboard = useCallback(() => {
    setIsKeyboardOpen(false);
    setActiveTarget(null);
  }, []);

  const typeCharacter = useCallback((char: string) => {
    if (!activeTarget) return;
    if (navigator.vibrate) navigator.vibrate(8);
    const updated = (activeTarget.value || '') + char;
    activeTarget.onChange(updated);
    setActiveTarget(prev => prev ? { ...prev, value: updated } : null);
  }, [activeTarget]);

  const deleteCharacter = useCallback(() => {
    if (!activeTarget) return;
    if (navigator.vibrate) navigator.vibrate(12);
    const current = activeTarget.value || '';
    if (current.length > 0) {
      const updated = current.slice(0, -1);
      activeTarget.onChange(updated);
      setActiveTarget(prev => prev ? { ...prev, value: updated } : null);
    }
  }, [activeTarget]);

  const clearText = useCallback(() => {
    if (!activeTarget) return;
    if (navigator.vibrate) navigator.vibrate(15);
    activeTarget.onChange('');
    setActiveTarget(prev => prev ? { ...prev, value: '' } : null);
  }, [activeTarget]);

  const submitText = useCallback(() => {
    if (!activeTarget) return;
    if (navigator.vibrate) navigator.vibrate(20);
    if (activeTarget.onEnter) {
      activeTarget.onEnter();
    }
    closeKeyboard();
  }, [activeTarget, closeKeyboard]);

  useEffect(() => {
    (window as any).__libreKeyboard = {
      isKeyboardOpen,
      activeTarget,
      openKeyboard,
      closeKeyboard,
      typeCharacter,
      deleteCharacter,
      clearText,
      submitText,
    };
  }, [isKeyboardOpen, activeTarget, openKeyboard, closeKeyboard, typeCharacter, deleteCharacter, clearText, submitText]);

  return (
    <KeyboardContext.Provider
      value={{
        isKeyboardOpen,
        activeTarget,
        openKeyboard,
        closeKeyboard,
        typeCharacter,
        deleteCharacter,
        clearText,
        submitText,
      }}
    >
      {children}
    </KeyboardContext.Provider>
  );
};

export const useVirtualKeyboard = () => {
  const context = useContext(KeyboardContext);
  if (!context) {
    throw new Error('useVirtualKeyboard must be used within KeyboardProvider');
  }
  return context;
};

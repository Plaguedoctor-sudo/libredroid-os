import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Unlock, 
  Fingerprint, 
  ShieldCheck, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  X,
  FileCheck,
  FolderLock
} from 'lucide-react';
import { systemBus } from '../../services/systemBus';

interface AppLockModalProps {
  isOpen: boolean;
  targetAppName?: string;
  targetAppId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AppLockModal: React.FC<AppLockModalProps> = ({
  isOpen,
  targetAppName = 'Protected Application',
  targetAppId,
  onSuccess,
  onCancel,
}) => {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isBiometricScan, setIsBiometricScan] = useState(false);
  const correctPin = '1234'; // Default ColorOS demo security PIN

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setErrorMsg('');
      setIsBiometricScan(false);
    }
  }, [isOpen]);

  const handleDigit = (digit: string) => {
    if (pin.length >= 4) return;
    const nextPin = pin + digit;
    setPin(nextPin);
    setErrorMsg('');

    if (nextPin.length === 4) {
      if (nextPin === correctPin) {
        if (navigator.vibrate) navigator.vibrate([15, 30, 15]);
        systemBus.emit('security:app_unlocked', { appId: targetAppId });
        onSuccess();
      } else {
        if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
        setErrorMsg('Incorrect PIN. Default is 1234');
        setTimeout(() => setPin(''), 600);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleBiometricAuth = () => {
    setIsBiometricScan(true);
    setErrorMsg('');
    setTimeout(() => {
      setIsBiometricScan(false);
      if (navigator.vibrate) navigator.vibrate([20, 20]);
      systemBus.emit('security:app_unlocked', { appId: targetAppId });
      onSuccess();
    }, 900);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm mx-4 bg-[#14151b] border border-white/10 rounded-3xl p-6 text-white shadow-2xl flex flex-col items-center">
        
        {/* Close / Cancel Button */}
        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Header Icon */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-3 mt-1">
          <FolderLock size={28} className="text-white" />
        </div>

        <h3 className="text-lg font-bold tracking-tight text-center">App Lock & Private Safe</h3>
        <p className="text-xs text-neutral-400 text-center mt-1">
          Verify credentials to access <span className="text-emerald-400 font-semibold">{targetAppName}</span>
        </p>

        {/* PIN Indicators */}
        <div className="flex items-center gap-3 my-6">
          {[0, 1, 2, 3].map((idx) => (
            <div 
              key={idx}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                pin.length > idx 
                  ? 'bg-emerald-500 border-emerald-400 scale-110 shadow-lg shadow-emerald-500/50' 
                  : 'border-neutral-600 bg-neutral-800'
              }`}
            />
          ))}
        </div>

        {/* Error message */}
        {errorMsg ? (
          <p className="text-xs text-rose-400 font-medium mb-3 animate-shake flex items-center gap-1.5">
            <AlertCircle size={14} /> {errorMsg}
          </p>
        ) : (
          <p className="text-[11px] text-neutral-500 mb-3">
            Enter 4-digit PIN (Default: 1234)
          </p>
        )}

        {/* Number Pad Grid */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[260px] mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleDigit(digit)}
              className="h-14 rounded-2xl bg-neutral-800/80 hover:bg-neutral-700/80 active:scale-95 text-lg font-medium transition-all flex items-center justify-center border border-white/5 shadow"
            >
              {digit}
            </button>
          ))}

          {/* Biometric Button */}
          <button
            onClick={handleBiometricAuth}
            disabled={isBiometricScan}
            className="h-14 rounded-2xl bg-neutral-800/50 hover:bg-neutral-700/80 active:scale-95 text-emerald-400 transition-all flex items-center justify-center border border-white/5"
            title="Biometric Fingerprint Unlock"
          >
            <Fingerprint size={22} className={isBiometricScan ? 'animate-pulse text-emerald-300' : ''} />
          </button>

          {/* Zero Button */}
          <button
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-neutral-800/80 hover:bg-neutral-700/80 active:scale-95 text-lg font-medium transition-all flex items-center justify-center border border-white/5 shadow"
          >
            0
          </button>

          {/* Backspace Button */}
          <button
            onClick={handleBackspace}
            className="h-14 rounded-2xl bg-neutral-800/50 hover:bg-neutral-700/80 active:scale-95 text-neutral-400 hover:text-white transition-all flex items-center justify-center border border-white/5"
          >
            ⌫
          </button>
        </div>

        {/* Footer info */}
        <div className="flex items-center gap-1.5 text-[10px] text-neutral-500">
          <ShieldCheck size={12} className="text-emerald-500" />
          <span>ColorOS 14 TEE Hardware Enclave Keystore</span>
        </div>

      </div>
    </div>
  );
};

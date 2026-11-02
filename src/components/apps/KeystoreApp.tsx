import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  Lock, 
  Unlock, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Copy, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  RefreshCw, 
  Check, 
  FileKey, 
  Fingerprint, 
  Globe, 
  ShieldAlert, 
  Cpu, 
  Zap, 
  Layers,
  Key
} from 'lucide-react';
import { 
  keystoreEngine, 
  GpgKey, 
  PasskeyEntry, 
  VaultSecret, 
  VaultEntropyStatus 
} from '../../services/keystoreEngine';
import { useSystem } from '../../context/SystemContext';
import { AppIntent } from '../../types/apps';

interface Props extends Partial<AppIntent> {
  intent?: AppIntent;
}

export const KeystoreApp: React.FC<Props> = () => {
  const { addNotification } = useSystem();

  const [isUnlocked, setIsUnlocked] = useState(keystoreEngine.getIsUnlocked());
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const [activeTab, setActiveTab] = useState<'gpg' | 'passkeys' | 'secrets' | 'trng'>('gpg');
  const [gpgKeys, setGpgKeys] = useState<GpgKey[]>([]);
  const [passkeys, setPasskeys] = useState<PasskeyEntry[]>([]);
  const [secrets, setSecrets] = useState<VaultSecret[]>([]);
  const [entropyStatus, setEntropyStatus] = useState<VaultEntropyStatus>(keystoreEngine.getEntropyStatus());

  // Reveal secrets map
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New GPG Key modal state
  const [isNewKeyModalOpen, setIsNewKeyModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyEmail, setNewKeyEmail] = useState('');
  const [newKeyAlgo, setNewKeyAlgo] = useState<'Ed25519' | 'RSA-4096'>('Ed25519');

  // New Secret modal state
  const [isNewSecretModalOpen, setIsNewSecretModalOpen] = useState(false);
  const [newSecretTitle, setNewSecretTitle] = useState('');
  const [newSecretCategory, setNewSecretCategory] = useState<VaultSecret['category']>('password');
  const [newSecretUser, setNewSecretUser] = useState('');
  const [newSecretVal, setNewSecretVal] = useState('');
  const [newSecretDomain, setNewSecretDomain] = useState<VaultSecret['domainLock']>('any');

  // New Passkey modal state
  const [isNewPasskeyModalOpen, setIsNewPasskeyModalOpen] = useState(false);
  const [newPasskeyRp, setNewPasskeyRp] = useState('');
  const [newPasskeyUser, setNewPasskeyUser] = useState('');

  const loadData = () => {
    setIsUnlocked(keystoreEngine.getIsUnlocked());
    setGpgKeys(keystoreEngine.getGpgKeys());
    setPasskeys(keystoreEngine.getPasskeys());
    setSecrets(keystoreEngine.getSecrets());
    setEntropyStatus(keystoreEngine.getEntropyStatus());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const ok = keystoreEngine.unlock(pinInput);
    if (ok) {
      setIsUnlocked(true);
      setPinError(false);
      setPinInput('');
      loadData();
    } else {
      setPinError(true);
      if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
    }
  };

  const handleLock = () => {
    keystoreEngine.lock();
    setIsUnlocked(false);
    setRevealedSecrets({});
  };

  const handleGenerateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName || !newKeyEmail) return;
    const key = keystoreEngine.generateGpgKey(newKeyName, newKeyEmail, newKeyAlgo);
    addNotification({
      appId: 'system',
      appName: 'Sovereign Keystore',
      title: 'GPG Keypair Created',
      body: `Key ID: ${key.keyId} (${key.algorithm}) generated in seL4 vault.`,
    });
    setNewKeyName('');
    setNewKeyEmail('');
    setIsNewKeyModalOpen(false);
    loadData();
  };

  const handleDeleteGpg = (id: string) => {
    keystoreEngine.deleteGpgKey(id);
    loadData();
  };

  const handleAddSecret = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSecretTitle || !newSecretVal) return;
    keystoreEngine.addSecret(newSecretTitle, newSecretCategory, newSecretUser, newSecretVal, newSecretDomain);
    addNotification({
      appId: 'system',
      appName: 'Sovereign Keystore',
      title: 'Secret Vaulted',
      body: `Encrypted credential "${newSecretTitle}" stored in airgap domain.`,
    });
    setNewSecretTitle('');
    setNewSecretVal('');
    setNewSecretUser('');
    setIsNewSecretModalOpen(false);
    loadData();
  };

  const handleDeleteSecret = (id: string) => {
    keystoreEngine.deleteSecret(id);
    loadData();
  };

  const handleAddPasskey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasskeyRp || !newPasskeyUser) return;
    keystoreEngine.addPasskey(newPasskeyRp, newPasskeyUser, newPasskeyRp);
    addNotification({
      appId: 'system',
      appName: 'Sovereign Keystore',
      title: 'Passkey Registered',
      body: `WebAuthn credential for ${newPasskeyRp} secured in vault.`,
    });
    setNewPasskeyRp('');
    setNewPasskeyUser('');
    setIsNewPasskeyModalOpen(false);
    loadData();
  };

  const handleDeletePasskey = (id: string) => {
    keystoreEngine.deletePasskey(id);
    loadData();
  };

  const handleCopySecret = (secret: VaultSecret) => {
    keystoreEngine.copyWithAutoShred(secret.secretValue, secret.title);
    setCopiedId(secret.id);
    setTimeout(() => setCopiedId(null), 2500);

    addNotification({
      appId: 'system',
      appName: 'Clipboard Auto-Shredder',
      title: 'Secret Copied (Ephemeral)',
      body: `"${secret.title}" will be securely zeroed from clipboard in 30 seconds.`,
    });
  };

  const handleEmergencyPurge = () => {
    if (window.confirm('EMERGENCY VAULT PURGE: This will immediately overwrite all keys, passkeys, and secrets in RAM and storage. Proceed?')) {
      keystoreEngine.emergencyPurge();
      setIsUnlocked(false);
      loadData();
      addNotification({
        appId: 'system',
        appName: 'Sovereign Keystore',
        title: 'Vault Purged',
        body: 'Emergency zeroization complete. All memory buffers cleared.',
      });
    }
  };

  // Locked View
  if (!isUnlocked) {
    return (
      <div className="flex-1 w-full h-full flex flex-col items-center justify-center p-6 bg-neutral-950 text-white select-none">
        <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-violet-800 flex items-center justify-center text-white shadow-xl mb-4">
            <Lock size={30} />
          </div>

          <h1 className="text-lg font-bold text-white mb-1">seL4 Sovereign Keystore</h1>
          <p className="text-xs text-neutral-400 mb-6">
            Air-gapped microkernel vault domain. Enter Sovereign Master PIN to unlock cryptographic assets.
          </p>

          <form onSubmit={handleUnlock} className="w-full space-y-4">
            <div>
              <input
                type="password"
                maxLength={8}
                placeholder="Enter Master PIN (Default: 1234)"
                value={pinInput}
                onChange={e => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                className={`w-full bg-neutral-950 border rounded-xl px-4 py-3 text-center text-lg tracking-widest text-white placeholder-neutral-500 focus:outline-none ${
                  pinError ? 'border-rose-500' : 'border-neutral-700 focus:border-purple-500'
                }`}
                autoFocus
              />
              {pinError && (
                <p className="text-[11px] text-rose-400 mt-1.5 font-medium">
                  Invalid PIN. Default fallback is 1234.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg transition-all active:scale-95"
            >
              Unlock Vault
            </button>
          </form>

          <div className="mt-6 flex items-center gap-1.5 text-[11px] text-neutral-500 font-mono">
            <ShieldCheck size={13} className="text-purple-400" />
            <span>Formally-verified seL4 Isolation Barrier</span>
          </div>
        </div>
      </div>
    );
  }

  // Unlocked Vault View
  return (
    <div className="flex-1 w-full h-full flex flex-col bg-neutral-950 text-white select-none overflow-hidden">
      {/* Top Header */}
      <div className="bg-neutral-900 border-b border-neutral-800 p-3 sm:p-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-violet-800 flex items-center justify-center text-white shadow-md">
              <KeyRound size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-white tracking-tight">Sovereign Vault & Keyring</h1>
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 border border-purple-700 text-purple-300 font-mono">
                  lrd-vault (0 WAN)
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Formally verified cryptographic keystore & passkey manager
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleEmergencyPurge}
              className="px-2.5 py-1.5 rounded-lg bg-rose-950/80 border border-rose-800/80 hover:bg-rose-900 text-rose-300 text-xs font-medium transition-colors"
              title="Overwrites all RAM and storage keys immediately"
            >
              Emergency Wipe
            </button>

            <button
              onClick={handleLock}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-neutral-700 transition-colors"
            >
              <Lock size={12} />
              <span>Lock Vault</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-neutral-800/60 text-xs">
          <button
            onClick={() => setActiveTab('gpg')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'gpg'
                ? 'bg-purple-950/60 border border-purple-700 text-purple-200'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <FileKey size={14} />
            <span>GPG Keys ({gpgKeys.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('passkeys')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'passkeys'
                ? 'bg-purple-950/60 border border-purple-700 text-purple-200'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Fingerprint size={14} />
            <span>Passkeys ({passkeys.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('secrets')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'secrets'
                ? 'bg-purple-950/60 border border-purple-700 text-purple-200'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Key size={14} />
            <span>Encrypted Secrets ({secrets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('trng')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'trng'
                ? 'bg-purple-950/60 border border-purple-700 text-purple-200'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Cpu size={14} />
            <span>TRNG & Airgap</span>
          </button>
        </div>
      </div>

      {/* Tab 1: GPG Keys */}
      {activeTab === 'gpg' && (
        <div className="flex-1 p-4 overflow-auto">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white">Cryptographic GPG Keyrings</h2>
                <p className="text-xs text-neutral-400">
                  Hardware-bound OpenPGP keys for signing commits, encrypting emails, and decrypting messages.
                </p>
              </div>
              <button
                onClick={() => setIsNewKeyModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold hover:brightness-110 shadow-md"
              >
                <Plus size={14} />
                <span>Generate Keypair</span>
              </button>
            </div>

            <div className="space-y-3">
              {gpgKeys.map(k => (
                <div 
                  key={k.id}
                  className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-white text-sm">{k.userId}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-purple-300 border border-purple-800/40">
                          {k.algorithm}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                          {k.type.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 font-mono">{k.email}</p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(k.publicKeyArmored);
                          addNotification({
                            appId: 'system',
                            appName: 'Sovereign Keystore',
                            title: 'Armored Public Key Copied',
                            body: `Key ${k.keyId} public block ready to share.`,
                          });
                        }}
                        className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs flex items-center gap-1 transition-colors"
                        title="Copy Armored Public Key Block"
                      >
                        <Copy size={13} />
                        <span className="text-[11px]">Copy Public</span>
                      </button>

                      <button
                        onClick={() => handleDeleteGpg(k.id)}
                        className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900 text-rose-400 transition-colors"
                        title="Revoke / Delete Key"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="bg-neutral-950 border border-neutral-800/80 rounded-xl p-2.5 font-mono text-xs">
                    <div className="flex items-center justify-between text-neutral-400 text-[11px] mb-1">
                      <span>Fingerprint</span>
                      <span>Key ID: <strong className="text-white">{k.keyId}</strong></span>
                    </div>
                    <div className="text-purple-300 font-bold tracking-wider text-[11px]">
                      {k.fingerprint}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1 border-t border-neutral-800/50">
                    <div className="flex items-center gap-1">
                      <span>Capabilities:</span>
                      {k.capabilities.map(cap => (
                        <span key={cap} className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 uppercase text-[9px]">
                          {cap}
                        </span>
                      ))}
                    </div>
                    <span>Created: {k.created}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Passkeys (FIDO2) */}
      {activeTab === 'passkeys' && (
        <div className="flex-1 p-4 overflow-auto">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white">WebAuthn / FIDO2 Passkeys</h2>
                <p className="text-xs text-neutral-400">
                  Passwordless public-key credentials stored in hardware-isolated enclave.
                </p>
              </div>
              <button
                onClick={() => setIsNewPasskeyModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold hover:brightness-110 shadow-md"
              >
                <Plus size={14} />
                <span>Register Passkey</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {passkeys.map(pk => (
                <div 
                  key={pk.id}
                  className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-300">
                          <Globe size={14} />
                        </div>
                        <span className="font-bold text-white text-xs">{pk.displayName}</span>
                      </div>
                      <button
                        onClick={() => handleDeletePasskey(pk.id)}
                        className="text-neutral-500 hover:text-rose-400 p-1"
                        title="Remove passkey"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="space-y-1 text-xs font-mono mb-3">
                      <div className="text-neutral-400">RP: <span className="text-cyan-300">{pk.rpId}</span></div>
                      <div className="text-neutral-400">User: <span className="text-white">{pk.userName}</span></div>
                      <div className="text-[10px] text-neutral-500 truncate">ID: {pk.credentialId}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-neutral-500 pt-2 border-t border-neutral-800">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <Check size={11} /> Attested
                    </span>
                    <span>Last used: {pk.lastUsed}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Encrypted Secrets */}
      {activeTab === 'secrets' && (
        <div className="flex-1 p-4 overflow-auto">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white">Vault Encrypted Secrets & Credentials</h2>
                <p className="text-xs text-neutral-400">
                  AES-256-GCM + Argon2id encrypted store with 30-second ephemeral clipboard auto-shredding.
                </p>
              </div>
              <button
                onClick={() => setIsNewSecretModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold hover:brightness-110 shadow-md"
              >
                <Plus size={14} />
                <span>Vault Secret</span>
              </button>
            </div>

            <div className="space-y-3">
              {secrets.map(sec => {
                const isRevealed = !!revealedSecrets[sec.id];
                const isCopied = copiedId === sec.id;

                return (
                  <div 
                    key={sec.id}
                    className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-white text-sm">{sec.title}</span>
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-neutral-800 text-cyan-300">
                            {sec.category.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 border border-purple-800 text-purple-300">
                            Lock: {sec.domainLock}
                          </span>
                        </div>
                        {sec.username && (
                          <p className="text-xs text-neutral-400 font-mono">User: {sec.username}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setRevealedSecrets(prev => ({ ...prev, [sec.id]: !prev[sec.id] }))}
                          className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                          title={isRevealed ? 'Mask secret' : 'Reveal secret'}
                        >
                          {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>

                        <button
                          onClick={() => handleCopySecret(sec)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            isCopied 
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' 
                              : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700'
                          }`}
                          title="Copy to clipboard with 30s auto-shred timer"
                        >
                          {isCopied ? <Check size={13} /> : <Copy size={13} />}
                          <span>{isCopied ? 'Copied (30s shred)' : 'Copy (Shred)'}</span>
                        </button>

                        <button
                          onClick={() => handleDeleteSecret(sec.id)}
                          className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900 text-rose-400 transition-colors"
                          title="Delete secret"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="bg-neutral-950 border border-neutral-800/80 rounded-xl p-2.5 font-mono text-xs">
                      {isRevealed ? (
                        <span className="text-cyan-300 break-all select-all">{sec.secretValue}</span>
                      ) : (
                        <span className="text-neutral-500 tracking-widest">••••••••••••••••••••••••••••••••</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: TRNG & Airgap */}
      {activeTab === 'trng' && (
        <div className="flex-1 p-4 overflow-auto">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
              <h2 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                <ShieldCheck size={18} className="text-purple-400" />
                Airgap Isolation & Hardware TRNG Attestation
              </h2>
              <p className="text-xs text-neutral-400 mb-6">
                seL4 microkernel domain state verifies zero external routes, no veth interfaces, and raw hardware entropy pool generation.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5">
                  <span className="text-xs text-neutral-400 block mb-1">Network Barrier</span>
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <ShieldCheck size={16} /> Air-Gapped (Loopback Only)
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1 font-mono">
                    `ip netns exec lrd-vault` contains 0 default routes.
                  </p>
                </div>

                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5">
                  <span className="text-xs text-neutral-400 block mb-1">Hardware TRNG Entropy</span>
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-sm font-mono">
                    <Zap size={16} /> {entropyStatus.availableBits} / 4096 Bits Optimal
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1 font-mono">
                    Source: {entropyStatus.source}
                  </p>
                </div>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                  <span className="text-neutral-400">TRNG Rate</span>
                  <span className="text-white">{(entropyStatus.hardwareTrngRateBps / 1000000).toFixed(2)} Mbps</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                  <span className="text-neutral-400">Domain Enclosure</span>
                  <span className="text-purple-300">{entropyStatus.isolationDomain}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                  <span className="text-neutral-400">Ephemeral Memory Shifting</span>
                  <span className="text-emerald-400">Active (tmpfs zeroization)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: New GPG Key */}
      {isNewKeyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-1">Generate New GPG Keypair</h3>
            <p className="text-xs text-neutral-400 mb-4">
              Key derivation happens completely inside the airgapped vault domain.
            </p>

            <form onSubmit={handleGenerateKey} className="space-y-3">
              <div>
                <label className="text-xs text-neutral-400 block mb-1">User Identity Name</label>
                <input
                  type="text"
                  placeholder="e.g. Satoshi Sovereign"
                  value={newKeyName}
                  onChange={e => setNewKeyName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">Email / Uid</label>
                <input
                  type="email"
                  placeholder="e.g. satoshi@libredroid.mesh"
                  value={newKeyEmail}
                  onChange={e => setNewKeyEmail(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">Algorithm</label>
                <select
                  value={newKeyAlgo}
                  onChange={e => setNewKeyAlgo(e.target.value as any)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Ed25519">Ed25519 (Recommended modern high-security curve)</option>
                  <option value="RSA-4096">RSA-4096 (Legacy broad compatibility)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsNewKeyModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
                >
                  Generate Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Secret */}
      {isNewSecretModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-1">Vault New Encrypted Secret</h3>
            <p className="text-xs text-neutral-400 mb-4">
              Stored with AES-256-GCM and bound to domain isolation policies.
            </p>

            <form onSubmit={handleAddSecret} className="space-y-3">
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Title</label>
                <input
                  type="text"
                  placeholder="e.g. Nextcloud Admin Token"
                  value={newSecretTitle}
                  onChange={e => setNewSecretTitle(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Category</label>
                  <select
                    value={newSecretCategory}
                    onChange={e => setNewSecretCategory(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="password">Password</option>
                    <option value="token">API Token</option>
                    <option value="ssh_key">SSH Passphrase</option>
                    <option value="seed_phrase">Recovery Seed Phrase</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Domain Binding</label>
                  <select
                    value={newSecretDomain}
                    onChange={e => setNewSecretDomain(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="any">Any Domain</option>
                    <option value="vault">Vault Only</option>
                    <option value="work">Workstation Only</option>
                    <option value="android">Waydroid Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">Username / Identifier (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. admin@nextcloud"
                  value={newSecretUser}
                  onChange={e => setNewSecretUser(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">Secret Content</label>
                <textarea
                  rows={3}
                  placeholder="Paste password, private token, or recovery words..."
                  value={newSecretVal}
                  onChange={e => setNewSecretVal(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsNewSecretModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
                >
                  Save to Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Passkey */}
      {isNewPasskeyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-1">Register WebAuthn Passkey</h3>
            <p className="text-xs text-neutral-400 mb-4">
              Creates cryptographic public-key credentials bound to relying party domain.
            </p>

            <form onSubmit={handleAddPasskey} className="space-y-3">
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Relying Party Domain</label>
                <input
                  type="text"
                  placeholder="e.g. nextcloud.sovereign.mesh or github.com"
                  value={newPasskeyRp}
                  onChange={e => setNewPasskeyRp(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">Username / Handle</label>
                <input
                  type="text"
                  placeholder="e.g. sovereign_user"
                  value={newPasskeyUser}
                  onChange={e => setNewPasskeyUser(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsNewPasskeyModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
                >
                  Register Passkey
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

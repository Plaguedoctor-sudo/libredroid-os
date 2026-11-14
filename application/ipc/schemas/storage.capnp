@0x123456789abcdef0;

enum StorageSecurityLevel {
  hardwareTpmSealed @0; # Master key unwrapped only when PCRs match verified state
  passkeyBiometric @1;   # Key derived from user biometric + passkey
  sessionVolatile @2;    # RAM-backed tmpfs, wiped on window destruction
}

struct VaultDescriptor {
  vaultId @0 :Text;
  mountPath @1 :Text;
  securityLevel @2 :StorageSecurityLevel;
  allocatedQuotaBytes @3 :UInt64;
  usedBytes @4 :UInt64;
}

interface StorageService {
  openAppVault @0 (appId :Text, security :StorageSecurityLevel, capToken :Data) -> (vault :VaultDescriptor);
  syncCrdtDoc @1 (collection :Text, docId :Text, deltaCrdt :Data) -> (newVectorClock :Data);
  shredAppStorage @2 (appId :Text) -> (shreddedOk :Bool);
}

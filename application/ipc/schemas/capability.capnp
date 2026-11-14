@0x89abcdef01234567;

struct CapHandle {
  id @0 :Data;              # 32-byte cryptographic unforgeable token
  resourceId @1 :Text;      # Canonical URI (e.g., "sap://camera/front", "sap://fs/vault")
  permissions @2 :UInt32;   # Bitmask of permitted actions (READ=1, WRITE=2, EXEC=4, ATOM=8)
  issuer @3 :Text;          # Sovereign system authority
  recipient @4 :Text;       # Application identifier (e.g., "org.sovereign.camera")
  issuedAt @5 :UInt64;      # Monotonic timestamp (nanoseconds)
  expiresAt @6 :UInt64;     # Monotonic expiration (0 = indefinite until revoked)
}

struct CapLeaseRequest {
  resourceId @0 :Text;
  requestedActions @1 :UInt32;
  leaseDurationMs @2 :UInt32; # Ephemeral lease duration requested (max 10000ms)
  userIntentProof @3 :Data;  # Cryptographic hardware touch/gesture proof
}

struct CapLeaseResponse {
  enum Status {
    granted @0;
    deniedUserIntentMissing @1;
    deniedPolicyRestriction @2;
    deniedHardwareLocked @3;
  }
  status @0 :Status;
  handle @1 :CapHandle;
  signature @2 :Data;        # System authority Ed25519 signature
}

interface CapabilityAuthority {
  requestLease @0 (request :CapLeaseRequest) -> (response :CapLeaseResponse);
  attenuate @1 (parent :CapHandle, restrictedActions :UInt32, subResource :Text) -> (child :CapHandle);
  revoke @2 (handleId :Data) -> (success :Bool);
  verify @3 (handle :CapHandle, action :UInt32) -> (valid :Bool);
}

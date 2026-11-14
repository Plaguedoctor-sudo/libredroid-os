@0xa3456789abcdef01;

struct PasskeyCredential {
  credentialId @0 :Data;
  relyingPartyId @1 :Text;
  publicKeyEd25519 @2 :Data;
  signCount @3 :UInt32;
  createdAtEpoch @4 :UInt64;
}

struct AssertionSignature {
  authenticatorData @0 :Data;
  clientDataHash @1 :Data;
  signature @2 :Data;
}

interface IdentityService {
  createPasskey @0 (rpId :Text, userHandle :Data, capToken :Data) -> (cred :PasskeyCredential);
  signAssertion @1 (credentialId :Data, clientDataHash :Data, capToken :Data) -> (sig :AssertionSignature);
  getDeviceDid @2 () -> (didUri :Text, hardwareAttestation :Data);
}

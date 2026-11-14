@0x8123456789abcdef;

enum CellularRadioTech {
  none @0;
  gsmGprs @1;
  umtsHspa @2;
  lte4g @3;
  nr5gSa @4;
  nr5gNsa @5;
}

enum CallState {
  idle @0;
  dialing @1;
  ringing @2;
  activeVoLte @3;
  activeVoNr @4;
  held @5;
  disconnected @6;
}

struct CallDescriptor {
  callId @0 :UInt32;
  remoteParty @1 :Text;
  state @2 :CallState;
  startTimeEpoch @3 :UInt64;
  isEncryptedIms @4 :Bool;
}

struct SmsMessage {
  sender @0 :Text;
  body @1 :Text;
  timestampEpoch @2 :UInt64;
}

interface TelephonyService {
  dialNumber @0 (phoneNumber :Text, capToken :Data) -> (call :CallDescriptor);
  hangupCall @1 (callId :UInt32) -> (success :Bool);
  sendSms @2 (recipient :Text, body :Text, capToken :Data) -> (messageId :UInt64);
  getRadioStatus @3 () -> (tech :CellularRadioTech, signalStrengthDbm :Int32, carrierName :Text);
}

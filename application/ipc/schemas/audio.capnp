@0xcdef0123456789ab;

enum AudioFormat {
  pcmS16le @0;
  pcmS24le @1;
  pcmFloat32 @2;
  opus @3;
}

enum AudioRoute {
  earpiece @0;
  speaker @1;
  wiredHeadset @2;
  bluetoothA2dp @3;
  usbAudio @4;
}

struct AudioStreamConfig {
  sampleRateHz @0 :UInt32;
  channels @1 :UInt16;
  format @2 :AudioFormat;
  latencyFrames @3 :UInt32;
  route @4 :AudioRoute;
}

interface AudioService {
  createPlaybackStream @0 (config :AudioStreamConfig, capToken :Data) -> (streamFd :Int32, streamId :UInt64);
  createCaptureStream @1 (config :AudioStreamConfig, capToken :Data) -> (streamFd :Int32, streamId :UInt64);
  setVolume @2 (streamId :UInt64, volumePct :Float32) -> ();
  setRoute @3 (route :AudioRoute) -> (success :Bool);
  setPrivacyMute @4 (hardwareMute :Bool) -> ();
}

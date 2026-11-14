@0xdef0123456789abc;

enum CameraLens {
  frontSelfie @0;
  backMain @1;
  backUltrawide @2;
  backTelephoto @3;
  privacySynthetic @4; # Zero-trust dummy camera feed with synthetic noise
}

struct CameraStreamConfig {
  lens @0 :CameraLens;
  width @1 :UInt32;
  height @2 :UInt32;
  targetFps @3 :UInt32;
  pixelFormatFourCc @4 :UInt32; # V4L2_PIX_FMT_NV12, etc.
}

struct CameraFrameMeta {
  frameIndex @0 :UInt64;
  timestampNs @1 :UInt64;
  exposureTimeUs @2 :UInt32;
  analogGain @3 :Float32;
  colorTemperatureK @4 :UInt32;
}

interface CameraService {
  acquireCameraStream @0 (config :CameraStreamConfig, leaseToken :Data) -> (ringBufferFd :Int32, streamId :UInt64);
  releaseCameraStream @1 (streamId :UInt64) -> (success :Bool);
  setTorchMode @2 (enabled :Bool) -> ();
  setPhysicalPrivacyShutter @3 (closed :Bool) -> ();
}

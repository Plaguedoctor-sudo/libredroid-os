@0xabcdef0123456789;

enum FormFactorMode {
  handset @0;        # 16:9 - 21:9 vertical single-hand ergonomics
  foldableTent @1;   # ~90° hinge posture
  foldableOpen @2;   # ~180° dual-pane tablet view
  tablet @3;         # Stylus pencil enabled, multi-app side-by-side
  desktopDocked @4;  # Multi-window, multi-monitor, keyboard/mouse
  spatialXr @5;      # Low-latency heads-up AR display
}

struct SurfaceDescriptor {
  surfaceId @0 :UInt64;
  shmFd @1 :Int32;           # Shared memory file descriptor for DRM buffer
  width @2 :UInt32;
  height @3 :UInt32;
  stride @4 :UInt32;
  pixelFormat @5 :UInt32;    # DRM_FORMAT_XRGB8888, DRM_FORMAT_ARGB8888
  refreshRateHz @6 :UInt32;  # 60, 90, 120, 144 VRR
}

struct WindowGeometry {
  x @0 :Int32;
  y @1 :Int32;
  width @2 :UInt32;
  height @3 :UInt32;
  isFloating @4 :Bool;
  isMaximized @5 :Bool;
  zIndex @6 :UInt32;
}

interface DisplayCompositor {
  createSurface @0 (appId :Text, width :UInt32, height :UInt32) -> (surface :SurfaceDescriptor);
  commitBuffer @1 (surfaceId :UInt64, bufferIndex :UInt32, acquireFence :Int32) -> (releaseFence :Int32);
  updateGeometry @2 (surfaceId :UInt64, geometry :WindowGeometry) -> ();
  destroySurface @3 (surfaceId :UInt64) -> (success :Bool);
  queryFormFactor @4 () -> (mode :FormFactorMode, hingeAngleDeg :Float32);
}

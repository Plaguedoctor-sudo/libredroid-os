@0x9abcdef012345678;

enum AppState {
  uninitialized @0;
  created @1;
  active @2;         # Render loop running, input dispatch active
  background @3;     # Windows hidden, network background throttled
  frozen @4;         # SIGSTOP / cgroup freezer, 0% CPU consumption
  destroyed @5;
}

struct ProcessMetrics {
  cpuUsagePct @0 :Float32;
  residentMemoryKb @1 :UInt64;
  gpuMemoryKb @2 :UInt64;
  sandboxedSyscallCount @3 :UInt64;
  ioBytesRead @4 :UInt64;
  ioBytesWritten @5 :UInt64;
}

struct LifecycleTransition {
  appId @0 :Text;
  previousState @1 :AppState;
  newState @2 :AppState;
  timestamp @3 :UInt64;
  reason @4 :Text;
}

interface ApplicationSupervisor {
  registerApp @0 (appId :Text, manifestHash :Data) -> (pid :UInt32, assignedDomain :Text);
  notifyStateChange @1 (transition :LifecycleTransition) -> (acknowledged :Bool);
  requestFreeze @2 (appId :Text) -> (success :Bool);
  requestUnfreeze @3 (appId :Text) -> (success :Bool);
  terminateApp @4 (appId :Text, exitCode :Int32) -> ();
  getMetrics @5 (appId :Text) -> (metrics :ProcessMetrics);
}

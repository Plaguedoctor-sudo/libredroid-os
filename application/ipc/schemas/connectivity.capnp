@0xf0123456789abcde;

enum NetworkEgressPolicy {
  defaultDeny @0;      # No packet egress allowed
  torOnly @1;          # Routed exclusively via isolated Tor onion circuit
  vpnWireguard @2;     # Routed via user-controlled WireGuard tunnel
  localMeshDirect @3;  # Wi-Fi Direct / 802.11s local mesh only
  clearnetUnfiltered @4; # Direct internet (requires explicit user consent)
}

struct NetworkInterfaceStatus {
  ifName @0 :Text;
  isUp @1 :Bool;
  ipv4Addr @2 :Text;
  ipv6Addr @3 :Text;
  rxBytes @4 :UInt64;
  txBytes @5 :UInt64;
  egressPolicy @6 :NetworkEgressPolicy;
}

interface ConnectivityService {
  assignAppEgressPolicy @0 (appId :Text, policy :NetworkEgressPolicy) -> (success :Bool);
  queryStatus @1 () -> (interfaces :List(NetworkInterfaceStatus));
  setAirplaneMode @2 (enabled :Bool) -> ();
  toggleTorCircuit @3 () -> (newCircuitReady :Bool);
}

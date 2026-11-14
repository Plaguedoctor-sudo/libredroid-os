@0xb3456789abcdef02;

enum NotificationUrgency {
  low @0;
  normal @1;
  criticalUrgent @2;
}

struct NotificationAction {
  actionId @0 :Text;
  label @1 :Text;
}

struct SovereignNotification {
  id @0 :UInt64;
  appId @1 :Text;
  title @2 :Text;
  body @3 :Text;
  urgency @4 :NotificationUrgency;
  actions @5 :List(NotificationAction);
  timestampEpoch @6 :UInt64;
}

interface NotificationDispatcher {
  postNotification @0 (notification :SovereignNotification, capToken :Data) -> (success :Bool);
  dismissNotification @1 (id :UInt64) -> ();
  registerPushEndpoint @2 (appId :Text, matrixOrUnifiedPushEndpoint :Text) -> (subscriptionToken :Text);
}

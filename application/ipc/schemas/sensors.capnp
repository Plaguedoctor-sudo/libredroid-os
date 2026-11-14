@0xef0123456789abcd;

enum SensorType {
  accelerometer @0;
  gyroscope @1;
  magnetometer @2;
  ambientLight @3;
  proximity @4;
  barometer @5;
  hingeAngle @6;
  stepCounter @7;
}

struct SensorReading {
  sensorType @0 :SensorType;
  timestampNs @1 :UInt64;
  values @2 :List(Float32); # x, y, z or scalar
  accuracy @3 :UInt8;
}

interface SensorService {
  subscribeSensor @0 (sensor :SensorType, rateHz :UInt32, capToken :Data) -> (subscriptionId :UInt64);
  unsubscribeSensor @1 (subscriptionId :UInt64) -> (success :Bool);
  getLatestReading @2 (sensor :SensorType) -> (reading :SensorReading);
}

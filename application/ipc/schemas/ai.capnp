@0xbcdef0123456789a;

enum ModelPrecision {
  int4 @0;
  int8 @1;
  fp16 @2;
}

enum HardwareEngine {
  npu @0;
  gpuVulkan @1;
  cpuVector @2;
}

struct TensorDimensions {
  shape @0 :List(UInt32);
  dataType @1 :UInt32;
}

struct InferenceRequest {
  modelTag @0 :Text;          # "sovereign-slm-1b", "whisper-tiny-local"
  promptTokens @1 :List(UInt32);
  maxNewTokens @2 :UInt32;
  temperature @3 :Float32;
  preferredEngine @4 :HardwareEngine;
}

struct InferenceResponse {
  generatedTokens @0 :List(UInt32);
  text @1 :Text;
  executionTimeMs @2 :UInt32;
  tokensPerSec @3 :Float32;
  engineUsed @4 :HardwareEngine;
}

struct VectorQuery {
  embedding @0 :List(Float32);
  topK @1 :UInt32;
  namespace @2 :Text;
}

struct VectorMatch {
  docId @0 :Text;
  score @1 :Float32;
  payload @2 :Text;
}

interface SovereignAiService {
  executeInference @0 (req :InferenceRequest) -> (res :InferenceResponse);
  queryEpisodicMemory @1 (query :VectorQuery) -> (matches :List(VectorMatch));
  upsertMemory @2 (namespace :Text, docId :Text, embedding :List(Float32), payload :Text) -> (success :Bool);
  compileNaturalIntent @3 (voiceOrText :Text) -> (capabilityInvocation :Text);
}

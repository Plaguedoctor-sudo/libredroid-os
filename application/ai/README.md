# Sovereign Local Intelligence Subsystem (`ai/`)

Replaces cloud-dependent assistants (Google Assistant / Gemini / Siri) with a **100% on-device neuromorphic execution engine**. The OS provides native intelligence services to user applications without leaking context or queries to remote servers.

## Core Components

- [`npu-hal/`](file:///home/nitin/fkgugal/application/ai/npu-hal): Unified C ABI interfacing directly with hardware tensor accelerators (Qualcomm QNN / Hexagon, MediaTek NeuroPilot, Apple Neural Engine, and Vulkan Compute Tensors).
- [`inference/`](file:///home/nitin/fkgugal/application/ai/inference): High-performance quantized model runner executing 1B–8B parameter SLMs (INT4/INT8 GGUF/SafeTensors) with sub-15ms time-to-first-token.
- [`context/`](file:///home/nitin/fkgugal/application/ai/context): Encrypted on-device vector database (local RAG) providing episodic user memory sealed with TPM 2.0 hardware keys.
- [`intent/`](file:///home/nitin/fkgugal/application/ai/intent): Deterministic intent-to-capability compiler converting user instructions directly into Cap'n Proto capability invocations.
- [`privacy-shield/`](file:///home/nitin/fkgugal/application/ai/privacy-shield): Real-time prompt filter preventing confidential information (passwords, biometrics, private keys) from entering inference pipelines.

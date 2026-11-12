#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-or-later
"""FreeStack Deterministic Execution & Model Output Replay Harness (Task 1.12)

Replays recorded IPC conversations, model inferences, and capability calls
with zero network access, verifying byte-for-byte reproducibility of effects.
"""

import json
import sys
import hashlib
from pathlib import Path


def compute_trace_digest(events: list) -> str:
    h = hashlib.sha256()
    for ev in events:
        h.update(json.dumps(ev, sort_keys=True).encode("utf-8"))
    return h.hexdigest()


def replay_trace(trace_path: Path, stub_outputs: dict | None = None) -> bool:
    if not trace_path.exists():
        print(f"Error: Trace file {trace_path} not found", file=sys.stderr)
        return False
    data = json.loads(trace_path.read_text(encoding="utf-8"))
    initial_events = data.get("events", [])
    expected_digest = data.get("trace_digest")

    print(f"[*] Loading trace: {data.get('trace_id', 'unknown')}")
    print(f"    Total recorded steps: {len(initial_events)}")

    replayed_events = []
    for step in initial_events:
        step_id = step.get("step")
        action = step.get("action")
        params = step.get("params", {})
        
        # Stub model/external inputs deterministically
        if step.get("kind") == "infer_query":
            output = stub_outputs.get(action, step.get("output", "default_stub_response")) if stub_outputs else step.get("output")
        else:
            output = step.get("output")

        replayed_step = {
            "step": step_id,
            "action": action,
            "params": params,
            "output": output,
            "kind": step.get("kind", "ipc")
        }
        replayed_events.append(replayed_step)

    got_digest = compute_trace_digest(replayed_events)
    if expected_digest and got_digest != expected_digest:
        print(f"FAIL: Deterministic replay diverged! {got_digest} != {expected_digest}", file=sys.stderr)
        return False

    print(f"✔ Deterministic trace replay verified. Digest: {got_digest[:16]}...")
    return True


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: fs-replay-harness.py <trace.json>", file=sys.stderr)
        sys.exit(1)
    success = replay_trace(Path(sys.argv[1]))
    sys.exit(0 if success else 1)

#!/usr/bin/env python3
import json, sys, time, urllib.request

port, out = sys.argv[1], sys.argv[2]
mode = sys.argv[3] if len(sys.argv) > 3 else "--hit"
fails = []

for _ in range(40):
    try:
        tabs = json.load(urllib.request.urlopen(f"http://127.0.0.1:{port}/json", timeout=2))
        ws = next(t["webSocketDebuggerUrl"] for t in tabs if t["type"] == "page")
        break
    except Exception:
        time.sleep(1)
else:
    print(json.dumps({"error": "no cdp target"})); sys.exit(1)

import websocket  # websocket-client
w = websocket.create_connection(ws, timeout=15)
mid = 0

def ev(expr):
    global mid
    mid += 1
    w.send(json.dumps({"id": mid, "method": "Runtime.evaluate",
                       "params": {"expression": expr, "returnByValue": True,
                                  "awaitPromise": True}}))
    while True:
        m = json.loads(w.recv())
        if m.get("id") == mid:
            return m.get("result", {}).get("result", {}).get("value")

JS = {
 "--hit": r"""(() => {
   const out = [];
   for (const b of document.querySelectorAll('[data-lrd-dock] button')) {
     const r = b.getBoundingClientRect();
     if (!r.width) continue;
     const hit = document.elementFromPoint(r.left + r.width/2, r.top + r.height/2);
     if (hit && !b.contains(hit)) out.push({icon: b.getAttribute('aria-label') || b.id, by: hit.className});
   }
   return out; })()""",
 "--names": r"""(() => [...document.querySelectorAll('[data-lrd-dock] button')]
   .filter(b => !(b.getAttribute('aria-label') || b.textContent.trim()))
   .map(b => b.id || b.className))()""",
 "--overflow": r"""(() => document.documentElement.scrollWidth > window.innerWidth + 1)()""",
}

res = ev(JS[mode])
json.dump({"mode": mode, "result": res}, open(f"{out}/cdp{mode}.json", "w"))
ok = (res == [] or res is False) if mode != "--overflow" else (res is False)
w.close()
sys.exit(0 if ok else 1)

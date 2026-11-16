import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = 3899;
const TEST_ENV = {
  ...process.env,
  PORT: String(PORT),
  LRD_DEV_INSTALL: '0',
};

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function httpRequest(method, reqPath, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: '127.0.0.1',
      port: PORT,
      path: reqPath,
      method,
      headers: {
        'host': `127.0.0.1:${PORT}`,
        ...headers,
      },
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch {}
        resolve({ status: res.statusCode, headers: res.headers, body: data, json });
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('[TEST] Starting server on port', PORT);
  const serverProc = spawn('node', ['legacy/server.js'], {
    env: TEST_ENV,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  serverProc.stdout.on('data', (d) => process.stdout.write('[SERVER] ' + d));
  serverProc.stderr.on('data', (d) => process.stderr.write('[SERVER-ERR] ' + d));

  let started = false;
  for (let i = 0; i < 40; i++) {
    await sleep(250);
    try {
      const res = await httpRequest('GET', '/healthz');
      if (res.status === 200) {
        started = true;
        break;
      }
    } catch {}
  }

  if (!started) {
    serverProc.kill();
    throw new Error('Server failed to start within timeout');
  }

  console.log('[TEST] Server online. Beginning Security Regression Audits...');
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (!condition) {
      console.error(`[-] FAILED: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
    passed++;
    console.log(`[+] PASSED: ${message}`);
  }

  try {
    // 1. Verify GET /api/host/caps does NOT leak the bridge token
    const capsRes = await httpRequest('GET', '/api/host/caps');
    assert(capsRes.status === 200, 'GET /api/host/caps responds with 200');
    assert(capsRes.json && capsRes.json.token === undefined, 'GET /api/host/caps does NOT leak secret token in response');

    // 2. Fetch the legitimate injected token from index.html (as legitimate SPA does)
    const indexRes = await httpRequest('GET', '/');
    assert(indexRes.status === 200, 'GET / serves SPA index.html');
    const tokenMatch = indexRes.body.match(/window\.__LRD_BRIDGE_TOKEN__\s*=\s*"([^"]+)";/);
    assert(tokenMatch && tokenMatch[1].length > 16, 'index.html contains securely injected window.__LRD_BRIDGE_TOKEN__');
    const validToken = tokenMatch ? tokenMatch[1] : '';

    // 3. Test Fail-Closed Mutating Endpoint Auth: POST without token
    const noTokenRes = await httpRequest('POST', '/api/host/exec', { 'content-type': 'application/json' }, { cmd: 'uname' });
    assert(noTokenRes.status === 401, 'POST /api/host/exec without token is rejected with 401 Unauthorized');

    // 4. Test Mutating Endpoint Auth: POST with invalid token
    const badTokenRes = await httpRequest('POST', '/api/host/exec', {
      'content-type': 'application/json',
      'x-lrd-token': 'attacker-fake-token-12345',
    }, { cmd: 'uname' });
    assert(badTokenRes.status === 401, 'POST /api/host/exec with bogus token is rejected with 401 Unauthorized');

    // 5. Test Whitelist Enforcement: Attempts to run arbitrary shell (sh/bash)
    const bashExecRes = await httpRequest('POST', '/api/host/exec', {
      'content-type': 'application/json',
      'x-lrd-token': validToken,
    }, { cmd: 'bash -c whoami' });
    assert(bashExecRes.status === 403, 'POST /api/host/exec with forbidden binary (bash) is rejected with 403 Forbidden');

    // 6. Test Command Injection / Chaining: Attacker attempts "uname; id"
    const chainExecRes = await httpRequest('POST', '/api/host/exec', {
      'content-type': 'application/json',
      'x-lrd-token': validToken,
    }, { cmd: 'uname; whoami' });
    assert(chainExecRes.status === 403, 'POST /api/host/exec with command chaining (;) is rejected with 403 Forbidden');

    // 7. Test Root Escalation: Attacker requests root: true
    const rootExecRes = await httpRequest('POST', '/api/host/exec', {
      'content-type': 'application/json',
      'x-lrd-token': validToken,
    }, { cmd: 'uname', root: true });
    assert(rootExecRes.status === 403, 'POST /api/host/exec with root: true is rejected with 403 Forbidden');

    // 8. Test Safe Execution: Whitelisted single command
    const safeExecRes = await httpRequest('POST', '/api/host/exec', {
      'content-type': 'application/json',
      'x-lrd-token': validToken,
    }, { cmd: 'uname' });
    assert(safeExecRes.status === 200 && safeExecRes.json.ok === true, 'POST /api/host/exec with safe command executes successfully');

    // 9. Test Bare-Metal Installer Protection: Missing confirmation
    const baremetalNoConfirmRes = await httpRequest('POST', '/api/install/baremetal', {
      'content-type': 'application/json',
      'x-lrd-token': validToken,
    }, { disk: '/dev/sda' });
    assert(baremetalNoConfirmRes.status === 400, 'POST /api/install/baremetal without confirm token is rejected with 400 Bad Request');

    // 10. Test Bare-Metal Installer Protection: System is not in live boot mode
    const baremetalNotLiveRes = await httpRequest('POST', '/api/install/baremetal', {
      'content-type': 'application/json',
      'x-lrd-token': validToken,
    }, { disk: '/dev/sda', confirm: 'YES_INSTALL_LIBREDROID' });
    assert(baremetalNotLiveRes.status === 403, 'POST /api/install/baremetal on installed system is rejected with 403 Forbidden');

    // 11. Test Process Killing Protection: PID 1
    const killPid1Res = await httpRequest('POST', '/api/processes/1/kill', {
      'content-type': 'application/json',
      'x-lrd-token': validToken,
    }, { signal: 'SIGTERM' });
    assert(killPid1Res.status === 403, 'POST /api/processes/1/kill is rejected with 403 Forbidden');

    // 12. MedScript Protocol Test: Honeypot Canary Tripwire (/.env access attempt)
    const honeypotRes = await httpRequest('GET', '/.env');
    assert(honeypotRes.status === 403, 'Canary honeypot path (/.env) trips Intrusion Sentinel and returns 403 Forbidden');

    // 13. MedScript Protocol Test: Path Traversal Signature Detection (/..%2f..%2fetc%2fshadow)
    const traversalRes = await httpRequest('GET', '/api/storage/file?path=/etc/shadow');
    assert(traversalRes.status === 403, 'Exploit / traversal signature detection intercepts request with 403 Forbidden');

    // 14. MedScript Protocol Test: High-Assurance HTTP Security Headers
    assert(indexRes.headers['x-frame-options'] === 'DENY', 'High-assurance X-Frame-Options: DENY header present');
    assert(indexRes.headers['x-content-type-options'] === 'nosniff', 'X-Content-Type-Options: nosniff header present');
    assert(indexRes.headers['x-powered-by'] === undefined, 'Tech stack fingerprint X-Powered-By is suppressed');

    // 15. MedScript Protocol Test: API Response Cache Suppression
    assert(capsRes.headers['cache-control']?.includes('no-store'), 'API responses strictly enforce Cache-Control: no-store');

    console.log(`\n========================================`);
    console.log(`ALL AUDIT VERIFICATION TESTS PASSED (${passed}/${total})`);
    console.log(`========================================\n`);
  } finally {
    serverProc.kill();
  }
}

runTests().catch((err) => {
  console.error('[TEST FATAL]', err);
  process.exit(1);
});

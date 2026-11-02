import { useState, useCallback } from 'react';
import { getBridgeToken } from '../services/hardwareBridgeClient';

export interface ScopedExecOptions {
  appId: string;
  appToken?: string;
  scope?: 'read' | 'write' | 'root';
  pty?: boolean;
  cwd?: string;
  env?: Record<string, string>;
  timeoutMs?: number;
}

export interface ExecResult {
  ok: boolean;
  id?: string;
  pid?: number;
  pty?: boolean;
  state?: string;
  cmd?: string;
  error?: string;
}

export function useScopedExec(defaultAppId: string, defaultToken?: string) {
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<ExecResult | null>(null);

  const exec = useCallback(
    async (cmd: string, opts?: Partial<ScopedExecOptions>): Promise<ExecResult> => {
      setRunning(true);
      try {
        const appId = opts?.appId || defaultAppId;
        const appToken = opts?.appToken || defaultToken;
        const scope = opts?.scope || 'read';

        const headers: Record<string, string> = {
          'content-type': 'application/json',
          'x-lrd-app-id': appId,
        };

        const bridgeToken = getBridgeToken();
        if (bridgeToken) headers['x-lrd-token'] = bridgeToken;
        if (appToken) headers['x-lrd-app-token'] = appToken;

        const res = await fetch('/api/host/exec', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            cmd,
            scope,
            pty: opts?.pty !== false,
            cwd: opts?.cwd,
            env: opts?.env,
            timeoutMs: opts?.timeoutMs,
          }),
        });

        const data: ExecResult = await res.json();
        setLastResult(data);
        return data;
      } catch (err: any) {
        const failure: ExecResult = { ok: false, error: String(err?.message || err) };
        setLastResult(failure);
        return failure;
      } finally {
        setRunning(false);
      }
    },
    [defaultAppId, defaultToken]
  );

  return { exec, running, lastResult };
}

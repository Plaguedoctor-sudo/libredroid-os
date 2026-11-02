import { useEffect } from 'react';

/**
 * When a native app is focused, the shell's own virtual keyboard is wrong —
 * the OSK must be a compositor surface above the app. So: hide ours, show theirs.
 */
export function OSKBridge({ nativeFocused }: { nativeFocused: boolean }) {
  useEffect(() => {
    fetch('/api/wm/osk', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: nativeFocused ? 'show' : 'hide' }),
    }).catch(() => {});
  }, [nativeFocused]);
  return null;
}

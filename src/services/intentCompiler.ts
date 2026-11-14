/**
 * Sovereign AI Intent Compiler
 * Zero-cloud deterministic intent grammar for system control.
 * Matches native application/ai/intent/src/grammar.rs and compiler.rs
 */

export type SovereignCommand =
  | { type: 'AdjustBrightness'; value: number }
  | { type: 'SetVolume'; value: number }
  | { type: 'ToggleAirplaneMode'; enable: boolean }
  | { type: 'ToggleWifi'; enable: boolean }
  | { type: 'ToggleBluetooth'; enable: boolean }
  | { type: 'ToggleTor'; enable: boolean }
  | { type: 'FreezeApp'; target: string }
  | { type: 'LaunchApp'; target: string }
  | { type: 'MuteMicrophone'; mute: boolean }
  | { type: 'DialNumber'; number: string }
  | { type: 'SendSms'; recipient: string; message: string }
  | { type: 'EmergencyPanicLock' }
  | { type: 'GetSystemStatus' }
  | { type: 'Unknown'; raw: string };

export class IntentCompiler {
  public static compile(naturalInput: string): SovereignCommand {
    const inputLower = naturalInput.toLowerCase().trim();
    const trimmed = naturalInput.trim();

    // 1. Microphone controls
    if (inputLower.includes('mute mic') || inputLower.includes('mute microphone') || inputLower.includes('disable mic')) {
      return { type: 'MuteMicrophone', mute: true };
    }
    if (inputLower.includes('unmute mic') || inputLower.includes('unmute microphone') || inputLower.includes('enable mic')) {
      return { type: 'MuteMicrophone', mute: false };
    }

    // 2. Airplane mode
    if (inputLower.includes('airplane mode on') || inputLower.includes('enable airplane mode') || inputLower === 'flight mode on') {
      return { type: 'ToggleAirplaneMode', enable: true };
    }
    if (inputLower.includes('airplane mode off') || inputLower.includes('disable airplane mode') || inputLower === 'flight mode off') {
      return { type: 'ToggleAirplaneMode', enable: false };
    }

    // 3. Wi-Fi controls
    if (inputLower.includes('turn on wifi') || inputLower.includes('enable wifi') || inputLower === 'wifi on') {
      return { type: 'ToggleWifi', enable: true };
    }
    if (inputLower.includes('turn off wifi') || inputLower.includes('disable wifi') || inputLower === 'wifi off') {
      return { type: 'ToggleWifi', enable: false };
    }

    // 4. Bluetooth controls
    if (inputLower.includes('turn on bluetooth') || inputLower.includes('enable bluetooth') || inputLower === 'bluetooth on') {
      return { type: 'ToggleBluetooth', enable: true };
    }
    if (inputLower.includes('turn off bluetooth') || inputLower.includes('disable bluetooth') || inputLower === 'bluetooth off') {
      return { type: 'ToggleBluetooth', enable: false };
    }

    // 5. Tor anonymity circuit
    if (inputLower.includes('enable tor') || inputLower.includes('onion routing on') || inputLower === 'tor on') {
      return { type: 'ToggleTor', enable: true };
    }
    if (inputLower.includes('disable tor') || inputLower.includes('onion routing off') || inputLower === 'tor off') {
      return { type: 'ToggleTor', enable: false };
    }

    // 6. Volume controls
    if (inputLower.startsWith('set volume to ') || inputLower.startsWith('volume ')) {
      const digits = inputLower.replace(/\D/g, '');
      const val = parseInt(digits, 10);
      if (!isNaN(val)) {
        return { type: 'SetVolume', value: Math.min(100, Math.max(0, val)) };
      }
    }

    // 7. Brightness controls
    if (inputLower.startsWith('set brightness to ') || inputLower.startsWith('brightness ')) {
      const digits = inputLower.replace(/\D/g, '');
      const val = parseInt(digits, 10);
      if (!isNaN(val)) {
        return { type: 'AdjustBrightness', value: Math.min(100, Math.max(0, val)) };
      }
    }

    // 8. Panic / Emergency Lock
    if (
      inputLower.includes('panic lock') ||
      inputLower.includes('emergency lock') ||
      inputLower === 'lock system' ||
      inputLower === 'lock device' ||
      inputLower === 'lock'
    ) {
      return { type: 'EmergencyPanicLock' };
    }

    // 9. System status
    if (
      inputLower.includes('system status') ||
      inputLower.includes('device health') ||
      inputLower === 'status' ||
      inputLower === 'health'
    ) {
      return { type: 'GetSystemStatus' };
    }

    // 10. Call / Dial
    if (inputLower.startsWith('call ') || inputLower.startsWith('dial ')) {
      const num = trimmed.replace(/^(call|dial)[:\s]*/i, '').trim();
      return { type: 'DialNumber', number: num };
    }

    // 11. SMS
    if (inputLower.startsWith('sms ') || inputLower.startsWith('text ') || inputLower.startsWith('message ')) {
      const rest = trimmed.replace(/^(sms|text|message)[:\s]*/i, '').trim();
      const firstSpace = rest.indexOf(' ');
      const recipient = firstSpace > 0 ? rest.slice(0, firstSpace) : rest;
      const message = firstSpace > 0 ? rest.slice(firstSpace + 1) : '';
      return { type: 'SendSms', recipient, message };
    }

    // 12. App lifecycle
    if (inputLower.startsWith('launch ') || inputLower.startsWith('open ') || inputLower.startsWith('run ')) {
      const app = trimmed.split(/\s+/).slice(1).join(' ');
      return { type: 'LaunchApp', target: app };
    }
    if (inputLower.startsWith('freeze ') || inputLower.startsWith('close ') || inputLower.startsWith('kill app ')) {
      const app = trimmed.split(/\s+/).slice(1).join(' ');
      return { type: 'FreezeApp', target: app };
    }

    return { type: 'Unknown', raw: naturalInput };
  }
}

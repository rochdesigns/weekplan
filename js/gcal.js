import * as store from './store.js';

// Set this to your Google Cloud OAuth client ID to enable live sync.
// While empty, the feature stays dormant and the app is fully usable without it.
export const CLIENT_ID = '';

export function isConfigured() { return CLIENT_ID.trim().length > 0; }

export async function isConnected() {
  const s = await store.getSettings();
  return s.connectedCalendars.includes('google');
}

export async function connect() {
  if (!isConfigured()) {
    return { ok: false, reason: 'not-configured' };
  }
  // FUTURE: load Google Identity Services, run read-only OAuth consent here,
  // store the token, then call fetchWeekEvents() on render.
  const s = await store.getSettings();
  if (!s.connectedCalendars.includes('google')) {
    s.connectedCalendars.push('google');
    await store.saveSettings(s);
  }
  return { ok: true };
}

export async function disconnect() {
  const s = await store.getSettings();
  s.connectedCalendars = s.connectedCalendars.filter(c => c !== 'google');
  await store.saveSettings(s);
}

// Dormant seam: when wired, this fetches read-only events for the week
// (Mon..Sun of `monday`) and maps them to Block objects with category:'synced',
// calendarId:'google'. Returns [] until configured + connected.
export async function fetchWeekEvents(/* monday */) {
  return [];
}

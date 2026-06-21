const KEY = {
  blocks:   wk => `weekplan:blocks:${wk}`,
  targets:  wk => `weekplan:targets:${wk}`,
  note:     d  => `weekplan:notes:${d}`,
  settings: 'weekplan:settings',
};

export function uuid() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  // Fallback for older browsers / Node without global webcrypto
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function readJSON(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v == null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
}
function writeJSON(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

export async function getBlocks(wk)        { return readJSON(KEY.blocks(wk), []); }
export async function saveBlocks(wk, list) { writeJSON(KEY.blocks(wk), list); }

export async function getTargets(wk)        { return readJSON(KEY.targets(wk), []); }
export async function saveTargets(wk, list) { writeJSON(KEY.targets(wk), list); }

export async function getNote(dateStr) { return localStorage.getItem(KEY.note(dateStr)) || ''; }
export async function saveNote(dateStr, text) {
  if (text && text.trim()) localStorage.setItem(KEY.note(dateStr), text);
  else localStorage.removeItem(KEY.note(dateStr));
}
export async function getNotesForWeek(dateStrs) {
  const out = {};
  for (const d of dateStrs) out[d] = await getNote(d);
  return out;
}

export async function getSettings()   { return readJSON(KEY.settings, { connectedCalendars: [] }); }
export async function saveSettings(s) { writeJSON(KEY.settings, s); }

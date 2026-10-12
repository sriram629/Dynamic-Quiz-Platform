const PREFIX = "dynamic-quiz:v1:";
export function readStored(key, fallback, session = false) {
  try {
    const value = (
      session ? window.sessionStorage : window.localStorage
    ).getItem(PREFIX + key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}
export function writeStored(key, value, session = false) {
  try {
    (session ? window.sessionStorage : window.localStorage).setItem(
      PREFIX + key,
      JSON.stringify(value),
    );
    return true;
  } catch {
    return false;
  }
}
export function removeStored(key, session = false) {
  try {
    (session ? window.sessionStorage : window.localStorage).removeItem(
      PREFIX + key,
    );
  } catch {}
}

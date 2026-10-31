export const MOTION_PREFERENCE_EVENT = "shortlink:motion-preference-change";
const STORAGE_KEY = "shortlink:motion-preference";

export function isMotionEnabled() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "on") return true;
    if (saved === "off") return false;
  } catch {
    // Fall back to the device preference when storage is unavailable.
  }
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function applyMotionPreference() {
  const enabled = isMotionEnabled();
  document.documentElement.classList.toggle("motion-enabled", enabled);
  document.documentElement.classList.toggle("motion-disabled", !enabled);
  return enabled;
}

export function setMotionEnabled(enabled) {
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  } catch {
    // The preference still applies for this page session.
  }
  applyMotionPreference();
  window.dispatchEvent(new Event(MOTION_PREFERENCE_EVENT));
}

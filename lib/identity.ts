// Anonymous per-browser identity for the community feature — no accounts.
// A random device ID dedupes votes/favorites; a username (no password)
// attributes submitted topics. Both live in localStorage only.

const DEVICE_ID_KEY = "vus-device-id";
const USERNAME_KEY = "vus-username";

export function getDeviceId(): string {
  if (typeof localStorage === "undefined") {
    throw new Error("localStorage is not available in this environment.");
  }
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function getUsername(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(USERNAME_KEY);
}

export function setUsername(name: string): void {
  localStorage.setItem(USERNAME_KEY, name.trim());
}

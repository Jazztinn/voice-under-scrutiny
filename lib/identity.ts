// Anonymous per-browser identity for the community feature — no accounts.
// A random device ID dedupes votes/favorites. Lives in localStorage only.

const DEVICE_ID_KEY = "vus-device-id";

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

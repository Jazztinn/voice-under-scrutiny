import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export type Pitch = {
  id: string;
  topic: string;
  audioBlob: Blob; // stored directly in IndexedDB (webm/opus or mp4)
  mimeType: string;
  durationSec: number;
  transcript: string | null; // null until transcribed
  feedback: null; // reserved slot for future AI feedback
  createdAt: number; // Date.now()
};

interface PitchDB extends DBSchema {
  pitches: {
    key: string;
    value: Pitch;
    indexes: { "by-createdAt": number };
  };
}

const DB_NAME = "voice-under-scrutiny";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<PitchDB>> | null = null;

function getDB() {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB is not available in this environment.");
  }
  if (!dbPromise) {
    dbPromise = openDB<PitchDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore("pitches", { keyPath: "id" });
        store.createIndex("by-createdAt", "createdAt");
      },
    });
  }
  return dbPromise;
}

export async function addPitch(pitch: Pitch): Promise<void> {
  const db = await getDB();
  await db.add("pitches", pitch);
}

export async function updatePitch(pitch: Pitch): Promise<void> {
  const db = await getDB();
  await db.put("pitches", pitch);
}

/** All pitches, newest first. */
export async function getAllPitches(): Promise<Pitch[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex("pitches", "by-createdAt");
  return all.reverse();
}

export async function deletePitch(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("pitches", id);
}

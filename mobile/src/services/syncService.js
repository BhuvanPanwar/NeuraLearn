/**
 * Cloud sync service — keeps local AsyncStorage in sync with Firestore.
 * All writes go to local storage first (offline-first), then mirror to cloud.
 */

import { auth, userDoc, cylindersCol, logsCol } from '../config/firebase';
import {
  getUserProfile, saveUserProfile,
  getCurrentCylinder, saveCurrentCylinder,
  getCylinderHistory, addCylinderToHistory,
  getDailyLogs, saveDayLog,
} from '../utils/storage';

function uid() {
  return auth().currentUser?.uid;
}

// ─── Profile Sync ─────────────────────────────────────────────────────────────

export async function pushProfileToCloud(profile) {
  const id = uid();
  if (!id) return;
  await userDoc(id).set({ profile, updatedAt: new Date().toISOString() }, { merge: true });
}

export async function pullProfileFromCloud() {
  const id = uid();
  if (!id) return null;
  const snap = await userDoc(id).get();
  if (!snap.exists) return null;
  const data = snap.data();
  if (data?.profile) {
    await saveUserProfile(data.profile);
    return data.profile;
  }
  return null;
}

// ─── Cylinder Sync ────────────────────────────────────────────────────────────

export async function pushCurrentCylinderToCloud(cylinder) {
  const id = uid();
  if (!id || !cylinder) return;
  await cylindersCol(id).doc('current').set(cylinder);
}

export async function pushCylinderHistoryToCloud(historyItem) {
  const id = uid();
  if (!id) return;
  await cylindersCol(id).doc(historyItem.id || Date.now().toString()).set(historyItem);
}

export async function pullCylindersFromCloud() {
  const id = uid();
  if (!id) return;

  // Pull current cylinder
  const currentSnap = await cylindersCol(id).doc('current').get();
  if (currentSnap.exists) {
    await saveCurrentCylinder(currentSnap.data());
  }

  // Pull history (all docs except 'current')
  const histSnap = await cylindersCol(id).where('endDate', '!=', null).get();
  for (const doc of histSnap.docs) {
    await addCylinderToHistory(doc.data());
  }
}

// ─── Daily Logs Sync ──────────────────────────────────────────────────────────

export async function pushDayLogToCloud(dateKey, log) {
  const id = uid();
  if (!id) return;
  await logsCol(id).doc(dateKey).set({ ...log, dateKey });
}

export async function pullLogsFromCloud() {
  const id = uid();
  if (!id) return;
  const snap = await logsCol(id).get();
  for (const doc of snap.docs) {
    const data = doc.data();
    await saveDayLog(data.dateKey, data);
  }
}

// ─── Full Sync (called on app start after login) ──────────────────────────────

export async function fullSyncFromCloud() {
  try {
    await Promise.all([
      pullProfileFromCloud(),
      pullCylindersFromCloud(),
      pullLogsFromCloud(),
    ]);
  } catch (e) {
    // Silently fail — local data still works offline
    console.warn('Cloud sync failed (offline?):', e.message);
  }
}

/**
 * Push all local data to cloud — used after first login to back up existing data.
 */
export async function backfillLocalDataToCloud() {
  const id = uid();
  if (!id) return;

  try {
    const [profile, current, history, logs] = await Promise.all([
      getUserProfile(),
      getCurrentCylinder(),
      getCylinderHistory(),
      getDailyLogs(),
    ]);

    const ops = [];

    if (profile) ops.push(pushProfileToCloud(profile));
    if (current) ops.push(pushCurrentCylinderToCloud(current));
    if (history?.length) ops.push(...history.map(c => pushCylinderHistoryToCloud(c)));
    if (logs) {
      for (const [dateKey, log] of Object.entries(logs)) {
        ops.push(pushDayLogToCloud(dateKey, log));
      }
    }

    await Promise.all(ops);
  } catch (e) {
    console.warn('Backfill failed:', e.message);
  }
}

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  USER_PROFILE:      'lpgtrack:user_profile',
  CURRENT_CYLINDER:  'lpgtrack:current_cylinder',
  CYLINDER_HISTORY:  'lpgtrack:cylinder_history',
  DAILY_LOGS:        'lpgtrack:daily_logs',
  ONBOARDING_DONE:   'lpgtrack:onboarding_done',
};

// ─── User Profile ────────────────────────────────────────────────────────────

export async function saveUserProfile(profile) {
  await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
}

export async function getUserProfile() {
  const raw = await AsyncStorage.getItem(KEYS.USER_PROFILE);
  return raw ? JSON.parse(raw) : null;
}

// ─── Onboarding Flag ─────────────────────────────────────────────────────────

export async function setOnboardingDone() {
  await AsyncStorage.setItem(KEYS.ONBOARDING_DONE, 'true');
}

export async function isOnboardingDone() {
  const val = await AsyncStorage.getItem(KEYS.ONBOARDING_DONE);
  return val === 'true';
}

// ─── Current Cylinder ────────────────────────────────────────────────────────

export async function saveCurrentCylinder(cylinder) {
  await AsyncStorage.setItem(KEYS.CURRENT_CYLINDER, JSON.stringify(cylinder));
}

export async function getCurrentCylinder() {
  const raw = await AsyncStorage.getItem(KEYS.CURRENT_CYLINDER);
  return raw ? JSON.parse(raw) : null;
}

export async function clearCurrentCylinder() {
  await AsyncStorage.removeItem(KEYS.CURRENT_CYLINDER);
}

// ─── Cylinder History ─────────────────────────────────────────────────────────

export async function getCylinderHistory() {
  const raw = await AsyncStorage.getItem(KEYS.CYLINDER_HISTORY);
  return raw ? JSON.parse(raw) : [];
}

export async function addCylinderToHistory(cylinder) {
  const history = await getCylinderHistory();
  history.unshift(cylinder); // newest first
  await AsyncStorage.setItem(KEYS.CYLINDER_HISTORY, JSON.stringify(history));
}

// ─── Daily Logs ───────────────────────────────────────────────────────────────

export async function getDailyLogs() {
  const raw = await AsyncStorage.getItem(KEYS.DAILY_LOGS);
  return raw ? JSON.parse(raw) : {};
}

/**
 * Save a day's log. dateKey format: "YYYY-MM-DD"
 * log = { activities: ['tea', 'breakfast', 'lunch', 'dinner'], note: '' }
 */
export async function saveDayLog(dateKey, log) {
  const logs = await getDailyLogs();
  logs[dateKey] = { ...log, updatedAt: new Date().toISOString() };
  await AsyncStorage.setItem(KEYS.DAILY_LOGS, JSON.stringify(logs));
}

export async function getDayLog(dateKey) {
  const logs = await getDailyLogs();
  return logs[dateKey] || null;
}

// ─── Full Reset (for testing / new install) ──────────────────────────────────

export async function clearAllData() {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}

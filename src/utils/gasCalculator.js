// Standard Indian domestic LPG cylinder capacity in grams
export const CYLINDER_CAPACITY_GRAMS = 14200;

// Average cylinder lifespan in days by family size (based on Indian household data)
const BASE_DAYS_BY_FAMILY_SIZE = {
  1: 65,
  2: 48,
  3: 38,
  4: 32,
  5: 27,
  6: 23,
  7: 20,
  8: 17,
};

// Grams consumed per cooking event (average Indian kitchen)
export const CONSUMPTION_PER_ACTIVITY = {
  tea:       15,  // 1-2 cups of chai
  breakfast: 55,  // typical Indian breakfast
  lunch:    130,  // dal/sabzi/roti
  dinner:   160,  // full dinner with multiple dishes
  extra:     50,  // snacks, reheating, pressure cooking extras
};

// Multiplier based on cooking style
const COOKING_STYLE_MULTIPLIER = {
  simple:    0.80, // minimal cooking, fewer dishes
  moderate:  1.00, // typical Indian household
  elaborate: 1.30, // extensive daily cooking
};

/**
 * Returns estimated total lifespan (days) for a cylinder based on user profile.
 */
export function getEstimatedCylinderDays(familySize, cookingStyle = 'moderate', historicalAvgDays = null) {
  const clampedSize = Math.min(Math.max(familySize, 1), 8);
  const baseDays = BASE_DAYS_BY_FAMILY_SIZE[clampedSize] || 32;
  const multiplier = COOKING_STYLE_MULTIPLIER[cookingStyle] || 1.0;
  const profileDays = Math.round(baseDays / multiplier);

  if (historicalAvgDays && historicalAvgDays > 10) {
    // Blend profile estimate (40%) with personal history (60%)
    return Math.round(historicalAvgDays * 0.6 + profileDays * 0.4);
  }
  return profileDays;
}

/**
 * Returns daily consumption in grams based on estimated cylinder lifespan.
 */
export function getDailyConsumptionGrams(estimatedDays) {
  return CYLINDER_CAPACITY_GRAMS / estimatedDays;
}

/**
 * Calculates total grams consumed so far based on:
 * - Days elapsed since cylinder start
 * - Logged daily activities (array of activity objects)
 * - Profile-based base consumption
 */
export function calculateConsumedGrams(startDate, dailyLogs, estimatedDays) {
  const now = new Date();
  const start = new Date(startDate);
  const daysElapsed = Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));

  const baseDaily = getDailyConsumptionGrams(estimatedDays);

  let totalConsumed = 0;

  for (let i = 0; i < daysElapsed; i++) {
    const dateKey = getDateKey(new Date(start.getTime() + i * 86400000));
    const log = dailyLogs[dateKey];

    if (log && log.activities && log.activities.length > 0) {
      // Use actual logged data for this day
      const loggedGrams = log.activities.reduce((sum, activity) => {
        return sum + (CONSUMPTION_PER_ACTIVITY[activity] || 0);
      }, 0);
      totalConsumed += loggedGrams;
    } else {
      // Fall back to profile-based estimate for un-logged days
      totalConsumed += baseDaily;
    }
  }

  return Math.min(totalConsumed, CYLINDER_CAPACITY_GRAMS);
}

/**
 * Returns remaining gas as a percentage (0–100).
 */
export function getRemainingPercent(startDate, dailyLogs, estimatedDays) {
  const consumed = calculateConsumedGrams(startDate, dailyLogs, estimatedDays);
  return Math.max(0, Math.round(((CYLINDER_CAPACITY_GRAMS - consumed) / CYLINDER_CAPACITY_GRAMS) * 100));
}

/**
 * Returns estimated days remaining before the cylinder runs out.
 */
export function getDaysRemaining(startDate, dailyLogs, estimatedDays) {
  const consumed = calculateConsumedGrams(startDate, dailyLogs, estimatedDays);
  const remaining = CYLINDER_CAPACITY_GRAMS - consumed;
  const dailyRate = getDailyConsumptionGrams(estimatedDays);
  return Math.max(0, Math.round(remaining / dailyRate));
}

/**
 * Returns the urgency level based on remaining percent.
 * 'safe' | 'low' | 'critical'
 */
export function getUrgencyLevel(remainingPercent) {
  if (remainingPercent > 30) return 'safe';
  if (remainingPercent > 15) return 'low';
  return 'critical';
}

/**
 * Computes the historical average cylinder lifespan from past records.
 */
export function computeHistoricalAverage(cylinderHistory) {
  if (!cylinderHistory || cylinderHistory.length < 2) return null;
  const durations = cylinderHistory
    .filter(c => c.endDate)
    .map(c => {
      const start = new Date(c.startDate);
      const end = new Date(c.endDate);
      return Math.round((end - start) / (1000 * 60 * 60 * 24));
    })
    .filter(d => d > 5 && d < 120); // sanity check

  if (durations.length === 0) return null;
  return Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
}

/**
 * Returns a YYYY-MM-DD string key for a Date object.
 */
export function getDateKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Returns today's date key.
 */
export function todayKey() {
  return getDateKey(new Date());
}

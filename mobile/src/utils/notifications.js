import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ─── Daily Reminder ──────────────────────────────────────────────────────────

export async function scheduleDailyReminder(hour = 20, minute = 0) {
  await cancelDailyReminder();
  await Notifications.scheduleNotificationAsync({
    identifier: 'daily_log_reminder',
    content: {
      title: '🍳 आज का खाना लॉग करें',
      body: 'अपना खाना लॉग करें और जानें कितना गैस बचा है!',
    },
    trigger: {
      hour,
      minute,
      repeats: true,
    },
  });
}

export async function cancelDailyReminder() {
  await Notifications.cancelScheduledNotificationAsync('daily_log_reminder');
}

// ─── Low Gas Alert ───────────────────────────────────────────────────────────

export async function scheduleLowGasAlert(daysRemaining, remainingPercent) {
  await Notifications.cancelScheduledNotificationAsync('low_gas_alert');

  if (remainingPercent > 30) return;

  const isUrgent = remainingPercent <= 15;
  await Notifications.scheduleNotificationAsync({
    identifier: 'low_gas_alert',
    content: {
      title: isUrgent ? '🚨 गैस लगभग खत्म!' : '⚠️ गैस कम हो रही है',
      body: isUrgent
        ? `सिर्फ ${daysRemaining} दिन का गैस बचा है। अभी बुक करें!`
        : `लगभग ${daysRemaining} दिन का गैस बचा है (${remainingPercent}%). नया सिलेंडर बुक करें।`,
      data: { screen: 'Home' },
    },
    trigger: null, // fire immediately
  });
}

// ─── Cylinder Booking Reminder ───────────────────────────────────────────────

export async function scheduleBookingReminder(daysUntilEmpty) {
  await Notifications.cancelScheduledNotificationAsync('booking_reminder');

  // Remind 5 days before estimated empty date
  const triggerDays = Math.max(0, daysUntilEmpty - 5);
  if (triggerDays === 0) return;

  const triggerDate = new Date();
  triggerDate.setDate(triggerDate.getDate() + triggerDays);
  triggerDate.setHours(10, 0, 0, 0);

  await Notifications.scheduleNotificationAsync({
    identifier: 'booking_reminder',
    content: {
      title: '📋 सिलेंडर बुक करने का समय',
      body: 'लगभग 5 दिन में गैस खत्म होगा। अभी नया सिलेंडर बुक करें।',
      data: { screen: 'Home' },
    },
    trigger: { date: triggerDate },
  });
}

// ─── Immediate Test Notification ─────────────────────────────────────────────

export async function sendTestNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '✅ नोटिफिकेशन चालू है!',
      body: 'LPG Track आपको समय पर सूचना देगा।',
    },
    trigger: null,
  });
}

import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert, Switch,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SUPPORTED_LANGUAGES, getStrings } from '../constants/languages';
import { COOKING_STYLES } from '../constants/gasProfiles';
import { getUserProfile, saveUserProfile } from '../utils/storage';
import {
  scheduleDailyReminder, cancelDailyReminder,
  sendTestNotification, requestNotificationPermission,
} from '../utils/notifications';

const REMINDER_HOURS = [
  { label: '7:00 AM', value: 7 },
  { label: '8:00 PM', value: 20 },
  { label: '9:00 PM', value: 21 },
  { label: '10:00 PM', value: 22 },
];

export default function SettingsScreen({ route, navigation }) {
  const routeLang = route?.params?.lang || 'hi';

  const [lang,           setLang]         = useState(routeLang);
  const [familySize,     setFamilySize]   = useState(4);
  const [cookingStyle,   setCooking]      = useState('moderate');
  const [notifEnabled,   setNotif]        = useState(true);
  const [reminderHour,   setReminderHour] = useState(20);
  const [saved,          setSaved]        = useState(false);

  const t = getStrings(lang);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  async function loadProfile() {
    const profile = await getUserProfile();
    if (!profile) return;
    setLang(profile.lang || 'hi');
    setFamilySize(profile.familySize || 4);
    setCooking(profile.cookingStyle || 'moderate');
    setNotif(profile.notifEnabled !== false);
    setReminderHour(profile.reminderHour || 20);
  }

  async function handleSave() {
    const profile = {
      lang, familySize, cookingStyle, notifEnabled,
      reminderHour, updatedAt: new Date().toISOString(),
    };
    await saveUserProfile(profile);

    if (notifEnabled) {
      await requestNotificationPermission();
      await scheduleDailyReminder(reminderHour, 0);
    } else {
      await cancelDailyReminder();
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);

    if (navigation && navigation.setParams) {
      navigation.setParams({ lang });
    }
  }

  async function handleTestNotification() {
    const granted = await requestNotificationPermission();
    if (!granted) {
      Alert.alert(
        lang === 'hi' ? 'अनुमति नहीं' : 'Permission Denied',
        lang === 'hi' ? 'सेटिंग्स में नोटिफिकेशन चालू करें' : 'Enable notifications in Settings'
      );
      return;
    }
    await sendTestNotification();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={styles.pageTitle}>⚙️ {t.settings}</Text>

        {/* Language */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌐 {t.language}</Text>
          <View style={styles.langGrid}>
            {SUPPORTED_LANGUAGES.map(l => (
              <TouchableOpacity
                key={l.code}
                style={[styles.langChip, lang === l.code && styles.langChipActive]}
                onPress={() => { setLang(l.code); setSaved(false); }}
              >
                <Text style={[styles.langChipText, lang === l.code && styles.langChipTextActive]}>
                  {l.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Family Size */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👨‍👩‍👧 {t.familySizeLabel}</Text>
          <View style={styles.sizeRow}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
              <TouchableOpacity
                key={n}
                style={[styles.sizeChip, familySize === n && styles.sizeChipActive]}
                onPress={() => { setFamilySize(n); setSaved(false); }}
              >
                <Text style={[styles.sizeText, familySize === n && styles.sizeTextActive]}>
                  {n}{n === 8 ? '+' : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Cooking Style */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🍳 {t.cookingStyle}</Text>
          {COOKING_STYLES.map(s => (
            <TouchableOpacity
              key={s.id}
              style={[styles.styleRow, cookingStyle === s.id && styles.styleRowActive]}
              onPress={() => { setCooking(s.id); setSaved(false); }}
            >
              <Text style={styles.styleEmoji}>{s.icon}</Text>
              <Text style={[styles.styleLabel, cookingStyle === s.id && styles.styleLabelActive]}>
                {t[s.labelKey]}
              </Text>
              {cookingStyle === s.id && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 {t.notifications}</Text>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>
              {lang === 'hi' ? 'नोटिफिकेशन चालू/बंद' : 'Enable Notifications'}
            </Text>
            <Switch
              value={notifEnabled}
              onValueChange={v => { setNotif(v); setSaved(false); }}
              trackColor={{ false: '#DDD', true: '#FF6B35' }}
              thumbColor="#FFF"
            />
          </View>

          {notifEnabled && (
            <>
              <Text style={styles.reminderLabel}>{t.reminderTime}</Text>
              <View style={styles.timeRow}>
                {REMINDER_HOURS.map(h => (
                  <TouchableOpacity
                    key={h.value}
                    style={[styles.timeChip, reminderHour === h.value && styles.timeChipActive]}
                    onPress={() => { setReminderHour(h.value); setSaved(false); }}
                  >
                    <Text style={[styles.timeText, reminderHour === h.value && styles.timeTextActive]}>
                      {h.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.testBtn} onPress={handleTestNotification}>
                <Text style={styles.testBtnText}>🔔 {t.testNotification}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Account / Cloud Sync */}
        {/* App info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>CylinderSathi v1.0.0</Text>
          <Text style={styles.infoText}>
            {lang === 'hi'
              ? '🇮🇳 भारत के 30 करोड़ घरों के लिए बनाया गया'
              : '🇮🇳 Built for 300 million Indian homes'}
          </Text>
        </View>

      </ScrollView>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveBtn, saved && styles.saveBtnDone]}
        onPress={handleSave}
      >
        <Text style={styles.saveBtnText}>
          {saved ? `✅ ${lang === 'hi' ? 'सहेजा गया' : 'Saved!'}` : `💾 ${t.saveSettings}`}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: '#FFF8F0' },
  scroll:        { padding: 20, paddingBottom: 20 },
  pageTitle:     { fontSize: 26, fontWeight: '800', color: '#FF6B35', marginBottom: 20 },

  section:       { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#FFD9B3' },
  sectionTitle:  { fontSize: 15, fontWeight: '700', color: '#555', marginBottom: 12 },

  // Language
  langGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  langChip:      { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#FFD9B3', backgroundColor: '#F9F9F9' },
  langChipActive:{ borderColor: '#FF6B35', backgroundColor: '#FFF0E6' },
  langChipText:  { fontSize: 14, color: '#666', fontWeight: '500' },
  langChipTextActive: { color: '#FF6B35', fontWeight: '700' },

  // Family size
  sizeRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sizeChip:      { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: '#FFD9B3', alignItems: 'center', justifyContent: 'center' },
  sizeChipActive:{ borderColor: '#FF6B35', backgroundColor: '#FFF0E6' },
  sizeText:      { fontSize: 16, color: '#666', fontWeight: '600' },
  sizeTextActive:{ color: '#FF6B35' },

  // Cooking style
  styleRow:      { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 12, marginBottom: 8, borderWidth: 1.5, borderColor: 'transparent', gap: 10 },
  styleRowActive:{ borderColor: '#FF6B35', backgroundColor: '#FFF0E6' },
  styleEmoji:    { fontSize: 24 },
  styleLabel:    { flex: 1, fontSize: 15, color: '#555', fontWeight: '500' },
  styleLabelActive: { color: '#FF6B35', fontWeight: '700' },
  checkmark:     { fontSize: 18, color: '#FF6B35' },

  // Notifications
  toggleRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  toggleLabel:   { fontSize: 15, color: '#333', fontWeight: '500' },
  reminderLabel: { fontSize: 13, color: '#888', marginBottom: 8 },
  timeRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  timeChip:      { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#FFD9B3' },
  timeChipActive:{ borderColor: '#FF6B35', backgroundColor: '#FFF0E6' },
  timeText:      { fontSize: 14, color: '#666' },
  timeTextActive:{ color: '#FF6B35', fontWeight: '700' },
  testBtn:       { backgroundColor: '#FFF0E6', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#FF6B35' },
  testBtnText:   { color: '#FF6B35', fontWeight: '600', fontSize: 15 },

  // Account
  accountRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  // Info
  infoCard:      { backgroundColor: '#FFF', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#FFD9B3', gap: 4 },
  infoText:      { fontSize: 13, color: '#AAA' },

  // Save
  saveBtn:       { margin: 20, backgroundColor: '#FF6B35', borderRadius: 16, padding: 18, alignItems: 'center' },
  saveBtnDone:   { backgroundColor: '#4CAF50' },
  saveBtnText:   { color: '#FFF', fontSize: 18, fontWeight: '700' },
});

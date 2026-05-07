import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Dimensions,
} from 'react-native';
import { SUPPORTED_LANGUAGES, getStrings } from '../constants/languages';
import { COOKING_STYLES } from '../constants/gasProfiles';
import { saveUserProfile, setOnboardingDone } from '../utils/storage';
import { requestNotificationPermission, scheduleDailyReminder } from '../utils/notifications';

const { width } = Dimensions.get('window');
const STEPS = ['language', 'family', 'cooking', 'notifications'];

export default function OnboardingScreen({ navigation }) {
  const [step, setStep]             = useState(0);
  const [lang, setLang]             = useState('hi');
  const [familySize, setFamilySize] = useState(4);
  const [cookingStyle, setCooking]  = useState('moderate');

  const t = getStrings(lang);

  async function finish() {
    const profile = { lang, familySize, cookingStyle, createdAt: new Date().toISOString() };
    await saveUserProfile(profile);
    await setOnboardingDone();
    await requestNotificationPermission();
    await scheduleDailyReminder(20, 0);
    navigation.replace('MainTabs', { lang });
  }

  function next() {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else finish();
  }

  const isLast = step === STEPS.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress dots */}
      <View style={styles.dots}>
        {STEPS.map((_, i) => (
          <View key={i} style={[styles.dot, i <= step && styles.dotActive]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Step 0: Language ── */}
        {step === 0 && (
          <View style={styles.stepWrap}>
            <Text style={styles.emoji}>🌐</Text>
            <Text style={styles.title}>{t.selectLanguage}</Text>
            <View style={styles.grid}>
              {SUPPORTED_LANGUAGES.map(l => (
                <TouchableOpacity
                  key={l.code}
                  style={[styles.langCard, lang === l.code && styles.langCardActive]}
                  onPress={() => setLang(l.code)}
                >
                  <Text style={[styles.langLabel, lang === l.code && styles.langLabelActive]}>
                    {l.label}
                  </Text>
                  <Text style={styles.langSub}>{l.englishLabel}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── Step 1: Family Size ── */}
        {step === 1 && (
          <View style={styles.stepWrap}>
            <Text style={styles.emoji}>👨‍👩‍👧‍👦</Text>
            <Text style={styles.title}>{t.familySize}</Text>
            <View style={styles.familyRow}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                <TouchableOpacity
                  key={n}
                  style={[styles.numCard, familySize === n && styles.numCardActive]}
                  onPress={() => setFamilySize(n)}
                >
                  <Text style={[styles.numText, familySize === n && styles.numTextActive]}>
                    {n}{n === 8 ? '+' : ''}
                  </Text>
                  <Text style={styles.personIcon}>
                    {Array(Math.min(n, 4)).fill('👤').join('')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── Step 2: Cooking Style ── */}
        {step === 2 && (
          <View style={styles.stepWrap}>
            <Text style={styles.emoji}>🍳</Text>
            <Text style={styles.title}>{t.cookingStyle}</Text>
            {COOKING_STYLES.map(style => (
              <TouchableOpacity
                key={style.id}
                style={[styles.styleCard, cookingStyle === style.id && styles.styleCardActive]}
                onPress={() => setCooking(style.id)}
              >
                <Text style={styles.styleIcon}>{style.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.styleLabel, cookingStyle === style.id && styles.styleLabelActive]}>
                    {t[style.labelKey]}
                  </Text>
                  <Text style={styles.styleDesc}>{style.description}</Text>
                </View>
                {cookingStyle === style.id && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Step 3: Notifications ── */}
        {step === 3 && (
          <View style={styles.stepWrap}>
            <Text style={styles.emoji}>🔔</Text>
            <Text style={styles.title}>
              {lang === 'hi' ? 'नोटिफिकेशन चालू करें' : 'Enable Notifications'}
            </Text>
            <Text style={styles.subtitle}>
              {lang === 'hi'
                ? 'हम आपको हर शाम याद दिलाएंगे:\n• आज का खाना लॉग करने के लिए\n• गैस कम होने पर\n• बुकिंग करने का समय आने पर'
                : 'We will remind you every evening:\n• To log today\'s cooking\n• When gas is running low\n• When it\'s time to book a new cylinder'}
            </Text>
            <View style={styles.benefitBox}>
              <Text style={styles.benefitItem}>✅ {lang === 'hi' ? 'रोज़ शाम 8 बजे रिमाइंडर' : 'Daily 8 PM reminder'}</Text>
              <Text style={styles.benefitItem}>✅ {lang === 'hi' ? 'गैस कम होने का अलर्ट' : 'Low gas alert'}</Text>
              <Text style={styles.benefitItem}>✅ {lang === 'hi' ? 'सिलेंडर बुकिंग रिमाइंडर' : 'Cylinder booking reminder'}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.nextBtn} onPress={next}>
        <Text style={styles.nextBtnText}>
          {isLast ? t.getStarted : t.next} →
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#FFF8F0' },
  dots:       { flexDirection: 'row', justifyContent: 'center', paddingTop: 20, gap: 8 },
  dot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFD9B3' },
  dotActive:  { backgroundColor: '#FF6B35', width: 24 },
  content:    { padding: 24, paddingBottom: 40 },
  stepWrap:   { alignItems: 'center' },
  emoji:      { fontSize: 64, marginTop: 16, marginBottom: 8 },
  title:      { fontSize: 22, fontWeight: '700', color: '#2D1B00', textAlign: 'center', marginBottom: 24, lineHeight: 30 },
  subtitle:   { fontSize: 16, color: '#555', textAlign: 'center', lineHeight: 26, marginBottom: 24 },

  // Language grid
  grid:           { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', width: '100%' },
  langCard:       { width: (width - 72) / 2, padding: 16, borderRadius: 14, borderWidth: 2, borderColor: '#FFD9B3', backgroundColor: '#FFF', alignItems: 'center' },
  langCardActive: { borderColor: '#FF6B35', backgroundColor: '#FFF0E6' },
  langLabel:      { fontSize: 20, fontWeight: '700', color: '#555' },
  langLabelActive:{ color: '#FF6B35' },
  langSub:        { fontSize: 12, color: '#999', marginTop: 2 },

  // Family size
  familyRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  numCard:        { width: 80, height: 80, borderRadius: 16, borderWidth: 2, borderColor: '#FFD9B3', backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  numCardActive:  { borderColor: '#FF6B35', backgroundColor: '#FFF0E6' },
  numText:        { fontSize: 22, fontWeight: '700', color: '#555' },
  numTextActive:  { color: '#FF6B35' },
  personIcon:     { fontSize: 10, marginTop: 2 },

  // Cooking style
  styleCard:       { flexDirection: 'row', alignItems: 'center', width: '100%', padding: 16, borderRadius: 14, borderWidth: 2, borderColor: '#FFD9B3', backgroundColor: '#FFF', marginBottom: 12, gap: 12 },
  styleCardActive: { borderColor: '#FF6B35', backgroundColor: '#FFF0E6' },
  styleIcon:       { fontSize: 32 },
  styleLabel:      { fontSize: 16, fontWeight: '700', color: '#333' },
  styleLabelActive:{ color: '#FF6B35' },
  styleDesc:       { fontSize: 13, color: '#888', marginTop: 2 },
  checkmark:       { fontSize: 20, color: '#FF6B35' },

  // Benefits
  benefitBox:   { backgroundColor: '#FFF', borderRadius: 16, padding: 20, width: '100%', gap: 12, borderWidth: 1, borderColor: '#FFD9B3' },
  benefitItem:  { fontSize: 16, color: '#333', lineHeight: 24 },

  // Next button
  nextBtn:      { margin: 24, backgroundColor: '#FF6B35', borderRadius: 16, padding: 18, alignItems: 'center', shadowColor: '#FF6B35', shadowOpacity: 0.4, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8 },
  nextBtnText:  { color: '#FFF', fontSize: 18, fontWeight: '700' },
});

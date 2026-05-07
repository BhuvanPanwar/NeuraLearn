import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert, TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Speech from 'expo-speech';

import { getStrings } from '../constants/languages';
import { ACTIVITY_CONFIG, CONSUMPTION_PER_ACTIVITY } from '../constants/gasProfiles';
import { saveDayLog, getDayLog } from '../utils/storage';
import { todayKey, getDateKey } from '../utils/gasCalculator';

// Simple voice command parser — maps spoken words to activity IDs
function parseVoiceToActivities(text, lang) {
  const lower = text.toLowerCase();
  const found = [];

  const keywords = {
    tea:       lang === 'hi' ? ['चाय', 'tea', 'chai'] : ['tea', 'chai'],
    breakfast: lang === 'hi' ? ['नाश्ता', 'breakfast', 'nashta'] : ['breakfast', 'nashta'],
    lunch:     lang === 'hi' ? ['दोपहर', 'lunch', 'khana'] : ['lunch', 'afternoon'],
    dinner:    lang === 'hi' ? ['रात', 'dinner', 'raat'] : ['dinner', 'night meal'],
    extra:     lang === 'hi' ? ['अतिरिक्त', 'extra', 'frying', 'तलना'] : ['extra', 'frying', 'pressure'],
  };

  for (const [activity, words] of Object.entries(keywords)) {
    if (words.some(w => lower.includes(w))) found.push(activity);
  }
  return found;
}

export default function DailyLogScreen({ route }) {
  const lang = route?.params?.lang || 'hi';
  const t    = getStrings(lang);

  const [selected,   setSelected]   = useState([]);
  const [note,       setNote]       = useState('');
  const [saved,      setSaved]      = useState(false);
  const [isListening, setListening] = useState(false);
  const [voiceText,  setVoiceText]  = useState('');

  const dateKey   = todayKey();
  const todayStr  = new Date().toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  useFocusEffect(
    useCallback(() => {
      loadTodayLog();
      setSaved(false);
    }, [])
  );

  async function loadTodayLog() {
    const log = await getDayLog(dateKey);
    if (log) {
      setSelected(log.activities || []);
      setNote(log.note || '');
    } else {
      setSelected([]);
      setNote('');
    }
  }

  function toggleActivity(id) {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
    setSaved(false);
  }

  async function handleSave() {
    await saveDayLog(dateKey, { activities: selected, note });
    setSaved(true);
    // Speak confirmation in the selected language
    Speech.speak(
      lang === 'hi' ? 'खाना लॉग हो गया!' : 'Cooking logged!',
      { language: lang === 'hi' ? 'hi-IN' : 'en-IN', rate: 1.0 }
    );
  }

  // Simulated voice recognition (real impl uses expo-speech or react-native-voice)
  function handleVoice() {
    if (isListening) return;
    setListening(true);
    setVoiceText(t.listening);
    // In production, use Voice.start() from react-native-voice here.
    // For skeleton, simulate after 2s:
    setTimeout(() => {
      const simulated = lang === 'hi' ? 'आज चाय नाश्ता और दोपहर का खाना बनाया' : 'I made tea breakfast and lunch today';
      setVoiceText(simulated);
      const activities = parseVoiceToActivities(simulated, lang);
      setSelected(activities);
      setListening(false);
    }, 2000);
  }

  // Grams consumed today based on selected activities
  const totalGramsToday = selected.reduce((sum, a) => sum + (CONSUMPTION_PER_ACTIVITY[a] || 0), 0);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Date header */}
        <View style={styles.dateHeader}>
          <Text style={styles.dateLabel}>{todayStr}</Text>
          <Text style={styles.dateSubLabel}>
            {lang === 'hi' ? 'आज का खाना लॉग करें' : "Log today's cooking"}
          </Text>
        </View>

        {/* Voice Button */}
        <TouchableOpacity
          style={[styles.voiceBtn, isListening && styles.voiceBtnActive]}
          onPress={handleVoice}
          activeOpacity={0.8}
        >
          <Text style={styles.voiceBtnIcon}>{isListening ? '🎙️' : '🎤'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.voiceBtnLabel}>
              {isListening ? t.listening : (lang === 'hi' ? 'बोलकर बताएं' : 'Tell us by voice')}
            </Text>
            <Text style={styles.voiceHint}>
              {voiceText || t.voiceHint}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{lang === 'hi' ? 'या टैप करें' : 'or tap below'}</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Activity Grid */}
        <Text style={styles.sectionTitle}>
          {lang === 'hi' ? 'आज क्या बनाया?' : 'What did you cook today?'}
        </Text>
        <View style={styles.grid}>
          {ACTIVITY_CONFIG.map(activity => {
            const isOn = selected.includes(activity.id);
            return (
              <TouchableOpacity
                key={activity.id}
                style={[styles.actCard, isOn && { borderColor: activity.color, backgroundColor: activity.color + '18' }]}
                onPress={() => toggleActivity(activity.id)}
                activeOpacity={0.75}
              >
                <Text style={styles.actEmoji}>{activity.icon}</Text>
                <Text style={[styles.actLabel, isOn && { color: activity.color, fontWeight: '700' }]}>
                  {t[activity.id]}
                </Text>
                <Text style={styles.actGrams}>
                  ~{CONSUMPTION_PER_ACTIVITY[activity.id]}g
                </Text>
                {isOn && (
                  <View style={[styles.checkBadge, { backgroundColor: activity.color }]}>
                    <Text style={styles.checkBadgeText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Consumption estimate */}
        {selected.length > 0 && (
          <View style={styles.consumptionCard}>
            <Text style={styles.consumptionTitle}>
              🔥 {lang === 'hi' ? 'आज का अनुमानित उपयोग' : "Today's estimated usage"}
            </Text>
            <Text style={styles.consumptionValue}>{totalGramsToday}g LPG</Text>
            <Text style={styles.consumptionSub}>
              {lang === 'hi'
                ? `14.2 kg में से ${((totalGramsToday / 14200) * 100).toFixed(1)}% आज खर्च हुआ`
                : `${((totalGramsToday / 14200) * 100).toFixed(1)}% of 14.2 kg cylinder used today`}
            </Text>
          </View>
        )}

        {/* Note */}
        <TextInput
          style={styles.noteInput}
          placeholder={lang === 'hi' ? 'कोई नोट... (वैकल्पिक)' : 'Add a note... (optional)'}
          placeholderTextColor="#BBB"
          value={note}
          onChangeText={t => { setNote(t); setSaved(false); }}
          multiline
        />

      </ScrollView>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveBtn, saved && styles.saveBtnDone]}
        onPress={handleSave}
      >
        <Text style={styles.saveBtnText}>
          {saved ? `✅ ${t.logSaved}` : `💾 ${t.saveLog}`}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: '#FFF8F0' },
  scroll:            { padding: 20, paddingBottom: 20 },

  dateHeader:        { marginBottom: 20 },
  dateLabel:         { fontSize: 22, fontWeight: '800', color: '#FF6B35' },
  dateSubLabel:      { fontSize: 14, color: '#888', marginTop: 2 },

  // Voice
  voiceBtn:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, padding: 16, borderWidth: 2, borderColor: '#FFD9B3', gap: 12, marginBottom: 16 },
  voiceBtnActive:    { borderColor: '#FF6B35', backgroundColor: '#FFF0E6' },
  voiceBtnIcon:      { fontSize: 32 },
  voiceBtnLabel:     { fontSize: 15, fontWeight: '700', color: '#333' },
  voiceHint:         { fontSize: 12, color: '#999', marginTop: 2, fontStyle: 'italic' },

  // Divider
  dividerRow:        { flexDirection: 'row', alignItems: 'center', marginVertical: 12, gap: 8 },
  dividerLine:       { flex: 1, height: 1, backgroundColor: '#FFD9B3' },
  dividerText:       { color: '#BBB', fontSize: 13 },

  sectionTitle:      { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 12 },

  // Activity Grid
  grid:              { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actCard:           { width: '46%', backgroundColor: '#FFF', borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 2, borderColor: '#FFD9B3', position: 'relative' },
  actEmoji:          { fontSize: 32, marginBottom: 4 },
  actLabel:          { fontSize: 15, fontWeight: '600', color: '#555' },
  actGrams:          { fontSize: 11, color: '#BBB', marginTop: 2 },
  checkBadge:        { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  checkBadgeText:    { color: '#FFF', fontSize: 11, fontWeight: '700' },

  // Consumption card
  consumptionCard:   { marginTop: 16, backgroundColor: '#FFF0E6', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#FFD9B3', alignItems: 'center' },
  consumptionTitle:  { fontSize: 14, color: '#888', marginBottom: 4 },
  consumptionValue:  { fontSize: 28, fontWeight: '800', color: '#FF6B35' },
  consumptionSub:    { fontSize: 12, color: '#888', marginTop: 4, textAlign: 'center' },

  // Note
  noteInput:         { marginTop: 16, backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1, borderColor: '#FFD9B3', padding: 14, fontSize: 15, color: '#333', minHeight: 70 },

  // Save
  saveBtn:           { margin: 20, backgroundColor: '#FF6B35', borderRadius: 16, padding: 18, alignItems: 'center' },
  saveBtnDone:       { backgroundColor: '#4CAF50' },
  saveBtnText:       { color: '#FFF', fontSize: 18, fontWeight: '700' },
});

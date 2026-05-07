import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import GasGauge    from '../components/GasGauge';
import BookingSheet from '../components/BookingSheet';
import AdBanner    from '../components/AdBanner';
import { getStrings } from '../constants/languages';
import {
  getUserProfile, getCurrentCylinder, getDailyLogs,
  addCylinderToHistory, clearCurrentCylinder, getCylinderHistory,
} from '../utils/storage';
import {
  getRemainingPercent, getDaysRemaining, getUrgencyLevel,
  getEstimatedCylinderDays, computeHistoricalAverage,
} from '../utils/gasCalculator';
import { scheduleLowGasAlert, scheduleBookingReminder } from '../utils/notifications';
import { pushCurrentCylinderToCloud, pushCylinderHistoryToCloud } from '../services/syncService';

const URGENCY_STYLES = {
  safe:     { bg: '#E8F5E9', border: '#4CAF50', text: '#2E7D32' },
  low:      { bg: '#FFF3E0', border: '#FF9800', text: '#E65100' },
  critical: { bg: '#FFEBEE', border: '#F44336', text: '#B71C1C' },
};

export default function HomeScreen({ navigation, route }) {
  const lang = route?.params?.lang || 'hi';
  const t    = getStrings(lang);

  const [profile,      setProfile]   = useState(null);
  const [cylinder,     setCylinder]  = useState(null);
  const [remaining,    setRemaining] = useState(100);
  const [daysLeft,     setDaysLeft]  = useState(0);
  const [urgency,      setUrgency]   = useState('safe');
  const [showBooking,  setBooking]   = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    const prof = await getUserProfile();
    const cyl  = await getCurrentCylinder();
    const logs = await getDailyLogs();
    setProfile(prof);
    setCylinder(cyl);

    if (!cyl || !prof) return;

    const history  = await getCylinderHistory();
    const histAvg  = computeHistoricalAverage(history);
    const estDays  = getEstimatedCylinderDays(prof.familySize, prof.cookingStyle, histAvg);
    const remPct   = getRemainingPercent(cyl.startDate, logs, estDays);
    const days     = getDaysRemaining(cyl.startDate, logs, estDays);
    const urg      = getUrgencyLevel(remPct);

    setRemaining(remPct);
    setDaysLeft(days);
    setUrgency(urg);

    // Update notification schedule when data refreshes
    await scheduleLowGasAlert(days, remPct);
    await scheduleBookingReminder(days);
  }

  async function handleFinishCylinder() {
    Alert.alert(
      lang === 'hi' ? 'सिलेंडर खत्म?' : 'Cylinder Finished?',
      lang === 'hi'
        ? 'क्या आपका सिलेंडर खत्म हो गया? इसे इतिहास में सहेजा जाएगा।'
        : 'Did your cylinder finish? It will be saved to history.',
      [
        { text: lang === 'hi' ? 'रद्द करें' : 'Cancel', style: 'cancel' },
        {
          text: lang === 'hi' ? 'हाँ, खत्म हुआ' : 'Yes, Finished',
          onPress: async () => {
            const finished = { ...cylinder, endDate: new Date().toISOString() };
            await addCylinderToHistory(finished);
            await clearCurrentCylinder();
            pushCylinderHistoryToCloud(finished).catch(() => {});
            setCylinder(null);
            setRemaining(0);
            setDaysLeft(0);
          },
        },
      ]
    );
  }

  function handleBookNow() {
    setBooking(true);
  }

  const urgStyle = URGENCY_STYLES[urgency];
  const startDateStr = cylinder
    ? new Date(cylinder.startDate).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>CylinderSathi</Text>
            <Text style={styles.subName}>🇮🇳 आपका गैस साथी</Text>
          </View>
          <TouchableOpacity
            style={styles.newCylBtn}
            onPress={() => navigation.navigate('NewCylinder', { lang })}
          >
            <Text style={styles.newCylBtnText}>+ {t.newCylinder}</Text>
          </TouchableOpacity>
        </View>

        {/* Gas Gauge */}
        {cylinder ? (
          <>
            <GasGauge
              percent={remaining}
              daysRemaining={daysLeft}
              label={t.gasRemaining}
            />

            {/* Urgency Banner */}
            <View style={[styles.urgencyBanner, { backgroundColor: urgStyle.bg, borderColor: urgStyle.border }]}>
              <Text style={[styles.urgencyText, { color: urgStyle.text }]}>
                {urgency === 'safe' && '✅ '}
                {urgency === 'low'  && '⚠️ '}
                {urgency === 'critical' && '🚨 '}
                {t[urgency]}
              </Text>
            </View>

            {/* Cylinder Info */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>📅 {t.cylinderStarted}</Text>
                <Text style={styles.infoValue}>{startDateStr}</Text>
              </View>
              {cylinder.brand && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>🔵 Brand</Text>
                  <Text style={styles.infoValue}>{cylinder.brand.toUpperCase()}</Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.bookBtn} onPress={handleBookNow}>
                <Text style={styles.bookBtnText}>📞 {t.bookNow}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.doneBtn} onPress={handleFinishCylinder}>
                <Text style={styles.doneBtnText}>
                  {lang === 'hi' ? 'सिलेंडर खत्म' : 'Cylinder Empty'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          /* No Active Cylinder */
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🫙</Text>
            <Text style={styles.emptyTitle}>{t.noActiveCylinder}</Text>
            <TouchableOpacity
              style={styles.startBtn}
              onPress={() => navigation.navigate('NewCylinder', { lang })}
            >
              <Text style={styles.startBtnText}>+ {t.tapToStart}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Log Shortcut */}
        {cylinder && (
          <TouchableOpacity
            style={styles.quickLogCard}
            onPress={() => navigation.navigate('DailyLog', { lang })}
          >
            <Text style={styles.quickLogEmoji}>🍳</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.quickLogTitle}>{t.todayLog}</Text>
              <Text style={styles.quickLogSub}>
                {lang === 'hi' ? 'टैप करके आज का खाना लॉग करें' : 'Tap to log today\'s cooking'}
              </Text>
            </View>
            <Text style={styles.quickLogArrow}>›</Text>
          </TouchableOpacity>
        )}

        {/* Ad Banner */}
        <AdBanner />

      </ScrollView>

      {/* Booking bottom sheet */}
      <BookingSheet
        visible={showBooking}
        brand={cylinder?.brand || 'indane'}
        lang={lang}
        onClose={() => setBooking(false)}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: '#FFF8F0' },
  scroll:        { padding: 20, paddingBottom: 40, alignItems: 'center' },

  header:        { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  appName:       { fontSize: 24, fontWeight: '800', color: '#FF6B35' },
  subName:       { fontSize: 13, color: '#888', marginTop: 1 },

  newCylBtn:     { backgroundColor: '#FF6B35', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  newCylBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },

  urgencyBanner: { width: '100%', marginTop: 16, padding: 12, borderRadius: 12, borderWidth: 1.5, alignItems: 'center' },
  urgencyText:   { fontSize: 15, fontWeight: '700' },

  infoCard:      { width: '100%', backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginTop: 16, borderWidth: 1, borderColor: '#FFD9B3' },
  infoRow:       { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  infoLabel:     { fontSize: 14, color: '#888' },
  infoValue:     { fontSize: 14, fontWeight: '600', color: '#333' },

  actionRow:     { flexDirection: 'row', gap: 12, width: '100%', marginTop: 16 },
  bookBtn:       { flex: 1, backgroundColor: '#FF6B35', borderRadius: 14, padding: 14, alignItems: 'center' },
  bookBtnText:   { color: '#FFF', fontWeight: '700', fontSize: 15 },
  doneBtn:       { flex: 1, backgroundColor: '#FFF', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#FFD9B3' },
  doneBtnText:   { color: '#666', fontWeight: '600', fontSize: 14 },

  emptyState:    { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji:    { fontSize: 72, marginBottom: 12 },
  emptyTitle:    { fontSize: 18, color: '#888', fontWeight: '600', marginBottom: 20 },
  startBtn:      { backgroundColor: '#FF6B35', borderRadius: 16, paddingHorizontal: 28, paddingVertical: 14 },
  startBtnText:  { color: '#FFF', fontWeight: '700', fontSize: 16 },

  quickLogCard:  { width: '100%', backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginTop: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#FFD9B3', gap: 12 },
  quickLogEmoji: { fontSize: 32 },
  quickLogTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  quickLogSub:   { fontSize: 13, color: '#999', marginTop: 2 },
  quickLogArrow: { fontSize: 28, color: '#FF6B35', fontWeight: '300' },
});

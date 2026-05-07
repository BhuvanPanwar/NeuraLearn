import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  SafeAreaView, TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { getStrings } from '../constants/languages';
import { CYLINDER_BRANDS } from '../constants/gasProfiles';
import { getCylinderHistory, getCurrentCylinder } from '../utils/storage';
import { computeHistoricalAverage } from '../utils/gasCalculator';

function durationDays(startDate, endDate) {
  const start = new Date(startDate);
  const end   = endDate ? new Date(endDate) : new Date();
  return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
}

function brandColor(brandId) {
  return CYLINDER_BRANDS.find(b => b.id === brandId)?.color || '#888';
}

function brandLabel(brandId) {
  return CYLINDER_BRANDS.find(b => b.id === brandId)?.label || brandId;
}

export default function HistoryScreen({ route }) {
  const lang = route?.params?.lang || 'hi';
  const t    = getStrings(lang);

  const [history, setHistory]       = useState([]);
  const [current, setCurrent]       = useState(null);
  const [avgDays, setAvgDays]       = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  async function loadHistory() {
    const hist = await getCylinderHistory();
    const cur  = await getCurrentCylinder();
    setHistory(hist);
    setCurrent(cur);
    setAvgDays(computeHistoricalAverage(hist));
  }

  const allCylinders = current
    ? [{ ...current, isCurrent: true }, ...history]
    : history;

  function formatDate(iso, l) {
    return new Date(iso).toLocaleDateString(l === 'hi' ? 'hi-IN' : 'en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={styles.pageTitle}>{t.history}</Text>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{allCylinders.length}</Text>
            <Text style={styles.statLabel}>
              {lang === 'hi' ? 'सिलेंडर' : 'Cylinders'}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{avgDays ?? '—'}</Text>
            <Text style={styles.statLabel}>
              {t.avgDuration} ({t.days})
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {allCylinders.length > 0
                ? Math.round(allCylinders.reduce((s, c) => s + durationDays(c.startDate, c.endDate), 0) / allCylinders.length)
                : '—'}
            </Text>
            <Text style={styles.statLabel}>
              {lang === 'hi' ? 'औसत दिन' : 'Avg days'}
            </Text>
          </View>
        </View>

        {/* Bar chart visual */}
        {allCylinders.length > 1 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>
              {lang === 'hi' ? 'पिछले सिलेंडरों की अवधि' : 'Duration of past cylinders'}
            </Text>
            {allCylinders.slice(0, 6).reverse().map((c, i) => {
              const days = durationDays(c.startDate, c.endDate);
              const maxD = Math.max(...allCylinders.map(x => durationDays(x.startDate, x.endDate)), 1);
              const pct  = (days / maxD) * 100;
              const col  = c.isCurrent ? '#FF6B35' : brandColor(c.brand);
              return (
                <View key={c.id || i} style={styles.barRow}>
                  <Text style={styles.barLabel}>#{allCylinders.length - i}</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: col }]} />
                  </View>
                  <Text style={styles.barDays}>{days}d</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Cylinder List */}
        {allCylinders.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyText}>
              {lang === 'hi'
                ? 'अभी कोई इतिहास नहीं है। पहला सिलेंडर शुरू करें!'
                : 'No history yet. Start your first cylinder!'}
            </Text>
          </View>
        ) : (
          allCylinders.map((c, i) => {
            const days    = durationDays(c.startDate, c.endDate);
            const col     = brandColor(c.brand);
            const isGood  = days >= 30;
            return (
              <View key={c.id || i} style={styles.cylCard}>
                <View style={[styles.cylColorBar, { backgroundColor: col }]} />
                <View style={{ flex: 1 }}>
                  <View style={styles.cylRow}>
                    <Text style={styles.cylBrand}>{brandLabel(c.brand)}</Text>
                    {c.isCurrent && (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>
                          {lang === 'hi' ? 'चालू' : 'Active'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.cylDate}>
                    📅 {formatDate(c.startDate, lang)}
                    {c.endDate ? ` → ${formatDate(c.endDate, lang)}` : ` → ${lang === 'hi' ? 'अभी' : 'Now'}`}
                  </Text>
                  <Text style={[styles.cylDuration, { color: isGood ? '#4CAF50' : '#FF9800' }]}>
                    ⏱ {days} {t.days} {isGood ? '✓' : '↓'}
                  </Text>
                </View>
              </View>
            );
          })
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: '#FFF8F0' },
  scroll:        { padding: 20, paddingBottom: 40 },
  pageTitle:     { fontSize: 26, fontWeight: '800', color: '#FF6B35', marginBottom: 20 },

  // Stats
  statsRow:      { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard:      { flex: 1, backgroundColor: '#FFF', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#FFD9B3' },
  statValue:     { fontSize: 24, fontWeight: '800', color: '#FF6B35' },
  statLabel:     { fontSize: 11, color: '#888', marginTop: 2, textAlign: 'center' },

  // Chart
  chartCard:     { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#FFD9B3' },
  chartTitle:    { fontSize: 14, fontWeight: '700', color: '#555', marginBottom: 12 },
  barRow:        { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  barLabel:      { width: 28, fontSize: 12, color: '#888', textAlign: 'right' },
  barTrack:      { flex: 1, height: 16, backgroundColor: '#F5F5F5', borderRadius: 8, overflow: 'hidden' },
  barFill:       { height: '100%', borderRadius: 8 },
  barDays:       { width: 32, fontSize: 12, color: '#555', fontWeight: '600' },

  // Cylinder cards
  cylCard:       { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 16, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#FFD9B3' },
  cylColorBar:   { width: 6 },
  cylRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, paddingBottom: 4 },
  cylBrand:      { fontSize: 15, fontWeight: '700', color: '#333' },
  currentBadge:  { backgroundColor: '#FF6B35', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  currentBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  cylDate:       { fontSize: 13, color: '#888', paddingHorizontal: 12, paddingBottom: 4 },
  cylDuration:   { fontSize: 14, fontWeight: '600', paddingHorizontal: 12, paddingBottom: 12 },

  // Empty
  emptyState:    { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji:    { fontSize: 56, marginBottom: 12 },
  emptyText:     { fontSize: 16, color: '#888', textAlign: 'center', lineHeight: 24 },
});

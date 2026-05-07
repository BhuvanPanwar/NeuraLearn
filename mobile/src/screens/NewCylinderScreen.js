import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { getStrings } from '../constants/languages';
import { CYLINDER_BRANDS } from '../constants/gasProfiles';
import { saveCurrentCylinder, getCurrentCylinder, addCylinderToHistory } from '../utils/storage';
import { scheduleBookingReminder } from '../utils/notifications';
import { getEstimatedCylinderDays } from '../utils/gasCalculator';

function DateSelector({ value, onChange, lang }) {
  const [year, setYear]   = useState(value.getFullYear());
  const [month, setMonth] = useState(value.getMonth());
  const [day, setDay]     = useState(value.getDate());

  const MONTHS_HI = ['जनवरी','फरवरी','मार्च','अप्रैल','मई','जून','जुलाई','अगस्त','सितंबर','अक्टूबर','नवंबर','दिसंबर'];
  const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const MONTHS    = lang === 'hi' ? MONTHS_HI : MONTHS_EN;

  function daysInMonth(m, y) {
    return new Date(y, m + 1, 0).getDate();
  }

  function update(d, m, y) {
    const maxDay = daysInMonth(m, y);
    const safeDay = Math.min(d, maxDay);
    setDay(safeDay);
    onChange(new Date(y, m, safeDay));
  }

  const maxDay = daysInMonth(month, year);

  return (
    <View style={ds.container}>
      {/* Day */}
      <View style={ds.spinnerCol}>
        <TouchableOpacity onPress={() => { const d = day < maxDay ? day + 1 : 1; update(d, month, year); }}>
          <Text style={ds.arrow}>▲</Text>
        </TouchableOpacity>
        <Text style={ds.val}>{String(day).padStart(2, '0')}</Text>
        <TouchableOpacity onPress={() => { const d = day > 1 ? day - 1 : maxDay; update(d, month, year); }}>
          <Text style={ds.arrow}>▼</Text>
        </TouchableOpacity>
      </View>

      <Text style={ds.sep}>/</Text>

      {/* Month */}
      <View style={ds.spinnerCol}>
        <TouchableOpacity onPress={() => { const m = (month + 1) % 12; setMonth(m); update(day, m, year); }}>
          <Text style={ds.arrow}>▲</Text>
        </TouchableOpacity>
        <Text style={[ds.val, { fontSize: 16 }]}>{MONTHS[month]}</Text>
        <TouchableOpacity onPress={() => { const m = month === 0 ? 11 : month - 1; setMonth(m); update(day, m, year); }}>
          <Text style={ds.arrow}>▼</Text>
        </TouchableOpacity>
      </View>

      <Text style={ds.sep}>/</Text>

      {/* Year */}
      <View style={ds.spinnerCol}>
        <TouchableOpacity onPress={() => { const y = year + 1; setYear(y); update(day, month, y); }}>
          <Text style={ds.arrow}>▲</Text>
        </TouchableOpacity>
        <Text style={ds.val}>{year}</Text>
        <TouchableOpacity onPress={() => { const y = year - 1; setYear(y); update(day, month, y); }}>
          <Text style={ds.arrow}>▼</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const ds = StyleSheet.create({
  container:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#FFD9B3', gap: 8 },
  spinnerCol: { alignItems: 'center', minWidth: 60 },
  arrow:      { fontSize: 20, color: '#FF6B35', padding: 6 },
  val:        { fontSize: 22, fontWeight: '700', color: '#333', minWidth: 50, textAlign: 'center' },
  sep:        { fontSize: 28, color: '#CCC', marginTop: 4 },
});

export default function NewCylinderScreen({ navigation, route }) {
  const lang = route?.params?.lang || 'hi';
  const t    = getStrings(lang);

  const [startDate, setStartDate] = useState(new Date());
  const [brand, setBrand]         = useState('indane');
  const [photoUri, setPhotoUri]   = useState(null);
  const [saving, setSaving]       = useState(false);

  async function pickPhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(lang === 'hi' ? 'कैमरा अनुमति चाहिए' : 'Camera permission needed');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing:    true,
      aspect:           [4, 3],
      quality:          0.6,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function handleConfirm() {
    if (saving) return;
    setSaving(true);

    try {
      // Archive any existing cylinder first
      const existing = await getCurrentCylinder();
      if (existing) {
        await addCylinderToHistory({ ...existing, endDate: startDate.toISOString() });
      }

      const cylinder = {
        id:        Date.now().toString(),
        startDate: startDate.toISOString(),
        brand,
        photoUri:  photoUri || null,
        createdAt: new Date().toISOString(),
      };

      await saveCurrentCylinder(cylinder);

      // Schedule booking reminder based on family size (profile loaded elsewhere)
      await scheduleBookingReminder(35); // default; HomeScreen will refine on next load

      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={styles.sectionLabel}>📅 {t.startDate}</Text>
        <DateSelector value={startDate} onChange={setStartDate} lang={lang} />

        {/* Brand Selection */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>🔵 {t.cylinderBrand}</Text>
        <View style={styles.brandRow}>
          {CYLINDER_BRANDS.map(b => (
            <TouchableOpacity
              key={b.id}
              style={[styles.brandCard, brand === b.id && { borderColor: b.color, backgroundColor: b.color + '15' }]}
              onPress={() => setBrand(b.id)}
            >
              <Text style={[styles.brandName, brand === b.id && { color: b.color }]}>{b.label}</Text>
              {brand === b.id && <Text style={{ color: b.color, fontSize: 16 }}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {/* Photo Capture */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>📸 {t.takePhoto}</Text>
        <TouchableOpacity style={styles.photoBtn} onPress={pickPhoto}>
          {photoUri ? (
            <Text style={styles.photoSuccess}>
              ✅ {lang === 'hi' ? 'फोटो ली गई' : 'Photo taken'}
            </Text>
          ) : (
            <>
              <Text style={styles.photoBtnIcon}>📷</Text>
              <Text style={styles.photoBtnText}>
                {lang === 'hi' ? 'सिलेंडर की तारीख का फोटो लें (वैकल्पिक)' : 'Take photo of cylinder date sticker (optional)'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Estimated Duration Preview */}
        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>
            {lang === 'hi' ? '📊 अनुमानित जानकारी' : '📊 Estimated Info'}
          </Text>
          <Text style={styles.previewText}>
            {lang === 'hi'
              ? `सिलेंडर शुरू: ${startDate.toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`
              : `Cylinder start: ${startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`}
          </Text>
          <Text style={styles.previewText}>
            {lang === 'hi'
              ? 'रोज़ का उपयोग आपकी प्रोफाइल के हिसाब से गिना जाएगा'
              : 'Daily usage will be calculated based on your profile'}
          </Text>
        </View>

      </ScrollView>

      <TouchableOpacity
        style={[styles.confirmBtn, saving && { opacity: 0.6 }]}
        onPress={handleConfirm}
        disabled={saving}
      >
        <Text style={styles.confirmBtnText}>
          {saving ? '...' : `🚀 ${t.confirm}`}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: '#FFF8F0' },
  scroll:        { padding: 20, paddingBottom: 20 },

  sectionLabel:  { fontSize: 15, fontWeight: '700', color: '#555', marginBottom: 10 },

  brandRow:      { gap: 10 },
  brandCard:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 2, borderColor: '#FFD9B3', backgroundColor: '#FFF' },
  brandName:     { fontSize: 15, fontWeight: '600', color: '#555' },

  photoBtn:      { backgroundColor: '#FFF', borderRadius: 14, borderWidth: 2, borderColor: '#FFD9B3', borderStyle: 'dashed', padding: 20, alignItems: 'center', gap: 8 },
  photoBtnIcon:  { fontSize: 36 },
  photoBtnText:  { fontSize: 14, color: '#888', textAlign: 'center' },
  photoSuccess:  { fontSize: 16, color: '#4CAF50', fontWeight: '700' },

  previewCard:   { marginTop: 24, backgroundColor: '#FFF0E6', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#FFD9B3' },
  previewTitle:  { fontSize: 15, fontWeight: '700', color: '#FF6B35', marginBottom: 8 },
  previewText:   { fontSize: 13, color: '#555', lineHeight: 22 },

  confirmBtn:    { margin: 20, backgroundColor: '#FF6B35', borderRadius: 16, padding: 18, alignItems: 'center', shadowColor: '#FF6B35', shadowOpacity: 0.4, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8 },
  confirmBtnText:{ color: '#FFF', fontSize: 18, fontWeight: '700' },
});

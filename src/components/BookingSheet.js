/**
 * Bottom sheet for booking a new LPG cylinder.
 * Shows all 3 booking options: missed call, SMS, and phone call.
 */
import React from 'react';
import {
  View, Text, TouchableOpacity, Modal,
  StyleSheet, Linking, Alert, Platform,
} from 'react-native';
import { BOOKING_INFO, CYLINDER_BRANDS } from '../constants/gasProfiles';

const BOOKING_METHODS = {
  indane: [
    { label: 'Missed Call',   icon: '📞', action: 'call',   value: '8454955555',  desc: 'Give a missed call to book' },
    { label: 'SMS',           icon: '💬', action: 'sms',    value: '7718955555',  smsBody: 'BOOK', desc: 'SMS "BOOK" to book' },
    { label: 'IVR Call',      icon: '☎️', action: 'call',   value: '7718955555',  desc: 'Call IVR to book' },
  ],
  hp: [
    { label: 'Missed Call',   icon: '📞', action: 'call',   value: '9222201122',  desc: 'Give a missed call' },
    { label: 'SMS',           icon: '💬', action: 'sms',    value: '9222201122',  smsBody: 'HP', desc: 'SMS "HP" to book' },
    { label: 'IVR Call',      icon: '☎️', action: 'call',   value: '1800233555',  desc: 'Call toll-free' },
  ],
  bharat: [
    { label: 'Missed Call',   icon: '📞', action: 'call',   value: '7715012345',  desc: 'Give a missed call' },
    { label: 'SMS',           icon: '💬', action: 'sms',    value: '7715012345',  smsBody: 'BG', desc: 'SMS "BG" to book' },
    { label: 'IVR Call',      icon: '☎️', action: 'call',   value: '1800224344',  desc: 'Call toll-free' },
  ],
  other: [
    { label: 'Call Agency',   icon: '📞', action: 'call',   value: null,          desc: 'Call your local gas agency' },
  ],
};

async function executeBookingAction(method, lang) {
  if (!method.value) {
    Alert.alert(
      lang === 'hi' ? 'एजेंसी से संपर्क करें' : 'Contact your agency',
      lang === 'hi' ? 'अपनी स्थानीय गैस एजेंसी से संपर्क करें।' : 'Please contact your local gas agency directly.'
    );
    return;
  }

  if (method.action === 'call') {
    await Linking.openURL(`tel:${method.value}`);
  } else if (method.action === 'sms') {
    const separator = Platform.OS === 'ios' ? '&' : '?';
    await Linking.openURL(`sms:${method.value}${separator}body=${encodeURIComponent(method.smsBody)}`);
  }
}

export default function BookingSheet({ visible, brand = 'indane', lang = 'hi', onClose }) {
  const brandInfo    = CYLINDER_BRANDS.find(b => b.id === brand) || CYLINDER_BRANDS[0];
  const methods      = BOOKING_METHODS[brand] || BOOKING_METHODS.other;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        {/* Handle bar */}
        <View style={styles.handle} />

        <Text style={styles.title}>
          {lang === 'hi' ? '📦 नया सिलेंडर बुक करें' : '📦 Book New Cylinder'}
        </Text>
        <Text style={[styles.brandLabel, { color: brandInfo.color }]}>
          {brandInfo.label}
        </Text>

        <View style={styles.methods}>
          {methods.map((m, i) => (
            <TouchableOpacity
              key={i}
              style={styles.methodCard}
              onPress={() => executeBookingAction(m, lang)}
            >
              <Text style={styles.methodIcon}>{m.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.methodLabel}>{m.label}</Text>
                <Text style={styles.methodDesc}>{m.desc}</Text>
                {m.value && (
                  <Text style={styles.methodNumber}>{m.value}</Text>
                )}
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>
            {lang === 'hi' ? 'बंद करें' : 'Close'}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet:       { backgroundColor: '#FFF8F0', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, position: 'absolute', bottom: 0, left: 0, right: 0 },
  handle:      { width: 40, height: 4, backgroundColor: '#DDD', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title:       { fontSize: 20, fontWeight: '800', color: '#333', marginBottom: 4 },
  brandLabel:  { fontSize: 14, fontWeight: '600', marginBottom: 16 },
  methods:     { gap: 10, marginBottom: 20 },
  methodCard:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#FFD9B3', gap: 12 },
  methodIcon:  { fontSize: 28 },
  methodLabel: { fontSize: 15, fontWeight: '700', color: '#333' },
  methodDesc:  { fontSize: 13, color: '#888', marginTop: 2 },
  methodNumber:{ fontSize: 14, color: '#FF6B35', fontWeight: '600', marginTop: 2 },
  arrow:       { fontSize: 24, color: '#FF6B35' },
  closeBtn:    { backgroundColor: '#F0F0F0', borderRadius: 14, padding: 14, alignItems: 'center' },
  closeBtnText:{ fontSize: 16, color: '#666', fontWeight: '600' },
});

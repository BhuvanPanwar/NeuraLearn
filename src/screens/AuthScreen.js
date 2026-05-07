import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView,
  Platform, Alert, ActivityIndicator,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { getStrings } from '../constants/languages';
import { fullSyncFromCloud, backfillLocalDataToCloud } from '../services/syncService';

const COUNTRY_CODE = '+91'; // India

export default function AuthScreen({ navigation, route }) {
  const lang  = route?.params?.lang || 'hi';
  const t     = getStrings(lang);

  const [phone,        setPhone]        = useState('');
  const [otp,          setOtp]          = useState('');
  const [confirm,      setConfirm]      = useState(null); // Firebase confirmation
  const [step,         setStep]         = useState('phone'); // 'phone' | 'otp'
  const [loading,      setLoading]      = useState(false);
  const [resendTimer,  setResendTimer]  = useState(0);

  const otpInputRef = useRef(null);
  const timerRef    = useRef(null);

  function startResendTimer() {
    setResendTimer(30);
    timerRef.current = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  async function sendOtp() {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      Alert.alert(
        lang === 'hi' ? 'गलत नंबर' : 'Invalid number',
        lang === 'hi' ? '10 अंकों का मोबाइल नंबर डालें' : 'Enter a 10-digit mobile number'
      );
      return;
    }

    setLoading(true);
    try {
      const confirmation = await auth().signInWithPhoneNumber(`${COUNTRY_CODE}${cleaned}`);
      setConfirm(confirmation);
      setStep('otp');
      startResendTimer();
      setTimeout(() => otpInputRef.current?.focus(), 300);
    } catch (e) {
      Alert.alert(lang === 'hi' ? 'OTP नहीं भेजा जा सका' : 'Could not send OTP', e.message);
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    if (otp.length !== 6) return;
    setLoading(true);
    try {
      await confirm.confirm(otp);
      // On success, auth state listener in AppNavigator will handle navigation.
      // Sync cloud data down (or push local data up for new users).
      await Promise.all([
        fullSyncFromCloud(),
        backfillLocalDataToCloud(),
      ]);
    } catch (e) {
      Alert.alert(
        lang === 'hi' ? 'गलत OTP' : 'Wrong OTP',
        lang === 'hi' ? 'OTP गलत है। दोबारा कोशिश करें।' : 'Incorrect OTP. Please try again.'
      );
      setOtp('');
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp() {
    if (resendTimer > 0) return;
    setOtp('');
    await sendOtp();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>

          {/* Logo / header */}
          <View style={styles.logoWrap}>
            <Text style={styles.logoEmoji}>🫙</Text>
            <Text style={styles.appName}>CylinderSathi</Text>
            <Text style={styles.tagline}>
              {lang === 'hi' ? 'आपका गैस, आपके हाथ में' : 'Your gas, in your hands'}
            </Text>
          </View>

          {/* Phone step */}
          {step === 'phone' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                {lang === 'hi' ? '📱 मोबाइल नंबर डालें' : '📱 Enter mobile number'}
              </Text>
              <Text style={styles.cardSub}>
                {lang === 'hi'
                  ? 'आपका डेटा सुरक्षित रहे इसलिए OTP से लॉगिन करें'
                  : 'Login with OTP to keep your data safe'}
              </Text>

              <View style={styles.phoneRow}>
                <View style={styles.countryCode}>
                  <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder={lang === 'hi' ? 'मोबाइल नंबर' : 'Mobile number'}
                  placeholderTextColor="#BBB"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={setPhone}
                  returnKeyType="done"
                  onSubmitEditing={sendOtp}
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, (loading || phone.length !== 10) && styles.btnDisabled]}
                onPress={sendOtp}
                disabled={loading || phone.length !== 10}
              >
                {loading
                  ? <ActivityIndicator color="#FFF" />
                  : <Text style={styles.primaryBtnText}>
                      {lang === 'hi' ? 'OTP भेजें →' : 'Send OTP →'}
                    </Text>
                }
              </TouchableOpacity>
            </View>
          )}

          {/* OTP step */}
          {step === 'otp' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                {lang === 'hi' ? '🔐 OTP डालें' : '🔐 Enter OTP'}
              </Text>
              <Text style={styles.cardSub}>
                {lang === 'hi'
                  ? `+91 ${phone} पर 6 अंकों का OTP भेजा गया`
                  : `6-digit OTP sent to +91 ${phone}`}
              </Text>

              <TextInput
                ref={otpInputRef}
                style={styles.otpInput}
                placeholder="• • • • • •"
                placeholderTextColor="#DDD"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={v => { setOtp(v); if (v.length === 6) verifyOtp(); }}
                textAlign="center"
                letterSpacing={12}
              />

              <TouchableOpacity
                style={[styles.primaryBtn, (loading || otp.length !== 6) && styles.btnDisabled]}
                onPress={verifyOtp}
                disabled={loading || otp.length !== 6}
              >
                {loading
                  ? <ActivityIndicator color="#FFF" />
                  : <Text style={styles.primaryBtnText}>
                      {lang === 'hi' ? 'सत्यापित करें ✓' : 'Verify ✓'}
                    </Text>
                }
              </TouchableOpacity>

              <View style={styles.resendRow}>
                <Text style={styles.resendText}>
                  {lang === 'hi' ? 'OTP नहीं मिला? ' : 'Didn\'t receive OTP? '}
                </Text>
                <TouchableOpacity onPress={resendOtp} disabled={resendTimer > 0}>
                  <Text style={[styles.resendLink, resendTimer > 0 && { color: '#BBB' }]}>
                    {resendTimer > 0
                      ? `${lang === 'hi' ? 'दोबारा भेजें' : 'Resend'} (${resendTimer}s)`
                      : (lang === 'hi' ? 'दोबारा भेजें' : 'Resend')}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={() => { setStep('phone'); setOtp(''); }}>
                <Text style={styles.changeNumber}>
                  {lang === 'hi' ? '← नंबर बदलें' : '← Change number'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Skip option */}
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() => navigation.replace('MainTabs', { lang })}
          >
            <Text style={styles.skipText}>
              {lang === 'hi' ? 'अभी नहीं, बिना लॉगिन के चालू करें' : 'Skip for now, continue without login'}
            </Text>
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: '#FFF8F0' },
  container:     { flex: 1, padding: 24, justifyContent: 'center' },

  logoWrap:      { alignItems: 'center', marginBottom: 32 },
  logoEmoji:     { fontSize: 64, marginBottom: 8 },
  appName:       { fontSize: 32, fontWeight: '800', color: '#FF6B35' },
  tagline:       { fontSize: 14, color: '#888', marginTop: 4 },

  card:          { backgroundColor: '#FFF', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#FFD9B3', shadowColor: '#FF6B35', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 4 },
  cardTitle:     { fontSize: 20, fontWeight: '700', color: '#333', marginBottom: 6 },
  cardSub:       { fontSize: 14, color: '#888', marginBottom: 20, lineHeight: 20 },

  phoneRow:      { flexDirection: 'row', gap: 10, marginBottom: 20 },
  countryCode:   { backgroundColor: '#FFF0E6', borderRadius: 12, borderWidth: 1, borderColor: '#FFD9B3', paddingHorizontal: 14, justifyContent: 'center' },
  countryCodeText:{ fontSize: 15, fontWeight: '600', color: '#FF6B35' },
  phoneInput:    { flex: 1, backgroundColor: '#F9F9F9', borderRadius: 12, borderWidth: 1, borderColor: '#E0E0E0', padding: 14, fontSize: 18, color: '#333', fontWeight: '600' },

  otpInput:      { backgroundColor: '#F9F9F9', borderRadius: 12, borderWidth: 1.5, borderColor: '#FFD9B3', padding: 16, fontSize: 28, color: '#333', fontWeight: '800', marginBottom: 20 },

  primaryBtn:    { backgroundColor: '#FF6B35', borderRadius: 14, padding: 16, alignItems: 'center' },
  btnDisabled:   { opacity: 0.5 },
  primaryBtnText:{ color: '#FFF', fontSize: 17, fontWeight: '700' },

  resendRow:     { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  resendText:    { fontSize: 14, color: '#888' },
  resendLink:    { fontSize: 14, color: '#FF6B35', fontWeight: '600' },
  changeNumber:  { textAlign: 'center', marginTop: 12, fontSize: 14, color: '#888' },

  skipBtn:       { marginTop: 20, alignItems: 'center', padding: 12 },
  skipText:      { fontSize: 13, color: '#BBB', textDecorationLine: 'underline' },
});

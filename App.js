import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import AppNavigator from './src/navigation/AppNavigator';
import { isOnboardingDone, getUserProfile } from './src/utils/storage';

export default function App() {
  // AppNavigator handles all routing including onboarding check.
  // Onboarding flow is managed inside OnboardingScreen and uses
  // navigation.replace() to transition to MainTabs on completion.
  return (
    <>
      <StatusBar style="dark" backgroundColor="#FFF8F0" />
      <AppNavigator />
    </>
  );
}

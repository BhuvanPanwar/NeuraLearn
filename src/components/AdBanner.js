/**
 * Google AdMob banner ad component.
 *
 * SETUP:
 * 1. Go to https://admob.google.com and create an account
 * 2. Create a new app for Android and iOS
 * 3. Create banner ad units for each platform
 * 4. Replace the placeholder IDs below with your real ad unit IDs
 * 5. Replace app IDs in app.json (androidAppId / iosAppId)
 *
 * Use TEST IDs during development — Google will ban your account for
 * clicking your own live ads.
 */
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

// Replace with real ad unit IDs from AdMob console before publishing
const AD_UNIT_IDS = {
  android: __DEV__ ? TestIds.BANNER : 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
  ios:     __DEV__ ? TestIds.BANNER : 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
};

const AD_UNIT_ID = Platform.OS === 'ios' ? AD_UNIT_IDS.ios : AD_UNIT_IDS.android;

export default function AdBanner() {
  return (
    <View style={styles.container}>
      <BannerAd
        unitId={AD_UNIT_ID}
        size={BannerAdSize.BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdFailedToLoad={() => {}} // silently hide on failure
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 8,
  },
});

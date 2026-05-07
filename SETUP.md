# CylinderSathi — Setup Guide

## 1. Install dependencies
```bash
cd mobile
npm install
```

## 2. Generate app icons
```bash
npm install --save-dev sharp
node assets/generate-icons.js
```

## 3. Set up Firebase

1. Go to https://console.firebase.google.com
2. Create project: **CylinderSathi**
3. Add **Android app** → package: `com.cylindersathi.app`
4. Add **iOS app** → bundle ID: `com.cylindersathi.app`
5. Download **google-services.json** → place at `mobile/google-services.json`
6. Download **GoogleService-Info.plist** → place at `mobile/GoogleService-Info.plist`
7. Firebase console → **Authentication** → Sign-in method → Enable **Phone**
8. Firebase console → **Firestore Database** → Create database (production mode)

## 4. Set up Google AdMob

1. Go to https://admob.google.com
2. Create app for Android + iOS
3. Create **Banner** ad units
4. Replace placeholder IDs in:
   - `mobile/app.json` → `androidAppId` / `iosAppId`
   - `mobile/src/components/AdBanner.js` → ad unit IDs

> Use TEST IDs (`TestIds.BANNER`) during development — do NOT click your own live ads.

## 5. Run the app

```bash
# Start Expo dev server
npm start

# On Android device/emulator
npm run android

# On iOS simulator (Mac only)
npm run ios
```

## 6. Build for release

```bash
# Install EAS CLI
npm install -g eas-cli
eas login

# Build Android APK (internal testing)
npm run build:android

# Build iOS (requires Apple Developer account)
npm run build:ios
```

## 7. Submit to stores

```bash
# Fill in your credentials in eas.json first, then:
npm run submit:android
npm run submit:ios
```

---

## Key files to configure before release

| File | What to fill in |
|---|---|
| `mobile/google-services.json` | Download from Firebase console |
| `mobile/GoogleService-Info.plist` | Download from Firebase console |
| `mobile/app.json` | AdMob app IDs, EAS project ID |
| `mobile/src/components/AdBanner.js` | Real AdMob ad unit IDs |
| `mobile/eas.json` | Apple ID, Team ID, App Store Connect app ID |

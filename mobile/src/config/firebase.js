/**
 * Firebase configuration for CylinderSathi.
 *
 * HOW TO SET UP:
 * 1. Go to https://console.firebase.google.com
 * 2. Create a new project called "CylinderSathi"
 * 3. Add an Android app (package: com.cylindersathi.app)
 * 4. Add an iOS app (bundle: com.cylindersathi.app)
 * 5. Download google-services.json → place it at mobile/google-services.json
 * 6. Download GoogleService-Info.plist → place it at mobile/GoogleService-Info.plist
 * 7. Enable "Phone" sign-in under Authentication → Sign-in method
 * 8. Create a Firestore database in "production" mode
 *
 * The @react-native-firebase packages auto-read the above native config files,
 * so no JS config object is needed here — just import this file to ensure
 * the app initialises Firebase before any screen tries to use auth/firestore.
 */

import auth      from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Firestore collection paths
export const COLLECTIONS = {
  USERS:    'users',
  CYLINDERS:'cylinders',
  LOGS:     'logs',
};

/**
 * Returns the Firestore document reference for the current user's profile.
 */
export function userDoc(uid) {
  return firestore().collection(COLLECTIONS.USERS).doc(uid);
}

/**
 * Returns the Firestore collection reference for a user's cylinders.
 */
export function cylindersCol(uid) {
  return firestore()
    .collection(COLLECTIONS.USERS)
    .doc(uid)
    .collection(COLLECTIONS.CYLINDERS);
}

/**
 * Returns the Firestore collection reference for a user's daily logs.
 */
export function logsCol(uid) {
  return firestore()
    .collection(COLLECTIONS.USERS)
    .doc(uid)
    .collection(COLLECTIONS.LOGS);
}

export { auth, firestore };

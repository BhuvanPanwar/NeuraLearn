import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, ActivityIndicator } from 'react-native';
import auth from '@react-native-firebase/auth';

import OnboardingScreen  from '../screens/OnboardingScreen';
import AuthScreen        from '../screens/AuthScreen';
import HomeScreen        from '../screens/HomeScreen';
import NewCylinderScreen from '../screens/NewCylinderScreen';
import DailyLogScreen    from '../screens/DailyLogScreen';
import HistoryScreen     from '../screens/HistoryScreen';
import SettingsScreen    from '../screens/SettingsScreen';
import { isOnboardingDone, getUserProfile } from '../utils/storage';
import { fullSyncFromCloud } from '../services/syncService';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

function TabIcon({ emoji, focused }) {
  return (
    <Text style={{ fontSize: focused ? 26 : 22, opacity: focused ? 1 : 0.5 }}>
      {emoji}
    </Text>
  );
}

function MainTabs({ route }) {
  const lang = route?.params?.lang || 'hi';
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown:      false,
        tabBarStyle:      { backgroundColor: '#FFF8F0', borderTopColor: '#FFD9B3', height: 65 },
        tabBarLabelStyle: { fontSize: 11, marginBottom: 6, fontWeight: '600' },
        tabBarActiveTintColor:   '#FF6B35',
        tabBarInactiveTintColor: '#999',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        initialParams={{ lang }}
        options={{
          tabBarLabel: lang === 'hi' ? 'होम' : 'Home',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="DailyLog"
        component={DailyLogScreen}
        initialParams={{ lang }}
        options={{
          tabBarLabel: lang === 'hi' ? 'खाना लॉग' : 'Log Meals',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🍳" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        initialParams={{ lang }}
        options={{
          tabBarLabel: lang === 'hi' ? 'इतिहास' : 'History',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📋" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        initialParams={{ lang }}
        options={{
          tabBarLabel: lang === 'hi' ? 'सेटिंग्स' : 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const [ready,        setReady]        = useState(false);
  const [initialRoute, setInitialRoute] = useState('Onboarding');
  const [initialLang,  setInitialLang]  = useState('hi');

  useEffect(() => {
    (async () => {
      const done    = await isOnboardingDone();
      const profile = done ? await getUserProfile() : null;

      if (done && profile) {
        setInitialRoute('MainTabs');
        setInitialLang(profile.lang || 'hi');

        // If user is signed in, sync latest data from cloud
        const user = auth().currentUser;
        if (user) {
          fullSyncFromCloud().catch(() => {}); // non-blocking
        }
      }

      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF8F0' }}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />

        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={{
            headerShown:      true,
            headerTitle:      '',
            headerTransparent: true,
            headerBackTitle:  '',
          }}
        />

        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          initialParams={{ lang: initialLang }}
        />

        <Stack.Screen
          name="NewCylinder"
          component={NewCylinderScreen}
          options={{
            presentation:    'modal',
            headerShown:     true,
            headerTitle:     'नया सिलेंडर',
            headerStyle:     { backgroundColor: '#FF6B35' },
            headerTintColor: '#FFF',
            headerTitleStyle:{ fontWeight: 'bold', fontSize: 18 },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

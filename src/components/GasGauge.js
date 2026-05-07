import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const SIZE        = 220;
const STROKE      = 18;
const RADIUS      = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getGaugeColor(percent) {
  if (percent > 30) return ['#4CAF50', '#8BC34A']; // green
  if (percent > 15) return ['#FF9800', '#FFC107']; // orange
  return ['#F44336', '#FF5722'];                   // red
}

export default function GasGauge({ percent = 0, daysRemaining = 0, label = 'Gas Remaining' }) {
  const animPercent = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animPercent, {
      toValue:         percent,
      duration:        1000,
      useNativeDriver: false,
    }).start();
  }, [percent]);

  const strokeDash = animPercent.interpolate({
    inputRange:  [0, 100],
    outputRange: [0, CIRCUMFERENCE],
  });

  const [colorStart, colorEnd] = getGaugeColor(percent);

  const AnimatedCircle = Animated.createAnimatedComponent(Circle);

  return (
    <View style={styles.container}>
      <Svg width={SIZE} height={SIZE}>
        <Defs>
          <LinearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%"   stopColor={colorStart} />
            <Stop offset="100%" stopColor={colorEnd}   />
          </LinearGradient>
        </Defs>

        {/* Background ring */}
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke="#F0E0D0"
          strokeWidth={STROKE}
          fill="none"
        />

        {/* Filled arc — rotated so it starts at top */}
        <AnimatedCircle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke="url(#gaugeGrad)"
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDash.interpolate({
            inputRange:  [0, CIRCUMFERENCE],
            outputRange: [CIRCUMFERENCE, 0],
          })}
          rotation="-90"
          origin={`${SIZE / 2}, ${SIZE / 2}`}
        />
      </Svg>

      {/* Center text overlay */}
      <View style={styles.center}>
        <Text style={[styles.percentText, { color: colorStart }]}>{percent}%</Text>
        <Text style={styles.labelText}>{label}</Text>
        <View style={styles.daysChip}>
          <Text style={styles.daysText}>
            {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  center:      { position: 'absolute', alignItems: 'center' },
  percentText: { fontSize: 48, fontWeight: '800', lineHeight: 54 },
  labelText:   { fontSize: 13, color: '#888', fontWeight: '500', marginTop: 2 },
  daysChip:    { marginTop: 6, backgroundColor: '#FFF0E6', paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: '#FFD9B3' },
  daysText:    { fontSize: 13, color: '#FF6B35', fontWeight: '600' },
});

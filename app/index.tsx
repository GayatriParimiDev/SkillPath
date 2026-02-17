import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Platform, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, withRepeat, withSequence, Easing } from 'react-native-reanimated';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

const { width } = Dimensions.get('window');

function FloatingBlob({ delay, x, y, size, color }: { delay: number; x: number; y: number; size: number; color: string }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(0.3, { duration: 1000 }));
    translateY.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(-20, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(20, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ), -1, true
    ));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[{ position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: size / 2, backgroundColor: color }, style]} />
  );
}

function FeatureCard({ icon, title, desc, delay, colors }: { icon: string; title: string; desc: string; delay: number; colors: any }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 600 }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border }, style]}>
      <View style={[styles.featureIcon, { backgroundColor: colors.surfaceSecondary }]}>
        <MaterialCommunityIcons name={icon as any} size={22} color={colors.primary} />
      </View>
      <Text style={[styles.featureTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>{title}</Text>
      <Text style={[styles.featureDesc, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>{desc}</Text>
    </Animated.View>
  );
}

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();
  const authCtx = useAuth();
  const { user } = authCtx;
  const heroOpacity = useSharedValue(0);
  const heroTranslateY = useSharedValue(40);

  useEffect(() => {
    if (user) {
      router.replace('/(tabs)');
      return;
    }
    heroOpacity.value = withTiming(1, { duration: 800 });
    heroTranslateY.value = withTiming(0, { duration: 800, easing: Easing.out(Easing.cubic) });
  }, [user]);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ translateY: heroTranslateY.value }],
  }));

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const features = [
    { icon: 'map-marker-path', title: 'Personalized Roadmap', desc: 'AI-crafted 4-week learning plans' },
    { icon: 'head-lightbulb-outline', title: 'Concept Coach', desc: 'Step-by-step AI explanations' },
    { icon: 'chart-timeline-variant', title: 'Mastery Tracking', desc: 'Track progress with spaced repetition' },
    { icon: 'shield-check-outline', title: 'AI Feedback', desc: 'Smart evaluation & integrity checks' },
  ];

  if (user) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#0f172a', '#1e1b4b', '#0f172a'] : ['#eef2ff', '#faf5ff', '#ecfeff']}
        style={StyleSheet.absoluteFill}
      />
      <FloatingBlob delay={0} x={-40} y={100} size={180} color={isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.08)'} />
      <FloatingBlob delay={500} x={width - 80} y={250} size={140} color={isDark ? 'rgba(6,182,212,0.12)' : 'rgba(6,182,212,0.08)'} />
      <FloatingBlob delay={1000} x={60} y={500} size={100} color={isDark ? 'rgba(168,85,247,0.12)' : 'rgba(168,85,247,0.08)'} />

      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <View style={styles.logoRow}>
          <View style={[styles.logoBadge, { backgroundColor: colors.primary }]}>
            <Ionicons name="trending-up" size={18} color="#fff" />
          </View>
          <Text style={[styles.logoText, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>SkillPath</Text>
        </View>
        <Pressable onPress={toggleTheme} style={[styles.themeBtn, { backgroundColor: colors.surface }]}>
          <Feather name={isDark ? 'sun' : 'moon'} size={18} color={colors.text} />
        </Pressable>
      </View>

      <Animated.ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 20 }]}
        showsVerticalScrollIndicator={false}
        style={heroStyle}
      >
        <View style={styles.heroSection}>
          <View style={[styles.heroBadge, { backgroundColor: isDark ? 'rgba(129,140,248,0.15)' : 'rgba(79,70,229,0.1)' }]}>
            <Ionicons name="sparkles" size={14} color={colors.primary} />
            <Text style={[styles.heroBadgeText, { color: colors.primary, fontFamily: 'Inter_500Medium' }]}>AI-Powered Learning</Text>
          </View>
          <Text style={[styles.heroTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
            Your Personalized{'\n'}Learning Assistant
          </Text>
          <Text style={[styles.heroSubtext, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
            Adaptive AI that understands your strengths, identifies gaps, and creates a tailored roadmap to mastery.
          </Text>
        </View>

        <View style={styles.buttonSection}>
          <Pressable
            onPress={() => router.push('/login')}
            style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
          >
            <Text style={[styles.primaryBtnText, { fontFamily: 'Inter_600SemiBold' }]}>Get Started</Text>
            <Feather name="arrow-right" size={18} color="#fff" />
          </Pressable>
          <Pressable
            onPress={async () => {
              const { loginAsGuest: guestLogin } = authCtx;
              await guestLogin();
            }}
            style={({ pressed }) => [styles.secondaryBtn, { borderColor: colors.border, backgroundColor: colors.surface, opacity: pressed ? 0.8 : 1 }]}
          >
            <Feather name="user" size={16} color={colors.text} />
            <Text style={[styles.secondaryBtnText, { color: colors.text, fontFamily: 'Inter_500Medium' }]}>Continue as Guest</Text>
          </Pressable>
        </View>

        <View style={styles.featuresSection}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>What you'll get</Text>
          <View style={styles.featuresGrid}>
            {features.map((f, i) => (
              <FeatureCard key={f.title} icon={f.icon} title={f.title} desc={f.desc} delay={600 + i * 150} colors={colors} />
            ))}
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, zIndex: 10 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoBadge: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 20 },
  themeBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  scrollContent: { paddingHorizontal: 20 },
  heroSection: { marginTop: 40, gap: 16 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  heroBadgeText: { fontSize: 13 },
  heroTitle: { fontSize: 34, lineHeight: 42 },
  heroSubtext: { fontSize: 16, lineHeight: 24 },
  buttonSection: { marginTop: 32, gap: 12 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 14, shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 4 },
  primaryBtnText: { color: '#fff', fontSize: 16 },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1 },
  secondaryBtnText: { fontSize: 15 },
  featuresSection: { marginTop: 48 },
  sectionTitle: { fontSize: 20, marginBottom: 16 },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  featureCard: { width: (width - 52) / 2, padding: 16, borderRadius: 16, borderWidth: 1, gap: 8 },
  featureIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  featureTitle: { fontSize: 14 },
  featureDesc: { fontSize: 12, lineHeight: 17 },
});

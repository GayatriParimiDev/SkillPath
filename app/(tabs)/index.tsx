import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable, Platform, ScrollView, ActivityIndicator, Dimensions, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/query-client';

const { width } = Dimensions.get('window');

function AnimatedProgressBar({ value, color, delay, bgColor }: { value: number; color: string; delay: number; bgColor: string }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(delay, withTiming(Math.min(value, 100) / 100, { duration: 1000, easing: Easing.out(Easing.cubic) }));
  }, [value]);
  const animStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` as any }));
  return (
    <View style={[{ height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: bgColor }]}>
      <Animated.View style={[{ height: '100%', borderRadius: 4, backgroundColor: color }, animStyle]} />
    </View>
  );
}

function CircularScore({ score, label, color, colors }: { score: number; label: string; color: string; colors: any }) {
  const anim = useSharedValue(0);
  useEffect(() => { anim.value = withTiming(1, { duration: 1200 }); }, []);
  const textStyle = useAnimatedStyle(() => ({ opacity: anim.value }));
  return (
    <View style={styles.circularContainer}>
      <View style={[styles.circularOuter, { borderColor: color + '30' }]}>
        <View style={[styles.circularInner, { borderColor: color, borderLeftColor: 'transparent', borderBottomColor: 'transparent' }]}>
          <Animated.Text style={[styles.circularValue, { color, fontFamily: 'Inter_700Bold' }, textStyle]}>{score}%</Animated.Text>
        </View>
      </View>
      <Text style={[styles.circularLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>{label}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, logout, isGuest } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const fetchAnalytics = async () => {
    try {
      if (isGuest) {
        const saved = await AsyncStorage.getItem('skillpath_guest_progress');
        if (saved) {
          const progress = JSON.parse(saved);
          const total = progress.length;
          const avgMastery = total > 0 ? progress.reduce((s: number, p: any) => s + (p.mastery_level || 0), 0) / total : 0;
          const avgConf = total > 0 ? Math.min(1, avgMastery / 100) : 0;
          setAnalytics({ total_topics: total, average_mastery: avgMastery, average_confidence: avgConf, exam_readiness_score: Math.round((avgMastery + avgConf * 100) / 2) });
        } else {
          setAnalytics({ total_topics: 0, average_mastery: 0, average_confidence: 0, exam_readiness_score: 0 });
        }
      } else {
        const res = await apiRequest('GET', `/api/analytics/${user?.id}`);
        const data = await res.json();
        setAnalytics(data);
      }
    } catch {
      setAnalytics({ total_topics: 0, average_mastery: 0, average_confidence: 0, exam_readiness_score: 0 });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAnalytics(); }, []);

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  const readiness = analytics?.exam_readiness_score || 0;
  const mastery = Math.round(analytics?.average_mastery || 0);
  const confidence = Math.round((analytics?.average_confidence || 0) * 100);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={isDark ? ['#0f172a', '#1e1b4b'] : ['#eef2ff', '#f8f9ff']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />

      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
            {isGuest ? 'Guest Mode' : 'Welcome back'}
          </Text>
          <Text style={[styles.userName, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{user?.name || 'Learner'}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={toggleTheme} style={[styles.iconBtn, { backgroundColor: colors.surface }]}>
            <Feather name={isDark ? 'sun' : 'moon'} size={18} color={colors.text} />
          </Pressable>
          <Pressable onPress={handleLogout} style={[styles.iconBtn, { backgroundColor: colors.surface }]}>
            <Feather name="log-out" size={18} color={colors.error} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAnalytics(); }} tintColor={colors.primary} />}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            <Animated.View entering={FadeInDown.duration(500)} style={[styles.scoreSection]}>
              <CircularScore score={readiness} label="Exam Readiness" color={colors.primary} colors={colors} />
              <CircularScore score={confidence} label="Confidence" color={colors.accent} colors={colors} />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).duration(500)} style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statsTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Mastery Overview</Text>
              <View style={styles.statRow}>
                <View style={styles.statInfo}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>Average Mastery</Text>
                  <Text style={[styles.statValue, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{mastery}%</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <AnimatedProgressBar value={mastery} color={colors.primary} delay={400} bgColor={isDark ? 'rgba(129,140,248,0.15)' : 'rgba(79,70,229,0.1)'} />
                </View>
              </View>
              <View style={styles.statRow}>
                <View style={styles.statInfo}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>Confidence Level</Text>
                  <Text style={[styles.statValue, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{confidence}%</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <AnimatedProgressBar value={confidence} color={colors.accent} delay={600} bgColor={isDark ? 'rgba(34,211,238,0.15)' : 'rgba(6,182,212,0.1)'} />
                </View>
              </View>
              <View style={[styles.topicBadge, { backgroundColor: isDark ? 'rgba(129,140,248,0.1)' : 'rgba(79,70,229,0.06)' }]}>
                <Ionicons name="book-outline" size={16} color={colors.primary} />
                <Text style={[styles.topicBadgeText, { color: colors.text, fontFamily: 'Inter_500Medium' }]}>
                  {analytics?.total_topics || 0} topics tracked
                </Text>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(400).duration(500)}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Quick Actions</Text>
              <View style={styles.actionsGrid}>
                {[
                  { icon: 'map-outline', label: 'View Roadmap', route: '/(tabs)/roadmap', color: colors.primary },
                  { icon: 'bulb-outline', label: 'Concept Coach', route: '/(tabs)/concept', color: colors.accent },
                  { icon: 'document-text-outline', label: 'Get Feedback', route: '/(tabs)/feedback', color: colors.warning },
                  { icon: 'trending-up', label: 'Track Progress', route: '/(tabs)/progress', color: colors.success },
                ].map((action, i) => (
                  <Pressable
                    key={action.label}
                    onPress={() => router.push(action.route as any)}
                    style={({ pressed }) => [styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}
                  >
                    <View style={[styles.actionIcon, { backgroundColor: action.color + '15' }]}>
                      <Ionicons name={action.icon as any} size={22} color={action.color} />
                    </View>
                    <Text style={[styles.actionLabel, { color: colors.text, fontFamily: 'Inter_500Medium' }]}>{action.label}</Text>
                  </Pressable>
                ))}
              </View>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, marginBottom: 8 },
  greeting: { fontSize: 14 },
  userName: { fontSize: 24 },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1 },
  scrollContent: { paddingHorizontal: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  scoreSection: { flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 16, marginBottom: 20 },
  circularContainer: { alignItems: 'center', gap: 8 },
  circularOuter: { width: 110, height: 110, borderRadius: 55, borderWidth: 6, alignItems: 'center', justifyContent: 'center' },
  circularInner: { width: 90, height: 90, borderRadius: 45, borderWidth: 4, alignItems: 'center', justifyContent: 'center' },
  circularValue: { fontSize: 24 },
  circularLabel: { fontSize: 12 },
  statsCard: { padding: 20, borderRadius: 16, borderWidth: 1, gap: 16, marginBottom: 24 },
  statsTitle: { fontSize: 16 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  statInfo: { width: 100, gap: 2 },
  statLabel: { fontSize: 12 },
  statValue: { fontSize: 16 },
  topicBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, alignSelf: 'flex-start' },
  topicBadgeText: { fontSize: 13 },
  sectionTitle: { fontSize: 18, marginBottom: 12 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: { width: (width - 52) / 2, padding: 16, borderRadius: 14, borderWidth: 1, gap: 10 },
  actionIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 13 },
});

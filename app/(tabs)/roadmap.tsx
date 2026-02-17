import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Platform, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInLeft } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/query-client';

interface WeekData {
  week: number;
  title: string;
  tasks: string[];
}

function parseRoadmapText(text: string): WeekData[] {
  const weeks: WeekData[] = [];
  const lines = text.split('\n').filter(l => l.trim());
  let current: WeekData | null = null;

  for (const line of lines) {
    const weekMatch = line.match(/week\s*(\d)/i);
    if (weekMatch) {
      if (current) weeks.push(current);
      current = { week: parseInt(weekMatch[1]), title: line.replace(/^[\*\-\#]+\s*/, '').trim(), tasks: [] };
    } else if (current && (line.startsWith('-') || line.startsWith('*') || line.match(/^\d+\./))) {
      current.tasks.push(line.replace(/^[\*\-\d\.]+\s*/, '').trim());
    } else if (current) {
      current.tasks.push(line.trim());
    }
  }
  if (current) weeks.push(current);

  if (weeks.length === 0) {
    return [
      { week: 1, title: 'Foundation', tasks: lines.slice(0, Math.ceil(lines.length / 4)) },
      { week: 2, title: 'Core Skills', tasks: lines.slice(Math.ceil(lines.length / 4), Math.ceil(lines.length / 2)) },
      { week: 3, title: 'Application', tasks: lines.slice(Math.ceil(lines.length / 2), Math.ceil(lines.length * 3 / 4)) },
      { week: 4, title: 'Mastery', tasks: lines.slice(Math.ceil(lines.length * 3 / 4)) },
    ];
  }
  return weeks;
}

function WeekCard({ week, expanded, onToggle, colors, delay }: { week: WeekData; expanded: boolean; onToggle: () => void; colors: any; delay: number }) {
  const weekColors = [colors.primary, colors.accent, colors.warning, colors.success];
  const color = weekColors[(week.week - 1) % 4];

  return (
    <Animated.View entering={FadeInLeft.delay(delay).duration(400)}>
      <View style={styles.timelineRow}>
        <View style={styles.timelineLine}>
          <View style={[styles.timelineDot, { backgroundColor: color }]}>
            <Ionicons name="checkmark" size={12} color="#fff" />
          </View>
          <View style={[styles.timelineBar, { backgroundColor: colors.border }]} />
        </View>
        <Pressable
          onPress={onToggle}
          style={({ pressed }) => [styles.weekCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: color, opacity: pressed ? 0.9 : 1 }]}
        >
          <View style={styles.weekHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.weekLabel, { color, fontFamily: 'Inter_600SemiBold' }]}>Week {week.week}</Text>
              <Text style={[styles.weekTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>{week.title}</Text>
            </View>
            <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
          </View>
          {expanded && week.tasks.length > 0 && (
            <View style={styles.tasksContainer}>
              {week.tasks.map((task, i) => (
                <View key={i} style={styles.taskItem}>
                  <View style={[styles.taskDot, { backgroundColor: color + '40' }]}>
                    <View style={[styles.taskDotInner, { backgroundColor: color }]} />
                  </View>
                  <Text style={[styles.taskText, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>{task}</Text>
                </View>
              ))}
            </View>
          )}
        </Pressable>
      </View>
    </Animated.View>
  );
}

export default function RoadmapScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user, isGuest } = useAuth();
  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedWeek, setExpandedWeek] = useState<number>(1);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const fetchRoadmap = async () => {
    try {
      setError('');
      if (isGuest) {
        const saved = await AsyncStorage.getItem('skillpath_curriculum');
        if (saved) {
          const data = JSON.parse(saved);
          if (data.roadmap) {
            setWeeks(data.roadmap);
          } else {
            setWeeks([
              { week: 1, title: 'Foundation Building', tasks: ['Review core concepts', 'Set up study schedule', 'Complete diagnostic'] },
              { week: 2, title: 'Deep Dive', tasks: ['Focus on weak areas', 'Practice problems', 'Study groups'] },
              { week: 3, title: 'Application', tasks: ['Build projects', 'Mock tests', 'Peer review'] },
              { week: 4, title: 'Mastery', tasks: ['Final review', 'Assessment', 'Next steps'] },
            ]);
          }
        } else {
          setWeeks([
            { week: 1, title: 'Foundation Building', tasks: ['Complete curriculum analysis first to get a personalized roadmap'] },
          ]);
        }
      } else {
        const res = await apiRequest('GET', `/api/roadmap/${user?.id}`);
        const data = await res.json();
        if (data.roadmap) {
          const parsed = parseRoadmapText(data.roadmap);
          setWeeks(parsed);
        }
      }
    } catch {
      setError('Could not load roadmap. Pull to refresh.');
      setWeeks([
        { week: 1, title: 'Foundation Building', tasks: ['Review core concepts', 'Set learning goals'] },
        { week: 2, title: 'Skill Development', tasks: ['Practice exercises', 'Online resources'] },
        { week: 3, title: 'Application', tasks: ['Build projects', 'Collaborate with peers'] },
        { week: 4, title: 'Review & Mastery', tasks: ['Comprehensive review', 'Final assessment'] },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchRoadmap(); }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={isDark ? ['#0f172a', '#1e1b4b'] : ['#eef2ff', '#f8f9ff']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />

      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <View>
          <Text style={[styles.pageTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Learning Roadmap</Text>
          <Text style={[styles.pageSubtitle, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>Your personalized 4-week plan</Text>
        </View>
        <View style={[styles.weekBadge, { backgroundColor: isDark ? 'rgba(129,140,248,0.15)' : 'rgba(79,70,229,0.1)' }]}>
          <Ionicons name="calendar-outline" size={14} color={colors.primary} />
          <Text style={[styles.weekBadgeText, { color: colors.primary, fontFamily: 'Inter_600SemiBold' }]}>{weeks.length} weeks</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRoadmap(); }} tintColor={colors.primary} />}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>Generating your roadmap...</Text>
          </View>
        ) : (
          <>
            {!!error && (
              <View style={[styles.errorBanner, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                <Feather name="alert-circle" size={14} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error, fontFamily: 'Inter_400Regular' }]}>{error}</Text>
              </View>
            )}
            {weeks.map((week, i) => (
              <WeekCard
                key={week.week}
                week={week}
                expanded={expandedWeek === week.week}
                onToggle={() => setExpandedWeek(expandedWeek === week.week ? -1 : week.week)}
                colors={colors}
                delay={i * 150}
              />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  pageTitle: { fontSize: 24 },
  pageSubtitle: { fontSize: 14, marginTop: 2 },
  weekBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  weekBadgeText: { fontSize: 12 },
  scrollContent: { paddingHorizontal: 20 },
  loadingContainer: { justifyContent: 'center', alignItems: 'center', paddingTop: 80, gap: 12 },
  loadingText: { fontSize: 14 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, marginBottom: 12 },
  errorText: { fontSize: 13, flex: 1 },
  timelineRow: { flexDirection: 'row', marginBottom: 4 },
  timelineLine: { width: 32, alignItems: 'center' },
  timelineDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  timelineBar: { width: 2, flex: 1, marginTop: -2 },
  weekCard: { flex: 1, marginLeft: 8, padding: 16, borderRadius: 14, borderWidth: 1, borderLeftWidth: 3, marginBottom: 12 },
  weekHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  weekLabel: { fontSize: 12, marginBottom: 2 },
  weekTitle: { fontSize: 15 },
  tasksContainer: { marginTop: 12, gap: 8 },
  taskItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  taskDot: { width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  taskDotInner: { width: 6, height: 6, borderRadius: 3 },
  taskText: { flex: 1, fontSize: 13, lineHeight: 20 },
});

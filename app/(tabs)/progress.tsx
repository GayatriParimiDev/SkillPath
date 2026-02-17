import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, Platform, ScrollView, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/query-client';

const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Completed'];

interface ProgressEntry {
  topic: string;
  status: string;
  mastery_level: number;
  confidence_score?: number;
  next_revision?: string;
  last_studied?: string;
}

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user, isGuest } = useAuth();
  const [topic, setTopic] = useState('');
  const [status, setStatus] = useState('In Progress');
  const [mastery, setMastery] = useState(50);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<ProgressEntry[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const successScale = useSharedValue(0);
  const successStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
    opacity: successScale.value,
  }));

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    if (isGuest) {
      const saved = await AsyncStorage.getItem('skillpath_guest_progress');
      if (saved) setHistory(JSON.parse(saved));
    }
  };

  const handleSubmit = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setResult(null);
    setShowSuccess(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (isGuest) {
        const confidence = Math.min(1, mastery / 100);
        const today = new Date();
        const nextRevision = new Date(today);
        if (mastery < 40) nextRevision.setDate(today.getDate() + 2);
        else if (mastery < 70) nextRevision.setDate(today.getDate() + 5);
        else nextRevision.setDate(today.getDate() + 10);

        const entry: ProgressEntry = {
          topic: topic.trim(),
          status,
          mastery_level: mastery,
          confidence_score: confidence,
          next_revision: nextRevision.toISOString(),
          last_studied: today.toISOString(),
        };

        const updated = [...history, entry];
        setHistory(updated);
        await AsyncStorage.setItem('skillpath_guest_progress', JSON.stringify(updated));
        setResult({ confidence_score: confidence, next_revision: nextRevision.toISOString() });
      } else {
        const res = await apiRequest('POST', '/api/progress', {
          student_id: user?.id,
          topic: topic.trim(),
          status,
          mastery_level: mastery,
        });
        const data = await res.json();
        setResult(data);
      }

      setShowSuccess(true);
      successScale.value = withSpring(1, { damping: 12, stiffness: 100 });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setResult({ confidence_score: mastery / 100, next_revision: new Date().toISOString() });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTopic('');
    setStatus('In Progress');
    setMastery(50);
    setResult(null);
    setShowSuccess(false);
    successScale.value = 0;
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={isDark ? ['#0f172a', '#1e1b4b'] : ['#eef2ff', '#f8f9ff']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />

      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <Text style={[styles.pageTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Track Progress</Text>
        <Text style={[styles.pageSubtitle, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>Log your learning journey</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {showSuccess && result ? (
            <Animated.View style={[styles.successContainer, successStyle]}>
              <View style={[styles.successCircle, { borderColor: colors.success }]}>
                <Ionicons name="checkmark" size={48} color={colors.success} />
              </View>
              <Text style={[styles.successTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Progress Saved!</Text>

              <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.resultRow}>
                  <Text style={[styles.resultLabel, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>Confidence Score</Text>
                  <Text style={[styles.resultValue, { color: colors.primary, fontFamily: 'Inter_700Bold' }]}>
                    {Math.round((result.confidence_score || 0) * 100)}%
                  </Text>
                </View>
                <View style={[styles.resultDivider, { backgroundColor: colors.border }]} />
                <View style={styles.resultRow}>
                  <Text style={[styles.resultLabel, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>Next Revision</Text>
                  <Text style={[styles.resultValue, { color: colors.accent, fontFamily: 'Inter_600SemiBold' }]}>
                    {formatDate(result.next_revision)}
                  </Text>
                </View>
                <View style={[styles.resultDivider, { backgroundColor: colors.border }]} />
                <View style={styles.resultRow}>
                  <Text style={[styles.resultLabel, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>Mastery Level</Text>
                  <Text style={[styles.resultValue, { color: colors.success, fontFamily: 'Inter_700Bold' }]}>{mastery}%</Text>
                </View>
              </View>

              <Pressable
                onPress={resetForm}
                style={({ pressed }) => [styles.addMoreBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
              >
                <Feather name="plus" size={18} color="#fff" />
                <Text style={[styles.addMoreText, { fontFamily: 'Inter_600SemiBold' }]}>Add More Progress</Text>
              </Pressable>
            </Animated.View>
          ) : (
            <>
              <Animated.View entering={FadeInDown.duration(400)} style={[styles.inputCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Topic</Text>
                  <View style={[styles.inputRow, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                    <Feather name="book" size={16} color={colors.textSecondary} />
                    <TextInput
                      style={[styles.input, { color: colors.text, fontFamily: 'Inter_400Regular' }]}
                      placeholder="e.g. Binary Trees, Linear Algebra"
                      placeholderTextColor={colors.textSecondary}
                      value={topic}
                      onChangeText={setTopic}
                    />
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Status</Text>
                  <View style={styles.chipRow}>
                    {STATUS_OPTIONS.map((s) => (
                      <Pressable
                        key={s}
                        onPress={() => setStatus(s)}
                        style={[styles.chip, {
                          backgroundColor: status === s ? colors.primary : colors.surfaceSecondary,
                          borderColor: status === s ? colors.primary : colors.border,
                        }]}
                      >
                        <Text style={[styles.chipText, {
                          color: status === s ? '#fff' : colors.text,
                          fontFamily: status === s ? 'Inter_600SemiBold' : 'Inter_400Regular',
                        }]}>{s}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <View style={styles.masteryHeader}>
                    <Text style={[styles.fieldLabel, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Mastery Level</Text>
                    <Text style={[styles.masteryValue, { color: colors.primary, fontFamily: 'Inter_700Bold' }]}>{mastery}%</Text>
                  </View>
                  <View style={styles.sliderContainer}>
                    <View style={[styles.sliderTrack, { backgroundColor: colors.border }]}>
                      <View style={[styles.sliderFill, { width: `${mastery}%`, backgroundColor: colors.primary }]} />
                    </View>
                    <View style={styles.sliderButtons}>
                      {[0, 25, 50, 75, 100].map((v) => (
                        <Pressable key={v} onPress={() => setMastery(v)} style={[styles.sliderBtn, { backgroundColor: mastery >= v ? colors.primary + '20' : colors.surfaceSecondary }]}>
                          <Text style={[styles.sliderBtnText, { color: mastery >= v ? colors.primary : colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>{v}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                </View>

                <Pressable
                  onPress={handleSubmit}
                  disabled={loading || !topic.trim()}
                  style={({ pressed }) => [styles.submitBtn, {
                    backgroundColor: !topic.trim() ? colors.border : colors.primary,
                    opacity: pressed || loading ? 0.85 : 1,
                  }]}
                >
                  {loading ? <ActivityIndicator color="#fff" size="small" /> : (
                    <>
                      <Feather name="save" size={16} color="#fff" />
                      <Text style={[styles.submitBtnText, { fontFamily: 'Inter_600SemiBold' }]}>Save Progress</Text>
                    </>
                  )}
                </Pressable>
              </Animated.View>

              {history.length > 0 && (
                <Animated.View entering={FadeInDown.delay(200).duration(400)}>
                  <Text style={[styles.historyTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Recent Progress</Text>
                  {history.slice(-5).reverse().map((entry, i) => (
                    <View key={i} style={[styles.historyItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <View style={styles.historyRow}>
                        <Text style={[styles.historyTopic, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>{entry.topic}</Text>
                        <View style={[styles.historyBadge, { backgroundColor: entry.status === 'Completed' ? colors.success + '20' : colors.warning + '20' }]}>
                          <Text style={[styles.historyBadgeText, { color: entry.status === 'Completed' ? colors.success : colors.warning, fontFamily: 'Inter_500Medium' }]}>
                            {entry.mastery_level}%
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.historyDate, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                        {entry.last_studied ? formatDate(entry.last_studied) : 'Today'}
                      </Text>
                    </View>
                  ))}
                </Animated.View>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, marginBottom: 8 },
  pageTitle: { fontSize: 24 },
  pageSubtitle: { fontSize: 14, marginTop: 2 },
  scrollContent: { paddingHorizontal: 20, gap: 12 },
  inputCard: { padding: 18, borderRadius: 16, borderWidth: 1, gap: 16 },
  fieldGroup: { gap: 8 },
  fieldLabel: { fontSize: 14 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  input: { flex: 1, fontSize: 15, padding: 0 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13 },
  masteryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  masteryValue: { fontSize: 20 },
  sliderContainer: { gap: 10 },
  sliderTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  sliderFill: { height: '100%', borderRadius: 3 },
  sliderButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  sliderBtnText: { fontSize: 12 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
  submitBtnText: { color: '#fff', fontSize: 15 },
  successContainer: { alignItems: 'center', paddingTop: 40, gap: 16 },
  successCircle: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 24 },
  resultCard: { width: '100%', padding: 18, borderRadius: 14, borderWidth: 1, gap: 12 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultLabel: { fontSize: 14 },
  resultValue: { fontSize: 18 },
  resultDivider: { height: 1 },
  addMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12 },
  addMoreText: { color: '#fff', fontSize: 15 },
  historyTitle: { fontSize: 18, marginTop: 8, marginBottom: 8 },
  historyItem: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyTopic: { fontSize: 14, flex: 1 },
  historyBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  historyBadgeText: { fontSize: 12 },
  historyDate: { fontSize: 12, marginTop: 4 },
});

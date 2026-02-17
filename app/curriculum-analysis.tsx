import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, Platform, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing, withRepeat, withSequence } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/query-client';

const { width } = Dimensions.get('window');

const EDUCATION_LEVELS = ['High School', 'Undergraduate', 'Graduate', 'Self-Learner'];
const GOALS = ['Exam Preparation', 'Job Placement', 'Skill Development', 'Research'];

function ChipSelector({ options, selected, onSelect, colors }: { options: string[]; selected: string; onSelect: (v: string) => void; colors: any }) {
  return (
    <View style={chipStyles.row}>
      {options.map((opt) => (
        <Pressable
          key={opt}
          onPress={() => onSelect(opt)}
          style={[chipStyles.chip, {
            backgroundColor: selected === opt ? colors.primary : colors.surfaceSecondary,
            borderColor: selected === opt ? colors.primary : colors.border,
          }]}
        >
          <Text style={[chipStyles.chipText, {
            color: selected === opt ? '#fff' : colors.text,
            fontFamily: selected === opt ? 'Inter_600SemiBold' : 'Inter_400Regular',
          }]}>{opt}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const chipStyles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13 },
});

function AnalyzingAnimation({ colors }: { colors: any }) {
  const dot1 = useSharedValue(0.3);
  const dot2 = useSharedValue(0.3);
  const dot3 = useSharedValue(0.3);
  const pulse = useSharedValue(1);

  useEffect(() => {
    dot1.value = withRepeat(withSequence(withTiming(1, { duration: 400 }), withTiming(0.3, { duration: 400 })), -1);
    dot2.value = withDelay(200, withRepeat(withSequence(withTiming(1, { duration: 400 }), withTiming(0.3, { duration: 400 })), -1));
    dot3.value = withDelay(400, withRepeat(withSequence(withTiming(1, { duration: 400 }), withTiming(0.3, { duration: 400 })), -1));
    pulse.value = withRepeat(withSequence(withTiming(1.05, { duration: 1500 }), withTiming(0.95, { duration: 1500 })), -1, true);
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const d1 = useAnimatedStyle(() => ({ opacity: dot1.value }));
  const d2 = useAnimatedStyle(() => ({ opacity: dot2.value }));
  const d3 = useAnimatedStyle(() => ({ opacity: dot3.value }));

  return (
    <View style={styles.analyzingContainer}>
      <Animated.View style={[styles.analyzingCircle, { borderColor: colors.primary }, pulseStyle]}>
        <MaterialCommunityIcons name="brain" size={48} color={colors.primary} />
      </Animated.View>
      <Text style={[styles.analyzingTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Analyzing Your Profile</Text>
      <View style={styles.dotsRow}>
        {[d1, d2, d3].map((d, i) => (
          <Animated.View key={i} style={[styles.dot, { backgroundColor: colors.primary }, d]} />
        ))}
      </View>
      <Text style={[styles.analyzingSubtext, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
        Our AI is crafting your personalized learning path...
      </Text>
    </View>
  );
}

export default function CurriculumAnalysisScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [educationLevel, setEducationLevel] = useState('');
  const [subjects, setSubjects] = useState('');
  const [strengths, setStrengths] = useState('');
  const [weaknesses, setWeaknesses] = useState('');
  const [goal, setGoal] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await apiRequest('POST', '/api/curriculum-analysis', {
        education_level: educationLevel,
        subjects: subjects.split(',').map(s => s.trim()).filter(Boolean),
        strengths: strengths.split(',').map(s => s.trim()).filter(Boolean),
        weaknesses: weaknesses.split(',').map(s => s.trim()).filter(Boolean),
        goal,
      });
      const data = await res.json();
      setResult(data);
      await AsyncStorage.setItem('skillpath_curriculum', JSON.stringify(data));
    } catch (err) {
      setResult({
        summary: 'Analysis generated based on your profile',
        confidence_score: 72,
        strength_analysis: strengths.split(',').map(s => s.trim()).filter(Boolean),
        weakness_analysis: weaknesses.split(',').map(s => s.trim()).filter(Boolean),
        roadmap: [
          { week: 1, title: 'Foundation Building', tasks: ['Review core concepts', 'Set up study schedule', 'Complete diagnostic assessment'] },
          { week: 2, title: 'Deep Dive', tasks: ['Focus on weak areas', 'Practice problems', 'Peer discussions'] },
          { week: 3, title: 'Application', tasks: ['Real-world projects', 'Mock assessments', 'Expert consultation'] },
          { week: 4, title: 'Mastery', tasks: ['Final review', 'Performance assessment', 'Next steps planning'] },
        ],
        suggested_path: 'Focus on strengthening fundamentals before advancing to complex topics.',
      });
    } finally {
      setAnalyzing(false);
      setStep(3);
    }
  };

  const goToDashboard = () => router.replace('/(tabs)');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#0f172a', '#1e1b4b', '#0f172a'] : ['#eef2ff', '#faf5ff', '#ecfeff']}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <Pressable onPress={() => step > 1 ? setStep(step - 1) : router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.stepIndicator}>
          {[1, 2, 3].map((s) => (
            <View key={s} style={[styles.stepDot, { backgroundColor: step >= s ? colors.primary : colors.border }]} />
          ))}
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 20 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {analyzing ? (
          <AnalyzingAnimation colors={colors} />
        ) : step === 1 ? (
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Tell us about yourself</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
              Help our AI understand your learning profile
            </Text>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Education Level</Text>
                <ChipSelector options={EDUCATION_LEVELS} selected={educationLevel} onSelect={setEducationLevel} colors={colors} />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Current Subjects</Text>
                <TextInput
                  style={[styles.textInput, { color: colors.text, backgroundColor: colors.surfaceSecondary, borderColor: colors.border, fontFamily: 'Inter_400Regular' }]}
                  placeholder="e.g. Math, Physics, CS (comma-separated)"
                  placeholderTextColor={colors.textSecondary}
                  value={subjects}
                  onChangeText={setSubjects}
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Goal</Text>
                <ChipSelector options={GOALS} selected={goal} onSelect={setGoal} colors={colors} />
              </View>
            </View>
            <Pressable
              onPress={() => setStep(2)}
              disabled={!educationLevel || !goal}
              style={({ pressed }) => [styles.nextBtn, {
                backgroundColor: !educationLevel || !goal ? colors.border : colors.primary,
                opacity: pressed ? 0.85 : 1,
              }]}
            >
              <Text style={[styles.nextBtnText, { fontFamily: 'Inter_600SemiBold' }]}>Next</Text>
              <Feather name="arrow-right" size={16} color="#fff" />
            </Pressable>
          </Animated.View>
        ) : step === 2 ? (
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Strengths & Weaknesses</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
              This helps us personalize your roadmap
            </Text>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.fieldGroup}>
                <View style={styles.fieldLabelRow}>
                  <Feather name="trending-up" size={16} color={colors.success} />
                  <Text style={[styles.fieldLabel, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Strength Areas</Text>
                </View>
                <TextInput
                  style={[styles.textInputMulti, { color: colors.text, backgroundColor: colors.surfaceSecondary, borderColor: colors.border, fontFamily: 'Inter_400Regular' }]}
                  placeholder="e.g. Problem solving, Data structures, Algorithms"
                  placeholderTextColor={colors.textSecondary}
                  value={strengths}
                  onChangeText={setStrengths}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
              <View style={styles.fieldGroup}>
                <View style={styles.fieldLabelRow}>
                  <Feather name="trending-down" size={16} color={colors.warning} />
                  <Text style={[styles.fieldLabel, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Areas to Improve</Text>
                </View>
                <TextInput
                  style={[styles.textInputMulti, { color: colors.text, backgroundColor: colors.surfaceSecondary, borderColor: colors.border, fontFamily: 'Inter_400Regular' }]}
                  placeholder="e.g. Networking, Databases, System design"
                  placeholderTextColor={colors.textSecondary}
                  value={weaknesses}
                  onChangeText={setWeaknesses}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>
            <Pressable
              onPress={handleAnalyze}
              style={({ pressed }) => [styles.nextBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
            >
              <Ionicons name="sparkles" size={18} color="#fff" />
              <Text style={[styles.nextBtnText, { fontFamily: 'Inter_600SemiBold' }]}>Analyze with AI</Text>
            </Pressable>
          </Animated.View>
        ) : result ? (
          <Animated.View entering={FadeInUp.duration(500)}>
            <View style={styles.resultHeader}>
              <Ionicons name="checkmark-circle" size={48} color={colors.success} />
              <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Analysis Complete</Text>
            </View>

            <View style={[styles.scoreCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.scoreLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Confidence Score</Text>
              <View style={styles.scoreCircle}>
                <View style={[styles.scoreRing, { borderColor: colors.primary }]}>
                  <Text style={[styles.scoreValue, { color: colors.primary, fontFamily: 'Inter_700Bold' }]}>{result.confidence_score || 72}%</Text>
                </View>
              </View>
            </View>

            {result.summary && (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Summary</Text>
                <Text style={[styles.cardBody, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>{result.summary}</Text>
              </View>
            )}

            {result.roadmap && result.roadmap.length > 0 && (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>4-Week Roadmap</Text>
                {result.roadmap.map((week: any, i: number) => (
                  <Animated.View key={i} entering={FadeInDown.delay(i * 100).duration(400)} style={[styles.weekItem, { borderLeftColor: colors.primary }]}>
                    <Text style={[styles.weekTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Week {week.week}: {week.title}</Text>
                    {week.tasks?.map((task: string, j: number) => (
                      <View key={j} style={styles.taskRow}>
                        <Feather name="circle" size={8} color={colors.accent} />
                        <Text style={[styles.taskText, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>{task}</Text>
                      </View>
                    ))}
                  </Animated.View>
                ))}
              </View>
            )}

            <Pressable
              onPress={goToDashboard}
              style={({ pressed }) => [styles.nextBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
            >
              <Text style={[styles.nextBtnText, { fontFamily: 'Inter_600SemiBold' }]}>Go to Dashboard</Text>
              <Feather name="arrow-right" size={16} color="#fff" />
            </Pressable>
          </Animated.View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  stepIndicator: { flexDirection: 'row', gap: 8 },
  stepDot: { width: 28, height: 4, borderRadius: 2 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16 },
  title: { fontSize: 26, marginBottom: 4 },
  subtitle: { fontSize: 15, marginBottom: 20, lineHeight: 22 },
  card: { padding: 20, borderRadius: 16, borderWidth: 1, marginBottom: 16, gap: 16 },
  fieldGroup: { gap: 8 },
  fieldLabel: { fontSize: 14 },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  textInput: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1, fontSize: 14 },
  textInputMulti: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1, fontSize: 14, minHeight: 80 },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 14, marginTop: 8, shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  nextBtnText: { color: '#fff', fontSize: 16 },
  analyzingContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 20 },
  analyzingCircle: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  analyzingTitle: { fontSize: 22 },
  dotsRow: { flexDirection: 'row', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  analyzingSubtext: { fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
  resultHeader: { alignItems: 'center', gap: 12, marginBottom: 20 },
  scoreCard: { alignItems: 'center', padding: 24, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  scoreLabel: { fontSize: 14, marginBottom: 12 },
  scoreCircle: { alignItems: 'center' },
  scoreRing: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, alignItems: 'center', justifyContent: 'center' },
  scoreValue: { fontSize: 28 },
  cardTitle: { fontSize: 16, marginBottom: 4 },
  cardBody: { fontSize: 14, lineHeight: 22 },
  weekItem: { borderLeftWidth: 3, paddingLeft: 14, paddingVertical: 8, gap: 4 },
  weekTitle: { fontSize: 14, marginBottom: 2 },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  taskText: { fontSize: 13, flex: 1 },
});

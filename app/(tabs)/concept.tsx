import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, Platform, ScrollView, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { apiRequest } from '@/lib/query-client';

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const LANGUAGES = ['English', 'Hindi', 'Spanish', 'French'];

interface ConceptResult {
  topic: string;
  steps: string[];
  analogy: string;
  hint_question: string;
  mastery_question: string;
}

function ResultCard({ result, colors, isDark }: { result: ConceptResult; colors: any; isDark: boolean }) {
  return (
    <Animated.View entering={FadeInUp.duration(500)} style={{ gap: 12 }}>
      <View style={[cStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={cStyles.cardHeader}>
          <View style={[cStyles.cardBadge, { backgroundColor: colors.primary + '15' }]}>
            <MaterialCommunityIcons name="stairs" size={16} color={colors.primary} />
          </View>
          <Text style={[cStyles.cardTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Step-by-Step</Text>
        </View>
        {result.steps.map((step, i) => (
          <View key={i} style={cStyles.stepRow}>
            <View style={[cStyles.stepNumber, { backgroundColor: colors.primary }]}>
              <Text style={[cStyles.stepNumberText, { fontFamily: 'Inter_600SemiBold' }]}>{i + 1}</Text>
            </View>
            <Text style={[cStyles.stepText, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>{step}</Text>
          </View>
        ))}
      </View>

      {!!result.analogy && (
        <View style={[cStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={cStyles.cardHeader}>
            <View style={[cStyles.cardBadge, { backgroundColor: colors.accent + '15' }]}>
              <Ionicons name="bulb-outline" size={16} color={colors.accent} />
            </View>
            <Text style={[cStyles.cardTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Analogy</Text>
          </View>
          <Text style={[cStyles.cardBody, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>{result.analogy}</Text>
        </View>
      )}

      {!!result.hint_question && (
        <View style={[cStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={cStyles.cardHeader}>
            <View style={[cStyles.cardBadge, { backgroundColor: colors.warning + '15' }]}>
              <Feather name="help-circle" size={16} color={colors.warning} />
            </View>
            <Text style={[cStyles.cardTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Think About This</Text>
          </View>
          <Text style={[cStyles.cardBody, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>{result.hint_question}</Text>
        </View>
      )}

      {!!result.mastery_question && (
        <View style={[cStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={cStyles.cardHeader}>
            <View style={[cStyles.cardBadge, { backgroundColor: colors.success + '15' }]}>
              <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
            </View>
            <Text style={[cStyles.cardTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Mastery Check</Text>
          </View>
          <Text style={[cStyles.cardBody, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>{result.mastery_question}</Text>
        </View>
      )}
    </Animated.View>
  );
}

const cStyles = StyleSheet.create({
  card: { padding: 16, borderRadius: 14, borderWidth: 1, gap: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardBadge: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15 },
  cardBody: { fontSize: 14, lineHeight: 22 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  stepNumber: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  stepNumberText: { fontSize: 12, color: '#fff' },
  stepText: { flex: 1, fontSize: 14, lineHeight: 22 },
});

export default function ConceptCoachScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('Beginner');
  const [language, setLanguage] = useState('English');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ConceptResult | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const handleSubmit = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setResult(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const res = await apiRequest('POST', '/api/concept', { topic: topic.trim(), level: level.toLowerCase(), language });
      const data = await res.json();
      setResult(data);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
    } catch {
      setResult({
        topic: topic.trim(),
        steps: ['Unable to generate explanation. Please try again.'],
        analogy: '',
        hint_question: '',
        mastery_question: '',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={isDark ? ['#0f172a', '#1e1b4b'] : ['#eef2ff', '#f8f9ff']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />

      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <Text style={[styles.pageTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Concept Coach</Text>
        <Text style={[styles.pageSubtitle, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>AI-powered explanations</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInDown.duration(400)} style={[styles.inputCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Topic</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                <Feather name="search" size={16} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.text, fontFamily: 'Inter_400Regular' }]}
                  placeholder="e.g. Binary Search Trees, Photosynthesis"
                  placeholderTextColor={colors.textSecondary}
                  value={topic}
                  onChangeText={setTopic}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Level</Text>
              <View style={styles.chipRow}>
                {LEVELS.map((l) => (
                  <Pressable
                    key={l}
                    onPress={() => setLevel(l)}
                    style={[styles.chip, { backgroundColor: level === l ? colors.primary : colors.surfaceSecondary, borderColor: level === l ? colors.primary : colors.border }]}
                  >
                    <Text style={[styles.chipText, { color: level === l ? '#fff' : colors.text, fontFamily: level === l ? 'Inter_600SemiBold' : 'Inter_400Regular' }]}>{l}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Language</Text>
              <View style={styles.chipRow}>
                {LANGUAGES.map((l) => (
                  <Pressable
                    key={l}
                    onPress={() => setLanguage(l)}
                    style={[styles.chip, { backgroundColor: language === l ? colors.accent : colors.surfaceSecondary, borderColor: language === l ? colors.accent : colors.border }]}
                  >
                    <Text style={[styles.chipText, { color: language === l ? '#fff' : colors.text, fontFamily: language === l ? 'Inter_600SemiBold' : 'Inter_400Regular' }]}>{l}</Text>
                  </Pressable>
                ))}
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
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={18} color="#fff" />
                  <Text style={[styles.submitBtnText, { fontFamily: 'Inter_600SemiBold' }]}>Explain</Text>
                </>
              )}
            </Pressable>
          </Animated.View>

          {loading && (
            <View style={styles.loadingArea}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>AI is thinking...</Text>
            </View>
          )}

          {result && !loading && <ResultCard result={result} colors={colors} isDark={isDark} />}
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
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
  submitBtnText: { color: '#fff', fontSize: 15 },
  loadingArea: { alignItems: 'center', paddingTop: 32, gap: 12 },
  loadingText: { fontSize: 14 },
});

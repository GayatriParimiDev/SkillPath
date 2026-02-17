import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, Platform, ScrollView, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { apiRequest } from '@/lib/query-client';

function ScoreBar({ label, score, maxScore, color, colors }: { label: string; score: number; maxScore: number; color: string; colors: any }) {
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
  return (
    <View style={fStyles.scoreBarContainer}>
      <View style={fStyles.scoreBarLabel}>
        <Text style={[fStyles.scoreBarName, { color: colors.text, fontFamily: 'Inter_500Medium' }]}>{label}</Text>
        <Text style={[fStyles.scoreBarValue, { color, fontFamily: 'Inter_600SemiBold' }]}>{score}/{maxScore}</Text>
      </View>
      <View style={[fStyles.scoreBarBg, { backgroundColor: color + '20' }]}>
        <View style={[fStyles.scoreBarFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const fStyles = StyleSheet.create({
  scoreBarContainer: { gap: 4 },
  scoreBarLabel: { flexDirection: 'row', justifyContent: 'space-between' },
  scoreBarName: { fontSize: 13 },
  scoreBarValue: { fontSize: 13 },
  scoreBarBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  scoreBarFill: { height: '100%', borderRadius: 4 },
});

export default function FeedbackScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [content, setContent] = useState('');
  const [rubric, setRubric] = useState('');
  const [loading, setLoading] = useState(false);
  const [integrityLoading, setIntegrityLoading] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [integrity, setIntegrity] = useState<any>(null);
  const scrollRef = useRef<ScrollView>(null);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const handleSubmit = async () => {
    if (!content.trim() || !rubric.trim()) return;
    setLoading(true);
    setFeedback(null);
    setIntegrity(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const res = await apiRequest('POST', '/api/feedback', { content: content.trim(), rubric: rubric.trim() });
      const data = await res.json();
      setFeedback(data);

      setIntegrityLoading(true);
      const intRes = await apiRequest('POST', '/api/integrity', { content: content.trim() });
      const intData = await intRes.json();
      setIntegrity(intData);
    } catch {
      setFeedback({ criteria_scores: {}, strengths: ['Unable to analyze'], improvements: ['Please try again'], overall_score: 0 });
    } finally {
      setLoading(false);
      setIntegrityLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
    }
  };

  const riskColor = integrity?.originality_risk === 'High' ? colors.error : integrity?.originality_risk === 'Medium' ? colors.warning : colors.success;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={isDark ? ['#0f172a', '#1e1b4b'] : ['#eef2ff', '#f8f9ff']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />

      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <Text style={[styles.pageTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Feedback & Integrity</Text>
        <Text style={[styles.pageSubtitle, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>AI evaluation & originality check</Text>
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
              <Text style={[styles.fieldLabel, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Submission Content</Text>
              <TextInput
                style={[styles.textArea, { color: colors.text, backgroundColor: colors.surfaceSecondary, borderColor: colors.border, fontFamily: 'Inter_400Regular' }]}
                placeholder="Paste your essay, assignment, or answer here..."
                placeholderTextColor={colors.textSecondary}
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Rubric Criteria</Text>
              <TextInput
                style={[styles.textArea, { color: colors.text, backgroundColor: colors.surfaceSecondary, borderColor: colors.border, fontFamily: 'Inter_400Regular', minHeight: 80 }]}
                placeholder="e.g. Clarity: 10, Depth: 10, Grammar: 5, Originality: 10"
                placeholderTextColor={colors.textSecondary}
                value={rubric}
                onChangeText={setRubric}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
            <Pressable
              onPress={handleSubmit}
              disabled={loading || !content.trim() || !rubric.trim()}
              style={({ pressed }) => [styles.submitBtn, {
                backgroundColor: !content.trim() || !rubric.trim() ? colors.border : colors.primary,
                opacity: pressed || loading ? 0.85 : 1,
              }]}
            >
              {loading ? <ActivityIndicator color="#fff" size="small" /> : (
                <>
                  <Ionicons name="sparkles" size={18} color="#fff" />
                  <Text style={[styles.submitBtnText, { fontFamily: 'Inter_600SemiBold' }]}>Analyze</Text>
                </>
              )}
            </Pressable>
          </Animated.View>

          {feedback && !loading && (
            <Animated.View entering={FadeInUp.duration(500)} style={{ gap: 12 }}>
              <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.cardBadge, { backgroundColor: colors.primary + '15' }]}>
                    <Feather name="bar-chart-2" size={16} color={colors.primary} />
                  </View>
                  <Text style={[styles.cardTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Evaluation</Text>
                  <View style={[styles.overallBadge, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.overallText, { fontFamily: 'Inter_700Bold' }]}>{feedback.overall_score || 0}</Text>
                  </View>
                </View>
                {Object.entries(feedback.criteria_scores || {}).map(([key, val]) => (
                  <ScoreBar key={key} label={key} score={Number(val) || 0} maxScore={10} color={colors.primary} colors={colors} />
                ))}
              </View>

              {feedback.strengths?.length > 0 && (
                <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.cardBadge, { backgroundColor: colors.success + '15' }]}>
                      <Feather name="check-circle" size={16} color={colors.success} />
                    </View>
                    <Text style={[styles.cardTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Strengths</Text>
                  </View>
                  {feedback.strengths.map((s: string, i: number) => (
                    <View key={i} style={styles.listItem}>
                      <Feather name="plus" size={12} color={colors.success} />
                      <Text style={[styles.listText, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>{s}</Text>
                    </View>
                  ))}
                </View>
              )}

              {feedback.improvements?.length > 0 && (
                <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.cardBadge, { backgroundColor: colors.warning + '15' }]}>
                      <Feather name="arrow-up-circle" size={16} color={colors.warning} />
                    </View>
                    <Text style={[styles.cardTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Areas to Improve</Text>
                  </View>
                  {feedback.improvements.map((s: string, i: number) => (
                    <View key={i} style={styles.listItem}>
                      <Feather name="arrow-up" size={12} color={colors.warning} />
                      <Text style={[styles.listText, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>{s}</Text>
                    </View>
                  ))}
                </View>
              )}

              {integrityLoading ? (
                <View style={styles.loadingArea}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.loadingText, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>Checking integrity...</Text>
                </View>
              ) : integrity ? (
                <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.cardBadge, { backgroundColor: riskColor + '15' }]}>
                      <MaterialCommunityIcons name="shield-check-outline" size={16} color={riskColor} />
                    </View>
                    <Text style={[styles.cardTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Integrity Check</Text>
                  </View>
                  <View style={styles.integrityRow}>
                    <Text style={[styles.integrityLabel, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>Originality Risk</Text>
                    <View style={[styles.riskBadge, { backgroundColor: riskColor + '20' }]}>
                      <Text style={[styles.riskText, { color: riskColor, fontFamily: 'Inter_600SemiBold' }]}>{integrity.originality_risk}</Text>
                    </View>
                  </View>
                  {integrity.citation_needed && (
                    <View style={[styles.citationBanner, { backgroundColor: colors.warning + '10' }]}>
                      <Feather name="alert-triangle" size={14} color={colors.warning} />
                      <Text style={[styles.citationText, { color: colors.warning, fontFamily: 'Inter_500Medium' }]}>Citations recommended</Text>
                    </View>
                  )}
                  {!!integrity.recommendation && (
                    <Text style={[styles.recommendationText, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>{integrity.recommendation}</Text>
                  )}
                </View>
              ) : null}
            </Animated.View>
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
  inputCard: { padding: 18, borderRadius: 16, borderWidth: 1, gap: 14 },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 14 },
  textArea: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1, fontSize: 14, minHeight: 120 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
  submitBtnText: { color: '#fff', fontSize: 15 },
  resultCard: { padding: 16, borderRadius: 14, borderWidth: 1, gap: 12 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardBadge: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, flex: 1 },
  overallBadge: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  overallText: { color: '#fff', fontSize: 16 },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  listText: { flex: 1, fontSize: 13, lineHeight: 20 },
  integrityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  integrityLabel: { fontSize: 14 },
  riskBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  riskText: { fontSize: 13 },
  citationBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 8 },
  citationText: { fontSize: 13 },
  recommendationText: { fontSize: 13, lineHeight: 20 },
  loadingArea: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  loadingText: { fontSize: 14 },
});

import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, Platform, KeyboardAvoidingView, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [education, setEducation] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signup(name.trim(), education.trim(), email.trim(), password.trim());
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#0f172a', '#1e1b4b', '#0f172a'] : ['#eef2ff', '#faf5ff', '#ecfeff']}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: topInset + 16, paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 20 }]} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.text} />
          </Pressable>

          <Animated.View entering={FadeInDown.duration(500)} style={styles.heroArea}>
            <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(129,140,248,0.15)' : 'rgba(79,70,229,0.1)' }]}>
              <Ionicons name="person-add-outline" size={30} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Create Account</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>Start your personalized learning journey</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {!!error && (
              <View style={[styles.errorBox, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                <Feather name="alert-circle" size={14} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error, fontFamily: 'Inter_400Regular' }]}>{error}</Text>
              </View>
            )}

            {[
              { label: 'Full Name', icon: 'user', value: name, setter: setName, placeholder: 'John Doe', required: true },
              { label: 'Education', icon: 'book-open', value: education, setter: setEducation, placeholder: 'e.g. B.Tech CS, 2nd Year' },
              { label: 'Email', icon: 'mail', value: email, setter: setEmail, placeholder: 'you@example.com', keyboard: 'email-address' as const, required: true },
              { label: 'Password', icon: 'lock', value: password, setter: setPassword, placeholder: 'Create a password', secure: true, required: true },
            ].map((field) => (
              <View key={field.label} style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>
                  {field.label}{field.required ? ' *' : ''}
                </Text>
                <View style={[styles.inputRow, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                  <Feather name={field.icon as any} size={16} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: colors.text, fontFamily: 'Inter_400Regular' }]}
                    placeholder={field.placeholder}
                    placeholderTextColor={colors.textSecondary}
                    value={field.value}
                    onChangeText={field.setter}
                    secureTextEntry={field.secure}
                    keyboardType={field.keyboard}
                    autoCapitalize={field.keyboard === 'email-address' ? 'none' : 'words'}
                  />
                </View>
              </View>
            ))}

            <Pressable
              onPress={handleSignup}
              disabled={loading}
              style={({ pressed }) => [styles.signupBtn, { backgroundColor: colors.primary, opacity: pressed || loading ? 0.85 : 1 }]}
            >
              {loading ? <ActivityIndicator color="#fff" size="small" /> : (
                <>
                  <Text style={[styles.signupBtnText, { fontFamily: 'Inter_600SemiBold' }]}>Create Account</Text>
                  <Feather name="arrow-right" size={16} color="#fff" />
                </>
              )}
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>Already have an account? </Text>
            <Pressable onPress={() => router.push('/login')}>
              <Text style={[styles.footerLink, { color: colors.primary, fontFamily: 'Inter_600SemiBold' }]}>Sign In</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 24 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  heroArea: { alignItems: 'center', marginTop: 16, gap: 8 },
  iconCircle: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  title: { fontSize: 28, textAlign: 'center' },
  subtitle: { fontSize: 15, textAlign: 'center' },
  formCard: { marginTop: 24, padding: 20, borderRadius: 20, borderWidth: 1, gap: 14 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10 },
  errorText: { fontSize: 13, flex: 1 },
  inputGroup: { gap: 6 },
  label: { fontSize: 13, marginLeft: 4 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  input: { flex: 1, fontSize: 15, padding: 0 },
  signupBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 12, marginTop: 4 },
  signupBtnText: { color: '#fff', fontSize: 15 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14 },
});

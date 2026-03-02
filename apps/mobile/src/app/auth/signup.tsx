import { Link } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Colors,
  Radius,
  Shadow,
  Spacing,
  Typography,
} from "@memora/shared/constants/design";

import { useAuth } from "@/hooks/use-auth";

export default function SignupScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signup, isLoading } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>
            Build your calm memory workflow in seconds.
          </Text>

          <View style={styles.formCard}>
            <TextInput
              accessibilityLabel="Email input"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={Colors.textSecondary}
              style={styles.input}
              value={email}
            />

            <TextInput
              accessibilityLabel="Password input"
              autoCapitalize="none"
              onChangeText={setPassword}
              placeholder="Password (min 8 chars)"
              placeholderTextColor={Colors.textSecondary}
              secureTextEntry
              style={styles.input}
              value={password}
            />

            <Pressable
              accessibilityLabel="Sign up"
              disabled={isLoading}
              onPress={() => {
                void signup(email, password);
              }}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.textInverse} />
              ) : (
                <Text style={styles.primaryButtonText}>Sign up</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowText}>Already have an account?</Text>
            <Link href="/auth/login" style={styles.linkText}>
              Login
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.md,
  },
  title: {
    fontSize: Typography.size.xxxl,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.xl,
    textAlign: "center",
    color: Colors.textSecondary,
    fontSize: Typography.size.md,
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.md,
  },
  input: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    color: Colors.textPrimary,
    fontSize: Typography.size.md,
    padding: Spacing.md,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  primaryButtonPressed: {
    backgroundColor: Colors.primaryDark,
  },
  primaryButtonText: {
    color: Colors.textInverse,
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: Spacing.lg,
    gap: Spacing.xs,
  },
  rowText: {
    color: Colors.textSecondary,
    fontSize: Typography.size.sm,
  },
  linkText: {
    color: Colors.primary,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
  },
});

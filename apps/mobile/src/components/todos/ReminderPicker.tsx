import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import {
  Colors,
  Radius,
  Shadow,
  Spacing,
  Typography,
} from "@memora/shared";

const QUICK_OFFSETS: { label: string; seconds: number }[] = [
  { label: "30s", seconds: 30 },
  { label: "5m", seconds: 5 * 60 },
  { label: "15m", seconds: 15 * 60 },
  { label: "30m", seconds: 30 * 60 },
  { label: "1h", seconds: 60 * 60 },
  { label: "3h", seconds: 3 * 60 * 60 },
  { label: "1d", seconds: 24 * 60 * 60 },
];

type TimeUnit = "s" | "m" | "h" | "d";

const TIME_UNITS: { label: string; unit: TimeUnit; multiplier: number }[] = [
  { label: "sec", unit: "s", multiplier: 1 },
  { label: "min", unit: "m", multiplier: 60 },
  { label: "hr", unit: "h", multiplier: 3600 },
  { label: "day", unit: "d", multiplier: 86400 },
];

const DEFAULT_CUSTOM_AMOUNT = "5";
const DEFAULT_CUSTOM_UNIT: TimeUnit = "m";

interface ReminderPickerProps {
  reminderAt: string | null;
  onChange: (value: { reminderAt: string | null }) => void;
}

export function ReminderPicker({
  reminderAt,
  onChange,
}: ReminderPickerProps) {
  const [expanded, setExpanded] = useState(Boolean(reminderAt));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [customAmount, setCustomAmount] = useState(DEFAULT_CUSTOM_AMOUNT);
  const [customUnit, setCustomUnit] = useState<TimeUnit>(DEFAULT_CUSTOM_UNIT);
  const [customError, setCustomError] = useState<string | null>(null);

  const reminderDate = reminderAt ? new Date(reminderAt) : new Date();

  const applyOffset = (seconds: number) => {
    const target = new Date(Date.now() + seconds * 1000);
    onChange({ reminderAt: target.toISOString(), reminderChannel });
  };

  const applyCustomOffset = () => {
    const amount = parseInt(customAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      setCustomError("Enter a number greater than 0.");
      return;
    }
    const unit = TIME_UNITS.find((u) => u.unit === customUnit);
    if (!unit) return;
    setCustomError(null);
    applyOffset(amount * unit.multiplier);
  };

  const handleDateChange = (_event: DateTimePickerEvent, value?: Date) => {
    setShowDatePicker(false);
    if (!value) return;

    const nextDate = new Date(reminderDate);
    nextDate.setFullYear(
      value.getFullYear(),
      value.getMonth(),
      value.getDate(),
    );
    onChange({ reminderAt: nextDate.toISOString() });
  };

  const handleTimeChange = (_event: DateTimePickerEvent, value?: Date) => {
    setShowTimePicker(false);
    if (!value) return;

    const nextDate = new Date(reminderDate);
    nextDate.setHours(value.getHours(), value.getMinutes(), 0, 0);
    onChange({ reminderAt: nextDate.toISOString() });
  };

  const summaryLabel = reminderAt
    ? format(new Date(reminderAt), "EEE, d MMM • h:mm a")
    : "Add reminder";

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel="Toggle reminder options"
        onPress={() => {
          const nextExpanded = !expanded;
          setExpanded(nextExpanded);
          if (nextExpanded && !reminderAt) {
            onChange({ reminderAt: new Date().toISOString() });
          }
          if (!nextExpanded) {
            onChange({ reminderAt: null });
          }
        }}
        style={styles.trigger}
      >
        <View style={styles.triggerLeft}>
          <Ionicons
            name="notifications-outline"
            size={18}
            color={Colors.primaryDark}
          />
          <Text style={styles.triggerText}>{summaryLabel}</Text>
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={Colors.textSecondary}
        />
      </Pressable>

      {expanded && reminderAt ? (
        <View style={styles.content}>
          {/* Quick picks */}
          <Text style={styles.sectionLabel}>Quick</Text>
          <View style={styles.quickRow}>
            {QUICK_OFFSETS.map(({ label, seconds }) => (
              <Pressable
                accessibilityLabel={`Remind in ${label}`}
                key={label}
                onPress={() => applyOffset(seconds)}
                style={styles.quickChip}
              >
                <Text style={styles.quickChipText}>{label}</Text>
              </Pressable>
            ))}
          </View>

          {/* Custom interval */}
          <View style={styles.customRow}>
            <Text style={styles.customInLabel}>In</Text>
            <TextInput
              accessibilityLabel="Custom reminder amount"
              keyboardType="numeric"
              maxLength={4}
              onChangeText={(v) => {
                setCustomAmount(v);
                setCustomError(null);
              }}
              style={styles.customAmountInput}
              value={customAmount}
            />
            <View style={styles.unitRow}>
              {TIME_UNITS.map(({ label, unit }) => (
                <Pressable
                  accessibilityLabel={`Time unit ${label}`}
                  key={unit}
                  onPress={() => setCustomUnit(unit)}
                  style={[
                    styles.unitButton,
                    customUnit === unit && styles.unitButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.unitText,
                      customUnit === unit && styles.unitTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              accessibilityLabel="Set custom reminder"
              onPress={applyCustomOffset}
              style={styles.setButton}
            >
              <Text style={styles.setButtonText}>Set</Text>
            </Pressable>
          </View>
          {customError ? (
            <Text style={styles.customError}>{customError}</Text>
          ) : null}

          {/* Specific date/time */}
          <Text style={styles.sectionLabel}>Specific</Text>
          <View style={styles.row}>
            {Platform.OS === "web" ? (
              <View style={[styles.metaButton, { padding: 0 }]}>
                <Text
                  style={[
                    styles.metaLabel,
                    { paddingLeft: Spacing.sm, paddingTop: Spacing.sm },
                  ]}
                >
                  Date
                </Text>
                <input
                  aria-label="Pick reminder date"
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) return;
                    const dateVal = new Date(val);
                    const nextDate = new Date(reminderDate);
                    nextDate.setFullYear(
                      dateVal.getFullYear(),
                      dateVal.getMonth(),
                      dateVal.getDate(),
                    );
                    onChange({
                      reminderAt: nextDate.toISOString(),
                    });
                  }}
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    color: Colors.textPrimary,
                    fontFamily: "inherit",
                    fontSize: Typography.size.md,
                    fontWeight: "500",
                    outline: "none",
                    padding: Spacing.sm,
                    width: "100%",
                  }}
                  type="date"
                  value={format(new Date(reminderAt), "yyyy-MM-dd")}
                />
              </View>
            ) : (
              <Pressable
                accessibilityLabel="Pick reminder date"
                onPress={() => setShowDatePicker(true)}
                style={styles.metaButton}
              >
                <Text style={styles.metaLabel}>Date</Text>
                <Text style={styles.metaValue}>
                  {format(new Date(reminderAt), "EEE, d MMM yyyy")}
                </Text>
              </Pressable>
            )}

            {Platform.OS === "web" ? (
              <View style={[styles.metaButton, { padding: 0 }]}>
                <Text
                  style={[
                    styles.metaLabel,
                    { paddingLeft: Spacing.sm, paddingTop: Spacing.sm },
                  ]}
                >
                  Time
                </Text>
                <input
                  aria-label="Pick reminder time"
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) return;
                    const [hours, minutes] = val.split(":").map(Number);
                    if (isNaN(hours) || isNaN(minutes)) return;
                    const nextDate = new Date(reminderDate);
                    nextDate.setHours(hours, minutes, 0, 0);
                    onChange({
                      reminderAt: nextDate.toISOString(),
                    });
                  }}
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    color: Colors.textPrimary,
                    fontFamily: "inherit",
                    fontSize: Typography.size.md,
                    fontWeight: "500",
                    outline: "none",
                    padding: Spacing.sm,
                    width: "100%",
                  }}
                  type="time"
                  value={format(new Date(reminderAt), "HH:mm")}
                />
              </View>
            ) : (
              <Pressable
                accessibilityLabel="Pick reminder time"
                onPress={() => setShowTimePicker(true)}
                style={styles.metaButton}
              >
                <Text style={styles.metaLabel}>Time</Text>
                <Text style={styles.metaValue}>
                  {format(new Date(reminderAt), "h:mm a")}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      ) : null}

      {showDatePicker ? (
        <DateTimePicker
          mode="date"
          value={reminderDate}
          onChange={handleDateChange}
        />
      ) : null}
      {showTimePicker ? (
        <DateTimePicker
          mode="time"
          value={reminderDate}
          onChange={handleTimeChange}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.sm },
  trigger: {
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.md,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  triggerLeft: { alignItems: "center", flexDirection: "row", gap: Spacing.sm },
  triggerText: {
    color: Colors.primaryDark,
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.medium,
  },
  content: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.sm,
    ...Shadow.sm,
  },
  row: { flexDirection: "row", gap: Spacing.sm },
  metaButton: {
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    flex: 1,
    padding: Spacing.sm,
  },
  metaLabel: { color: Colors.textSecondary, fontSize: Typography.size.sm },
  metaValue: {
    color: Colors.textPrimary,
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.medium,
  },
  segment: {
    backgroundColor: Colors.background,
    borderRadius: Radius.full,
    flexDirection: "row",
    marginTop: Spacing.sm,
    padding: Spacing.xs,
  },
  segmentButton: {
    alignItems: "center",
    borderRadius: Radius.full,
    flex: 1,
    paddingVertical: Spacing.xs,
  },
  segmentButtonActive: { backgroundColor: Colors.primaryDark },
  segmentText: {
    color: Colors.textSecondary,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  segmentTextActive: { color: Colors.textInverse },
  sectionLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    marginTop: Spacing.xs,
  },
  quickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  quickChip: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  quickChipText: {
    color: Colors.primaryDark,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
  },
  customRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  customInLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.size.sm,
  },
  customAmountInput: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    borderWidth: 1,
    color: Colors.textPrimary,
    fontSize: Typography.size.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    textAlign: "center",
    width: 52,
  },
  unitRow: {
    flexDirection: "row",
    gap: 2,
  },
  unitButton: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  unitButtonActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  unitText: {
    color: Colors.textSecondary,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
  },
  unitTextActive: { color: Colors.textInverse },
  setButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  setButtonText: {
    color: Colors.textInverse,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
  },
  customError: { color: Colors.error, fontSize: Typography.size.sm },
});

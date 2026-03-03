import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
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

  const reminderDate = reminderAt ? new Date(reminderAt) : new Date();

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
});

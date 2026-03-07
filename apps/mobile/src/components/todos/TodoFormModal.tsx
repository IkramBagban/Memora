import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import {
  Colors,
  Radius,
  Spacing,
  Typography,
  type Priority,
  type RecurrenceCompletionMode,
  type RecurrenceType,
  type RecurrenceWeekday,
  type Todo,
  type TodoRecurrence,
} from "@memora/shared";
import { ReminderPicker } from "@/components/todos/ReminderPicker";

interface TodoFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (payload: {
    id?: string;
    title: string;
    description?: string;
    priority: Priority;
    reminder_at?: string | null;
    recurrence?: TodoRecurrence | null;
  }) => void;
  initialTodo?: Todo | null;
}

const priorities: Priority[] = ["low", "medium", "high"];
type RecurrenceSelection = "none" | RecurrenceType;
const recurrenceTypes: RecurrenceSelection[] = ["none", "daily", "weekly"];
const completionModes: RecurrenceCompletionMode[] = ["occurrence", "series"];
const weekdays: RecurrenceWeekday[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const toTitleCase = (value: string): string => `${value[0].toUpperCase()}${value.slice(1)}`;

const toTimeParts = (value: string): { hours: number; minutes: number } | null => {
  const [hoursRaw, minutesRaw] = value.split(":");
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return { hours, minutes };
};

export function TodoFormModal({
  visible,
  onClose,
  onSave,
  initialTodo,
}: TodoFormModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [showRecurrenceTimePicker, setShowRecurrenceTimePicker] = useState(false);
  const [reminderAt, setReminderAt] = useState<string | null>(null);
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceSelection>("none");
  const [recurrenceTimes, setRecurrenceTimes] = useState<string[]>([]);
  const [recurrenceWeekdays, setRecurrenceWeekdays] = useState<RecurrenceWeekday[]>([]);
  const [completionMode, setCompletionMode] = useState<RecurrenceCompletionMode>("occurrence");
  const [titleError, setTitleError] = useState<string | null>(null);
  const [reminderError, setReminderError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setTitle(initialTodo?.title ?? "");
    setDescription(initialTodo?.description ?? "");
    setPriority(initialTodo?.priority ?? "medium");
    setReminderAt(initialTodo?.reminder_at ?? null);
    setRecurrenceType(initialTodo?.recurrence?.type ?? "none");
    setRecurrenceTimes(initialTodo?.recurrence?.times ?? []);
    setRecurrenceWeekdays(initialTodo?.recurrence?.weekdays ?? []);
    setCompletionMode(initialTodo?.recurrence?.completion_mode ?? "occurrence");
    setTitleError(null);
    setReminderError(null);
  }, [visible, initialTodo]);


  const handleSubmit = () => {
    if (!title.trim()) {
      setTitleError("Title is required.");
      return;
    }

    if (recurrenceType === "none" && reminderAt && new Date(reminderAt) <= new Date()) {
      setReminderError("Reminder must be in the future.");
      return;
    }

    if (recurrenceType !== "none" && recurrenceTimes.length === 0) {
      setReminderError("Add at least one reminder time for recurrence.");
      return;
    }

    if (recurrenceType === "weekly" && recurrenceWeekdays.length === 0) {
      setReminderError("Pick at least one weekday for weekly recurrence.");
      return;
    }

    const recurrence: TodoRecurrence | null =
      recurrenceType === "none"
        ? null
        : {
            type: recurrenceType,
            times: recurrenceTimes,
            weekdays: recurrenceType === "weekly" ? recurrenceWeekdays : undefined,
            completion_mode: completionMode,
          };

    onSave({
      id: initialTodo?.id,
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      reminder_at: recurrence ? null : reminderAt,
      recurrence,
    });
    onClose();
  };

  const addRecurrenceTime = (time: string) => {
    if (!toTimeParts(time)) {
      return;
    }

    setRecurrenceTimes((current) =>
      current.includes(time)
        ? current
        : [...current, time].sort((left, right) => left.localeCompare(right)),
    );
    setReminderError(null);
  };

  const removeRecurrenceTime = (time: string) => {
    setRecurrenceTimes((current) => current.filter((entry) => entry !== time));
  };

  const handleRecurrenceTimeChange = (_event: DateTimePickerEvent, value?: Date) => {
    setShowRecurrenceTimePicker(false);
    if (!value) {
      return;
    }

    addRecurrenceTime(format(value, "HH:mm"));
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <Pressable onPress={onClose} style={styles.backdrop}>
        <Pressable style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.heading}>
              {initialTodo ? "Edit Todo" : "Create Todo"}
            </Text>

            <View style={styles.field}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                accessibilityLabel="Todo title"
                onChangeText={(value) => {
                  setTitle(value);
                  setTitleError(null);
                }}
                placeholder="What do you want to remember?"
                placeholderTextColor={Colors.textSecondary}
                style={styles.input}
                value={title}
              />
              {titleError ? (
                <Text style={styles.error}>{titleError}</Text>
              ) : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                accessibilityLabel="Todo description"
                multiline
                numberOfLines={3}
                onChangeText={setDescription}
                placeholder="Optional context"
                placeholderTextColor={Colors.textSecondary}
                style={[styles.input, styles.textArea]}
                textAlignVertical="top"
                value={description}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Priority</Text>
              <View style={styles.segment}>
                {priorities.map((entry) => (
                  <Pressable
                    accessibilityLabel={`Priority ${entry}`}
                    key={entry}
                    onPress={() => setPriority(entry)}
                    style={[
                      styles.segmentButton,
                      entry === priority
                        ? styles.segmentButtonActive
                        : undefined,
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        entry === priority
                          ? styles.segmentTextActive
                          : undefined,
                      ]}
                    >
                      {entry.toUpperCase()}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.field}>
              <ReminderPicker
                onChange={({ reminderAt: nextReminder }) => {
                  setReminderAt(nextReminder);
                  setReminderError(null);
                }}
                reminderAt={reminderAt}
              />
              {reminderError ? (
                <Text style={styles.error}>{reminderError}</Text>
              ) : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Repeat</Text>
              <View style={styles.segment}>
                {recurrenceTypes.map((entry) => (
                  <Pressable
                    accessibilityLabel={`Repeat ${entry}`}
                    key={entry}
                    onPress={() => {
                      setRecurrenceType(entry);
                      setReminderError(null);
                    }}
                    style={[
                      styles.segmentButton,
                      entry === recurrenceType ? styles.segmentButtonActive : undefined,
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        entry === recurrenceType ? styles.segmentTextActive : undefined,
                      ]}
                    >
                      {toTitleCase(entry)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {recurrenceType !== "none" ? (
              <>
                <View style={styles.field}>
                  <Text style={styles.label}>Reminder Times</Text>
                  <View style={styles.chipsWrap}>
                    {recurrenceTimes.map((time) => (
                      <Pressable
                        accessibilityLabel={`Remove time ${time}`}
                        key={time}
                        onPress={() => removeRecurrenceTime(time)}
                        style={styles.timeChip}
                      >
                        <Text style={styles.timeChipText}>{time}</Text>
                      </Pressable>
                    ))}
                  </View>
                  {Platform.OS === "web" ? (
                    <View style={[styles.metaButton, { paddingVertical: 0 }]}> 
                      <input
                        aria-label="Add recurrence time"
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) {
                            addRecurrenceTime(val);
                          }
                        }}
                        style={{
                          backgroundColor: "transparent",
                          border: "none",
                          color: Colors.textPrimary,
                          fontFamily: "inherit",
                          fontSize: Typography.size.md,
                          outline: "none",
                          padding: Spacing.sm,
                          width: "100%",
                        }}
                        type="time"
                      />
                    </View>
                  ) : (
                    <Pressable
                      accessibilityLabel="Add recurrence time"
                      onPress={() => setShowRecurrenceTimePicker(true)}
                      style={styles.metaButton}
                    >
                      <Text style={styles.metaText}>Add time</Text>
                    </Pressable>
                  )}
                </View>

                {recurrenceType === "weekly" ? (
                  <View style={styles.field}>
                    <Text style={styles.label}>Weekdays</Text>
                    <View style={styles.segment}>
                      {weekdays.map((day) => {
                        const active = recurrenceWeekdays.includes(day);
                        return (
                          <Pressable
                            accessibilityLabel={`Toggle weekday ${day}`}
                            key={day}
                            onPress={() => {
                              setRecurrenceWeekdays((current) =>
                                active
                                  ? current.filter((entry) => entry !== day)
                                  : [...current, day],
                              );
                            }}
                            style={[styles.segmentButton, active ? styles.segmentButtonActive : undefined]}
                          >
                            <Text style={[styles.segmentText, active ? styles.segmentTextActive : undefined]}>
                              {day.toUpperCase()}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ) : null}

                <View style={styles.field}>
                  <Text style={styles.label}>When completed</Text>
                  <View style={styles.segment}>
                    {completionModes.map((mode) => (
                      <Pressable
                        accessibilityLabel={`Completion mode ${mode}`}
                        key={mode}
                        onPress={() => setCompletionMode(mode)}
                        style={[styles.segmentButton, completionMode === mode ? styles.segmentButtonActive : undefined]}
                      >
                        <Text style={[styles.segmentText, completionMode === mode ? styles.segmentTextActive : undefined]}>
                          {mode === "occurrence" ? "This occurrence" : "Entire series"}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </>
            ) : null}

            <Pressable
              accessibilityLabel="Save todo"
              onPress={handleSubmit}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </Pressable>
          </ScrollView>

          {showRecurrenceTimePicker ? (
            <DateTimePicker
              mode="time"
              onChange={handleRecurrenceTimeChange}
              value={new Date()}
            />
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: Colors.textPrimary,
    flex: 1,
    justifyContent: "flex-end",
    opacity: 0.95,
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    maxHeight: "92%",
    minHeight: "70%",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  handle: {
    alignSelf: "center",
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    height: Spacing.xs,
    marginBottom: Spacing.md,
    width: Spacing.xxl,
  },
  content: { gap: Spacing.md, paddingBottom: Spacing.xxl },
  heading: {
    color: Colors.textPrimary,
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
  },
  field: { gap: Spacing.xs },
  label: {
    color: Colors.textPrimary,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
  },
  input: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    color: Colors.textPrimary,
    fontSize: Typography.size.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  textArea: { minHeight: Spacing.xxl * 2 },
  segment: {
    backgroundColor: Colors.background,
    borderRadius: Radius.full,
    flexDirection: "row",
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
  row: { alignItems: "center", flexDirection: "row", gap: Spacing.sm },
  metaButton: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  metaText: { color: Colors.textPrimary, fontSize: Typography.size.md },
  clearButton: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs },
  clearButtonText: {
    color: Colors.error,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  timeChip: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  timeChipText: {
    color: Colors.primaryDark,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  error: { color: Colors.error, fontSize: Typography.size.sm },
  saveButton: {
    alignItems: "center",
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: Spacing.sm,
  },
  saveButtonText: {
    color: Colors.textInverse,
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
  },
});

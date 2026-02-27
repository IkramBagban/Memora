import { useEffect, useMemo, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { Colors, Radius, Spacing, Typography, type Priority, type ReminderChannel, type Todo } from '@memora/shared';
import { ReminderPicker } from '@/components/todos/ReminderPicker';

interface TodoFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (payload: {
    id?: string;
    title: string;
    description?: string;
    priority: Priority;
    due_date?: string | null;
    reminder_at?: string | null;
    reminder_channel?: ReminderChannel | null;
  }) => void;
  initialTodo?: Todo | null;
}

const priorities: Priority[] = ['low', 'medium', 'high'];

export function TodoFormModal({ visible, onClose, onSave, initialTodo }: TodoFormModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDuePicker, setShowDuePicker] = useState(false);
  const [reminderAt, setReminderAt] = useState<string | null>(null);
  const [reminderChannel, setReminderChannel] = useState<ReminderChannel>('push');
  const [titleError, setTitleError] = useState<string | null>(null);
  const [reminderError, setReminderError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setTitle(initialTodo?.title ?? '');
    setDescription(initialTodo?.description ?? '');
    setPriority(initialTodo?.priority ?? 'medium');
    setDueDate(initialTodo?.due_date ? new Date(initialTodo.due_date) : null);
    setReminderAt(initialTodo?.reminder_at ?? null);
    setReminderChannel(initialTodo?.reminder_channel ?? 'push');
    setTitleError(null);
    setReminderError(null);
  }, [visible, initialTodo]);

  const dueDateLabel = useMemo(() => (dueDate ? format(dueDate, 'EEE, d MMM yyyy') : 'Pick due date'), [dueDate]);

  const handleDueDateChange = (_event: DateTimePickerEvent, value?: Date) => {
    setShowDuePicker(false);
    if (value) {
      setDueDate(value);
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      setTitleError('Title is required.');
      return;
    }

    if (reminderAt && new Date(reminderAt) <= new Date()) {
      setReminderError('Reminder must be in the future.');
      return;
    }

    onSave({
      id: initialTodo?.id,
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : null,
      reminder_at: reminderAt,
      reminder_channel: reminderAt ? reminderChannel : null,
    });
    onClose();
  };

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <Pressable onPress={onClose} style={styles.backdrop}>
        <Pressable style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.heading}>{initialTodo ? 'Edit Todo' : 'Create Todo'}</Text>

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
              {titleError ? <Text style={styles.error}>{titleError}</Text> : null}
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
                    style={[styles.segmentButton, entry === priority ? styles.segmentButtonActive : undefined]}
                  >
                    <Text style={[styles.segmentText, entry === priority ? styles.segmentTextActive : undefined]}>
                      {entry.toUpperCase()}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Due Date</Text>
              <View style={styles.row}>
                {Platform.OS === 'web' ? (
                  <View style={[styles.metaButton, { paddingVertical: 0 }]}>
                    <input
                      aria-label="Pick due date"
                      onChange={(e) => {
                        const val = e.target.value;
                        setDueDate(val ? new Date(val) : null);
                      }}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: Colors.textPrimary,
                        flex: 1,
                        fontFamily: 'inherit',
                        fontSize: Typography.size.md,
                        outline: 'none',
                        padding: Spacing.sm,
                        width: '100%',
                      }}
                      type="date"
                      value={dueDate ? format(dueDate, 'yyyy-MM-dd') : ''}
                    />
                  </View>
                ) : (
                  <Pressable accessibilityLabel="Pick due date" onPress={() => setShowDuePicker(true)} style={styles.metaButton}>
                    <Text style={styles.metaText}>{dueDateLabel}</Text>
                  </Pressable>
                )}
                {dueDate ? (
                  <Pressable accessibilityLabel="Clear due date" onPress={() => setDueDate(null)} style={styles.clearButton}>
                    <Text style={styles.clearButtonText}>Clear</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>

            <View style={styles.field}>
              <ReminderPicker
                onChange={({ reminderAt: nextReminder, reminderChannel: nextChannel }) => {
                  setReminderAt(nextReminder);
                  setReminderChannel(nextChannel);
                  setReminderError(null);
                }}
                reminderAt={reminderAt}
                reminderChannel={reminderChannel}
              />
              {reminderError ? <Text style={styles.error}>{reminderError}</Text> : null}
            </View>

            <Pressable accessibilityLabel="Save todo" onPress={handleSubmit} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Save</Text>
            </Pressable>
          </ScrollView>

          {showDuePicker ? <DateTimePicker mode="date" onChange={handleDueDateChange} value={dueDate ?? new Date()} /> : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: Colors.textPrimary, flex: 1, justifyContent: 'flex-end', opacity: 0.95 },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    maxHeight: '92%',
    minHeight: '70%',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    height: Spacing.xs,
    marginBottom: Spacing.md,
    width: Spacing.xxl,
  },
  content: { gap: Spacing.md, paddingBottom: Spacing.xxl },
  heading: { color: Colors.textPrimary, fontSize: Typography.size.xl, fontWeight: Typography.weight.bold },
  field: { gap: Spacing.xs },
  label: { color: Colors.textPrimary, fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold },
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
  segment: { backgroundColor: Colors.background, borderRadius: Radius.full, flexDirection: 'row', padding: Spacing.xs },
  segmentButton: { alignItems: 'center', borderRadius: Radius.full, flex: 1, paddingVertical: Spacing.xs },
  segmentButtonActive: { backgroundColor: Colors.primaryDark },
  segmentText: { color: Colors.textSecondary, fontSize: Typography.size.sm, fontWeight: Typography.weight.medium },
  segmentTextActive: { color: Colors.textInverse },
  row: { alignItems: 'center', flexDirection: 'row', gap: Spacing.sm },
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
  clearButtonText: { color: Colors.error, fontSize: Typography.size.sm, fontWeight: Typography.weight.medium },
  error: { color: Colors.error, fontSize: Typography.size.sm },
  saveButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: Spacing.sm,
  },
  saveButtonText: { color: Colors.textInverse, fontSize: Typography.size.md, fontWeight: Typography.weight.semibold },
});

import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format, isBefore, isToday, startOfToday } from "date-fns";
import {
  Colors,
  Radius,
  Shadow,
  Spacing,
  Typography,
  type Priority,
  type Todo,
} from "@memora/shared";

interface TodoItemProps {
  todo: Todo;
  onToggleComplete: (todo: Todo) => void;
  onPress: (todo: Todo) => void;
  onDelete: (id: string) => void;
  onPriorityCycle: (todo: Todo, nextPriority: Priority) => void;
}

const priorityOrder: Priority[] = ["low", "medium", "high"];

const recurrenceLabel = (todo: Todo): string | null => {
  if (!todo.recurrence) {
    return null;
  }

  if (todo.recurrence.type === 'daily') {
    return `Daily · ${todo.recurrence.times.join(', ')}`;
  }

  const days = (todo.recurrence.weekdays ?? []).map((entry) => entry.toUpperCase()).join(', ');
  return `Weekly (${days}) · ${todo.recurrence.times.join(', ')}`;
};

export function TodoItem({
  todo,
  onToggleComplete,
  onPress,
  onDelete,
  onPriorityCycle,
}: TodoItemProps) {
  const isOverdue = Boolean(
    todo.due_date &&
      isBefore(new Date(todo.due_date), startOfToday()) &&
      !todo.is_completed,
  );

  const nextPriority =
    priorityOrder[
      (priorityOrder.indexOf(todo.priority) + 1) % priorityOrder.length
    ];
  const recurrence = recurrenceLabel(todo);

  const priorityLabel = `${todo.priority.charAt(0).toUpperCase()}${todo.priority.slice(1)} priority`;

  return (
    <Pressable
      accessibilityLabel={`Todo ${todo.title}`}
      onLongPress={() => onPriorityCycle(todo, nextPriority)}
      onPress={() => onPress(todo)}
      style={[
        styles.card,
        todo.is_completed ? styles.cardCompleted : undefined,
        isOverdue ? styles.overdue : undefined,
        todo.priority === "high" && !todo.is_completed
          ? styles.highPriority
          : undefined,
      ]}
    >
      <Pressable
        accessibilityLabel="Toggle completion"
        onPress={() => onToggleComplete(todo)}
        style={styles.checkbox}
      >
        <Ionicons
          color={todo.is_completed ? Colors.primary : Colors.border}
          name={todo.is_completed ? "checkmark-circle" : "ellipse-outline"}
          size={32}
        />
      </Pressable>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text
            numberOfLines={1}
            style={[
              styles.title,
              todo.is_completed ? styles.titleCompleted : undefined,
            ]}
          >
            {todo.title}
          </Text>
          <View
            style={[
              styles.priorityBadge,
              { backgroundColor: Colors.primaryLight },
            ]}
          >
            <Text style={styles.priorityText}>
              {priorityLabel}
            </Text>
          </View>
        </View>

        {todo.description ? (
          <Text numberOfLines={1} style={styles.description}>
            {todo.description}
          </Text>
        ) : null}

        {recurrence ? (
          <Text numberOfLines={1} style={styles.recurrenceText}>
            {recurrence}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          {todo.due_date ? (
            <View style={styles.metaItem}>
              <Ionicons
                color={isOverdue ? Colors.error : Colors.textSecondary}
                name="calendar-outline"
                size={12}
              />
              <Text
                style={[
                  styles.metaText,
                  isOverdue ? styles.metaTextOverdue : undefined,
                ]}
              >
                {isToday(new Date(todo.due_date))
                  ? "Today"
                  : format(new Date(todo.due_date), "MMM d")}
              </Text>
            </View>
          ) : null}

          {todo.reminder_at ? (
            <View style={styles.metaItem}>
              <Ionicons
                color={Colors.textSecondary}
                name="notifications-outline"
                size={12}
              />
              <Text style={styles.metaText}>
                {format(new Date(todo.reminder_at), "h:mm a")}
              </Text>
            </View>
          ) : null}

          <Pressable
            accessibilityLabel="Delete todo"
            onPress={() => onDelete(todo.id)}
            style={styles.deleteButton}
          >
            <Ionicons color={Colors.textSecondary} name="trash-outline" size={16} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    flexDirection: "row",
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: "transparent",
  },
  cardCompleted: {
    opacity: 0.7,
  },
  overdue: {
    borderColor: Colors.error,
    backgroundColor: Colors.surface,
  },
  highPriority: {
    borderColor: Colors.priorityHigh,
  },
  checkbox: {
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  content: { flex: 1, gap: Spacing.xs, justifyContent: "center" },
  headerRow: { alignItems: "center", flexDirection: "row", gap: Spacing.sm },
  title: {
    color: Colors.textPrimary,
    flex: 1,
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.medium,
  },
  titleCompleted: {
    color: Colors.textSecondary,
    textDecorationLine: "line-through",
  },
  priorityBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  priorityText: {
    color: Colors.textPrimary,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: Typography.size.md,
    marginTop: 2,
  },
  recurrenceText: {
    color: Colors.primaryDark,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  metaItem: { alignItems: "center", flexDirection: "row", gap: 4 },
  metaText: { color: Colors.textSecondary, fontSize: Typography.size.sm },
  metaTextOverdue: {
    color: Colors.error,
    fontWeight: Typography.weight.medium,
  },
  deleteButton: { marginLeft: "auto", padding: Spacing.xs },
});

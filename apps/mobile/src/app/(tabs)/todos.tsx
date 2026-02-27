import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadow, Spacing, Typography, type Priority, type Todo } from '@memora/shared';
import { TodoFormModal } from '@/components/todos/TodoFormModal';
import { TodoItem } from '@/components/todos/TodoItem';
import { useTodoStore, type TodoTabFilter } from '@/stores/todo.store';

interface SectionRow {
  id: string;
  type: 'header' | 'todo';
  label?: string;
  count?: number;
  todo?: Todo;
}

const filters: { key: TodoTabFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'high_priority', label: 'High Priority' },
];

export default function TodosScreen() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const {
    filter,
    setFilter,
    fetchTodos,
    getGroupedTodos,
    isLoading,
    toggleComplete,
    createTodo,
    updateTodo,
    deleteTodo,
  } = useTodoStore();

  useFocusEffect(
    useCallback(() => {
      void fetchTodos();
    }, [fetchTodos]),
  );

  const groupedTodos = getGroupedTodos();

  const rows = useMemo<SectionRow[]>(() => {
    const nextRows: SectionRow[] = [];

    if (groupedTodos.overdue.length) {
      nextRows.push({ id: 'header-overdue', type: 'header', label: 'Overdue', count: groupedTodos.overdue.length });
      groupedTodos.overdue.forEach((todo) => nextRows.push({ id: todo.id, type: 'todo', todo }));
    }

    if (groupedTodos.today.length) {
      nextRows.push({ id: 'header-today', type: 'header', label: 'Today', count: groupedTodos.today.length });
      groupedTodos.today.forEach((todo) => nextRows.push({ id: todo.id, type: 'todo', todo }));
    }

    if (groupedTodos.upcoming.length) {
      nextRows.push({ id: 'header-upcoming', type: 'header', label: 'Upcoming', count: groupedTodos.upcoming.length });
      groupedTodos.upcoming.forEach((todo) => nextRows.push({ id: todo.id, type: 'todo', todo }));
    }

    return nextRows;
  }, [groupedTodos]);

  const handlePriorityCycle = useCallback(
    (todo: Todo, nextPriority: Priority) => {
      void updateTodo({ id: todo.id, priority: nextPriority });
    },
    [updateTodo],
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Todos</Text>
        <Pressable
          accessibilityLabel="Create todo"
          onPress={() => {
            setEditingTodo(null);
            setModalOpen(true);
          }}
          style={styles.topButton}
        >
          <Ionicons color={Colors.primary} name="add" size={22} />
        </Pressable>
      </View>

      <View style={styles.filtersRow}>
        {filters.map((entry) => (
          <Pressable
            accessibilityLabel={`Filter by ${entry.label}`}
            key={entry.key}
            onPress={() => setFilter(entry.key)}
            style={[styles.filterChip, filter === entry.key ? styles.filterChipActive : undefined]}
          >
            <Text style={[styles.filterChipText, filter === entry.key ? styles.filterChipTextActive : undefined]}>
              {entry.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator color={Colors.primaryDark} />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={rows}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            if (item.type === 'header') {
              return (
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{item.label}</Text>
                  <Text style={styles.sectionCount}>{item.count}</Text>
                </View>
              );
            }

            if (!item.todo) {
              return null;
            }

            return (
              <TodoItem
                onDelete={(id) => {
                  void deleteTodo(id);
                }}
                onPress={(todo) => {
                  setEditingTodo(todo);
                  setModalOpen(true);
                }}
                onPriorityCycle={handlePriorityCycle}
                onToggleComplete={(todo) => {
                  void toggleComplete(todo);
                }}
                todo={item.todo}
              />
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons color={Colors.textSecondary} name="checkmark-circle-outline" size={48} />
              <Text style={styles.emptyTitle}>Nothing to do! 🎉</Text>
              <Text style={styles.emptyDescription}>{filter === 'all' ? "You're all caught up." : 'No todos in this view.'}</Text>
            </View>
          }
        />
      )}

      <Pressable
        accessibilityLabel="Create todo"
        onPress={() => {
          setEditingTodo(null);
          setModalOpen(true);
        }}
        style={styles.fab}
      >
        <Ionicons color={Colors.textInverse} name="add" size={28} />
      </Pressable>

      <TodoFormModal
        initialTodo={editingTodo}
        onClose={() => {
          setModalOpen(false);
          setEditingTodo(null);
        }}
        onSave={(payload) => {
          if (payload.id) {
            void updateTodo({
              ...payload,
              id: payload.id,
            });
            return;
          }

          void createTodo({
            title: payload.title,
            description: payload.description,
            priority: payload.priority,
            due_date: payload.due_date ?? undefined,
            reminder_at: payload.reminder_at ?? undefined,
            reminder_channel: payload.reminder_channel ?? undefined,
          });
        }}
        visible={isModalOpen}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.background, flex: 1 },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  title: { color: Colors.textPrimary, fontSize: Typography.size.xxxl, fontWeight: Typography.weight.bold },
  topButton: { backgroundColor: Colors.primaryLight, borderRadius: Radius.full, padding: Spacing.xs },
  filtersRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  filterChip: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  filterChipActive: { backgroundColor: Colors.primaryDark, borderColor: Colors.primaryDark },
  filterChipText: { color: Colors.textSecondary, fontSize: Typography.size.sm, fontWeight: Typography.weight.medium },
  filterChipTextActive: { color: Colors.textInverse },
  listContent: { padding: Spacing.md, paddingBottom: Spacing.xxl * 2 },
  loaderWrap: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', marginBottom: Spacing.xs, marginTop: Spacing.md },
  sectionTitle: { color: Colors.textPrimary, fontSize: Typography.size.lg, fontWeight: Typography.weight.semibold },
  sectionCount: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.full,
    color: Colors.primaryDark,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    marginLeft: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  emptyState: { alignItems: 'center', marginTop: Spacing.xxl, padding: Spacing.xxl },
  emptyTitle: { color: Colors.textPrimary, fontSize: Typography.size.lg, fontWeight: Typography.weight.semibold, marginTop: Spacing.md },
  emptyDescription: { color: Colors.textSecondary, fontSize: Typography.size.md, marginTop: Spacing.xs, textAlign: 'center' },
  fab: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    bottom: Spacing.xl,
    height: Spacing.xxl + Spacing.sm,
    justifyContent: 'center',
    position: 'absolute',
    right: Spacing.md,
    width: Spacing.xxl + Spacing.sm,
    ...Shadow.lg,
  },
});

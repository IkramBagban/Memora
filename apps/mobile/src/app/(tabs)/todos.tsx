import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Typography, Radius, Shadow } from '@memora/shared';
import { useTodoStore } from '../../stores/todo.store';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isToday, isBefore, startOfToday } from 'date-fns';

export default function TodosScreen() {
  const { todos, filter, setFilter, toggleComplete } = useTodoStore();

  const getFilteredTodos = () => {
    let active = todos.filter(t => !t.is_completed);
    
    if (filter === 'today') {
      active = active.filter(t => t.due_date && isToday(new Date(t.due_date)));
    } else if (filter === 'high_priority') {
      active = active.filter(t => t.priority === 'high');
    }
    
    // Sort logic mockup
    return active.sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
  };

  const renderTodo = ({ item }) => {
    const isOverdue = item.due_date && isBefore(new Date(item.due_date), startOfToday()) && !isToday(new Date(item.due_date));
    
    return (
      <View style={[
        styles.todoCard, 
        isOverdue && styles.todoCardOverdue,
        item.priority === 'high' && !isOverdue && styles.todoCardHighPriority
      ]}>
        <TouchableOpacity 
          style={styles.checkbox} 
          onPress={() => toggleComplete(item.id)}
        >
          <Ionicons 
            name={item.is_completed ? "checkmark-circle" : "ellipse-outline"} 
            size={28} 
            color={item.is_completed ? Colors.primary : Colors.border} 
          />
        </TouchableOpacity>
        
        <View style={styles.todoContent}>
          <View style={styles.todoHeader}>
            <Text style={[styles.todoTitle, item.is_completed && styles.todoTitleCompleted]}>
              {item.title}
            </Text>
            {item.priority === 'high' && <View style={styles.priorityDot} />}
          </View>
          
          {item.description && (
            <Text style={styles.todoDesc} numberOfLines={1}>{item.description}</Text>
          )}
          
          <View style={styles.todoFooter}>
            {item.due_date && (
              <View style={styles.metaBadge}>
                <Ionicons name="calendar-outline" size={12} color={isOverdue ? Colors.error : Colors.textSecondary} />
                <Text style={[styles.metaText, isOverdue && { color: Colors.error }]}>
                  {isOverdue ? 'Overdue' : new Date(item.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
            )}
            {item.reminder_at && (
              <View style={styles.metaBadge}>
                <Ionicons name="alarm-outline" size={12} color={Colors.textSecondary} />
                <Text style={styles.metaText}>
                  {new Date(item.reminder_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Todos</Text>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, filter === 'all' && styles.tabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.tabText, filter === 'all' && styles.tabTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, filter === 'today' && styles.tabActive]}
          onPress={() => setFilter('today')}
        >
          <Text style={[styles.tabText, filter === 'today' && styles.tabTextActive]}>Today</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, filter === 'high_priority' && styles.tabActive]}
          onPress={() => setFilter('high_priority')}
        >
          <Text style={[styles.tabText, filter === 'high_priority' && styles.tabTextActive]}>High Priority</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={getFilteredTodos()}
        keyExtractor={item => item.id}
        renderItem={renderTodo}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>Nothing to do! 🎉</Text>
            <Text style={styles.emptyDesc}>You're all caught up for {filter === 'all' ? 'now' : 'this view'}.</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={32} color={Colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Spacing.md,
    paddingTop: Spacing.lg,
  },
  title: {
    fontSize: Typography.size.xxxl,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  tab: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    marginRight: Spacing.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  tabText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.white,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl * 2,
  },
  todoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  todoCardOverdue: {
    borderLeftColor: Colors.error,
  },
  todoCardHighPriority: {
    borderLeftColor: Colors.priorityHigh,
  },
  checkbox: {
    marginRight: Spacing.md,
    justifyContent: 'center',
  },
  todoContent: {
    flex: 1,
  },
  todoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  todoTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.medium,
    color: Colors.textPrimary,
    flex: 1,
  },
  todoTitleCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.textSecondary,
    opacity: 0.6,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.priorityHigh,
    marginLeft: Spacing.sm,
  },
  todoDesc: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  todoFooter: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    gap: 4,
  },
  metaText: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    marginTop: Spacing.xxl,
  },
  emptyTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  emptyDesc: {
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.md,
    backgroundColor: Colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.lg,
  }
});

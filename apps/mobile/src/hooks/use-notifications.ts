import * as Notifications from 'expo-notifications';
import type { Todo } from '@memora/shared';

export const ensureNotificationPermission = async (): Promise<boolean> => {
  const permissions = await Notifications.getPermissionsAsync();
  if (permissions.granted) {
    return true;
  }

  const request = await Notifications.requestPermissionsAsync();
  return request.granted;
};

export const scheduleReminderNotification = async (todo: Todo): Promise<string | null> => {
  if (!todo.reminder_at) {
    return null;
  }

  const triggerAt = new Date(todo.reminder_at);
  if (triggerAt <= new Date()) {
    return null;
  }

  const hasPermission = await ensureNotificationPermission();
  if (!hasPermission) {
    return null;
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: todo.title,
      body: todo.description ?? 'Tap to manage your todo.',
      data: { todoId: todo.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerAt,
    },
  });

  return notificationId;
};

export const cancelReminderNotification = async (notificationId: string): Promise<void> => {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
};

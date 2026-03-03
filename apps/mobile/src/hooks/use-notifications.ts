import * as Notifications from 'expo-notifications';
import type { Todo } from '@memora/shared';

const weekdayMap: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

const toTimeParts = (value: string): { hours: number; minutes: number } | null => {
  const [hoursRaw, minutesRaw] = value.split(':');
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

const getRecurringOccurrences = (todo: Todo, horizonDays = 14): Date[] => {
  const recurrence = todo.recurrence;

  if (!recurrence) {
    return [];
  }

  const now = new Date();
  const occurrences: Date[] = [];

  for (let offset = 0; offset < horizonDays; offset += 1) {
    const date = new Date(now);
    date.setDate(now.getDate() + offset);

    const shouldIncludeDate =
      recurrence.type === 'daily' ||
      (recurrence.type === 'weekly' && (recurrence.weekdays ?? []).some((entry) => weekdayMap[entry] === date.getDay()));

    if (!shouldIncludeDate) {
      continue;
    }

    recurrence.times.forEach((time) => {
      const parts = toTimeParts(time);
      if (!parts) {
        return;
      }

      const occurrence = new Date(date);
      occurrence.setHours(parts.hours, parts.minutes, 0, 0);

      if (occurrence > now) {
        occurrences.push(occurrence);
      }
    });
  }

  return occurrences.sort((left, right) => left.getTime() - right.getTime()).slice(0, 20);
};

export const clearScheduledTodoNotifications = async (): Promise<void> => {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const todoNotificationIds = scheduled
    .filter((entry) => {
      if (!entry.content.data || typeof entry.content.data !== 'object') {
        return false;
      }

      return 'todoId' in entry.content.data;
    })
    .map((entry) => entry.identifier);

  await Promise.all(todoNotificationIds.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
};

export const ensureNotificationPermission = async (): Promise<boolean> => {
  const permissions = await Notifications.getPermissionsAsync();
  if (permissions.granted) {
    return true;
  }

  const request = await Notifications.requestPermissionsAsync();
  return request.granted;
};

export const scheduleReminderNotifications = async (todo: Todo): Promise<string[]> => {
  const hasPermission = await ensureNotificationPermission();
  if (!hasPermission) {
    return [];
  }

  if (!todo.reminder_at || todo.is_completed) {
    return [];
  }

  const occurrences = getRecurringOccurrences(todo);

  if (occurrences.length > 0) {
    const notificationIds = await Promise.all(
      occurrences.map((date) =>
        Notifications.scheduleNotificationAsync({
          content: {
            title: todo.title,
            body: todo.description ?? 'Tap to manage your todo.',
            data: { todoId: todo.id },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date,
          },
        }),
      ),
    );

    return notificationIds;
  }

  if (!todo.reminder_at) {
    return [];
  }

  const triggerAt = new Date(todo.reminder_at);
  if (triggerAt <= new Date()) {
    return [];
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

  return [notificationId];
};

export const cancelReminderNotifications = async (notificationIds: string[]): Promise<void> => {
  await Promise.all(notificationIds.map((notificationId) => Notifications.cancelScheduledNotificationAsync(notificationId)));
};

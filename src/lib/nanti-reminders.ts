import type {
  ReminderConfig,
  ReminderStage,
  ReminderChannel,
  ReminderIntensity,
} from "./nanti-types";
import { addDays, todayISO, normalizeDay } from "./nanti-utils";

export interface ScheduledReminder {
  stage: ReminderStage;
  channel: ReminderChannel;
  scheduledDate: string; // ISO date
  scheduledTime: string; // HH:mm
  idempotencyKey: string;
}

export function scheduleReminders(config: ReminderConfig): ScheduledReminder[] {
  const { itemId, dueDate, intensity, channels, preparationDays } = config;
  const reminders: ScheduledReminder[] = [];
  const normalizedDue = normalizeDay(dueDate);
  if (!normalizedDue) return [];

  const key = (stage: ReminderStage, channel: ReminderChannel, date: string) =>
    `rem:${itemId}:${stage}:${channel}:${date}`;

  switch (intensity) {
    case "gentle":
      // One reminder on due date
      for (const ch of channels) {
        reminders.push({
          stage: "due",
          channel: ch,
          scheduledDate: normalizedDue,
          scheduledTime: config.customReminderTime || "09:00",
          idempotencyKey: key("due", ch, normalizedDue),
        });
      }
      break;

    case "normal":
      // Before + due
      if (preparationDays > 0) {
        const prepDate = addDays(normalizedDue, -preparationDays);
        for (const ch of channels) {
          reminders.push({
            stage: "preparation",
            channel: ch,
            scheduledDate: prepDate,
            scheduledTime: config.customReminderTime || "09:00",
            idempotencyKey: key("preparation", ch, prepDate),
          });
        }
      }
      for (const ch of channels) {
        reminders.push({
          stage: "due",
          channel: ch,
          scheduledDate: normalizedDue,
          scheduledTime: config.customReminderTime || "09:00",
          idempotencyKey: key("due", ch, normalizedDue),
        });
      }
      break;

    case "persistent":
      // Before + due + check-in + overdue
      if (preparationDays > 0) {
        const prepDate = addDays(normalizedDue, -preparationDays);
        for (const ch of channels) {
          reminders.push({
            stage: "preparation",
            channel: ch,
            scheduledDate: prepDate,
            scheduledTime: config.customReminderTime || "09:00",
            idempotencyKey: key("preparation", ch, prepDate),
          });
        }
      }
      for (const ch of channels) {
        reminders.push({
          stage: "due",
          channel: ch,
          scheduledDate: normalizedDue,
          scheduledTime: config.customReminderTime || "09:00",
          idempotencyKey: key("due", ch, normalizedDue),
        });
      }
      // Check-in at end of day
      for (const ch of channels) {
        reminders.push({
          stage: "checkin",
          channel: ch,
          scheduledDate: normalizedDue,
          scheduledTime: "17:00",
          idempotencyKey: key("checkin", ch, normalizedDue),
        });
      }
      // Overdue reminder next day
      {
        const overdueDate = addDays(normalizedDue, 1);
        for (const ch of channels) {
          reminders.push({
            stage: "overdue",
            channel: ch,
            scheduledDate: overdueDate,
            scheduledTime: "09:00",
            idempotencyKey: key("overdue", ch, overdueDate),
          });
        }
      }
      break;
  }

  return reminders;
}

export function getDefaultChannels(): ReminderChannel[] {
  return ["in_app", "push"];
}

export function getDefaultIntensity(): ReminderIntensity {
  return "normal";
}

export function getPreparationDays(intensity: ReminderIntensity): number {
  switch (intensity) {
    case "gentle":
      return 0;
    case "normal":
      return 1;
    case "persistent":
      return 2;
  }
}

export function isWithinQuietHours(
  now: Date,
  start: string, // HH:mm
  end: string, // HH:mm
): boolean {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [startH, startM] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);
  const startMinutes = startH! * 60 + startM!;
  const endMinutes = endH! * 60 + endM!;

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
  // Wraps midnight
  return currentMinutes >= startMinutes || currentMinutes < endMinutes;
}

export function shouldSendReminder(
  scheduledDate: string,
  scheduledTime: string,
  quietHoursEnabled: boolean,
  quietStart: string,
  quietEnd: string,
  channel: ReminderChannel,
): { send: boolean; reason?: string } {
  const now = new Date();
  const today = todayISO();

  // Don't send reminders for past dates
  if (scheduledDate < today) {
    return { send: false, reason: "past_date" };
  }

  // Don't send until the scheduled time
  if (scheduledDate === today) {
    const [h, m] = scheduledTime.split(":").map(Number);
    const scheduledMinutes = h! * 60 + m!;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    if (currentMinutes < scheduledMinutes) {
      return { send: false, reason: "not_yet_time" };
    }
  }

  // Check quiet hours (only for non-critical)
  if (quietHoursEnabled && channel !== "in_app") {
    if (isWithinQuietHours(now, quietStart, quietEnd)) {
      return { send: false, reason: "quiet_hours" };
    }
  }

  return { send: true };
}

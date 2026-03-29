import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export async function requestNotificationPermission() {
  if (Platform.OS === "web") return false;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function scheduleDailyReminder(hour: number, minute: number) {
  if (Platform.OS === "web") return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Skill Companion Reminder",
      body: "Complete your pending tasks today 💪",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour,
      minute,
      repeats: true,
    },
  });
}


export async function requestWebNotificationPermission() {
  if (Platform.OS !== "web") return false;

  if (!("Notification" in window)) return false;

  const permission = await Notification.requestPermission();
  return permission === "granted";
}

export function sendWebTestNotification(
  pendingTasks?: number,
  streak?: number
) {
  if (Platform.OS !== "web") return;

  let message = "Keep going 💪";

  if (pendingTasks && pendingTasks > 0) {
    message = `You have ${pendingTasks} pending task${
      pendingTasks > 1 ? "s" : ""
    }`;
  } else if (streak && streak > 0) {
    message = `🔥 ${streak} day streak! Keep it up`;
  }

  new Notification("Skill Companion Reminder", {
    body: message,
  });
}
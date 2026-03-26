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

export function sendWebTestNotification() {
  if (Platform.OS !== "web") return;

  new Notification("Skill Companion Reminder", {
    body: "Complete your pending tasks today 💪",
  });
}
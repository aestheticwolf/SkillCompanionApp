import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

/* Ask permission */
export async function requestNotificationPermission() {
  if (Platform.OS === "web") return false;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

/* Daily reminder */
export async function scheduleDailyReminder(
  hour: number,
  minute: number
) {
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

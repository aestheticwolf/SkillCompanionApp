import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export async function scheduleReminder(
  title: string,
  body: string,
  hour: number
) {
  if (Platform.OS === "web") {
    alert("Notifications not supported on web");
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour,
      minute: 0,
      repeats: true,
    },
  });
}

import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

/* Configure behavior (Only Mobile) */
if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/* Ask Permission */
export async function requestPermission() {
  if (Platform.OS === "web") return false;

  const { status } =
    await Notifications.requestPermissionsAsync();

  return status === "granted";
}

/* Schedule Notification */
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
      type: Notifications.SchedulableTriggerInputTypes
        .CALENDAR,

      hour,
      minute: 0,
      repeats: true,
    },
  });
}

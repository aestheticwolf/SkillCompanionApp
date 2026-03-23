import { Platform } from "react-native";
import { Stack } from "expo-router";
import Toast from "react-native-toast-message";
import { useEffect } from "react";

import { TaskProvider } from "../src/context/TaskContext";
import { AuthProvider } from "../src/context/AuthContext";
import { toastConfig } from "../src/services/toastConfig";

import * as Notifications from "expo-notifications";

export default function Layout() {
  useEffect(() => {
    /* ── Favicon + tab title on web ── */
    if (Platform.OS === "web" && typeof document !== "undefined") {
      document.title = "SkillPath";
      document.querySelectorAll("link[rel~='icon']").forEach((el: any) => el.remove());
      const svgFavicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="pg" x1="12" y1="76" x2="88" y2="22" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="%23FF5C5C"/><stop offset="50%" stop-color="%23FFCA3A"/><stop offset="100%" stop-color="%2314D9C5"/></linearGradient></defs><circle cx="50" cy="50" r="48" fill="white"/><path d="M16 74 C 26 68, 34 56, 46 46 C 58 36, 66 26, 82 22" stroke="url(%23pg)" stroke-width="4" stroke-linecap="round" fill="none"/><circle cx="18" cy="74" r="9" fill="%23FF5C5C"/><circle cx="18" cy="74" r="4" fill="white" opacity="0.65"/><circle cx="48" cy="46" r="10" fill="%23FFCA3A"/><circle cx="48" cy="46" r="4.5" fill="white" opacity="0.65"/><circle cx="81" cy="22" r="12" fill="%2314D9C5"/><circle cx="81" cy="22" r="5" fill="white" opacity="0.65"/></svg>`;
      const link = document.createElement("link");
      link.rel = "icon"; link.type = "image/svg+xml";
      link.href = `data:image/svg+xml,${svgFavicon}`;
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }, []);

  return (
    <AuthProvider>
      <TaskProvider>
        <Stack screenOptions={{ headerShown: false }} />
        <Toast
          config={toastConfig}
          position="bottom"
          bottomOffset={32}
          visibilityTime={3800}
        />
      </TaskProvider>
    </AuthProvider>
  );
}

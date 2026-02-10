import NetInfo from "@react-native-community/netinfo";
import { showSuccess } from "./toast";

let wasOffline = false;

export const listenToNetwork = (cb: (v: boolean) => void) => {
  return NetInfo.addEventListener((state) => {
    const isOnline = !!state.isConnected;
    cb(isOnline);

    if (isOnline && wasOffline) {
      showSuccess("Back online. Changes synced");
    }

    wasOffline = !isOnline;
  });
};
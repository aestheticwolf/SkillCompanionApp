import { ref, onValue } from "firebase/database";
import { database } from "./firebase";

export function listenToSyncStatus(
  callback: (status: boolean) => void
) {
  const connectedRef = ref(database, ".info/connected");

  return onValue(connectedRef, (snap) => {
    callback(!!snap.val());
  });
}

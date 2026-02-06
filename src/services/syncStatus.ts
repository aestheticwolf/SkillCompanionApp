import { onSnapshot, doc } from "firebase/firestore";
import { db } from "./firebase";
import { auth } from "./firebase";

export const listenToSyncStatus = (
  setStatus: (v: boolean) => void
) => {
  const user = auth.currentUser;

  if (!user) return () => {};

  const ref = doc(db, "users", user.uid);

  return onSnapshot(
    ref,
    () => setStatus(true),
    () => setStatus(false)
  );
};

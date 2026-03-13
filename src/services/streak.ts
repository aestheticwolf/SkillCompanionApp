import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

export const updateStreak = async (userId: string) => {
  const userRef = doc(db, "users", userId);

  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) return;

  const data = snapshot.data();

  const today = new Date().toISOString().split("T")[0];

  let streak = data.streak || 0;
  const lastDate = data.lastCompletedDate;

  if (lastDate === today) {
    return;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (lastDate === yesterdayStr) {
    streak += 1;
  } else {
    streak = 1;
  }

  await updateDoc(userRef, {
    streak,
    lastCompletedDate: today,
  });
};
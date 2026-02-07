import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
} from "firebase/firestore";

import { db } from "./firebase";

/* Get all goals */
export const getUserGoals = async (uid: string) => {
  const ref = collection(db, "users", uid, "goals");
  const snap = await getDocs(ref);

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
};

/* Add new goal */
export const addUserGoal = async (
  uid: string,
  name: string
) => {
  const ref = collection(db, "users", uid, "goals");

  await addDoc(ref, {
    name,
    tasks: [],
    createdAt: Date.now(),
  });
};

/* Update single goal */
export const updateGoal = async (
  uid: string,
  goalId: string,
  data: any
) => {
  const ref = doc(db, "users", uid, "goals", goalId);

  await updateDoc(ref, data);
};

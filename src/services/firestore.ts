import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc
} from "firebase/firestore";

import { db } from "./firebase";

/* Add Goal */
export const addGoal = async (userId: string, title: string) => {
  return await addDoc(collection(db, "users", userId, "goals"), {
    title,
    createdAt: new Date(),
  });
};

/* Get Goals */
export const getGoals = async (userId: string) => {
  const q = query(collection(db, "users", userId, "goals"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
};

/* Delete Goal */
export const deleteGoal = async (userId: string, goalId: string) => {
  await deleteDoc(doc(db, "users", userId, "goals", goalId));
};

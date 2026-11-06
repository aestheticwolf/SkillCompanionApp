import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

import { db } from "./firebase";

// Add Goal
export const addGoal = async (userId: string, title: string) => {
  return await addDoc(collection(db, "users", userId, "goals"), {
    title,
    createdAt: new Date(),
  });
};

// Get Goals
export const getGoals = async (userId: string) => {
  const snapshot = await getDocs(
    collection(db, "users", userId, "goals")
  );

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));
};

// Delete Goal
export const deleteGoal = async (userId: string, goalId: string) => {
  await deleteDoc(
    doc(db, "users", userId, "goals", goalId)
  );
};
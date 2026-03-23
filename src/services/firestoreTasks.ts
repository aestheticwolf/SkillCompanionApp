import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,       
  orderBy
} from "firebase/firestore";

import { db } from "./firebase";

/* Get all goals */
export const getUserGoals = async (uid: string) => {
  const ref = collection(db, "users", uid, "goals");
  const q   = query(ref, orderBy("createdAt", "asc"));  
  const snap = await getDocs(q);                       

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
};

/* Add new goal */
/* Add new goal */
export const addUserGoal = async (
  uid: string,
  name: string,
  icon: string = "🎯"
) => {
  const ref = collection(db, "users", uid, "goals");

  await addDoc(ref, {
    name,
    icon,
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


export const deleteGoalFirestore = async (
  userId: string,
  goalId: string
) => {
  await deleteDoc(doc(db, "users", userId, "goals", goalId));
};

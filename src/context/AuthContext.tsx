import {
  createContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import {
  User,
  onAuthStateChanged,
} from "firebase/auth";

import { auth } from "@/src/services/firebase";

import { getGoals } from "../services/firestore";

// import { doc, getDoc } from "firebase/firestore";

import { doc, onSnapshot, setDoc } from "firebase/firestore";

import { db } from "../services/firebase";

/* Types */
type Goal = {
  id: string;
  title: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  goals: Goal[];
  userData: any;
  refreshGoals: () => Promise<void>;
};

/* Context */
export const AuthContext =
  createContext<AuthContextType>({
    user: null,
    loading: true,
    goals: [],
    userData: null,
    refreshGoals: async () => {},
  });

/* Provider */
export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<User | null>(null);

  const [loading, setLoading] =
    useState(true); 

  const [goals, setGoals] =
    useState<Goal[]>([]);

    const [userData, setUserData] = useState<any>(null);

  /* Load Goals */
  const loadGoals = async (uid: string) => {
    try {
      const data = await getGoals(uid);
      setGoals(data as Goal[]);
    } catch (err) {
      console.error("Load goals error:", err);
    }
  };

  /* Auth Listener */
  useEffect(() => {
  let unsubUser: any;

  const unsub = onAuthStateChanged(auth, async (u) => {
    setUser(u);

    if (u) {
      await loadGoals(u.uid);

      const ref = doc(db, "users", u.uid);

      unsubUser = onSnapshot(ref, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (!data.displayName && u.displayName) {
            data.displayName = u.displayName;
            setDoc(ref, { displayName: u.displayName }, { merge: true }).catch(() => {});
          }
          setUserData(data);
        } else {
          const fallbackData = {
            displayName: u.displayName || (u.email ? u.email.split("@")[0] : "Learner"),
            role: "Learner",
            streak: 0,
            activityLog: {},
          };
          setUserData(fallbackData);
          setDoc(ref, fallbackData, { merge: true }).catch(() => {});
        }
      });

    } else {
      setGoals([]);
      setUserData(null);
    }

    setLoading(false);
  });

  return () => {
    unsub();
    if (unsubUser) unsubUser();
  };
}, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        goals,
        userData,
        refreshGoals: async () => {
          if (user) {
            await loadGoals(user.uid);
          }
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

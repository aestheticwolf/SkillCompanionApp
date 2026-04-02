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

import { doc, onSnapshot } from "firebase/firestore";

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
          setUserData(snap.data());
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

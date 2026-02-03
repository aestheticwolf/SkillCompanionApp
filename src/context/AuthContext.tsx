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

/* Types */
type Goal = {
  id: string;
  title: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  goals: Goal[];
  refreshGoals: () => Promise<void>;
};

/* Context */
export const AuthContext =
  createContext<AuthContextType>({
    user: null,
    loading: true,
    goals: [],
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
    const unsub =
      onAuthStateChanged(
        auth,
        async (u) => {
          setUser(u);

          if (u) {
            await loadGoals(u.uid);
          } else {
            setGoals([]);
          }

          setLoading(false);
        }
      );

    return unsub;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        goals,
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

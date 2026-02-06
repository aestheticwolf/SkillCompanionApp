import React, {
  createContext,
  useState,
  ReactNode,
  useEffect,
  useContext,
} from "react";

import { AuthContext } from "./AuthContext";

import {
  getUserGoals,
  addUserGoal,
  updateGoal,
} from "../services/firestoreTasks";

import AsyncStorage from "@react-native-async-storage/async-storage";

/* Types */

export type Task = {
  id: string;
  title: string;
  completed: boolean;
};

export type Goal = {
  id: string;
  name: string;
  tasks: Task[];
};

type TaskContextType = {
  goals: Goal[];

  addGoal: (name: string) => Promise<void>;

  addTask: (
    goalId: string,
    title: string
  ) => Promise<void>;

  toggleTask: (
    goalId: string,
    taskId: string
  ) => Promise<void>;
};

/* Context */

export const TaskContext =
  createContext<TaskContextType | null>(null);

/* Provider */

export function TaskProvider({
  children,
}: {
  children: ReactNode;
}) {
  const authCtx = useContext(AuthContext);

  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  /* Load from Firestore */

  useEffect(() => {
    if (!authCtx?.user) {
      setGoals([]);
      return;
    }

    loadGoals();
  }, [authCtx?.user]);

  const loadGoals = async () => {
    if (!authCtx?.user) return;

    try {
      setLoading(true);

      /* Load cache first (offline support) */
      const cache = await AsyncStorage.getItem("CACHE_GOALS");

      if (cache) {
        setGoals(JSON.parse(cache));
      }

      /* Load from Firestore */
      const data = await getUserGoals(authCtx.user.uid);

      if (!data) return;

      setGoals(data as Goal[]);

      /* Save cache */
      await AsyncStorage.setItem(
        "CACHE_GOALS",
        JSON.stringify(data)
      );
    } catch (err) {
      console.log("Load error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* Add Goal */

  const addGoal = async (name: string) => {
    if (!authCtx?.user) return;

    await addUserGoal(authCtx.user.uid, name);

    await loadGoals();
  };

  /* Add Task */

  const addTask = async (
    goalId: string,
    title: string
  ) => {
    if (!authCtx?.user) return;

    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;

    const updatedTasks = [
      ...goal.tasks,
      {
        id: Date.now().toString(),
        title,
        completed: false,
      },
    ];

    await updateGoal(authCtx.user.uid, goalId, {
      tasks: updatedTasks,
    });

    await loadGoals();
  };

  /* Toggle Task */

  const toggleTask = async (
    goalId: string,
    taskId: string
  ) => {
    if (!authCtx?.user) return;

    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;

    const updatedTasks = goal.tasks.map((t) =>
      t.id === taskId
        ? { ...t, completed: !t.completed }
        : t
    );

    await updateGoal(authCtx.user.uid, goalId, {
      tasks: updatedTasks,
    });

    await loadGoals();
  };

  return (
    <TaskContext.Provider
      value={{
        goals,
        addGoal,
        addTask,
        toggleTask,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

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
  addTask: (goalId: string, title: string) => Promise<void>;
  toggleTask: (goalId: string, taskId: string) => Promise<void>;

  getOverallProgress: () => number;
  getGoalProgress: (goalId: string) => number;
  getRecommendation: () => string;

  getStats: () => {
  totalGoals: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
};
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

  const getRecommendation = () => {
  const overall = getOverallProgress();

  if (goals.length === 0) {
    return "Start by creating your first learning goal.";
  }

  if (overall === 0) {
    return "Begin with one small task today.";
  }

  if (overall < 30) {
    return "Try completing 2 tasks daily for faster growth.";
  }

  if (overall < 60) {
    return "Good consistency. Maintain your routine.";
  }

  if (overall < 80) {
    return "Great work. Focus on difficult topics now.";
  }

  if (overall < 100) {
    return "Almost complete. Finish remaining tasks.";
  }

  return "Excellent. Start a new advanced skill.";
};


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

  const cacheKey = `CACHE_GOALS_${authCtx.user.uid}`;

  try {
    setLoading(true);

    /* Load cache first */
    const cache = await AsyncStorage.getItem(cacheKey);

    if (cache) {
      setGoals(JSON.parse(cache));
    }

    /* Load from Firestore */
    const data = await getUserGoals(authCtx.user.uid);

    if (data && data.length >= 0) {
      setGoals(data as Goal[]);

      /* Save cache */
      await AsyncStorage.setItem(
        cacheKey,
        JSON.stringify(data)
      );
    }

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

  const getOverallProgress = () => {
  let total = 0;
  let completed = 0;

  goals.forEach((g) => {
    total += g.tasks.length;
    completed += g.tasks.filter((t) => t.completed).length;
  });

  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
};

const getGoalProgress = (goalId: string) => {
  const goal = goals.find((g) => g.id === goalId);
  if (!goal || goal.tasks.length === 0) return 0;

  const completed = goal.tasks.filter((t) => t.completed).length;
  return Math.round((completed / goal.tasks.length) * 100);
};

const getStats = () => {
  let totalTasks = 0;
  let completedTasks = 0;

  goals.forEach((g) => {
    totalTasks += g.tasks.length;
    completedTasks += g.tasks.filter(t => t.completed).length;
  });

  return {
    totalGoals: goals.length,
    totalTasks,
    completedTasks,
    pendingTasks: totalTasks - completedTasks,
  };
};



  return (
<TaskContext.Provider
  value={{
    goals,
    addGoal,
    addTask,
    toggleTask,
    getOverallProgress,
    getGoalProgress,
    getRecommendation,
    getStats,
  }}
>


      {children}
    </TaskContext.Provider>
  );


}
